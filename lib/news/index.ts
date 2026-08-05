/**
 * API pública das Notícias — a única superfície que componentes e páginas
 * conhecem. Implementação em `source.cms.ts` (Sanity). Ver ADR 0001.
 */
export { getNews, getNewsBySlug, getRecentNews } from "./source.cms";
