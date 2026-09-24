import type { PortableTextBlock } from "@portabletext/types";

/**
 * Três funções puras que preparam texto do CMS para virar `<title>`,
 * `<meta description>` ou dado estruturado.
 *
 * Nenhuma delas decide política — quem decide é `lib/seo/metadata.ts`. Aqui só
 * se limpa e se corta.
 */

/** Limite prático de uma descrição antes de o Google truncar. */
export const MAX_DESCRIPTION = 155;

/**
 * Tira os marcadores de Markdown inline que os campos curtos do site carregam
 * por convenção (ADR 0002) e que um `<title>` não interpreta.
 *
 * É o defeito que já vazou para produção uma vez, com `17*+*` saindo literal.
 * Os quatro títulos de projeto têm asterisco: `Serpentes *crípticas* da Serra
 * do Mar`.
 *
 * **Limitação aceita:** é remoção de marcador, não um parser CommonMark. `17 *+*`
 * vira `17 +`, que é o resultado desejado. O colapso de espaço no fim existe
 * porque os títulos de seção trazem `\n` — quebra de linha dentro de um
 * `<title>` não faz sentido nenhum.
 */
export function stripInlineMarkdown(value: string): string {
  return value
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extrai o texto corrido de um corpo em Portable Text, para servir de descrição
 * quando o "Resumo" está vazio — que é o estado das cinco notícias hoje.
 *
 * Só blocos de texto entram: título de seção, lista e parágrafo viram uma linha
 * só. Marcas (negrito, link) não aparecem, porque o que interessa aqui é a
 * primeira frase legível.
 */
export function portableTextToPlain(blocks: PortableTextBlock[] | undefined | null): string {
  if (!blocks?.length) return "";

  return blocks
    .filter((block) => block._type === "block")
    .map((block) =>
      Array.isArray(block.children)
        ? block.children
            .map((child) => (typeof child.text === "string" ? child.text : ""))
            .join("")
        : ""
    )
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Corta no espaço anterior ao limite, para a descrição não terminar no meio de
 * uma palavra. A reticência sinaliza que há mais texto — é o que o Google
 * mostraria de qualquer forma ao truncar sozinho, só que no lugar certo.
 */
export function truncateAtWord(value: string, max: number = MAX_DESCRIPTION): string {
  const text = value.trim();
  if (text.length <= max) return text;

  const head = text.slice(0, max + 1);
  const lastSpace = head.lastIndexOf(" ");
  const cut = lastSpace > 0 ? head.slice(0, lastSpace) : text.slice(0, max);

  return `${cut.replace(/[\s,.;:—–-]+$/, "")}…`;
}
