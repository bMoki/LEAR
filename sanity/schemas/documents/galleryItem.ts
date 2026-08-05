import { orderRankField, orderRankOrdering } from "@sanity/orderable-document-list";
import { defineField, defineType } from "sanity";

/**
 * Foto do “Caderno fotográfico”.
 *
 * `variant` e `doodle` do tipo `GalleryItem` não estão aqui: a rotação, a cor
 * do cartão e o glifo decorativo são derivados da posição na lista, em
 * `lib/content/source.cms.ts`. Ver `docs/plano-cms-headless.md` §6.
 */
export const galleryItem = defineType({
  name: "galleryItem",
  title: "Foto da galeria",
  type: "document",
  orderings: [orderRankOrdering],
  fields: [
    defineField({
      name: "image",
      title: "Foto",
      type: "imageWithAlt",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "caption",
      title: "Legenda",
      type: "string",
      description: "Texto manuscrito abaixo da foto. Ex.: “Cerrado às 06:40 — luz boa”.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "stamp",
      title: "Selo",
      type: "string",
      description: "Etiqueta girada no canto. Ex.: “14 · 03”. Opcional.",
    }),
    orderRankField({ type: "galleryItem" }),
  ],
  preview: {
    select: { title: "caption", subtitle: "stamp", media: "image.image" },
  },
});
