import { randomUUID } from "node:crypto";

/**
 * Converte o HTML do WordPress antigo em Portable Text.
 *
 * O corpo das páginas é uma mistura de três geradores — blocos do Gutenberg
 * (`<!-- wp:paragraph -->`), widgets do Elementor e do Beaver Builder — com
 * `<style>`, `<svg>` e `<div>` de layout no meio. Nada disso vira conteúdo: o
 * alvo é o subconjunto que `richBodyOf` oferece no Studio (parágrafo, h2, h3,
 * citação, lista, negrito, itálico, link), porque o que o editor não deixa
 * criar não precisa ser importado.
 *
 * Como o `markdown-to-portable-text.ts` ao lado, **não é um parser de HTML
 * genérico**. A entrada é fechada, conhecida e roda uma vez.
 *
 * Imagens não viram bloco — `richBodyOf` não tem tipo de imagem. Elas são
 * colhidas à parte por `colherImagens`, que devolve o que vai para os campos
 * `image` e `gallery` do documento.
 */

const key = () => randomUUID().slice(0, 12);

export type Span = { _type: "span"; _key: string; text: string; marks: string[] };
export type MarkDef = { _type: "link"; _key: string; href: string };
export type Block = {
  _type: "block";
  _key: string;
  style: string;
  markDefs: MarkDef[];
  children: Span[];
  listItem?: string;
  level?: number;
};

// ---------------------------------------------------------------------------
// Texto
// ---------------------------------------------------------------------------

const ENTIDADES: Record<string, string> = {
  nbsp: " ",
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  hellip: "…",
  ndash: "–",
  mdash: "—",
  rsquo: "’",
  lsquo: "‘",
  ldquo: "“",
  rdquo: "”",
  times: "×",
  deg: "°",
};

export function decode(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (todo, nome) => ENTIDADES[nome.toLowerCase()] ?? todo);
}

/** HTML → texto corrido, para campos de string e `text` do schema. */
export function toText(html: string): string {
  return decode(
    limpar(html)
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/[ \t ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Tira o que nunca é conteúdo: comentários, scripts, estilos, SVG, shortcodes. */
export function limpar(html: string): string {
  return (html ?? "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|svg|noscript)\b[\s\S]*?<\/\1>/gi, "")
    .replace(/\[\/?[a-z_]+[^\]]*\]/gi, "");
}

// ---------------------------------------------------------------------------
// Inline → spans
// ---------------------------------------------------------------------------

const MARCA: Record<string, string> = {
  strong: "strong",
  b: "strong",
  em: "em",
  i: "em",
  cite: "em",
};

/** Percorre o HTML inline mantendo uma pilha de marcas ativas. Cada `<a>` vira
 * uma anotação em `markDefs`, que é como o Portable Text guarda links. */
function inline(html: string): { children: Span[]; markDefs: MarkDef[] } {
  const children: Span[] = [];
  const markDefs: MarkDef[] = [];
  const pilha: string[] = [];
  const chavesDeLink = new Set<string>();

  const empurra = (texto: string) => {
    const t = decode(texto).replace(/[ \t ]+/g, " ");
    if (!t) return;
    const ultimo = children[children.length - 1];
    const marks = [...pilha];
    // Junta spans vizinhos de mesma formatação — senão “<b>a</b><b>b</b>”
    // viraria dois spans idênticos e o editor mostraria o cursor preso entre
    // eles.
    if (ultimo && ultimo.marks.join() === marks.join()) ultimo.text += t;
    else children.push({ _type: "span", _key: key(), text: t, marks });
  };

  let pos = 0;
  const tag = /<(\/?)([a-z0-9]+)((?:"[^"]*"|'[^']*'|[^>])*)>/gi;
  for (const m of html.matchAll(tag)) {
    if (m.index > pos) empurra(html.slice(pos, m.index));
    pos = m.index + m[0].length;

    const fechando = m[1] === "/";
    const nome = m[2].toLowerCase();
    const attrs = m[3] ?? "";

    if (nome === "br") {
      empurra("\n");
      continue;
    }
    if (nome === "a") {
      if (fechando) {
        // Tira da pilha a marca de link mais recente — as demais entradas são
        // negrito/itálico, que `</a>` não fecha.
        for (let i = pilha.length - 1; i >= 0; i--) {
          if (chavesDeLink.has(pilha[i])) {
            pilha.splice(i, 1);
            break;
          }
        }
        continue;
      }
      const href = decode((attrs.match(/href\s*=\s*"([^"]*)"/i) ?? [])[1] ?? "").trim();
      // Link vazio (o "Saiba mais" que o Elementor deixava sem destino) vira
      // texto comum em vez de uma âncora quebrada.
      if (!/^(https?:|mailto:|\/)/i.test(href)) continue;
      const def: MarkDef = { _type: "link", _key: key(), href };
      markDefs.push(def);
      chavesDeLink.add(def._key);
      pilha.push(def._key);
      continue;
    }

    const marca = MARCA[nome];
    if (!marca) continue;
    if (fechando) {
      const i = pilha.lastIndexOf(marca);
      if (i >= 0) pilha.splice(i, 1);
    } else {
      pilha.push(marca);
    }
  }
  if (pos < html.length) empurra(html.slice(pos));

  // markDefs órfãos (link cujo texto era vazio) sujariam o documento.
  const usados = new Set(children.flatMap((c) => c.marks));
  return {
    children: children.filter((c) => c.text.trim() !== "" || c.text === "\n"),
    markDefs: markDefs.filter((d) => usados.has(d._key)),
  };
}

// ---------------------------------------------------------------------------
// Blocos
// ---------------------------------------------------------------------------

function bloco(html: string, style: string, listItem?: string): Block | null {
  const { children, markDefs } = inline(html);
  if (children.length === 0) return null;
  if (children.every((c) => c.text.trim() === "")) return null;
  return {
    _type: "block",
    _key: key(),
    style,
    markDefs,
    children,
    ...(listItem ? { listItem, level: 1 } : {}),
  };
}

const BLOCOS = /<(h[1-6]|p|li|blockquote|figcaption|td)\b[^>]*>([\s\S]*?)<\/\1>/gi;

export function htmlToPortableText(html: string): Block[] {
  const limpo = limpar(html);
  const blocks: Block[] = [];
  const vistos = new Set<string>();

  for (const m of limpo.matchAll(BLOCOS)) {
    const tag = m[1].toLowerCase();
    const conteudo = m[2];

    // `<td>` costuma embrulhar parágrafos — as tabelas do site antigo eram
    // usadas como grade de layout, não como dado tabular. Quando há `<p>`
    // dentro, o `<td>` é só a moldura e os filhos já foram capturados.
    if (tag === "td" && /<p\b/i.test(conteudo)) continue;

    let style = "normal";
    let listItem: string | undefined;
    if (tag === "blockquote") style = "blockquote";
    else if (tag === "li") listItem = "bullet";
    else if (/^h[1-6]$/.test(tag)) {
      // O schema só oferece h2 e h3. O h1 da página vira h2 porque o título do
      // documento já ocupa o h1 no site.
      const nivel = Number(tag[1]);
      style = nivel <= 2 ? "h2" : "h3";
    }

    const b = bloco(conteudo, style, listItem);
    if (!b) continue;

    // O HTML aninhado faz o mesmo texto casar duas vezes (um `<p>` dentro de
    // um `<td>`, por exemplo). Repetição literal e seguida é ruído.
    const assinatura = style + "|" + b.children.map((c) => c.text).join("");
    if (vistos.has(assinatura)) continue;
    vistos.add(assinatura);

    blocks.push(b);
  }

  return blocks;
}

// ---------------------------------------------------------------------------
// Imagens
// ---------------------------------------------------------------------------

export type ImagemColhida = { src: string; alt: string; credito?: string };

/** Toda `<img>` do corpo, na ordem, sem repetir. Descarta os tamanhos gerados
 * pelo WordPress (`-1024x768`) para ficar com o arquivo original. */
export function colherImagens(html: string): ImagemColhida[] {
  const limpo = limpar(html);
  const out: ImagemColhida[] = [];
  const vistos = new Set<string>();

  const figuras = /<figure\b[^>]*>([\s\S]*?)<\/figure>/gi;
  const creditos = new Map<string, string>();
  for (const f of limpo.matchAll(figuras)) {
    const src = (f[1].match(/<img[^>]+src="([^"]+)"/i) ?? [])[1];
    const cap = (f[1].match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i) ?? [])[1];
    if (src && cap) creditos.set(original(src), creditoDe(toText(cap)) ?? "");
  }

  for (const m of limpo.matchAll(/<img[^>]+>/gi)) {
    const src = (m[0].match(/src\s*=\s*"([^"]*)"/i) ?? [])[1];
    if (!src || /^data:/i.test(src)) continue;
    const url = original(src);
    if (vistos.has(url)) continue;
    vistos.add(url);
    const alt = decode((m[0].match(/alt\s*=\s*"([^"]*)"/i) ?? [])[1] ?? "").trim();
    const credito = creditos.get(url) || undefined;
    out.push({ src: url, alt, credito });
  }
  return out;
}

/**
 * `http://www.herpetologia.ufsc.br/…/foto-1024x768.jpg` →
 * `https://herpetologia.ufsc.br/…/foto.jpg`.
 *
 * Três normalizações numa: tira o sufixo de tamanho (o WordPress guarda o
 * original ao lado das miniaturas, e queremos a maior resolução), força HTTPS
 * e descarta o `www.`. O acervo tem a mesma foto escrita das quatro formas
 * conforme o ano do upload; sem unificar, a mesma imagem subiria repetida.
 */
export function original(src: string): string {
  return src
    .replace(/-\d{2,4}x\d{2,4}(?=\.[a-z]{3,4}(?:$|\?))/i, "")
    .replace(/^http:/i, "https:")
    .replace(/^https:\/\/www\./i, "https://");
}

/** "Foto: Vítor Carvalho-Rocha" → "Vítor Carvalho-Rocha". */
export function creditoDe(legenda: string): string | undefined {
  const linha = legenda.split("\n").find((l) => /^(fotos?|imagem|v[ií]deo)\s*:/i.test(l.trim()));
  const nome = linha?.replace(/^[^:]+:\s*/, "").trim();
  // Algumas legendas trazem o DOI do artigo de origem no lugar do fotógrafo.
  return nome && !/^10\.\d{4}/.test(nome) ? nome : undefined;
}
