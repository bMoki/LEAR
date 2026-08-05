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
  image: ImageRef;
  /** Ainda não exibido em lugar nenhum; reservado. */
  excerpt?: string;
};
