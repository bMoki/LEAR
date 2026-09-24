import Link from "next/link";
import { NewsCard } from "./NewsCard";
import type { NewsItem } from "@/lib/news/types";

/**
 * “Outras notícias”, ao pé de um artigo.
 *
 * Existe para nenhuma notícia ser página órfã — nada ligava uma à outra, e
 * página que só o índice aponta é página mal rastreada (ADR 0005).
 *
 * O critério é **a data**, e só ela: as mais recentes, exceto a que está
 * aberta. Não existe assunto que agrupe Notícias no modelo — elas são avulsas
 * por definição (CONTEXT.md) — e ordem cronológica não exige campo novo nem
 * trabalho editorial nenhum. Se um dia fizer sentido agrupar por tema, o
 * caminho é um campo de tema na Notícia, deliberadamente fora desta fase.
 */
export function RelatedNews({ items }: { items: NewsItem[] }) {
  if (items.length === 0) return null;

  return (
    <aside className="related-news">
      <h2 className="related-news-head">Outras notícias</h2>
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
    </aside>
  );
}
