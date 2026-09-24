import { orderableDocumentListDeskItem } from "@sanity/orderable-document-list";
import type { StructureResolver } from "sanity/structure";

/**
 * Menu lateral do Studio. Escrito à mão (em vez do padrão “uma lista por tipo”)
 * por dois motivos:
 *
 * 1. Os singletons abrem direto no documento, sem passar por uma lista de um
 *    item só.
 * 2. Projetos, Equipe e Galeria usam a lista arrastável do plugin
 *    `@sanity/orderable-document-list` — a ordem é a ordem da página.
 */
const SINGLETONS: { id: string; title: string }[] = [
  { id: "siteSettings", title: "Configurações do site" },
  { id: "homePage", title: "Página inicial" },
  { id: "contactSection", title: "Contato" },
];

export const structure: StructureResolver = (S, context) =>
  S.list()
    .title("Conteúdo")
    .items([
      ...SINGLETONS.map(({ id, title }) =>
        S.listItem()
          .id(id)
          .title(title)
          .child(S.document().schemaType(id).documentId(id).title(title))
      ),

      S.divider(),

      S.documentTypeListItem("sectionHead").title("Cabeçalhos de seção"),

      S.divider(),

      orderableDocumentListDeskItem({ type: "project", title: "Projetos", S, context }),
      orderableDocumentListDeskItem({ type: "coordinator", title: "Equipe", S, context }),
      orderableDocumentListDeskItem({ type: "galleryItem", title: "Galeria", S, context }),

      S.divider(),

      S.listItem()
        .id("news")
        .title("Notícias")
        .child(
          S.documentTypeList("news")
            .title("Notícias")
            .defaultOrdering([{ field: "publishedAt", direction: "desc" }])
        ),

      S.divider(),

      // A Herpetoteca é o maior acervo do Studio — algumas centenas de
      // espécies. Uma lista única obrigaria a rolar por todas para achar uma
      // serpente, então a primeira divisão é a mesma que o site mostra ao
      // público: anfíbios de um lado, répteis do outro.
      S.listItem()
        .id("herpetoteca")
        .title("Herpetoteca")
        .child(
          S.list()
            .title("Herpetoteca")
            .items([
              ...(
                [
                  ["anfibio", "Anfíbios"],
                  ["reptil", "Répteis"],
                ] as const
              ).map(([grupo, title]) =>
                S.listItem()
                  .id(grupo)
                  .title(title)
                  .child(
                    S.documentTypeList("species")
                      .title(title)
                      .filter("_type == 'species' && group == $grupo")
                      .params({ grupo })
                      .defaultOrdering([{ field: "scientificName", direction: "asc" }])
                  )
              ),
              S.divider(),
              S.listItem()
                .id("todas")
                .title("Todas as espécies")
                .child(
                  S.documentTypeList("species")
                    .title("Todas as espécies")
                    .defaultOrdering([{ field: "scientificName", direction: "asc" }])
                ),
            ])
        ),

      orderableDocumentListDeskItem({ type: "locality", title: "Locais", S, context }),

      S.listItem()
        .id("publication")
        .title("Publicações")
        .child(
          S.documentTypeList("publication")
            .title("Publicações")
            .defaultOrdering([{ field: "year", direction: "desc" }])
        ),

      S.divider(),

      S.documentTypeListItem("page").title("Páginas"),
    ]);
