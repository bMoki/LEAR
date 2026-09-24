import { getProjectBySlug } from "@/lib/content";
import { projectPeriod } from "@/lib/content/project";
import { OG_ALT, OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/seo/og-card";
import { stripInlineMarkdown } from "@/lib/seo/text";
import { BRAND_FULL } from "@/lib/seo/site";

/**
 * Card social de um projeto: a foto quando houver, o card desenhado quando não.
 *
 * A linha de cima traz bioma e período, que é o que identifica um projeto de
 * relance — os mesmos campos que viram etiqueta no cartão.
 */

export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** Ver a nota gêmea em `noticias/[slug]/opengraph-image.tsx`. */
export { generateStaticParams } from "./page";

/** Ver a nota gêmea em `noticias/[slug]/opengraph-image.tsx`: a URL do
 * `ImageRef` pede 1400px sem recorte, e o card é 1200×630. */
function toCardPhoto(src: string): string {
  const url = new URL(src);
  url.searchParams.set("w", String(OG_SIZE.width));
  url.searchParams.set("h", String(OG_SIZE.height));
  url.searchParams.set("fit", "crop");
  url.searchParams.set("auto", "format");
  return url.toString();
}

type Props = { params: Promise<{ slug: string }> };

export default async function ProjectOpengraphImage({ params }: Props) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    return renderOgCard({ kicker: "Projeto", title: BRAND_FULL });
  }

  const kicker = ["Projeto", project.bioma, projectPeriod(project)].filter(Boolean).join(" · ");

  return renderOgCard({
    kicker,
    title: stripInlineMarkdown(project.title),
    photoUrl: project.image.src ? toCardPhoto(project.image.src) : undefined,
  });
}
