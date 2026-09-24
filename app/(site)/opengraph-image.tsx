import { OG_ALT, OG_CONTENT_TYPE, OG_SIZE, renderSiteOgCard } from "@/lib/seo/og-card";

/** Card social da home. Ver `lib/seo/og-card.tsx` para por que cada rota
 * declara o seu. */

export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default renderSiteOgCard;
