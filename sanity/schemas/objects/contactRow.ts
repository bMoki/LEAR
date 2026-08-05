import { defineField, defineType } from "sanity";
import { INLINE_MD } from "../inline";

/** Uma linha do bloco de contato: rótulo à esquerda, valor (+ nota) à direita. */
export const contactRow = defineType({
  name: "contactRow",
  title: "Linha de contato",
  type: "object",
  fields: [
    defineField({
      name: "label",
      title: "Rótulo",
      type: "string",
      description: "Ex.: “Endereço”, “E-mail”, “Telefone”.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "value",
      title: "Valor",
      type: "text",
      rows: 3,
      description: `${INLINE_MD} Para e-mail, use [lear@bio.ufrj.br](mailto:lear@bio.ufrj.br).`,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "note",
      title: "Observação",
      type: "string",
      description: "Linha menor abaixo do valor. Ex.: “seg—sex · 10h às 16h”.",
    }),
  ],
  preview: { select: { title: "label", subtitle: "value" } },
});
