import type { PortableTextBlock } from "@portabletext/types";
import type { ImageRef } from "@/lib/content/types";

/**
 * Notícia (ver CONTEXT.md). Único conteúdo do site com texto longo, e por isso
 * o único em Portable Text — o formato nativo do Sanity, escrito no editor
 * visual do Studio. Os textos curtos do resto do site seguem sendo strings com
 * Markdown inline (ADR 0002).
 *
 * `body` é JSON serializável, como todo o resto do modelo: continua valendo a
 * regra de que aqui não entra JSX.
 */
export type NewsItem = {
  /** Campo próprio e estável: editar o título não muda a URL. */
  slug: string;
  title: string;
  body: PortableTextBlock[];
  /** Nome em texto livre — não precisa ser alguém da equipe cadastrada. */
  author: string;
  /** ISO 8601. */
  publishedAt: string;
  /**
   * Quando o documento foi editado pela última vez — o `_updatedAt` do Sanity,
   * também em ISO 8601. Não é data de publicação e não aparece na página: serve
   * de `dateModified` no dado estruturado e de `lastmod` no sitemap.
   */
  updatedAt: string;
  image: ImageRef;
  /**
   * O "Resumo". Vira a `<meta description>` e o `og:description` da notícia
   * quando preenchido; sem ele, a descrição sai do início do corpo
   * (ADR 0005, *Nenhum campo de SEO bloqueia a publicação*).
   */
  excerpt?: string;
};
