/**
 * Sobe para o Sanity o conteúdo que `extract.ts` deixou em `content.json`.
 *
 *     npx tsx --env-file=.env.local scripts/wp/import.ts          # tudo
 *     npx tsx --env-file=.env.local scripts/wp/import.ts --dry    # só relata
 *     npx tsx --env-file=.env.local scripts/wp/import.ts --sem-imagens
 *     npx tsx --env-file=.env.local scripts/wp/import.ts --parar-no-bloqueio
 *
 * ⚠️ **Sobrescreve.** Usa `createOrReplace` com `_id` derivado do slug, então
 * rodar de novo restaura o estado do site antigo por cima — inclusive apagando
 * o que um pesquisador tiver escrito no Studio no mesmo documento. É a mesma
 * ressalva do `scripts/seed.ts`, e vale enquanto o dataset ainda não recebeu
 * texto novo.
 *
 * As imagens são baixadas do servidor da UFSC, que continua no ar. O mapa
 * URL → asset fica em `assets.json`: a segunda execução não rebaixa nada, e
 * uma interrupção no meio de 648 downloads não custa recomeçar do zero.
 *
 * Esse mapa **é versionado**, pelo mesmo motivo que `content.json` é. Enquanto
 * o site antigo responde, ele é só um cache — apagá-lo custa uma tarde de
 * download. Depois que o servidor da UFSC sair do ar, ele passa a ser o único
 * vínculo entre o texto e as fotos já enviadas: sem ele, esta importação monta
 * os documentos sem imagem e os grava por cima dos que têm, e os assets ficam
 * órfãos na biblioteca de mídia sem nada apontando para eles. 90 das 648 fotos
 * já respondem 404 — o prazo do ADR 0006 começou a correr.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { randomUUID } from "node:crypto";
import { createClient, type IdentifiedSanityDocumentStub } from "@sanity/client";
import { LexoRank } from "lexorank";
import { slugify } from "../../sanity/schemas/slug";
import { compat } from "./compat";
import type { Conteudo, Imagem } from "./extract";
import { moldura, PENDENTE_DE_REVISAO } from "./moldura";

const RAIZ = join(process.cwd(), "scripts", "wp");
const CONTEUDO = join(RAIZ, "content.json");
const ASSETS = join(RAIZ, "assets.json");

const seco = process.argv.includes("--dry");
const semImagens = process.argv.includes("--sem-imagens");
/** Pula a projeção do acervo em Galeria e Notícia — útil no dia em que as
 * telas próprias existirem. Ver `compat.ts`. */
const semCompat = process.argv.includes("--sem-compat");
/** Aborta a importação inteira se a proteção da RedeUFSC aparecer, em vez de
 * gravar o texto sem as fotos. Para quando se quer tudo ou nada. */
const pararNoBloqueio = process.argv.includes("--parar-no-bloqueio");

// ---------------------------------------------------------------------------
// Cliente
// ---------------------------------------------------------------------------

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_WRITE_TOKEN;

if (!seco && (!projectId || !dataset || !token)) {
  throw new Error(
    "Faltam variáveis de ambiente. Rode com:\n" +
      "  npx tsx --env-file=.env.local scripts/wp/import.ts"
  );
}

const client =
  projectId && dataset
    ? createClient({
        projectId,
        dataset,
        token,
        apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2026-08-04",
        useCdn: false,
      })
    : null;

// ---------------------------------------------------------------------------
// Imagens
// ---------------------------------------------------------------------------

type Assets = Record<string, string>;
const assets: Assets = existsSync(ASSETS) ? JSON.parse(readFileSync(ASSETS, "utf8")) : {};

/** Os nomes de arquivo do acervo têm acento e espaço — `fetch` exige o caminho
 * já percent-encoded, senão devolve 400. */
function encodar(url: string): string {
  const u = new URL(url);
  u.pathname = u.pathname.split("/").map(encodeURIComponent).join("/");
  return u.toString();
}

/**
 * A RedeUFSC põe um desafio Cloudflare Turnstile na frente do site quando o
 * acesso vem de fora da rede dela — e uma rajada de downloads é o que o
 * dispara. O servidor responde **200 com uma página HTML**, não 403, então sem
 * esta checagem o import "conclui" com 648 imagens silenciosamente perdidas.
 *
 * Ao detectar, o import para a fase de imagens inteira: insistir só aprofunda
 * o bloqueio, e não há como resolver o desafio por script.
 */
class DesafioUFSC extends Error {
  constructor() {
    super(
      "O servidor da UFSC respondeu com o desafio do Sistema de Prevenção de " +
        "Ataques da RedeUFSC em vez da imagem.\n" +
        "  As imagens não podem ser baixadas até isso liberar. Saídas:\n" +
        "    · esperar o bloqueio expirar e rodar de novo (a fase de texto já terá passado);\n" +
        "    · rodar de dentro da RedeUFSC ou pela VPN da universidade;\n" +
        "    · seguir agora só com o texto: --sem-imagens."
    );
  }
}

/**
 * O que aconteceu com uma imagem.
 *
 * `ausente` e `falhou` são coisas diferentes, e confundi-las custou caro: um
 * 404 é o servidor **respondendo** que a foto não existe mais, enquanto uma
 * falha é o servidor não respondendo. A primeira versão tratava os dois como
 * falha, então cada foto apagada dobrava a pausa — e 16 delas espalhadas pela
 * fila levaram a pausa ao teto e derrubaram a fase de imagens com 251 fotos
 * ainda na fila, sendo que a maioria continuava no ar.
 */
type Resultado = "subiu" | "ausente" | "falhou";

async function subirImagem(url: string): Promise<Resultado> {
  if (assets[url]) return "subiu";
  if (!client) return "falhou";

  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    try {
      const resposta = await fetch(encodar(url), {
        signal: AbortSignal.timeout(60_000),
        headers: { "user-agent": "site-lear-import/1.0" },
      });
      if (!resposta.ok) {
        // 404 não melhora tentando de novo — a foto sumiu do servidor antigo.
        if (resposta.status === 404) return "ausente";
        throw new Error(`HTTP ${resposta.status}`);
      }
      const tipo = resposta.headers.get("content-type") ?? "";
      if (!/^image\//.test(tipo)) {
        if (/text\/html/.test(tipo)) {
          const corpo = await resposta.text();
          if (/turnstile|RedeUFSC|Preven[çc][ãa]o de Ataques/i.test(corpo)) throw new DesafioUFSC();
        }
        console.warn(`  ⚠ ${url} não é imagem (${tipo}) — pulado`);
        return "ausente";
      }
      const buffer = Buffer.from(await resposta.arrayBuffer());
      const asset = await client.assets.upload("image", buffer, {
        filename: decodeURIComponent(basename(new URL(url).pathname)),
      });
      assets[url] = asset._id;
      return "subiu";
    } catch (erro) {
      if (erro instanceof DesafioUFSC) throw erro;
      if (tentativa === 3) {
        console.warn(`  ⚠ falhou ${url}: ${(erro as Error).message}`);
        return "falhou";
      }
      await new Promise((r) => setTimeout(r, 500 * tentativa));
    }
  }
  return "falhou";
}

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Intervalo entre requisições, em ms. Sobe a cada falha e desce devagar a
 * cada sucesso, entre estes limites. */
const PAUSA_MINIMA = 400;
const PAUSA_MAXIMA = 30_000;

/**
 * Baixa uma imagem de cada vez, com pausa adaptativa entre requisições.
 *
 * A primeira versão usava seis conexões em paralelo e nenhum intervalo — e foi
 * exatamente isso que fez a proteção da RedeUFSC fechar a porta no meio da
 * importação, com 648 fotos perdidas. O servidor é de terceiro, hospeda outros
 * sites da universidade e não vai a lugar nenhum; a pressa não compra nada.
 *
 * A pausa **dobra a cada falha e encolhe 10% a cada sucesso**, com jitter para
 * não sincronizar as tentativas num padrão regular. Assim uma lentidão
 * passageira do servidor faz o import desacelerar sozinho em vez de insistir no
 * mesmo ritmo que causou o bloqueio, e volta a acelerar quando o servidor
 * respira. É o mesmo princípio de um debounce: reagir ao ritmo de quem
 * responde, não ao de quem pede.
 */
async function subirTodas(urls: string[], rotulo: string) {
  const pendentes = urls.filter((u) => !assets[u]);
  if (pendentes.length === 0) {
    console.log(`  ${rotulo}: ${urls.length} já no Sanity`);
    return;
  }
  console.log(
    `  ${rotulo}: ${pendentes.length} para subir (${urls.length - pendentes.length} em cache)`
  );

  let pausa = PAUSA_MINIMA;
  let feitas = 0;
  let ausentes = 0;
  let seguidas = 0;

  for (const url of pendentes) {
    const resultado = await subirImagem(url);

    if (resultado === "subiu") {
      seguidas = 0;
      pausa = Math.max(PAUSA_MINIMA, pausa * 0.9);
    } else if (resultado === "ausente") {
      // Não mexe na pausa: o servidor respondeu, e depressa. Acelerar também
      // seria errado — um 404 não é prova de que ele aguenta mais pressão.
      ausentes++;
    } else {
      seguidas++;
      pausa = Math.min(PAUSA_MAXIMA, pausa * 2);
      if (pausa >= PAUSA_MAXIMA) {
        console.warn(
          `    ⚠ ${seguidas} falhas seguidas e a pausa chegou a ${PAUSA_MAXIMA / 1000}s — ` +
            `o servidor não está colaborando. Interrompendo a fase de imagens.`
        );
        break;
      }
    }

    // Jitter de ±25%: requisições em intervalo exato parecem robô, que é
    // justamente o que a proteção procura.
    await espera(pausa * (0.75 + Math.random() * 0.5));

    if (++feitas % 25 === 0) {
      console.log(`    ${feitas}/${pendentes.length} · pausa ${Math.round(pausa)}ms`);
      writeFileSync(ASSETS, JSON.stringify(assets, null, 1));
    }
  }
  writeFileSync(ASSETS, JSON.stringify(assets, null, 1));
  if (ausentes) console.log(`    ${ausentes} não existem mais no servidor antigo (404)`);
}

// ---------------------------------------------------------------------------
// Montagem
// ---------------------------------------------------------------------------

const key = () => randomUUID().slice(0, 12);

function ranks(quantidade: number): string[] {
  const out: string[] = [];
  let rank = LexoRank.min();
  for (let i = 0; i < quantidade; i++) {
    rank = rank.genNext();
    out.push(rank.toString());
  }
  return out;
}

/** `imageWithAlt` com o asset já enviado. Sem asset, mantém o `placeholder`
 * — é o mesmo contrato do `seed.ts`, e o `ImageSlot` continua desenhando a
 * caixa até alguém subir a foto pelo Studio. */
function imagem(fonte: Imagem | undefined, placeholder: string) {
  if (!fonte) return undefined;
  const assetId = assets[fonte.src];
  return {
    _type: "imageWithAlt",
    alt: fonte.alt || placeholder,
    placeholder,
    credit: fonte.credito,
    ...(assetId
      ? { image: { _type: "image", asset: { _type: "reference", _ref: assetId } } }
      : {}),
  };
}

/**
 * Monta a lista completa de documentos.
 *
 * É chamada duas vezes: uma antes de baixar imagem nenhuma, só para conferir
 * os `_id`, e outra depois, já com os assets no lugar. Rodar de novo custa
 * microssegundos e evita a alternativa — descobrir um `_id` inválido no meio
 * da gravação, com metade do dataset escrita e a outra metade não.
 */
function montar(c: Conteudo): IdentifiedSanityDocumentStub[] {
  const docs: IdentifiedSanityDocumentStub[] = [];

  // A moldura primeiro: sem `siteSettings` e `homePage` o site não renderiza
  // (`lib/content/source.cms.ts` lança), então eles não são "mais um tipo" —
  // são a condição para qualquer coisa aparecer.
  docs.push(...(moldura(c) as IdentifiedSanityDocumentStub[]));

  // Locais primeiro: as Espécies apontam para eles por referência, e o Sanity
  // recusa uma referência para documento que ainda não existe. Na mesma
  // transação a ordem do array já basta.
  const rankLocais = ranks(c.locais.length);
  c.locais.forEach((l, i) =>
    docs.push({
      _id: `locality-${l.slug}`,
      _type: "locality",
      name: l.nome,
      slug: { _type: "slug", current: l.slug },
      shortName: l.curto,
      orderRank: rankLocais[i],
    })
  );

  c.especies.forEach((e) =>
    docs.push({
      _id: `species-${e.slug}`,
      _type: "species",
      scientificName: e.cientifico,
      slug: { _type: "slug", current: e.slug },
      commonNames: e.populares.length ? e.populares : undefined,
      group: e.grupo,
      ordem: e.ordem,
      familia: e.familia,
      subfamilia: e.subfamilia,
      localities: e.locais.map((slug) => ({
        _type: "reference",
        _key: key(),
        _ref: `locality-${slug}`,
      })),
      image: imagem(e.imagem, `foto · ${e.cientifico}`),
      gallery: e.galeria.length
        ? e.galeria.map((g) => ({ ...imagem(g, `foto · ${e.cientifico}`), _key: key() }))
        : undefined,
      habitat: e.habitat,
      description: e.descricao,
      reproduction: e.reproducao,
      distribution: e.distribuicao,
      threatStatus: e.ameaca,
      references: e.referencias,
    })
  );

  c.noticias.forEach((n) =>
    docs.push({
      _id: `news-${n.slug}`,
      _type: "news",
      title: n.titulo,
      slug: { _type: "slug", current: n.slug },
      author: n.autor,
      publishedAt: n.publicadoEm,
      origin: "noticia",
      image: imagem(n.imagem, `foto · ${n.titulo}`),
      body: n.corpo,
      excerpt: n.resumo,
    })
  );

  const rankProjetos = ranks(c.projetos.length);
  c.projetos.forEach((p, i) =>
    docs.push({
      _id: `project-${p.slug}`,
      _type: "project",
      title: p.titulo,
      slug: { _type: "slug", current: p.slug },
      // O site antigo não numerava nem classificava os projetos; a numeração é
      // só a posição na página e a situação vira o padrão do schema. Ambos são
      // obrigatórios e o pesquisador ajusta no Studio.
      number: `Projeto ${String(i + 1).padStart(2, "0")}`,
      status: "em campo",
      description: p.descricao,
      image: imagem(p.imagem, `foto · ${p.titulo}`),
      body: p.corpo,
      orderRank: rankProjetos[i],
    })
  );

  const rankEquipe = ranks(c.equipe.length);
  c.equipe.forEach((p, i) =>
    docs.push({
      _id: `coordinator-${slugify(p.nome)}`,
      _type: "coordinator",
      name: p.nome,
      role: p.funcao,
      image: imagem(p.imagem, `retrato · ${p.nome}`),
      caption: p.nome,
      bio: p.bio,
      // O site antigo não separava linhas de pesquisa das biografias. Fica
      // vazio de propósito, para o pesquisador preencher — inventar a partir
      // do texto corrido produziria etiqueta errada com cara de certa.
      lines: undefined,
      email: p.email,
      lattes: p.lattes,
      orderRank: rankEquipe[i],
    })
  );

  c.publicacoes.forEach((p) =>
    docs.push({
      // Referência é texto longo e não vira `_id`; o par ano + primeiro autor
      // identifica bem e mantém a importação repetível.
      _id: `publication-${p.ano}-${slugify(p.referencia).slice(0, 40)}`,
      _type: "publication",
      reference: p.referencia,
      year: p.ano,
      kind: p.tipo,
      url: p.url,
    })
  );

  c.paginas.forEach((p) =>
    docs.push({
      _id: `page-${p.slug}`,
      _type: "page",
      title: p.titulo,
      slug: { _type: "slug", current: p.slug },
      image: imagem(p.imagem, `foto · ${p.titulo}`),
      body: p.corpo,
    })
  );

  if (!semCompat) {
    const { docs: ponte } = compat(c);
    // `orderRank` só aqui: a galeria é lista arrastável no Studio, e sem rank
    // os cartões saem em ordem indefinida.
    const rankGaleria = ranks(ponte.filter((d) => d._type === "galleryItem").length);
    let i = 0;
    for (const d of ponte) {
      const doc = d as IdentifiedSanityDocumentStub;
      if (doc._type === "galleryItem") doc.orderRank = rankGaleria[i++];
      if (doc._type === "galleryItem" && doc.image) {
        // A projeção não sabe se a foto já subiu; o `imagem()` sabe.
        const fonte = c.especies.find((e) => `${"gallery-sp-"}${e.slug}` === doc._id)?.imagem;
        doc.image = imagem(fonte, `foto · ${(doc.caption as string) ?? ""}`);
      }
      docs.push(doc);
    }
  }

  return docs;
}

/**
 * Confere os `_id` antes de gravar qualquer coisa.
 *
 * O Sanity aceita `[a-zA-Z0-9._-]` e no máximo 128 caracteres, e recusa o
 * documento **na montagem da transação** — quer dizer, tarde: os lotes
 * anteriores já foram comitados. Um `post_name` de 141 caracteres vindo do
 * WordPress derrubou a primeira execução com 200 dos 399 documentos gravados.
 */
function conferirIds(docs: IdentifiedSanityDocumentStub[]) {
  const problemas = docs
    .map((d) => d._id)
    .filter((id) => id.length > 128 || !/^[a-zA-Z0-9._-]+$/.test(id));
  const repetidos = docs
    .map((d) => d._id)
    .filter((id, i, todos) => todos.indexOf(id) !== i);

  if (problemas.length || repetidos.length) {
    throw new Error(
      [
        problemas.length ? `_id inválido (${problemas.length}):` : "",
        ...problemas.map((id) => `    ${id.length} car. — ${id}`),
        repetidos.length ? `_id repetido (${new Set(repetidos).size}):` : "",
        ...[...new Set(repetidos)].map((id) => `    ${id}`),
      ]
        .filter(Boolean)
        .join("\n")
    );
  }
}

async function main() {
  if (!existsSync(CONTEUDO)) {
    throw new Error(`${CONTEUDO} não existe. Rode antes: npx tsx scripts/wp/extract.ts`);
  }
  const c = JSON.parse(readFileSync(CONTEUDO, "utf8")) as Conteudo;

  conferirIds(montar(c));

  if (!semImagens && !seco) {
    console.log("Imagens:");
    try {
      await subirTodas(c.imagens, "referenciadas");
      await subirTodas(c.acervo, "acervo");
    } catch (erro) {
      if (!(erro instanceof DesafioUFSC)) throw erro;
      // Com `--parar-no-bloqueio`, o bloqueio encerra tudo antes de qualquer
      // escrita — nenhum documento é gravado, então não sobra meia importação
      // no dataset.
      if (pararNoBloqueio) throw erro;
      // Sem a flag: o texto não depende das fotos. Melhor gravar os documentos
      // sem imagem agora e completar depois — `assets.json` guarda o que já
      // subiu, e uma nova execução só busca o que falta.
      console.warn(`\n⚠ ${erro.message}\n\n  Seguindo só com o texto.\n`);
    }
  }

  const docs = montar(c);

  const porTipo = docs.reduce<Record<string, number>>((a, d) => {
    a[d._type] = (a[d._type] ?? 0) + 1;
    return a;
  }, {});
  console.log("\nDocumentos:");
  for (const [tipo, n] of Object.entries(porTipo)) console.log(`  ${tipo.padEnd(12)} ${n}`);
  console.log(`  ${"total".padEnd(12)} ${docs.length}`);

  if (seco) {
    console.log("\n--dry: nada foi gravado.");
    return;
  }

  // Uma transação por lote: 500 documentos numa só estoura o limite da API.
  const LOTE = 100;
  for (let i = 0; i < docs.length; i += LOTE) {
    const transacao = client!.transaction();
    for (const doc of docs.slice(i, i + LOTE)) transacao.createOrReplace(doc);
    await transacao.commit();
    console.log(`  gravados ${Math.min(i + LOTE, docs.length)}/${docs.length}`);
  }

  const comFoto = docs.filter((d) => (d as { image?: { image?: unknown } }).image?.image).length;
  console.log(`\n✔ ${docs.length} documentos em ${projectId}/${dataset}`);
  console.log(`  ${comFoto} com foto; o resto mostra o placeholder até alguém subir uma.`);

  if (!semCompat) {
    const { semFoto } = compat(c);
    console.log(
      `\n  Ponte de compatibilidade ativa (ADR 0006): as Espécies também estão\n` +
        `  como Foto da galeria e as Publicações também como Notícia, para\n` +
        `  aparecerem enquanto /especies e /publicacoes não existem.\n` +
        `  ${semFoto} espécies sem foto ficaram fora da galeria.`
    );
  }

  console.log("\n  Precisa de revisão humana antes de publicar:");
  for (const item of PENDENTE_DE_REVISAO) console.log(`    · ${item}`);
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
