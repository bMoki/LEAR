import { getNewsBySlug } from "@/lib/news";
import { OG_ALT, OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/seo/og-card";
import { stripInlineMarkdown } from "@/lib/seo/text";
import { BRAND_FULL } from "@/lib/seo/site";

/**
 * Card social de uma notícia: **a foto quando houver, o card desenhado quando
 * não** — que é o estado de 14 slots em 14 hoje (ADR 0005).
 *
 * A leitura é a mesma memoizada que `generateMetadata` e a página usam
 * (`getNewsBySlug`), então a notícia é buscada uma vez só por requisição.
 */

export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/**
 * A mesma lista de slugs que a página usa. Sem isto o card fica fora do build e
 * é desenhado na primeira vez que alguém compartilha o link — e o build deixa
 * de avisar se o card de alguma notícia não renderiza.
 */
export { generateStaticParams } from "./page";

const fmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

/**
 * A URL que `toImageRef` monta pede 1400px de largura sem recorte — bom para o
 * artigo, errado para um card de 1200×630. Os parâmetros do CDN do Sanity são
 * reescritos aqui em vez de virarem mais um campo no `ImageRef`: o formato do
 * card é assunto desta rota, e de nenhuma outra.
 */
function toCardPhoto(src: string): string {
  const url = new URL(src);
  url.searchParams.set("w", String(OG_SIZE.width));
  url.searchParams.set("h", String(OG_SIZE.height));
  url.searchParams.set("fit", "crop");
  url.searchParams.set("auto", "format");
  return url.toString();
}

type Props = { params: Promise<{ slug: string }> };

export default async function NewsOpengraphImage({ params }: Props) {
  const { slug } = await params;
  const item = await getNewsBySlug(slug);

  return renderOgCard({
    kicker: item ? `Notícia · ${fmt.format(new Date(item.publishedAt))}` : "Notícia",
    title: item ? stripInlineMarkdown(item.title) : BRAND_FULL,
    photoUrl: item?.image.src ? toCardPhoto(item.image.src) : undefined,
  });
}
