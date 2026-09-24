import { getSectionHead } from "@/lib/content";
import { OG_ALT, OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/seo/og-card";
import { stripInlineMarkdown } from "@/lib/seo/text";

/** Card social do índice de projetos, do mesmo cabeçalho que a página mostra. */

export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function ProjectsOpengraphImage() {
  const head = await getSectionHead("projects");

  return renderOgCard({
    kicker: stripInlineMarkdown(head.kicker),
    title: stripInlineMarkdown(head.title),
  });
}
