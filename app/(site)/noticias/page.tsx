import { Footer } from "@/components/sections/Footer";
import { SectionHead } from "@/components/sections/SectionHead";
import { NewsCard } from "@/components/news/NewsCard";
import { getNews } from "@/lib/news";
import { getSectionHead } from "@/lib/content";

export default async function NoticiasPage() {
  const [head, items] = await Promise.all([getSectionHead("newsArchive"), getNews()]);

  return (
    <div className="page">
      <section className="section">
        <SectionHead kicker={head.kicker} title={head.title} blurb={head.blurb} />
        <div className="news-grid news-grid--full">
          {items.map((item) => (
            <NewsCard key={item.slug} item={item} />
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
}
