import type { Metadata } from "next";
import type { PortableTextBlock } from "@portabletext/types";
import { ALLOW_INDEXING, BRAND_FULL, SITE_DESCRIPTION, withBrand } from "./site";
import { portableTextToPlain, stripInlineMarkdown, truncateAtWord } from "./text";

/**
 * A regra de metadado do ADR 0005, num lugar só: **derivado por padrão,
 * override opcional**. Nenhum campo de SEO pode bloquear a publicação de uma
 * notícia ou de um projeto, então todo valor tem de sair do conteúdo que já
 * existe.
 *
 *     title       = stripInlineMarkdown(título) + sufixo da marca
 *     description = "Resumo" ?? início do corpo ?? descrição do site
 *     canonical   = o próprio caminho (o `metadataBase` resolve o resto)
 *     openGraph   = o mesmo par, mais url, site_name, locale e tipo
 *
 * Uma função para todas as rotas — sem ela cada página inventaria a sua, e é
 * assim que `<title>` e `og:title` acabam divergindo.
 *
 * **`images` não entra aqui de propósito.** O card social vem do arquivo
 * `opengraph-image.tsx` de cada segmento, que o Next injeta sozinho — declarar
 * de novo aqui seria a mesma imagem descrita em dois lugares, prontos para
 * sair de sincronia.
 */

type ArticleFacts = {
  /** ISO 8601. */
  publishedTime: string;
  /** ISO 8601. Sai do `_updatedAt` do Sanity. */
  modifiedTime?: string;
  /** Nome em texto livre — Pessoa não tem página no site (ADR 0005). */
  authors?: string[];
};

type BuildMetadataArgs = {
  /** Título cru do documento; pode trazer Markdown inline. */
  title: string;
  /** Caminho da rota, começando com barra. Vira canonical e `og:url`. */
  path: string;
  /** O override: o campo "Resumo", quando preenchido. */
  description?: string | null;
  /** A derivação: o corpo do documento, usado quando não há resumo. */
  body?: PortableTextBlock[] | null;
  /**
   * Título sem o sufixo da marca. Só a home usa — ela já **é** a marca, e
   * "LEAR — Laboratório… · LEAR" seria repetição.
   */
  absoluteTitle?: boolean;
  /** Presente só nas notícias: é o que faz o link compartilhado mostrar data
   * e assinatura. */
  article?: ArticleFacts;
};

export function buildMetadata({
  title,
  path,
  description,
  body,
  absoluteTitle = false,
  article,
}: BuildMetadataArgs): Metadata {
  const cleanTitle = stripInlineMarkdown(title);

  const resolvedDescription = truncateAtWord(
    description?.trim() || portableTextToPlain(body) || SITE_DESCRIPTION
  );

  return {
    title: absoluteTitle ? { absolute: cleanTitle } : cleanTitle,
    description: resolvedDescription,
    alternates: { canonical: path },
    openGraph: {
      // O `title.template` do layout do site não alcança `og:title` — daí o
      // sufixo aplicado à mão, pela mesma função que gera o template.
      title: absoluteTitle ? cleanTitle : withBrand(cleanTitle),
      description: resolvedDescription,
      url: path,
      siteName: BRAND_FULL,
      locale: "pt_BR",
      ...(article
        ? {
            type: "article" as const,
            publishedTime: article.publishedTime,
            modifiedTime: article.modifiedTime,
            authors: article.authors,
          }
        : { type: "website" as const }),
    },
    // Sem `twitter-image` próprio, o X cai no `og:image` sozinho; o que falta é
    // dizer que o card é o grande, e não a miniatura ao lado do texto.
    twitter: { card: "summary_large_image" },
    // O `noindex` fica na página, e não num `Disallow: /` do robots.txt, porque
    // são coisas diferentes: `Disallow` impede **rastrear**, não indexar — uma
    // URL bloqueada ainda pode ser indexada a partir de um link de fora, e aí o
    // buscador nunca chega a ler o `noindex` que a resolveria. Deixar rastrear
    // e responder `noindex` é o que garante que a página fique fora.
    ...(ALLOW_INDEXING ? {} : { robots: { index: false, follow: false } }),
  };
}
