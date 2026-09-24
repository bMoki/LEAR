/**
 * De onde vem cada coisa no despejo do WordPress.
 *
 * O site antigo não tinha tipos de conteúdo: **tudo** era `page`, e o que
 * distinguia uma espécie de um projeto era o menu em que a página estava
 * pendurada. Como esse menu não sobreviveu à exportação de forma utilizável,
 * a correspondência foi levantada à mão a partir dos links da página
 * `/projetos`, dos submenus da Herpetoteca e da leitura das 56 páginas.
 *
 * Por isso está aqui, isolado e comentado, em vez de espalhado pelo extrator:
 * é a única parte da importação que é **julgamento**, não regra. Se algo vier
 * parar na gaveta errada, o conserto é nesta tabela.
 */

/** Páginas linkadas na antiga `/projetos` (ID 3494). */
export const PROJETOS = [
  306, // Monitoramento populacional de Boana poaju
  1594, // Diagnóstico socioambiental — Nascentes do Saí
  1603, // Interação entre insetos parasitas e vertebrados hospedeiros
  1609, // Monitoramento acústico automatizado
  1615, // Conservação dos sapinhos-da-montanha (Brachycephalus)
  1612, // Lista de espécies — Ilha de Santa Catarina
  1618, // Lista de espécies — Reserva Biológica Marinha do Arvoredo
  1600, // Lista de espécies — Parque Nacional de São Joaquim
  1606, // Lista de espécies — Parque Estadual da Serra do Tabuleiro
  340, // Rede de pesquisa em bioacústica
  345, // Avaliação e monitoramento — PARNA São Joaquim
  353, // Coleção herpetológica na divulgação da fauna catarinense
  2377, // Corethrella em Santa Catarina
  2387, // DNA ambiental com insetos hematófagos
];

/** `post_type=post` — as sete notícias reais do site. */
export const NOTICIAS = [143, 151, 501, 1202, 3806, 4117, 4130];

/**
 * Páginas de equipe. `secao` é o cargo quando a página inteira trata de um só
 * — nas que misturam níveis (268, 96), o cargo sai do subtítulo antes de cada
 * pessoa e este valor é só o fallback.
 */
export const EQUIPE: { id: number; secao: string }[] = [
  { id: 298, secao: "Professor responsável" },
  { id: 95, secao: "Colaborador" },
  { id: 94, secao: "Graduação" },
  { id: 268, secao: "Doutorado" },
  { id: 96, secao: "Mestrado" },
  { id: 4668, secao: "Pós-doutorado" },
];

/**
 * Listas de herpetofauna. Cada Local rendia duas páginas no site antigo, uma
 * por grupo; aqui as duas apontam para o mesmo `local`, e `grupo` diz qual
 * metade da lista aquela página trazia.
 */
export const LISTAS: { id: number; local: string; grupo: "anfibio" | "reptil" }[] = [
  { id: 2193, local: "santa-catarina", grupo: "anfibio" },
  { id: 2469, local: "santa-catarina", grupo: "reptil" },
  { id: 618, local: "parque-nacional-de-sao-joaquim", grupo: "anfibio" },
  { id: 624, local: "parque-nacional-de-sao-joaquim", grupo: "reptil" },
  { id: 1790, local: "ilha-de-santa-catarina", grupo: "anfibio" },
  { id: 2038, local: "ilha-de-santa-catarina", grupo: "reptil" },
  { id: 1866, local: "distrito-do-sai", grupo: "anfibio" },
  { id: 1916, local: "distrito-do-sai", grupo: "reptil" },
  { id: 2044, local: "parque-estadual-da-serra-do-tabuleiro", grupo: "anfibio" },
  { id: 2077, local: "reserva-biologica-marinha-do-arvoredo", grupo: "anfibio" },
];

/** Os Locais em si. O nome curto é o que cabe na etiqueta de uma espécie. */
export const LOCAIS: { slug: string; nome: string; curto?: string }[] = [
  { slug: "santa-catarina", nome: "Estado de Santa Catarina", curto: "SC" },
  {
    slug: "parque-nacional-de-sao-joaquim",
    nome: "Parque Nacional de São Joaquim",
    curto: "PARNA São Joaquim",
  },
  { slug: "ilha-de-santa-catarina", nome: "Ilha de Santa Catarina", curto: "Ilha de SC" },
  {
    slug: "distrito-do-sai",
    nome: "Distrito do Saí, São Francisco do Sul",
    curto: "Distrito do Saí",
  },
  {
    slug: "parque-estadual-da-serra-do-tabuleiro",
    nome: "Parque Estadual da Serra do Tabuleiro",
    curto: "Serra do Tabuleiro",
  },
  {
    slug: "reserva-biologica-marinha-do-arvoredo",
    nome: "Reserva Biológica Marinha do Arvoredo",
    curto: "Arvoredo",
  },
];

/** Fichas de espécie individuais. Só duas estão completas; o resto é a linha
 * de classificação mais uma galeria, e mesmo assim vale — a galeria é foto do
 * acervo que não aparece em nenhum outro lugar. */
export const FICHAS = [529, 567, 570, 818, 862, 878, 889, 897, 903];

/**
 * Taxonomia que não dá para deduzir do despejo.
 *
 * Fichas cujo corpo é só um `[gallery]`, sem a linha "Classe: … > Ordem: …",
 * chegariam sem ordem nem família — e, pior, cairiam no grupo padrão. Uma
 * serpente arquivada entre os anfíbios não é um campo em branco: é um dado
 * errado, que ninguém revisando a lista de anfíbios pensaria em procurar.
 */
export const TAXONOMIA_MANUAL: Record<
  string,
  { grupo: "anfibio" | "reptil"; ordem: string; familia: string }
> = {
  // Página 878 — só a galeria de fotos. É a dormideira, uma serpente.
  "Sibynomorphus neuwiedii": { grupo: "reptil", ordem: "Squamata", familia: "Dipsadidae" },
};

/** Página única de Publicações. */
export const PUBLICACOES = 278;

/** Texto institucional que não é Notícia, Projeto nem Espécie. */
export const PAGINAS = [
  { id: 372, titulo: "Herpetoteca", slug: "herpetoteca" },
  { id: 614, titulo: "Coleção Herpetológica da UFSC", slug: "colecao-herpetologica" },
  { id: 1273, titulo: "Herpeto Sem Fronteiras", slug: "herpeto-sem-fronteiras" },
  { id: 276, titulo: "Visitas", slug: "visitas" },
  { id: 2903, titulo: "Política de privacidade", slug: "politica-de-privacidade" },
];

/**
 * Páginas deliberadamente **não** importadas, para o próximo a mexer nisto não
 * precisar redescobrir uma por uma:
 *
 * - 2, 8 — "Página de Exemplo" e "Sobre" do WordPress recém-instalado.
 * - 7, 97, 116, 274, 3284, 3494 — índices e landings (Home, Membros,
 *   Projetos2, Galeria, Novidades, Projetos). São navegação, e o site novo tem
 *   a sua própria.
 * - 3044 — "spp-teste1": protótipo da ficha rica de espécie, com texto
 *   "dummy tooltip contents" do Elementor. Nunca teve conteúdo real.
 * - 1995, 4464, 4795, 3096, 3097, 3098 — vazias ou rascunho do construtor.
 */
export const IGNORADAS = [2, 8, 7, 97, 116, 274, 3284, 3494, 3044, 1995, 4464, 4795, 3096, 3097, 3098];
