import Link from "next/link";
import { SectionHead } from "./SectionHead";
import { NewsCard } from "@/components/news/NewsCard";
import { getRecentNews } from "@/lib/news";
import { getSectionHead } from "@/lib/content";

export async function News() {
  const [head, items] = await Promise.all([getSectionHead("news"), getRecentNews(3)]);

  return (
    <section className="section" id="noticias">
      <SectionHead kicker={head.kicker} title={head.title} blurb={head.blurb} />
      <div className="news-grid">
        {items.map((item) => (
          <NewsCard key={item.slug} item={item} />
        ))}
      </div>
      <div className="news-footer">
        <Link href="/noticias" className="btn ghost">
          ver todas →
        </Link>
      </div>
    </section>
  );
}
