import { randomUUID } from "node:crypto";

/**
 * Converte Markdown em Portable Text para o seed das Notícias.
 *
 * Cobre exatamente o subconjunto que os corpos originais usam — verificado no
 * `seed-data.json`: parágrafos, `##`, listas com `-`, `**forte**` e `*ênfase*`.
 * Sem links, código, imagens ou aninhamento. **Não é um parser de Markdown
 * genérico** e não precisa ser: a entrada é fechada, conhecida e roda uma vez.
 * Depois do seed, quem escreve notícia usa o editor visual do Studio.
 */

export type Span = { _type: "span"; _key: string; text: string; marks: string[] };

export type Block = {
  _type: "block";
  _key: string;
  style: string;
  markDefs: never[];
  children: Span[];
  listItem?: string;
  level?: number;
};

const key = () => randomUUID().slice(0, 12);

/** Captura `**forte**` e `*ênfase*`. O `**` vem primeiro na alternância para
 * não ser confundido com duas ênfases vazias. */
const INLINE = /(\*\*[^*]+\*\*|\*[^*\n]+\*)/g;

export function spans(text: string): Span[] {
  return text
    .split(INLINE)
    .filter((part) => part !== "")
    .map((part) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return { _type: "span" as const, _key: key(), text: part.slice(2, -2), marks: ["strong"] };
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return { _type: "span" as const, _key: key(), text: part.slice(1, -1), marks: ["em"] };
      }
      return { _type: "span" as const, _key: key(), text: part, marks: [] };
    });
}

function block(text: string, style = "normal", listItem?: string): Block {
  return {
    _type: "block",
    _key: key(),
    style,
    markDefs: [],
    children: spans(text),
    ...(listItem ? { listItem, level: 1 } : {}),
  };
}

export function markdownToPortableText(markdown: string): Block[] {
  const blocks: Block[] = [];

  for (const chunk of markdown.split(/\n{2,}/)) {
    const lines = chunk.split("\n").filter((line) => line.trim() !== "");
    if (lines.length === 0) continue;

    // Um bloco inteiro de itens de lista vira um item de lista por linha.
    if (lines.every((line) => /^\s*[-*+]\s+/.test(line))) {
      for (const line of lines) {
        blocks.push(block(line.replace(/^\s*[-*+]\s+/, ""), "normal", "bullet"));
      }
      continue;
    }

    for (const line of lines) {
      const heading = line.match(/^(#{1,6})\s+(.*)$/);
      if (heading) {
        // O schema só oferece h2 e h3; níveis mais fundos colapsam em h3.
        blocks.push(block(heading[2], `h${Math.min(heading[1].length, 3)}`));
      } else {
        blocks.push(block(line));
      }
    }
  }

  return blocks;
}
