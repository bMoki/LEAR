import { randomUUID } from "node:crypto";
import { slugify } from "../../sanity/schemas/slug";
import type { Conteudo } from "./extract";

/**
 * Camada de compatibilidade: projeta o acervo nos tipos que **já têm tela**.
 *
 * O site tem rotas para Notícia, Projeto, Equipe e Galeria. Os tipos criados
 * pela importação — Espécie, Publicação, Local, Página — existem no Studio e no
 * dataset, mas não têm onde aparecer. Sem isto, 87% do que foi importado fica
 * invisível para o público até alguém escrever as telas novas.
 *
 * Então:
 *
 * - **Espécie → Foto da galeria.** A Herpetoteca vira o Caderno fotográfico.
 * - **Publicação → Notícia.** A lista de artigos entra no feed.
 *
 * ⚠️ **Isto é uma ponte, não o modelo.** Cada projeção perde informação, e a
 * perda é grande: uma Espécie tem ordem, família, nomes populares, grau de
 * ameaça e locais de ocorrência; uma Foto da galeria tem imagem, legenda e
 * selo. Nada disso fica pesquisável, filtrável ou indexável enquanto for foto
 * de galeria.
 *
 * Por isso os documentos ricos **continuam sendo gravados**. Eles são a fonte
 * da verdade; estes aqui são derivados e descartáveis. Quando `/especies` e
 * `/publicacoes` existirem, apaga-se o que veio daqui — as Notícias por
 * `origin == "publicacao"`, as Fotos por `_id` começando com `gallery-sp-` —
 * e nada de conteúdo se perde.
 */

const key = () => randomUUID().slice(0, 12);

/** Prefixo dos `_id` gerados aqui, para dar para apagar em bloco depois. */
export const PREFIXO_GALERIA = "gallery-sp-";

/**
 * Trecho que é lista de autores, não título.
 *
 * Dois sinais, porque o acervo mistura dois estilos de citação:
 * - APA — "Bogoni, J. A., Peres, C. A., & Galetti, M.": muitas iniciais soltas.
 * - ABNT — "CARVALHO-ROCHA, Vítor; PERES, Carlos A.": sobrenome, vírgula, nome.
 */
/** O acervo mistura hífen ASCII com o tipográfico (U+2010/2011) em nomes como
 * "CARVALHO‐ROCHA". Sem unificar, as classes de caractere não os reconhecem
 * como parte do sobrenome e o nome se parte ao meio. */
const normalizarHifen = (s: string) => s.replace(/[‐‑]/g, "-");

function pareceListaDeAutores(trecho: string): boolean {
  const t = normalizarHifen(trecho).trim();
  const iniciais = t.match(/\b\p{Lu}\.\s*/gu)?.length ?? 0;
  const palavras = t.split(/\s+/).length;
  if (iniciais >= 2 && iniciais / Math.max(palavras, 1) > 0.2) return true;
  // Começa com "Sobrenome, Nome". O `{0,3}` é essencial: sem teto, qualquer
  // frase com uma vírgula seguida de maiúscula casaria — e "Avaliação de
  // populações no Parque Estadual da Serra do Tabuleiro, Santa Catarina" é
  // título, não autor.
  return /^\p{Lu}[\p{L}'’\-]*(\s+[\p{L}'’\-]+){0,3},\s+\p{Lu}/u.test(t);
}

/**
 * Título de um artigo a partir da referência bibliográfica.
 *
 * O acervo tem os dois formatos, e o ano é o divisor em ambos:
 *
 *     Autores (2024). Título. Periódico, v. 12, p. 1-10.   ← título depois
 *     Autores. Título. (2024) Periódico, v. 49, p. 530.    ← título antes
 *
 * Por isso as duas metades são testadas. Ganha a que parece mais um título:
 * lista de autores é descartada pelas iniciais, e entre as sobreviventes vale a
 * mais longa — nome de periódico é curto ("Ecological Entomology, v"), título de
 * artigo não é.
 *
 * Quando nenhuma convence (capítulo com organizador, preprint), fica a
 * referência inteira encurtada: feio, e nunca errado.
 */
export function tituloDaReferencia(referencia: string): string {
  const candidatos: string[] = [];
  const partes = referencia.split(/\((?:19|20)\d{2}[a-z]?\)\.?/);

  if (partes.length > 1) {
    // Depois do ano: a primeira frase.
    const depois = partes.slice(1).join(" ").trim();
    const primeira = depois.split(/\.\s+/)[0]?.trim();
    if (primeira) candidatos.push(primeira);

    // Antes do ano: a última frase, que é o título no formato "Autores.
    // Título. (2024) Periódico".
    const antes = partes[0].trim().replace(/[.,;\s]+$/, "");
    const ultima = antes.split(/\.\s+/).pop()?.trim();
    if (ultima) candidatos.push(ultima);
  }

  // ABNT não põe o ano entre parênteses, então o corte acima não acha nada.
  // Aqui o título é simplesmente a primeira frase que não é bloco de autores.
  const frases = referencia.split(/\.\s+/).map((f) => f.trim());
  const primeiraNaoAutoral = frases.find((f) => f.length > 20 && !pareceListaDeAutores(f));
  if (primeiraNaoAutoral) candidatos.push(primeiraNaoAutoral);

  const bons = candidatos.filter(
    (t) =>
      t.length > 20 &&
      // Cinco palavras é o que separa um título de um pedaço de citação:
      // "Ecological Entomology, v" tem três e é o periódico, não o artigo.
      t.split(/\s+/).length >= 5 &&
      !pareceListaDeAutores(t)
  );

  const titulo = bons.sort((a, b) => b.length - a.length)[0] ?? referencia;
  return titulo.length > 200 ? titulo.slice(0, 197).trimEnd() + "…" : titulo;
}

/**
 * Primeiro autor citado — vira o "autor" da Notícia.
 *
 * Nas teses em ABNT o nome vem antes do primeiro ponto ("Campos, Leonardo
 * Leite Ferraz de. Interações ecológicas…"); nos artigos em APA vem antes do
 * ano. Tenta o ponto primeiro, porque é o corte mais preciso dos dois, e cai
 * para o ano quando a referência não tem ponto cedo.
 */
export function primeiroAutor(referencia: string): string {
  /** APA: "Bogoni, J. A., Peres, C. A., …" — sobrenome, vírgula, iniciais. */
  const APA = /^\s*([\p{L}'’\-]+(?:\s+[\p{L}'’\-]+)*,\s*(?:\p{Lu}\.\s*)+)/u;
  /** ABNT: "Campos, Leonardo Leite Ferraz de. Título…" — nome por extenso,
   * terminado no primeiro ponto, ponto-e-vírgula ou parêntese. */
  const ABNT = /^\s*(\p{Lu}[\p{L}'’\-]*(?:[\s\-][\p{L}'’\-]+)*,\s*[^.;(]+)/u;

  // A ordem importa: os dois padrões casam com quase toda referência, e o que
  // decide qual está certo é o estilo. Parênteses com ano é a marca do APA.
  const ordem = /\((?:19|20)\d{2}/.test(referencia) ? [APA, ABNT] : [ABNT, APA];
  const texto = normalizarHifen(referencia);

  for (const padrao of ordem) {
    const nome = texto.match(padrao)?.[1]?.replace(/[\s,;]+$/, "").trim();
    if (nome && nome.length > 2 && nome.length < 60) return nome;
  }
  return "LEAR";
}

export function compat(c: Conteudo) {
  const docs: Record<string, unknown>[] = [];

  // --- Espécie → Foto da galeria -------------------------------------------
  // Só as que têm foto. Uma espécie sem imagem viraria um cartão vazio no
  // caderno fotográfico — pior que ausente, porque ocupa espaço sem informar.
  const comFoto = c.especies.filter((e) => e.imagem);
  comFoto.forEach((e) => {
    const popular = e.populares[0];
    docs.push({
      _id: `${PREFIXO_GALERIA}${e.slug}`,
      _type: "galleryItem",
      image: {
        _type: "imageWithAlt",
        alt: e.imagem!.alt || e.cientifico,
        placeholder: `foto · ${e.cientifico}`,
        credit: e.imagem!.credito,
      },
      // A legenda carrega o que couber do que a Espécie sabe: é o único campo
      // de texto que a galeria tem, e sem ele o nome do animal sumiria.
      caption: popular ? `${e.cientifico} — ${popular}` : e.cientifico,
      stamp: e.familia,
    });
  });

  // --- Publicação → Notícia -------------------------------------------------
  c.publicacoes.forEach((p) => {
    const titulo = tituloDaReferencia(p.referencia);
    const slug = `${slugify(titulo).slice(0, 80).replace(/-[^-]*$/, "")}-${p.ano}`;
    docs.push({
      _id: `news-pub-${slug}`.slice(0, 120),
      _type: "news",
      title: titulo,
      slug: { _type: "slug", current: slug },
      author: primeiroAutor(p.referencia),
      // Só o ano é conhecido. 1º de janeiro é convenção visível — ninguém vai
      // confundir com a data real de publicação.
      publishedAt: `${p.ano}-01-01T12:00:00.000Z`,
      origin: "publicacao",
      excerpt: p.referencia.length > 300 ? p.referencia.slice(0, 297) + "…" : p.referencia,
      body: [
        {
          _type: "block",
          _key: key(),
          style: "normal",
          markDefs: [],
          children: [{ _type: "span", _key: key(), text: p.referencia, marks: [] }],
        },
        ...(p.url
          ? [
              {
                _type: "block",
                _key: key(),
                style: "normal",
                markDefs: [{ _type: "link", _key: "url", href: p.url }],
                children: [
                  { _type: "span", _key: key(), text: "Acessar a publicação", marks: ["url"] },
                ],
              },
            ]
          : []),
      ],
    });
  });

  return { docs, semFoto: c.especies.length - comFoto.length };
}
