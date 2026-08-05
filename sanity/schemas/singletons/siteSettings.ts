import { defineArrayMember, defineField, defineType } from "sanity";

/**
 * Documento único (`_id: "siteSettings"`). Alimenta `getNav` e `getFooter`.
 *
 * `brandName` e `brandTag` ficam só aqui, e o adapter os copia para o menu do
 * topo **e** para o rodapé — no modelo antigo o mesmo texto aparecia em dois
 * lugares e podia divergir.
 */
export const siteSettings = defineType({
  name: "siteSettings",
  title: "Configurações do site",
  type: "document",
  groups: [
    { name: "brand", title: "Identidade", default: true },
    { name: "nav", title: "Menu do topo" },
    { name: "footer", title: "Rodapé" },
  ],
  fields: [
    defineField({
      name: "brandName",
      title: "Sigla",
      type: "string",
      group: "brand",
      description: "Aparece no menu do topo e no rodapé. Ex.: “LEAR”.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "brandTag",
      title: "Nome por extenso",
      type: "string",
      group: "brand",
      description: "Linha menor ao lado da sigla, no menu do topo.",
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "navLinks",
      title: "Links do menu",
      type: "array",
      group: "nav",
      of: [defineArrayMember({ type: "navLink" })],
      validation: (Rule) => Rule.required().min(1),
    }),

    defineField({
      name: "footerText",
      title: "Texto do rodapé",
      type: "text",
      group: "footer",
      rows: 4,
      description: "Parágrafo de apresentação, logo após a sigla.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "footerColumns",
      title: "Colunas de links",
      type: "array",
      group: "footer",
      of: [
        defineArrayMember({
          type: "object",
          name: "footerColumn",
          title: "Coluna",
          fields: [
            defineField({
              name: "title",
              title: "Título da coluna",
              type: "string",
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "links",
              title: "Links",
              type: "array",
              of: [defineArrayMember({ type: "link" })],
              validation: (Rule) => Rule.required().min(1),
            }),
          ],
          preview: {
            select: { title: "title", links: "links" },
            prepare: ({ title, links }) => ({
              title,
              subtitle: `${links?.length ?? 0} link(s)`,
            }),
          },
        }),
      ],
    }),
    defineField({
      name: "footerFine",
      title: "Linha fina",
      type: "array",
      group: "footer",
      of: [defineArrayMember({ type: "string" })],
      description:
        "Os textos miúdos da última linha do rodapé, um por item. " +
        "Ex.: “© 2009—2026 · UFRJ”.",
    }),
  ],
  preview: { prepare: () => ({ title: "Configurações do site" }) },
});
