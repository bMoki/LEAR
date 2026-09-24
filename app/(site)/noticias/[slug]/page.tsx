import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/sections/Footer";
import { NewsArticle } from "@/components/news/NewsArticle";
import { RelatedNews } from "@/components/news/RelatedNews";
import { JsonLd } from "@/components/seo/JsonLd";
import { getNews, getNewsBySlug, getRecentNews } from "@/lib/news";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, newsArticleJsonLd } from "@/lib/seo/json-ld";
import { stripInlineMarkdown } from "@/lib/seo/text";

type Props = { params: Promise<{ slug: string }> };

/**
 * Pré-renderiza as notícias no build, em vez de gerá-las sob demanda na
 * primeira visita. A lista sai da mesma consulta que alimenta `/noticias` — e
 * ela já filtra `defined(slug.current)`, então notícia sem endereço não vira
 * rota.
 */
export async function generateStaticParams() {
  const items = await getNews();
  return items.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await getNewsBySlug(slug);

  // Slug inexistente cai no `notFound()` da página; devolver metadata vazia
  // aqui evita inventar título para uma rota que vai responder 404.
  if (!item) return {};

  return buildMetadata({
    title: item.title,
    path: `/noticias/${item.slug}`,
    description: item.excerpt,
    body: item.body,
    article: {
      publishedTime: item.publishedAt,
      modifiedTime: item.updatedAt,
      authors: [item.author],
    },
  });
}

/** Quantas notícias o pé do artigo mostra. Busca uma a mais porque a atual
 * costuma estar entre as mais recentes e sai da lista. */
const RELATED_COUNT = 3;

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params;
  const [item, recent] = await Promise.all([
    getNewsBySlug(slug),
    getRecentNews(RELATED_COUNT + 1),
  ]);

  if (!item) notFound();

  const related = recent.filter((other) => other.slug !== item.slug).slice(0, RELATED_COUNT);

  return (
    <div className="page">
      <JsonLd data={newsArticleJsonLd(item)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Notícias", path: "/noticias" },
          { name: stripInlineMarkdown(item.title), path: `/noticias/${item.slug}` },
        ])}
      />
      <section className="section">
        <NewsArticle item={item} />
        <RelatedNews items={related} />
      </section>
      <Footer />
    </div>
  );
}
