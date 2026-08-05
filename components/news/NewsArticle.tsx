import { ImageSlot } from "@/components/ui/ImageSlot";
import { PortableBody } from "@/components/ui/PortableBody";
import type { NewsItem } from "@/lib/news/types";

type Props = { item: NewsItem };

const fmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export function NewsArticle({ item }: Props) {
  return (
    <article className="news-article">
      <header className="news-article-header">
        <time className="news-article-date" dateTime={item.publishedAt}>
          {fmt.format(new Date(item.publishedAt))}
        </time>
        <h1 className="news-article-title">{item.title}</h1>
        <div className="news-article-byline">{item.author}</div>
      </header>
      <div className="news-article-img">
        <ImageSlot {...item.image} />
      </div>
      <div className="news-article-body">
        <PortableBody value={item.body} />
      </div>
    </article>
  );
}
