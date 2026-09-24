import { cache } from "react";
import type { PortableTextBlock } from "@portabletext/types";
import { sanityFetch } from "@/lib/sanity/client";
import { toImageRef } from "@/lib/sanity/image";
import { allNewsQuery, newsBySlugQuery, recentNewsQuery } from "@/lib/sanity/queries";
import { TAGS } from "@/lib/sanity/tags";
import type {
  AllNewsQueryResult,
  NewsBySlugQueryResult,
  RecentNewsQueryResult,
} from "@/sanity/types.generated";
import type { NewsItem } from "./types";

/**
 * Fonte CMS (Sanity) das Notícias. Mesma API assíncrona de sempre — a ordenação
 * por data desc agora é feita pela GROQ, não em memória.
 */

type NewsQueryItem = AllNewsQueryResult[number];

function toNewsItem(item: NewsQueryItem): NewsItem {
  return {
    slug: item.slug ?? "",
    title: item.title ?? "",
    // O typegen descreve os blocos com os tipos do próprio schema; em runtime é
    // Portable Text padrão, que é o que o renderizador espera.
    body: (item.body ?? []) as PortableTextBlock[],
    author: item.author ?? "",
    publishedAt: item.publishedAt ?? "",
    // Sem `str()`: `_updatedAt` é metadado do Sanity, não campo de schema, e o
    // typegen o descreve como obrigatório — nunca chega nulo.
    updatedAt: item._updatedAt,
    image: toImageRef(item.image ?? null, item._id),
    excerpt: item.excerpt ?? undefined,
  };
}

export async function getRecentNews(limit: number): Promise<NewsItem[]> {
  const items = await sanityFetch<RecentNewsQueryResult, { limit: number }>({
    query: recentNewsQuery,
    params: { limit },
    tags: [TAGS.news],
  });
  return items.map(toNewsItem);
}

export async function getNews(): Promise<NewsItem[]> {
  const items = await sanityFetch<AllNewsQueryResult>({
    query: allNewsQuery,
    tags: [TAGS.news],
  });
  return items.map(toNewsItem);
}

/**
 * Memoizada com o `cache()` do React porque a rota `/noticias/[slug]` lê a
 * mesma notícia duas vezes: uma no `generateMetadata` e outra na página. É a
 * recomendação dos docs do Next instalado para exatamente este caso
 * (`14-metadata-and-og-images.md:133`). O `opengraph-image` da rota é uma
 * terceira leitura.
 *
 * A memoização vale por requisição — não substitui o cache de `sanityFetch`,
 * que é o que atravessa requisições e responde ao webhook de revalidação.
 */
export const getNewsBySlug = cache(async (slug: string): Promise<NewsItem | null> => {
  const item = await sanityFetch<NewsBySlugQueryResult, { slug: string }>({
    query: newsBySlugQuery,
    params: { slug },
    tags: [TAGS.news],
  });
  return item ? toNewsItem(item) : null;
});
