import type { MetadataRoute } from "next";
import { getPages, getProjects, getSiteLastModified } from "@/lib/content";
import { getNews } from "@/lib/news";
import { absoluteUrl } from "@/lib/seo/site";

/**
 * Mapa do site: as rotas fixas mais uma linha por notícia e por projeto.
 *
 * `sitemap.ts` é um Route Handler **cacheado por padrão** (docs do Next
 * instalado, `sitemap.md:44`). Como ele lê do Sanity pelos mesmos adaptadores
 * que as páginas usam — e portanto pelo mesmo `sanityFetch`, com as mesmas tags
 * de cache —, o webhook de revalidação já existente atualiza o sitemap junto
 * com as páginas. Nenhum código novo para isso.
 *
 * As duas consultas filtram `defined(slug.current)` na GROQ e o cliente usa
 * `perspective: "published"`: documento sem endereço e rascunho não entram
 * aqui.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [news, projects, pages, siteLastModified] = await Promise.all([
    getNews(),
    getProjects(),
    getPages(),
    getSiteLastModified(),
  ]);

  // As notícias já vêm da mais recente para a mais antiga.
  const newestNews = news[0];

  return [
    {
      url: absoluteUrl("/"),
      lastModified: siteLastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/noticias"),
      lastModified: newestNews ? new Date(newestNews.updatedAt) : siteLastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...news.map((item) => ({
      url: absoluteUrl(`/noticias/${item.slug}`),
      lastModified: new Date(item.updatedAt),
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
    {
      url: absoluteUrl("/projetos"),
      lastModified: projects[0] ? new Date(projects[0].updatedAt) : siteLastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    // Um projeto muda menos que uma notícia e dura mais: o corpo cresce
    // devagar, e a ficha praticamente não muda depois de preenchida.
    ...projects.map((project) => ({
      url: absoluteUrl(`/projetos/${project.slug}`),
      lastModified: new Date(project.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    // Página institucional é o conteúdo mais estável do site — a coleção
    // herpetológica não muda de ano para ano — e por isso a menor frequência e
    // a menor prioridade da lista.
    ...pages.map((page) => ({
      url: absoluteUrl(`/${page.slug}`),
      lastModified: new Date(page.updatedAt),
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
}
