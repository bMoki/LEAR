import { defineField, defineType } from "sanity";

const hrefDescription =
  "Endereço do link. Pode ser uma âncora da própria página (#projetos), " +
  "um caminho interno (/noticias) ou uma URL completa (https://…).";

/** Link simples — usado nos botões do hero, nas colunas do rodapé, etc. */
export const link = defineType({
  name: "link",
  title: "Link",
  type: "object",
  fields: [
    defineField({
      name: "label",
      title: "Texto",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "href",
      title: "Endereço",
      type: "string",
      description: hrefDescription,
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: { select: { title: "label", subtitle: "href" } },
});

/** Link do menu do topo — igual ao `link`, mais o destaque visual. */
export const navLink = defineType({
  name: "navLink",
  title: "Link do menu",
  type: "object",
  fields: [
    defineField({
      name: "label",
      title: "Texto",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "href",
      title: "Endereço",
      type: "string",
      description: hrefDescription,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "pin",
      title: "Destacar",
      type: "boolean",
      description: "Desenha o link como um selo destacado, no fim do menu.",
      initialValue: false,
    }),
  ],
  preview: {
    select: { title: "label", subtitle: "href", pin: "pin" },
    prepare: ({ title, subtitle, pin }) => ({
      title: pin ? `${title} ★` : title,
      subtitle,
    }),
  },
});
