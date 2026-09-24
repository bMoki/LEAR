import type { NewsItem } from "@/lib/news/types";
import type { Project } from "@/lib/content/types";
import { projectPeriod } from "@/lib/content/project";
import { absoluteUrl, BRAND_FULL, BRAND_SHORT, SITE_DESCRIPTION } from "./site";
import { portableTextToPlain, stripInlineMarkdown, truncateAtWord } from "./text";

/**
 * Os blocos de dado estruturado do site (ADR 0005 §8). Montados aqui e
 * emitidos por `components/seo/JsonLd.tsx`.
 *
 * Sem `schema-dts` nem outra dependência: são quatro formatos, todos estáveis,
 * e o custo de manter um pacote de tipos supera o de escrever os objetos.
 *
 * Só o `BreadcrumbList` muda a **aparência** do resultado na busca — troca a
 * URL crua pela trilha. Os outros servem para o buscador entender de que
 * entidade a página fala, o que não rende resultado rico e ainda assim é o que
 * liga as páginas do laboratório umas às outras.
 */

export type JsonLdNode = Record<string, unknown>;

const SCHEMA = "https://schema.org";

/** Limite da `headline` de um `NewsArticle` na documentação do Google. O maior
 * título de hoje tem 62 caracteres — o corte é rede de segurança. */
const MAX_HEADLINE = 110;

/**
 * O laboratório como entidade.
 *
 * `name` é o nome por extenso e `alternateName` é a sigla, e não o contrário:
 * "LEAR" sozinho disputa com a Lear Corporation e não é consulta vencível
 * (ADR 0005). A consulta a perseguir é o nome inteiro.
 */
export function organizationJsonLd(): JsonLdNode {
  return {
    "@context": SCHEMA,
    "@type": "Organization",
    name: BRAND_FULL,
    alternateName: BRAND_SHORT,
    url: absoluteUrl("/"),
    description: SITE_DESCRIPTION,
  };
}

/** O mesmo laboratório, na forma reduzida que serve de `publisher`. */
function publisher(): JsonLdNode {
  return {
    "@type": "Organization",
    name: BRAND_FULL,
    alternateName: BRAND_SHORT,
    url: absoluteUrl("/"),
  };
}

export function newsArticleJsonLd(item: NewsItem): JsonLdNode {
  const path = `/noticias/${item.slug}`;

  return {
    "@context": SCHEMA,
    "@type": "NewsArticle",
    headline: truncateAtWord(stripInlineMarkdown(item.title), MAX_HEADLINE),
    description: truncateAtWord(item.excerpt?.trim() || portableTextToPlain(item.body)),
    datePublished: item.publishedAt,
    dateModified: item.updatedAt,
    // Nome sem URL: Pessoa não tem página no site, e um `url` apontando para
    // lugar nenhum é pior do que a ausência dele (ADR 0005).
    author: { "@type": "Person", name: item.author },
    publisher: publisher(),
    mainEntityOfPage: absoluteUrl(path),
    url: absoluteUrl(path),
    inLanguage: "pt-BR",
    // Só quando existe foto de verdade. Os 14 slots do CMS estão vazios, e
    // apontar `image` para o card desenhado seria descrever como fotografia da
    // notícia uma imagem que é só o título dela em cima do fundo do site.
    ...(item.image.src ? { image: [item.image.src] } : {}),
  };
}

/**
 * A página de um Projeto, como `WebPage` com um `about`.
 *
 * **Não rende resultado rico no Google**, e isso é sabido (ADR 0005): serve
 * para o buscador entender de que entidade a página fala. Quando o táxon está
 * preenchido, o `about` é um `Taxon` com o nome científico e os populares —
 * que é exatamente a distinção do CONTEXT.md, e o motivo de os dois nomes
 * conviverem: o laboratório escreve um, o público digita o outro.
 */
export function projectJsonLd(project: Project): JsonLdNode {
  const path = `/projetos/${project.slug}`;
  const name = stripInlineMarkdown(project.title);

  const about = project.taxonCientifico
    ? {
        "@type": "Taxon",
        name: project.taxonCientifico,
        ...(project.taxonPopular.length ? { alternateName: project.taxonPopular } : {}),
      }
    : { "@type": "Thing", name };

  return {
    "@context": SCHEMA,
    "@type": "WebPage",
    name,
    description: truncateAtWord(project.description),
    url: absoluteUrl(path),
    inLanguage: "pt-BR",
    isPartOf: { "@type": "WebSite", name: BRAND_FULL, url: absoluteUrl("/") },
    about,
    dateModified: project.updatedAt,
    ...(project.bioma ? { contentLocation: { "@type": "Place", name: project.bioma } } : {}),
    ...(project.image.src ? { primaryImageOfPage: project.image.src } : {}),
  };
}

export type Crumb = { name: string; path: string };

/**
 * A trilha, sempre começando em Início. É o único bloco desta lista que muda o
 * que aparece na busca.
 */
export function breadcrumbJsonLd(trail: Crumb[]): JsonLdNode {
  return {
    "@context": SCHEMA,
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Início", path: "/" }, ...trail].map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: stripInlineMarkdown(crumb.name),
      item: absoluteUrl(crumb.path),
    })),
  };
}
