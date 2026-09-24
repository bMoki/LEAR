import type { MetadataRoute } from "next";
import { absoluteUrl, ALLOW_INDEXING } from "@/lib/seo/site";

/**
 * Libera o site e fecha o que não é conteúdo.
 *
 * - `/studio` é o painel autenticado. O `next-sanity` já manda `noindex` no
 *   `<head>` dele; isto evita o rastreamento antes disso.
 * - `/api` é o webhook de revalidação — não tem nada para indexar.
 *
 * O endereço do sitemap sai de `SITE_URL`, então enquanto não houver domínio
 * ele aponta para `localhost`. É o comportamento certo: um `robots.txt` local
 * que fingisse um domínio inexistente seria pior do que um que diz a verdade.
 */
export default function robots(): MetadataRoute.Robots {
  /**
   * Ambiente provisório (ver `ALLOW_INDEXING`). O rastreamento **continua
   * liberado** de propósito: quem mantém a página fora da busca é o `noindex`
   * que `buildMetadata` emite, e um `Disallow: /` aqui impediria o buscador de
   * chegar a lê-lo. O que sai é o convite — sem sitemap anunciado, ninguém é
   * levado a percorrer o site.
   */
  if (!ALLOW_INDEXING) {
    return {
      rules: { userAgent: "*", disallow: ["/studio", "/api"] },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/studio", "/api"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
