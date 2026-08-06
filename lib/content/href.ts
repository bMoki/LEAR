/**
 * Sanitização de `href` vindo do CMS.
 *
 * A validação do schema (`sanity/schemas/objects/link.ts`) roda no Studio, e
 * só lá: quem escreve pela API com um token de editor não passa por ela. Como
 * o cenário que a regra endereça é justamente o de uma credencial comprometida,
 * a checagem precisa existir também **na entrada dos dados na aplicação** — é o
 * único ponto que todo consumidor atravessa.
 *
 * Um `href` recusado vira `#`, não some: o link continua no lugar, com o mesmo
 * texto e o mesmo desenho, e apenas não leva a lugar nenhum. Sumir mudaria o
 * layout da página por causa de um dado ruim; virar âncora morta é visível na
 * revisão sem quebrar nada.
 */

const ALLOWED_SCHEMES = new Set(["http:", "https:", "mailto:"]);

/** Âncora (`#projetos`) ou caminho interno (`/noticias`). O `(?!\/)` recusa
 * `//evil.com`, que parece caminho interno e navega para fora. */
const INTERNAL_HREF = /^(#[^\s]*|\/(?!\/)[^\s]*)$/;

export const SAFE_FALLBACK_HREF = "#";

export function safeHref(href: string | null | undefined): string {
  if (!href) return SAFE_FALLBACK_HREF;

  const value = href.trim();

  if (INTERNAL_HREF.test(value)) return value;

  try {
    if (ALLOWED_SCHEMES.has(new URL(value).protocol)) return value;
  } catch {
    // URL absoluta malformada — cai no fallback junto com o resto.
  }

  return SAFE_FALLBACK_HREF;
}
