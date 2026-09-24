/**
 * Como um título vira endereço.
 *
 * O `slugify` padrão do Sanity só passa para minúsculas e troca espaço por
 * hífen — ele **não** tira acento nem os asteriscos de Markdown que os campos
 * curtos deste site carregam por convenção (ADR 0002). Sem isto,
 * `Serpentes *crípticas* da Serra do Mar` viraria
 * `serpentes-*crípticas*-da-serra-do-mar`.
 *
 * Importa mais do que parece: slug é compromisso permanente. Uma vez indexado,
 * mudar exige redirecionamento — então o valor gerado precisa já nascer certo,
 * e não depender de alguém reparar no asterisco antes de publicar.
 */
export const SLUG_MAX_LENGTH = 96;

export function slugify(input: string): string {
  return (
    input
      // `[texto](endereço)` → `texto`
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/\*/g, "")
      // Separa o acento da letra e descarta o acento: “crípticas” → “cripticas”.
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, SLUG_MAX_LENGTH)
      .replace(/^-+|-+$/g, "")
  );
}

/** As opções que todo campo `slug` do site usa. */
export const slugOptions = {
  source: "title",
  maxLength: SLUG_MAX_LENGTH,
  slugify,
} as const;

export const SLUG_DESCRIPTION =
  "Parte final da URL. Gerado do título, mas fica fixo depois — mudar quebra " +
  "links já publicados e endereços já indexados na busca.";
