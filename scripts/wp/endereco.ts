import { SLUG_MAX_LENGTH, slugify } from "../../sanity/schemas/slug";

/**
 * Endereço final de um documento, a partir do `post_name` do WordPress.
 *
 * O `post_name` **não** serve como slug direto: o WordPress o gera do título
 * inteiro, sem teto. Uma das páginas do acervo tem 141 caracteres, o que
 * estoura o limite de 128 do `_id` do Sanity e, muito antes disso, o teto de
 * 96 que o ADR 0005 fixou para endereços legíveis.
 *
 * O corte é na última palavra inteira. `slugify` sozinho fatia no caractere
 * 96 e deixa `…-fauna-catarinen`.
 *
 * Vive aqui, e não no `extract.ts` que o usava sozinho, porque o gerador de
 * redirecionamentos (`redirects.ts`) precisa da **mesma** conta para saber
 * quais endereços mudaram — e o `extract.ts` chama `main()` no topo do módulo,
 * então importá-lo dispararia uma extração inteira.
 */
export function slugDe(postName: string | null, titulo: string): string {
  const bruto = slugify(postName || titulo);
  if (bruto.length < SLUG_MAX_LENGTH) return bruto;
  return bruto.replace(/-[^-]*$/, "");
}
