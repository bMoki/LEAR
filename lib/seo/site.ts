/**
 * Identidade pública do site, no único lugar do código onde ela é escrita.
 *
 * Por que não vem do CMS, como o resto dos textos (ADR 0002): estes valores são
 * consumidos por `metadata`, `sitemap.ts`, `robots.ts` e pelos cards sociais —
 * superfícies que o Next resolve **antes** de qualquer componente renderizar, e
 * onde `title.template` precisa ser uma string estática. Buscar o Sanity aí
 * trocaria uma constante de dez caracteres por uma dependência de rede em toda
 * rota. O nome da marca segue editável no Studio para tudo que aparece na
 * página; aqui fica só o que vai no `<head>`.
 */

/**
 * O endereço do site.
 *
 * **Tem padrão local de propósito.** Não existe domínio ainda e não há deploy
 * nesta fase; sem o padrão, o build quebraria na máquina de quem clonasse o
 * repositório, porque um campo de metadata com caminho relativo e sem
 * `metadataBase` é erro de build (docs do Next instalado,
 * `generate-metadata.md:428`).
 *
 * Quando o endereço definitivo existir (ver `PENDENCIAS.md`), esta é a única
 * linha a mudar: canonical, `og:url`, `sitemap.xml` e `robots.txt` derivam
 * dela.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";

/**
 * Se os buscadores podem indexar este ambiente. **Padrão: não.**
 *
 * É uma variável separada de `SITE_URL` de propósito, porque são duas perguntas
 * diferentes: *onde o site está* e *se este endereço é o definitivo*. Um deploy
 * de teste em `<projeto>.vercel.app` precisa de canonical e card social
 * corretos — senão o link compartilhado com o cliente aparece quebrado — e ao
 * mesmo tempo precisa ficar fora da busca.
 *
 * Deixar indexar um endereço provisório é caro de desfazer: uma vez indexado,
 * trocar de endereço vira migração de domínio, com 301 em toda URL e meses até
 * o ranking se recuperar (ver `PENDENCIAS.md`). Por isso o padrão é o seguro —
 * um clone novo, um preview de branch ou um deploy com a variável esquecida
 * ficam de fora sozinhos.
 *
 * Vale `"true"` num lugar só: o ambiente de produção, depois que o domínio
 * definitivo estiver respondendo.
 */
export const ALLOW_INDEXING = process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true";

/** A sigla. Curta o bastante para caber no fim de todo `<title>`. */
export const BRAND_SHORT = "LEAR";

/**
 * O nome por extenso. É esta a consulta institucional que vale perseguir — a
 * sigla sozinha disputa com a Lear Corporation e não é vencível (ADR 0005).
 * Longa demais para sufixo de título; entra no `<title>` da home, no
 * `Organization` do dado estruturado e no `og:site_name`.
 */
export const BRAND_FULL = "Laboratório de Ecologia de Anfíbios e Répteis";

export const SITE_TITLE = `${BRAND_SHORT} — ${BRAND_FULL}`;

export const SITE_DESCRIPTION =
  "Pesquisa, ensino e conservação da herpetofauna sul-americana. Serpentes, " +
  "lagartos, sapos e cecílias em florestas, cerrados, caatingas e restingas.";

/** Sufixo dos títulos internos. Ver `withBrand`. */
export const TITLE_TEMPLATE = `%s · ${BRAND_SHORT}`;

/**
 * Aplica o mesmo sufixo que o `title.template` do layout do site aplica ao
 * `<title>`. Existe porque `og:title` **não** passa pelo template — sem isto,
 * o título da aba e o do card compartilhado divergiriam.
 */
export function withBrand(title: string): string {
  return TITLE_TEMPLATE.replace("%s", title);
}

/** Caminho relativo → URL absoluta. Usado onde o `metadataBase` não alcança:
 * `sitemap.ts`, `robots.ts` e o dado estruturado. */
export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}
