import type { Metadata } from "next";
import { Footer } from "@/components/sections/Footer";
import { SectionHead } from "@/components/sections/SectionHead";
import { NewsCard } from "@/components/news/NewsCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { getNews } from "@/lib/news";
import { getSectionHead } from "@/lib/content";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";

/**
 * Título e descrição saem do mesmo cabeçalho que a página mostra — quem edita
 * o "Arquivo · notícias" no Studio edita as duas coisas de uma vez, sem campo
 * de SEO nenhum para preencher (ADR 0005).
 */
export async function generateMetadata(): Promise<Metadata> {
  const head = await getSectionHead("newsArchive");

  return buildMetadata({
    title: head.title,
    path: "/noticias",
    description: head.blurb,
  });
}

export default async function NoticiasPage() {
  const [head, items] = await Promise.all([getSectionHead("newsArchive"), getNews()]);

  return (
    <div className="page">
      <JsonLd data={breadcrumbJsonLd([{ name: "Notícias", path: "/noticias" }])} />
      <section className="section">
        {/* `as="h1"`: aqui a seção é a página inteira. Sem isso a hierarquia
            começava no nível 2 — o `SectionHead` emite `<h2>` e o `NewsCard`,
            `<h3>`. */}
        <SectionHead as="h1" kicker={head.kicker} title={head.title} blurb={head.blurb} />
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
