/**
 * Gera o mapa de redirecionamento do site antigo para o novo.
 *
 *     npx tsx scripts/wp/redirects.ts          # escreve lib/seo/redirects.ts
 *     npx tsx scripts/wp/redirects.ts --dry    # só relata
 *
 * **Por que isto existe.** `herpetologia.ufsc.br` está no ar desde 2010 e tem
 * URLs indexadas. O WordPress servia tudo na raiz — `/{post_name}/` valia para
 * página, notícia e projeto igualmente. O site novo separa por prefixo
 * (`/noticias/…`, `/projetos/…`), então **todo endereço de notícia e de projeto
 * muda**. Sem redirecionamento, a troca de DNS transforma 15 anos de links em
 * 404: os que estão na busca, os citados em artigo e os que alguém salvou.
 *
 * **Por que gerar, e não escrever à mão.** O slug novo não é o `post_name`: ele
 * passa pelo `slugDe`, que tira acento e corta em 96 caracteres na última
 * palavra inteira. Três dos catorze projetos mudaram de nome só por causa do
 * corte — `…-vila-da-gloria-sao-f-do-sul-sc` virou `…-vila-da-gloria-sao-f-do`.
 * Conferir isso a olho é onde o erro entra.
 *
 * A saída é `lib/seo/redirects.ts`, um arquivo literal e versionado. Ele **não**
 * lê o despejo nem o `content.json` em tempo de build — os dois estão fora do
 * git, e o site precisa construir na Vercel sem eles.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { readDump, type Row } from "./dump";
import { slugDe } from "./endereco";
import { EQUIPE, FICHAS, LISTAS, NOTICIAS, PAGINAS, PROJETOS, PUBLICACOES } from "./mapa";

const DUMP = process.env.WP_DUMP ?? join(process.cwd(), "herpetologia.json");
const SAIDA = join(process.cwd(), "lib", "seo", "redirects.ts");
const seco = process.argv.includes("--dry");

/**
 * Destinos que o despejo não deduz — julgamento, como o `mapa.ts`.
 *
 * São as páginas que existiam no site antigo e **não viraram documento**:
 * índices, landings e as páginas de equipe. O critério para redirecionar em vez
 * de deixar cair em 404 é um só: **o destino responde à mesma pergunta que a
 * página antiga respondia.** Redirecionamento para destino sem relação é pior
 * que 404 — o Google trata como “soft 404” e ainda esconde do usuário que o
 * conteúdo acabou.
 */
const MANUAIS: Record<number, string> = {
  // Índices e landings do site antigo.
  7: "/", // Home
  97: "/#coords", // Membros
  116: "/projetos", // "Projetos2"
  274: "/#galeria", // Galeria
  3284: "/noticias", // Novidades
  3494: "/projetos", // Projetos

  // As seis páginas de equipe viraram documentos `coordinator`, que hoje
  // aparecem só na seção da página inicial. Quando houver `/equipe`, é aqui
  // que muda.
  298: "/#coords", // Professor responsável
  95: "/#coords", // Colaboradores
  94: "/#coords", // Graduação
  268: "/#coords", // Doutorado
  96: "/#coords", // Mestrado
  4668: "/#coords", // Pós-doutorado

  // Publicações viraram documentos `publication`, projetados em Notícia pela
  // ponte do ADR 0006 até `/publicacoes` existir.
  [PUBLICACOES]: "/noticias",
};

/**
 * Listas de herpetofauna → o projeto que trata daquela mesma lista.
 *
 * Quatro dos seis Locais têm um projeto “Lista de espécies dos anfíbios e
 * répteis de …” importado, e ele é o destino honesto: mesma área, mesmo
 * levantamento. Os dois que sobram (`santa-catarina`, estado inteiro, e
 * `distrito-do-sai`) não têm equivalente e ficam de fora de propósito.
 */
const LISTA_PARA_PROJETO: Record<string, number> = {
  "ilha-de-santa-catarina": 1612,
  "parque-nacional-de-sao-joaquim": 1600,
  "parque-estadual-da-serra-do-tabuleiro": 1606,
  "reserva-biologica-marinha-do-arvoredo": 1618,
};

type Redirecionamento = { source: string; destination: string; permanent: boolean };

async function main() {
  const dump = await readDump(DUMP);
  const posts = new Map<number, Row>(dump.posts.map((p) => [Number(p.ID), p]));

  const titulo = (p: Row) => (p.post_title ?? "").trim();
  const origem = (p: Row) => (p.post_name ? `/${p.post_name}` : null);

  const mapa = new Map<string, string>();
  const semOrigem: string[] = [];

  /** Registra um par, ignorando o que já é igual — redirecionar `/x` para `/x`
   * é laço infinito, e o Next não avisa. */
  const registrar = (id: number, destino: string, rotulo: string) => {
    const p = posts.get(id);
    if (!p) {
      semOrigem.push(`${rotulo} (id ${id}: não está no despejo)`);
      return;
    }
    const src = origem(p);
    if (!src) {
      semOrigem.push(`${rotulo} (id ${id}: sem post_name)`);
      return;
    }
    if (src === destino) return;
    const anterior = mapa.get(src);
    if (anterior && anterior !== destino) {
      semOrigem.push(`⚠ ${src} disputado: ${anterior} vs ${destino}`);
      return;
    }
    mapa.set(src, destino);
  };

  for (const id of NOTICIAS) {
    const p = posts.get(id);
    if (p) registrar(id, `/noticias/${slugDe(p.post_name, titulo(p))}`, "notícia");
  }

  const slugDoProjeto = new Map<number, string>();
  for (const id of PROJETOS) {
    const p = posts.get(id);
    if (!p) continue;
    const slug = slugDe(p.post_name, titulo(p));
    slugDoProjeto.set(id, slug);
    registrar(id, `/projetos/${slug}`, "projeto");
  }

  // Páginas institucionais: o slug é escolhido no `mapa.ts`, não derivado.
  for (const { id, slug } of PAGINAS) registrar(id, `/${slug}`, "página");

  for (const { id, local } of LISTAS) {
    const projeto = LISTA_PARA_PROJETO[local];
    const slug = projeto && slugDoProjeto.get(projeto);
    if (slug) registrar(id, `/projetos/${slug}`, `lista (${local})`);
  }

  for (const [id, destino] of Object.entries(MANUAIS)) registrar(Number(id), destino, "manual");

  const redirecionamentos: Redirecionamento[] = [...mapa.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([source, destination]) => ({ source, destination, permanent: true }));

  // --- Relatório ------------------------------------------------------------
  console.log(`\n  ${redirecionamentos.length} redirecionamentos\n`);
  for (const r of redirecionamentos) console.log(`    ${r.source}  →  ${r.destination}`);

  const orfas = [...FICHAS, ...LISTAS.map((l) => l.id)]
    .filter((id) => {
      const p = posts.get(id);
      const src = p && origem(p);
      return src && !mapa.has(src);
    })
    .map((id) => `${origem(posts.get(id)!)}  (${titulo(posts.get(id)!)})`);

  if (orfas.length) {
    console.log(`\n  ${orfas.length} páginas sem destino — caem em 404 na virada:`);
    for (const o of orfas) console.log(`    ${o}`);
    console.log(
      "\n  São fichas de espécie e listas de herpetofauna. Todas viraram\n" +
        "  documentos `species` no Sanity, e nenhuma tem rota: é o custo de\n" +
        "  `/especies` não existir (ADR 0006). Some quando a rota existir."
    );
  }
  if (semOrigem.length) {
    console.log("\n  Avisos:");
    for (const a of semOrigem) console.log(`    ${a}`);
  }

  // --- Conferência contra o que a importação de fato grava -----------------
  //
  // Um 308 para um endereço que não existe é pior que um 404: o buscador
  // transfere o sinal da URL antiga para uma página de erro. Enquanto o
  // `content.json` estiver na máquina, dá para conferir de graça.
  const CONTEUDO = join(process.cwd(), "scripts", "wp", "content.json");
  if (existsSync(CONTEUDO)) {
    const c = JSON.parse(readFileSync(CONTEUDO, "utf8")) as {
      noticias: { slug: string }[];
      projetos: { slug: string }[];
      paginas: { slug: string }[];
    };
    const existentes = new Set([
      "/",
      "/noticias",
      "/projetos",
      ...c.noticias.map((n) => `/noticias/${n.slug}`),
      ...c.projetos.map((p) => `/projetos/${p.slug}`),
      ...c.paginas.map((p) => `/${p.slug}`),
    ]);
    const quebrados = redirecionamentos.filter(
      (r) => !existentes.has(r.destination.replace(/#.*$/, "") || "/")
    );
    if (quebrados.length) {
      console.error(`\n  ❌ ${quebrados.length} destinos não existem no conteúdo importado:`);
      for (const r of quebrados) console.error(`    ${r.source}  →  ${r.destination}`);
      process.exit(1);
    }
    console.log(`\n  ✅ os ${redirecionamentos.length} destinos existem no content.json.`);
  } else {
    console.log("\n  (content.json ausente — destinos não conferidos)");
  }

  if (seco) return;

  const arquivo =
    `/**\n` +
    ` * Endereços do site antigo (WordPress em \`herpetologia.ufsc.br\`) para os do\n` +
    ` * site novo. **Gerado** por \`npx tsx scripts/wp/redirects.ts\` — não editar à mão.\n` +
    ` *\n` +
    ` * O WordPress servia tudo na raiz; aqui notícia e projeto ganharam prefixo, e\n` +
    ` * alguns slugs encolheram no corte de 96 caracteres do ADR 0005. Sem esta\n` +
    ` * tabela, a troca de DNS transforma os links indexados em 404.\n` +
    ` *\n` +
    ` * \`permanent: true\` emite **308**, que instrui o buscador a transferir o sinal\n` +
    ` * da URL antiga para a nova — é o que preserva 15 anos de indexação.\n` +
    ` */\n` +
    `export type LegacyRedirect = {\n` +
    `  source: string;\n` +
    `  destination: string;\n` +
    `  permanent: boolean;\n` +
    `};\n\n` +
    `export const legacyRedirects: LegacyRedirect[] = [\n` +
    redirecionamentos
      .map(
        (r) =>
          `  { source: ${JSON.stringify(r.source)}, destination: ${JSON.stringify(
            r.destination
          )}, permanent: ${r.permanent} },`
      )
      .join("\n") +
    `\n];\n`;

  writeFileSync(SAIDA, arquivo);
  console.log(`\n  Escrito: lib/seo/redirects.ts\n`);
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
