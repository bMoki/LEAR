/**
 * Convenção de formatação dos campos de texto curto (ADR 0002): o valor é uma
 * string com Markdown **inline**, renderizada por `InlineText` em
 * `components/ui/RichText.tsx`. Só emphasis, strong, link e quebra de linha —
 * nada de blocos. Textos longos (corpo de Notícia) usam Portable Text.
 */
export const INLINE_MD =
  "Formatação: *itálico*, **negrito** e [texto do link](endereço). " +
  "Cada quebra de linha vira uma quebra de linha no site.";

/** Igual ao anterior, para campos onde só a ênfase faz sentido. */
export const INLINE_MD_EMPHASIS =
  "Use *asteriscos* para destacar uma palavra em itálico — é assim que o " +
  "design marca os destaques dos títulos.";
