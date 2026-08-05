import { orderRankField, orderRankOrdering } from "@sanity/orderable-document-list";
import { defineArrayMember, defineField, defineType } from "sanity";
import { INLINE_MD_EMPHASIS } from "../inline";

/**
 * Uma frente de pesquisa da seção “Projetos”.
 *
 * `variant` e `doodle` do tipo `Project` **não** estão aqui de propósito: são
 * decoração (rotação, cor de fundo, glifo do canto) derivada da posição do
 * projeto na lista, dentro de `lib/content/source.cms.ts`. Ver
 * `docs/plano-cms-headless.md` §6.
 */
export const project = defineType({
  name: "project",
  title: "Projeto",
  type: "document",
  orderings: [orderRankOrdering],
  fields: [
    defineField({
      name: "number",
      title: "Numeração",
      type: "string",
      description: "Como aparece no canto do cartão. Ex.: “Projeto 01”.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "status",
      title: "Situação",
      type: "string",
      description: "Ex.: “em campo”, “em análise”, “concluído”.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "title",
      title: "Título",
      type: "text",
      rows: 2,
      description: INLINE_MD_EMPHASIS,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Descrição",
      type: "text",
      rows: 5,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "pins",
      title: "Etiquetas",
      type: "array",
      description:
        "Bioma, responsável, período, financiador. A primeira costuma ser o " +
        "bioma, marcada em destaque.",
      of: [
        defineArrayMember({
          type: "object",
          name: "pin",
          fields: [
            defineField({
              name: "label",
              title: "Texto",
              type: "string",
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "warm",
              title: "Destacar",
              type: "boolean",
              description: "Pinta a etiqueta na cor de destaque.",
              initialValue: false,
            }),
          ],
          preview: {
            select: { title: "label", warm: "warm" },
            prepare: ({ title, warm }) => ({ title: warm ? `${title} ★` : title }),
          },
        }),
      ],
    }),
    orderRankField({ type: "project" }),
  ],
  preview: {
    select: { title: "title", number: "number", status: "status" },
    prepare: ({ title, number, status }) => ({
      title: title?.replace(/\*/g, ""),
      subtitle: [number, status].filter(Boolean).join(" · "),
    }),
  },
});
