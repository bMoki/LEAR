import Link from "next/link";
import { ImageSlot } from "@/components/ui/ImageSlot";
import type { NewsItem } from "@/lib/news/types";

type Props = { item: NewsItem };

const fmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

export function NewsCard({ item }: Props) {
  return (
    <Link href={`/noticias/${item.slug}`} className="news-card">
      <div className="news-card-img">
        <ImageSlot {...item.image} />
      </div>
      <div className="news-card-body">
        <time className="news-card-date" dateTime={item.publishedAt}>
          {fmt.format(new Date(item.publishedAt))}
        </time>
        <h3 className="news-card-title">{item.title}</h3>
      </div>
    </Link>
  );
}
