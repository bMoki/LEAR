/**
 * Tags de cache do Next, uma por tipo de documento do Sanity.
 *
 * Cada `sanityFetch` declara as tags do conteúdo que lê; o webhook em
 * `app/api/revalidate/route.ts` recebe o `_type` do documento publicado e
 * chama `revalidateTag` com o mesmo nome. Publicar no Studio invalida só as
 * páginas que dependem daquele tipo.
 *
 * Os nomes são exatamente os `_type` do schema — é o que o webhook envia, e
 * qualquer tradução no meio seria mais uma coisa para sair de sincronia.
 */
export const TAGS = {
  siteSettings: "siteSettings",
  homePage: "homePage",
  contactSection: "contactSection",
  sectionHead: "sectionHead",
  project: "project",
  coordinator: "coordinator",
  galleryItem: "galleryItem",
  news: "news",
} as const;

export type Tag = (typeof TAGS)[keyof typeof TAGS];

/** Todos os tipos que o site lê — usado pelo webhook para validar o `_type`. */
export const KNOWN_TAGS: ReadonlySet<string> = new Set(Object.values(TAGS));
