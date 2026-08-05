import { notFound } from "next/navigation";
import { Footer } from "@/components/sections/Footer";
import { NewsArticle } from "@/components/news/NewsArticle";
import { getNewsBySlug } from "@/lib/news";

type Props = { params: Promise<{ slug: string }> };

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params;
  const item = await getNewsBySlug(slug);

  if (!item) notFound();

  return (
    <div className="page">
      <section className="section">
        <NewsArticle item={item} />
      </section>
      <Footer />
    </div>
  );
}
