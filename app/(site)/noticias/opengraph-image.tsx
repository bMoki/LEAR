import { getSectionHead } from "@/lib/content";
import { OG_ALT, OG_CONTENT_TYPE, OG_SIZE, renderOgCard } from "@/lib/seo/og-card";
import { stripInlineMarkdown } from "@/lib/seo/text";

/** Card social do arquivo de notícias. Mesmo cabeçalho que a página mostra —
 * o card e a página nunca divergem porque leem o mesmo documento. */

export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function NewsArchiveOpengraphImage() {
  const head = await getSectionHead("newsArchive");

  return renderOgCard({
    kicker: stripInlineMarkdown(head.kicker),
    title: stripInlineMarkdown(head.title),
  });
}
