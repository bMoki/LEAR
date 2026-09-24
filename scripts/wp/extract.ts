/**
 * Lê o despejo do WordPress antigo e escreve `scripts/wp/content.json` — o
 * conteúdo já normalizado no formato do schema do Sanity.
 *
 *     npx tsx scripts/wp/extract.ts
 *
 * **Não fala com a rede nem com o Sanity.** Essa separação é o ponto: a etapa
 * que interpreta HTML de três construtores de página diferentes é a que erra,
 * e ela precisa poder rodar quantas vezes for necessário, ser lida num diff e
 * ser corrigida sem nunca tocar no dataset. Quem grava é `import.ts`.
 *
 * A saída é versionada. Com ela no repositório, o despejo de 125 MB não
 * precisa ser — e a importação continua reproduzível depois que o servidor da
 * UFSC sair do ar.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { slugify } from "../../sanity/schemas/slug";
import { metaIndex, readDump, type Row } from "./dump";
import { slugDe } from "./endereco";
import {
  colherImagens,
  creditoDe,
  decode,
  htmlToPortableText,
  limpar,
  original,
  toText,
  type Block,
  type ImagemColhida,
} from "./html";
import {
  EQUIPE,
  FICHAS,
  IGNORADAS,
  LISTAS,
  LOCAIS,
  NOTICIAS,
  PAGINAS,
  PROJETOS,
  PUBLICACOES,
  TAXONOMIA_MANUAL,
} from "./mapa";

const DUMP = process.env.WP_DUMP ?? join(process.cwd(), "herpetologia.json");
const SAIDA = join(process.cwd(), "scripts", "wp", "content.json");

// ---------------------------------------------------------------------------
// Tipos da saída
// ---------------------------------------------------------------------------

export type Imagem = { src: string; alt: string; credito?: string };

export type Conteudo = {
  geradoEm: string;
  noticias: {
    slug: string;
    titulo: string;
    autor: string;
    publicadoEm: string;
    imagem?: Imagem;
    corpo: Block[];
    resumo?: string;
  }[];
  projetos: {
    slug: string;
    titulo: string;
    descricao: string;
    imagem?: Imagem;
    corpo: Block[];
  }[];
  equipe: {
    nome: string;
    funcao: string;
    email?: string;
    lattes?: string;
    bio: string;
    imagem?: Imagem;
  }[];
  locais: { slug: string; nome: string; curto?: string }[];
  especies: {
    slug: string;
    cientifico: string;
    populares: string[];
    grupo: "anfibio" | "reptil";
    ordem?: string;
    familia?: string;
    subfamilia?: string;
    locais: string[];
    imagem?: Imagem;
    galeria: Imagem[];
    habitat?: string;
    descricao?: string;
    reproducao?: string;
    distribuicao?: string;
    ameaca?: string;
    referencias?: string;
  }[];
  publicacoes: { referencia: string; ano: string; tipo: string; url?: string }[];
  paginas: { slug: string; titulo: string; imagem?: Imagem; corpo: Block[] }[];
  /** Toda imagem referenciada acima, sem repetir — o que precisa existir no
   * Sanity para os documentos não nascerem quebrados. */
  imagens: string[];
  /** O resto do acervo de mídia: fotos que estavam na biblioteca do WordPress
   * sem nenhuma página apontando para elas. Vão para o Sanity soltas, para
   * ficarem à mão de quem for montar a galeria nova. */
  acervo: string[];
};

// ---------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------

const num = (r: Row, campo: string) => Number(r[campo] ?? 0);

/** `2017-06-01 14:31:27` do MySQL → ISO 8601 em UTC. O dump traz a hora local
 * e a GMT em colunas separadas; usamos a GMT quando ela não é zerada. */
function paraISO(local: string | null, gmt: string | null): string {
  const escolhido = gmt && !gmt.startsWith("0000") ? gmt : local;
  if (!escolhido || escolhido.startsWith("0000")) return new Date().toISOString();
  return new Date(escolhido.replace(" ", "T") + "Z").toISOString();
}

/** Primeiro parágrafo do corpo, para o campo de resumo. */
function resumoDe(corpo: Block[]): string | undefined {
  const p = corpo.find((b) => b.style === "normal" && !b.listItem);
  const texto = p?.children.map((c) => c.text).join("").trim();
  if (!texto) return undefined;
  return texto.length > 300 ? texto.slice(0, 297).trimEnd() + "…" : texto;
}

function imagemDe(colhida: ImagemColhida | undefined, alt: string): Imagem | undefined {
  if (!colhida) return undefined;
  return {
    src: colhida.src,
    // Quase nenhuma `<img>` do site antigo tinha `alt` — o WordPress deixava
    // vazio por padrão. Sem descrição, o texto alternativo vira o assunto da
    // foto, que é melhor do que nada para quem usa leitor de tela.
    alt: colhida.alt || alt,
    credito: colhida.credito,
  };
}

// ---------------------------------------------------------------------------
// Espécies
// ---------------------------------------------------------------------------

const ORDEM_DO_GRUPO: Record<string, "anfibio" | "reptil"> = {
  Anura: "anfibio",
  Caudata: "anfibio",
  Gymnophiona: "anfibio",
  Squamata: "reptil",
  Testudines: "reptil",
  Crocodylia: "reptil",
};

const AMEACAS: [RegExp, string][] = [
  [/criticamente/i, "CR"],
  [/\bem perigo\b|\bEN\b/i, "EN"],
  [/vulner[áa]vel|\bVU\b/i, "VU"],
  [/quase amea[çc]ad|\bNT\b/i, "NT"],
  [/pouco preocupante|\bLC\b/i, "LC"],
  [/dados insuficientes|\bDD\b/i, "DD"],
];

const ehBinomio = (s: string) => /^[A-Z][a-zé]+ [a-zé]{3,}$/.test(s.trim());

type Registro = {
  cientifico: string;
  popular?: string;
  familia?: string;
  ordem?: string;
  foto?: string;
  credito?: string;
};

/**
 * Extrai a lista de espécies de uma das nove páginas de levantamento.
 *
 * São dois markups para o mesmo conteúdo, e o parser aguenta os dois porque
 * ambos são a mesma sequência de eventos: um cabeçalho de ordem, um de
 * família, e daí em diante um registro por espécie. O que muda é onde cada
 * pedaço mora — no Elementor (página 2193) o nome popular é um `<h3>` e o
 * científico um `<i>` logo abaixo; no Gutenberg colunado o `<h5>` já é o
 * binômio e o nome popular está na primeira linha da legenda da foto.
 */
function lerLista(html: string): Registro[] {
  const limpo = limpar(html);
  const out: Registro[] = [];
  let ordem: string | undefined;
  let familia: string | undefined;
  let atual: Registro | null = null;

  const fechar = () => {
    if (atual?.cientifico) out.push(atual);
    atual = null;
  };

  const tokens =
    /<div class="wp-block-column|<h([1-6])[^>]*>([\s\S]*?)<\/h\1>|<figcaption[^>]*>([\s\S]*?)<\/figcaption>|<img[^>]+src="([^"]+)"|<i>([\s\S]*?)<\/i>/gi;

  for (const m of limpo.matchAll(tokens)) {
    // Coluna nova = espécie nova, mesmo que a anterior tenha ficado incompleta.
    if (m[0].startsWith("<div")) {
      fechar();
      atual = { cientifico: "", ordem, familia };
      continue;
    }

    if (m[2] != null) {
      const t = toText(m[2]);
      if (/^ordem\s+/i.test(t)) {
        fechar();
        ordem = normalizarOrdem(t.replace(/^ordem\s+/i, ""));
        continue;
      }
      if (/^fam[ií]lia\b/i.test(t)) {
        fechar();
        familia = t.replace(/^fam[ií]lia\s*/i, "").trim();
        continue;
      }
      if (!t) continue;

      if (ehBinomio(t)) {
        if (atual?.cientifico) fechar();
        atual ??= { cientifico: "", ordem, familia };
        atual.cientifico = t;
      } else {
        // Cabeçalho que não é binômio nem taxonomia: é o nome popular abrindo
        // um registro no markup do Elementor.
        fechar();
        atual = { cientifico: "", popular: t, ordem, familia };
      }
      continue;
    }

    if (!atual) continue;
    if (m[5] != null && !atual.cientifico && ehBinomio(toText(m[5]))) {
      atual.cientifico = toText(m[5]);
    } else if (m[4] != null && !atual.foto) {
      atual.foto = original(m[4]);
    } else if (m[3] != null) {
      const legenda = toText(m[3]);
      atual.credito ??= creditoDe(legenda);
      const primeira = legenda.split("\n")[0]?.trim();
      if (primeira && !atual.popular && !ehBinomio(primeira) && !/^(fotos?|v[ií]deo)\s*:/i.test(primeira)) {
        atual.popular = primeira;
      }
    }
  }
  fechar();
  return out;
}

const ROTULOS: [RegExp, string][] = [
  [/habitat\s*e\s*h[áa]bitos?/i, "habitat"],
  [/descri[çc][ãa]o/i, "descricao"],
  [/reprodu[çc][ãa]o/i, "reproducao"],
  [/distribui[çc][ãa]o/i, "distribuicao"],
  [/grau\s*de\s*amea[çc]a/i, "ameaca"],
  [/refer[êe]ncias?(\s*bibliogr[áa]ficas?)?/i, "referencias"],
];

/**
 * Campos rotulados da ficha individual — "Habitat e Hábitos:", "Descrição:",
 * "Grau de Ameaça:".
 *
 * Lê o HTML, e não o texto já achatado, porque a ficha é uma lista de
 * `<li><strong>Rótulo:</strong> valor</li>`: o `<li>` diz exatamente onde um
 * campo termina e o outro começa, enquanto no texto corrido a fronteira teria
 * de ser adivinhada por maiúscula seguida de dois-pontos — que erra em
 * "Habitat e Hábitos" (dois maiúsculos) e em qualquer valor que contenha
 * dois-pontos, como as referências bibliográficas.
 */
function lerFicha(html: string) {
  const campos: Record<string, string> = {};
  for (const m of limpar(html).matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)) {
    const linha = toText(m[1]).replace(/\s+/g, " ").trim();
    const [, rotulo, valor] = linha.match(/^([^:]{4,40}):\s*([\s\S]*)$/) ?? [];
    if (!rotulo || !valor?.trim()) continue;
    const achado = ROTULOS.find(([re]) => re.test(rotulo.trim()));
    if (achado && !campos[achado[1]]) campos[achado[1]] = valor.trim();
  }
  return campos;
}

/**
 * Normaliza o nome da ordem para a lista fechada do schema.
 *
 * O site antigo escrevia o mesmo táxon de quatro formas — "ANURA", "Anura",
 * "SQUAMATA (Lagartos, Serpentes e Anfisbenas)" com a glosa junto, e
 * "CROCODYLLIA" com um L a mais. Sem unificar, filtrar espécies por ordem
 * devolveria quatro grupos para o que é um só.
 */
function normalizarOrdem(bruta: string | undefined): string | undefined {
  if (!bruta) return undefined;
  const limpa = bruta
    .replace(/\(.*/, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
  const conhecidas: Record<string, string> = {
    anura: "Anura",
    caudata: "Caudata",
    gymnophiona: "Gymnophiona",
    squamata: "Squamata",
    testudines: "Testudines",
    crocodylia: "Crocodylia",
    crocodyllia: "Crocodylia",
  };
  return conhecidas[limpa];
}

// ---------------------------------------------------------------------------
// Principal
// ---------------------------------------------------------------------------

async function main() {
  console.log(`Lendo ${DUMP} …`);
  const dump = await readDump(DUMP);

  const posts = new Map(dump.posts.map((p) => [num(p, "ID"), p]));
  const anexos = new Map(
    dump.posts.filter((p) => p.post_type === "attachment").map((p) => [num(p, "ID"), p])
  );
  const destaques = metaIndex(dump.postmeta, "_thumbnail_id");
  const usuarios = new Map(dump.users.map((u) => [num(u, "ID"), u.display_name ?? ""]));

  const urlDoAnexo = (id: string | number): Imagem | undefined => {
    const a = anexos.get(Number(id));
    if (!a?.guid) return undefined;
    return {
      src: original(a.guid),
      alt: decode(a.post_excerpt || a.post_title || "").trim(),
      credito: creditoDe(decode(a.post_excerpt ?? "")),
    };
  };

  const conteudo: Conteudo = {
    geradoEm: new Date().toISOString(),
    noticias: [],
    projetos: [],
    equipe: [],
    locais: LOCAIS.map((l) => ({ slug: l.slug, nome: l.nome, curto: l.curto })),
    especies: [],
    publicacoes: [],
    paginas: [],
    imagens: [],
    acervo: [],
  };

  // --- Notícias -----------------------------------------------------------
  for (const id of NOTICIAS) {
    const p = posts.get(id);
    if (!p) continue;
    const corpo = htmlToPortableText(p.post_content ?? "");
    const imagens = colherImagens(p.post_content ?? "");
    const titulo = decode(p.post_title ?? "").trim();
    conteudo.noticias.push({
      slug: slugDe(p.post_name, titulo),
      titulo,
      autor: usuarios.get(num(p, "post_author")) || "LEAR",
      publicadoEm: paraISO(p.post_date, p.post_date_gmt),
      imagem: urlDoAnexo(destaques.get(String(id)) ?? "") ?? imagemDe(imagens[0], titulo),
      corpo,
      resumo: decode(p.post_excerpt ?? "").trim() || resumoDe(corpo),
    });
  }

  // --- Projetos -----------------------------------------------------------
  for (const id of PROJETOS) {
    const p = posts.get(id);
    if (!p) continue;
    const corpo = htmlToPortableText(p.post_content ?? "");
    const imagens = colherImagens(p.post_content ?? "");
    const titulo = decode(p.post_title ?? "").trim();
    conteudo.projetos.push({
      slug: slugDe(p.post_name, titulo),
      titulo,
      // A descrição do cartão é o primeiro parágrafo — no site antigo era ele
      // que abria a página, e é o que melhor resume a frente de pesquisa.
      descricao: resumoDe(corpo) ?? titulo,
      imagem: urlDoAnexo(destaques.get(String(id)) ?? "") ?? imagemDe(imagens[0], titulo),
      corpo,
    });
  }

  // --- Equipe -------------------------------------------------------------
  // Cada pessoa é um bloco `wp-block-media-text`: foto à esquerda, nome em
  // cabeçalho, biografia e a linha "e-mail | Currículo LATTES".
  const vistos = new Set<string>();
  for (const { id, secao } of EQUIPE) {
    const p = posts.get(id);
    if (!p) continue;
    const html = limpar(p.post_content ?? "");

    // Um bloco por pessoa. O `\s` depois do nome da classe é o que distingue o
    // `<div class="wp-block-media-text …">` que abre a pessoa do
    // `wp-block-media-text__content` que fica dentro dele.
    const inicios = [...html.matchAll(/<div class="wp-block-media-text\s/g)].map((m) => m.index);

    // Subtítulos que trocam o cargo das pessoas seguintes ("Doutorado",
    // "Pós-Doutorado"). Ficam **na cauda** do bloco anterior, não entre os
    // blocos — daí a comparação por posição em vez de por fatia.
    const secoes = [...html.matchAll(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi)]
      .map((m) => ({ pos: m.index, texto: toText(m[1]).trim() }))
      .filter((s) => /^(p[óo]s-)?(doutorado|mestrado|gradua[çc][ãa]o)$/i.test(s.texto));

    for (const [i, inicio] of inicios.entries()) {
      const proximo = inicios[i + 1] ?? html.length;
      // A fatia termina no próximo bloco ou num subtítulo de seção, o que vier
      // primeiro — senão o "Pós-Doutorado" entraria na biografia de quem veio
      // antes dele.
      const corte = secoes.find((s) => s.pos > inicio && s.pos < proximo)?.pos ?? proximo;
      const pedaco = html.slice(inicio, corte);

      const cargo =
        [...secoes].reverse().find((s) => s.pos < inicio)?.texto ?? secao;

      const nome = toText((pedaco.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i) ?? [])[1] ?? "");
      if (!nome) continue;

      const texto = toText(pedaco);
      const email = (texto.match(/[\w.+-]+@[\w.-]+\.\w{2,}/) ?? [])[0];
      // O e-mail identifica melhor que o nome: a mesma pessoa aparece como
      // "VÍTOR DE CARVALHO ROCHA" numa página e "Vítor Carvalho Rocha" noutra.
      const identidade = (email ?? nome).toLowerCase();
      if (vistos.has(identidade)) continue;
      vistos.add(identidade);

      const lattes = (pedaco.match(/https?:\/\/lattes\.cnpq\.br\/\d+/i) ?? [])[0];
      const bio = texto
        .split("\n")
        .filter((l) => l.trim() && l.trim() !== nome && !l.includes("@") && !/LATTES/i.test(l))
        .join("\n")
        .trim();
      const imagens = colherImagens(pedaco);

      conteudo.equipe.push({
        // O site antigo escrevia metade dos nomes em CAIXA ALTA e metade não.
        nome: nome === nome.toUpperCase() ? capitalizar(nome) : nome,
        funcao: cargo,
        email,
        lattes,
        bio,
        imagem: imagemDe(imagens[0], nome),
      });
    }
  }

  // --- Espécies -----------------------------------------------------------
  const porEspecie = new Map<string, Conteudo["especies"][number]>();

  for (const { id, local, grupo } of LISTAS) {
    const p = posts.get(id);
    if (!p?.post_content) continue;
    for (const r of lerLista(p.post_content)) {
      const chave = r.cientifico.toLowerCase();
      let e = porEspecie.get(chave);
      if (!e) {
        e = {
          slug: slugify(r.cientifico),
          cientifico: r.cientifico,
          populares: [],
          grupo: (r.ordem && ORDEM_DO_GRUPO[r.ordem]) || grupo,
          ordem: r.ordem,
          familia: r.familia,
          locais: [],
          galeria: [],
        };
        porEspecie.set(chave, e);
      }
      e.ordem ??= r.ordem;
      e.familia ??= r.familia;
      if (!e.locais.includes(local)) e.locais.push(local);
      if (r.popular && !e.populares.some((n) => n.toLowerCase() === r.popular!.toLowerCase())) {
        e.populares.push(r.popular);
      }
      // Cada lista traz a sua própria foto da espécie, e costumam ser fotos
      // diferentes — a mesma perereca fotografada em campanhas diferentes. Vão
      // todas para a galeria; a primeira também vira a capa.
      if (r.foto) {
        const foto = {
          src: r.foto,
          alt: `${r.cientifico}${r.popular ? ` (${r.popular})` : ""}`,
          credito: r.credito,
        };
        e.imagem ??= foto;
        if (!e.galeria.some((g) => g.src === foto.src)) e.galeria.push(foto);
      }
    }
  }

  // Fichas individuais: enriquecem o registro que já veio da lista, ou criam
  // um novo quando a espécie só existia como página solta.
  for (const id of FICHAS) {
    const p = posts.get(id);
    if (!p) continue;
    const titulo = decode(p.post_title ?? "").trim();
    const [, cientifico, popular] = titulo.match(/^([A-Z][a-zé]+ [a-zé]+)(?:\s*\(([^)]+)\))?/) ?? [];
    if (!cientifico) continue;

    const chave = cientifico.toLowerCase();
    const texto = toText(p.post_content ?? "");
    const campos = lerFicha(p.post_content ?? "");
    const taxonomia = Object.fromEntries(
      [...texto.matchAll(/(Classe|Ordem|Fam[íi]lia|Subfam[íi]lia|G[êe]nero)\s*:\s*([A-Za-zêáí]+)/g)].map(
        (m) => [m[1].normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(), m[2]]
      )
    );

    // `[gallery ids="820,821,…"]` aponta para anexos do próprio dump.
    const idsGaleria = [...(p.post_content ?? "").matchAll(/\[gallery[^\]]*ids="([^"]+)"/g)]
      .flatMap((m) => m[1].split(","))
      .map((s) => s.trim());

    let e = porEspecie.get(chave);
    if (!e) {
      e = {
        slug: slugify(cientifico),
        cientifico,
        populares: [],
        grupo: ORDEM_DO_GRUPO[normalizarOrdem(taxonomia.ordem) ?? ""] ?? "anfibio",
        locais: [],
        galeria: [],
      };
      porEspecie.set(chave, e);
    }
    if (popular && !e.populares.some((n) => n.toLowerCase() === popular.toLowerCase())) {
      e.populares.unshift(popular);
    }
    e.ordem ??= normalizarOrdem(taxonomia.ordem);
    e.familia ??= taxonomia.familia;
    e.subfamilia ??= taxonomia.subfamilia;
    e.habitat ??= campos.habitat;
    e.descricao ??= campos.descricao;
    e.reproducao ??= campos.reproducao;
    e.distribuicao ??= campos.distribuicao;
    e.referencias ??= campos.referencias;
    if (campos.ameaca) e.ameaca ??= AMEACAS.find(([re]) => re.test(campos.ameaca))?.[1];

    const acrescentar = (img: Imagem) => {
      e!.imagem ??= img;
      if (!e!.galeria.some((g) => g.src === img.src)) e!.galeria.push(img);
    };
    for (const gid of idsGaleria) {
      const img = urlDoAnexo(gid);
      if (img) acrescentar({ ...img, alt: img.alt || cientifico });
    }
    for (const img of colherImagens(p.post_content ?? "")) {
      acrescentar({ src: img.src, alt: img.alt || cientifico, credito: img.credito });
    }
  }

  for (const [nome, fix] of Object.entries(TAXONOMIA_MANUAL)) {
    const e = porEspecie.get(nome.toLowerCase());
    if (!e) continue;
    e.grupo = fix.grupo;
    e.ordem ??= fix.ordem;
    e.familia ??= fix.familia;
  }

  conteudo.especies = [...porEspecie.values()].sort((a, b) =>
    a.cientifico.localeCompare(b.cientifico)
  );

  const semTaxonomia = conteudo.especies.filter((e) => !e.ordem || !e.familia);
  if (semTaxonomia.length) {
    console.warn(
      `\n⚠ ${semTaxonomia.length} espécie(s) sem ordem ou família — confira e, se ` +
        `não der para deduzir do despejo, acrescente em TAXONOMIA_MANUAL:\n` +
        semTaxonomia.map((e) => `    ${e.cientifico}`).join("\n")
    );
  }

  // --- Publicações --------------------------------------------------------
  const pub = posts.get(PUBLICACOES);
  if (pub?.post_content) {
    const limpo = limpar(pub.post_content);
    let tipo = "artigo";
    const blocos = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>|<p[^>]*>([\s\S]*?)<\/p>/gi;
    for (const m of limpo.matchAll(blocos)) {
      if (m[2] != null) {
        const t = toText(m[2]).toUpperCase();
        if (t.includes("CAP")) tipo = "capitulo";
        else if (t.includes("LIVRO")) tipo = "livro";
        else if (t.includes("ARTIGO")) tipo = "artigo";
        continue;
      }
      const referencia = toText(m[3] ?? "").replace(/\s*\{\s*LINK\s*\}\s*$/i, "").trim();
      // Parágrafo curto na página de Publicações é separador visual, não
      // referência — a citação mais enxuta do acervo passa de 80 caracteres.
      if (referencia.length < 60) continue;
      const ano = (referencia.match(/\((\d{4})[a-z]?\)/) ?? referencia.match(/\b(19|20)\d{2}\b/) ?? [])[1];
      conteudo.publicacoes.push({
        referencia,
        ano: ano && /^\d{4}$/.test(ano) ? ano : (referencia.match(/\b((?:19|20)\d{2})\b/) ?? [])[1] ?? "",
        tipo,
        url: (m[3]?.match(/href="(https?:\/\/[^"]+)"/) ?? [])[1],
      });
    }
  }

  // --- Páginas institucionais ---------------------------------------------
  for (const { id, titulo, slug } of PAGINAS) {
    const p = posts.get(id);
    if (!p) continue;
    const corpo = htmlToPortableText(p.post_content ?? "");
    if (corpo.length === 0) continue;
    conteudo.paginas.push({
      slug,
      titulo,
      imagem: imagemDe(colherImagens(p.post_content ?? "")[0], titulo),
      corpo,
    });
  }

  // --- Lista de imagens ---------------------------------------------------
  const todas = new Set<string>();
  const registrar = (i?: Imagem) => i?.src && todas.add(i.src);
  conteudo.noticias.forEach((n) => registrar(n.imagem));
  conteudo.projetos.forEach((p) => registrar(p.imagem));
  conteudo.equipe.forEach((c) => registrar(c.imagem));
  conteudo.paginas.forEach((p) => registrar(p.imagem));
  conteudo.especies.forEach((e) => {
    registrar(e.imagem);
    e.galeria.forEach(registrar);
  });
  conteudo.imagens = [...todas].sort();

  // O resto da biblioteca de mídia. A lista é montada por **allowlist de tipo
  // MIME**, e não descartando o que parece ruim: a pasta `uploads` do site
  // antigo contém 24 arquivos `.php` de nome idêntico, subidos entre maio e
  // julho de 2023 e servidos até hoje — webshell, não conteúdo. Uma allowlist
  // deixa isso de fora por construção, junto de qualquer outra surpresa.
  const IMAGEM = /^image\/(jpeg|png|gif|webp|svg\+xml)$/;
  const acervo = new Set<string>();
  for (const a of anexos.values()) {
    if (!a.guid || !IMAGEM.test(a.post_mime_type ?? "")) continue;
    const url = original(a.guid);
    if (!todas.has(url)) acervo.add(url);
  }
  conteudo.acervo = [...acervo].sort();

  writeFileSync(SAIDA, JSON.stringify(conteudo, null, 1));

  const ignoradas = dump.posts.filter(
    (p) => p.post_type === "page" && IGNORADAS.includes(num(p, "ID"))
  ).length;

  console.log(`\n✔ ${SAIDA}\n`);
  console.log(`  notícias    ${conteudo.noticias.length}`);
  console.log(`  projetos    ${conteudo.projetos.length}`);
  console.log(`  equipe      ${conteudo.equipe.length}`);
  console.log(`  locais      ${conteudo.locais.length}`);
  console.log(`  espécies    ${conteudo.especies.length}`);
  console.log(`  publicações ${conteudo.publicacoes.length}`);
  console.log(`  páginas     ${conteudo.paginas.length}`);
  console.log(`  imagens     ${conteudo.imagens.length} referenciadas`);
  console.log(`  acervo      ${conteudo.acervo.length} soltas na biblioteca`);
  console.log(`\n  ${ignoradas} páginas ignoradas de propósito (ver scripts/wp/mapa.ts).`);
}

/** "ANTONIO SEBBEN" → "Antonio Sebben", preservando as partículas. */
function capitalizar(nome: string): string {
  const minusculas = new Set(["de", "da", "do", "das", "dos", "e"]);
  return nome
    .toLowerCase()
    .split(/\s+/)
    .map((p, i) =>
      i > 0 && minusculas.has(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)
    )
    .join(" ");
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
