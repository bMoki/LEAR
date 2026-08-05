import { orderRankField, orderRankOrdering } from "@sanity/orderable-document-list";
import { defineField, defineType } from "sanity";

/** Pesquisador responsável, na seção “Equipe”. */
export const coordinator = defineType({
  name: "coordinator",
  title: "Pesquisador",
  type: "document",
  orderings: [orderRankOrdering],
  fields: [
    defineField({
      name: "name",
      title: "Nome",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "role",
      title: "Função",
      type: "string",
      description: "Ex.: “Coordenação geral · Sistemática”.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "image",
      title: "Retrato",
      type: "imageWithAlt",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "caption",
      title: "Legenda do retrato",
      type: "string",
      description: "Texto manuscrito abaixo da foto. Ex.: “Dra. Clarice — campo de '24”.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "bio",
      title: "Minibiografia",
      type: "text",
      rows: 5,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "lines",
      title: "Linhas de pesquisa",
      type: "string",
      description: "Lista curta separada por vírgula. Ex.: “filogenia, viperídeos, coleções”.",
      validation: (Rule) => Rule.required(),
    }),
    orderRankField({ type: "coordinator" }),
  ],
  preview: {
    select: { title: "name", subtitle: "role", media: "image.image" },
  },
});
