import { defineArrayMember, defineField, defineType } from "sanity";
import { INLINE_MD_EMPHASIS } from "../inline";

/**
 * Documento único (`_id: "contactSection"`). Alimenta `getContactInfo` e
 * `getContactForm`.
 *
 * Os rótulos do formulário ficam num grupo separado: são micro-copy que quase
 * nunca muda e não deveria disputar espaço com o texto da seção.
 */
export const contactSection = defineType({
  name: "contactSection",
  title: "Contato",
  type: "document",
  groups: [
    { name: "info", title: "Texto e dados", default: true },
    { name: "form", title: "Formulário" },
  ],
  fields: [
    defineField({
      name: "heading",
      title: "Título",
      type: "text",
      rows: 2,
      group: "info",
      description: INLINE_MD_EMPHASIS,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "body",
      title: "Parágrafo",
      type: "text",
      rows: 4,
      group: "info",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "rows",
      title: "Linhas de contato",
      type: "array",
      group: "info",
      of: [defineArrayMember({ type: "contactRow" })],
      validation: (Rule) => Rule.required().min(1),
    }),

    defineField({
      name: "form",
      title: "Rótulos do formulário",
      type: "object",
      group: "form",
      description:
        "Apenas os textos do formulário. O destino das mensagens é " +
        "configurado no ambiente (CONTACT_TO_EMAIL), não aqui.",
      fields: [
        defineField({ name: "heading", title: "Título do formulário", type: "string" }),
        defineField({ name: "nameLabel", title: "Rótulo — Nome", type: "string" }),
        defineField({ name: "namePlaceholder", title: "Dica — Nome", type: "string" }),
        defineField({ name: "orgLabel", title: "Rótulo — Instituição", type: "string" }),
        defineField({ name: "orgPlaceholder", title: "Dica — Instituição", type: "string" }),
        defineField({ name: "emailLabel", title: "Rótulo — E-mail", type: "string" }),
        defineField({ name: "emailPlaceholder", title: "Dica — E-mail", type: "string" }),
        defineField({ name: "subjectLabel", title: "Rótulo — Assunto", type: "string" }),
        defineField({
          name: "subjectOptions",
          title: "Opções de assunto",
          type: "array",
          of: [
            defineArrayMember({
              type: "object",
              name: "subjectOption",
              fields: [
                defineField({
                  name: "value",
                  title: "Identificador",
                  type: "string",
                  description:
                    "Valor técnico enviado com o formulário, sem acento nem " +
                    "espaço. Ex.: “cooperation”.",
                  validation: (Rule) =>
                    Rule.required().regex(/^[a-z0-9-]+$/, {
                      name: "minúsculas, números e hífen",
                    }),
                }),
                defineField({
                  name: "label",
                  title: "Texto exibido",
                  type: "string",
                  validation: (Rule) => Rule.required(),
                }),
              ],
              preview: { select: { title: "label", subtitle: "value" } },
            }),
          ],
          validation: (Rule) => Rule.required().min(1),
        }),
        defineField({ name: "messageLabel", title: "Rótulo — Mensagem", type: "string" }),
        defineField({ name: "messagePlaceholder", title: "Dica — Mensagem", type: "string" }),
        defineField({
          name: "note",
          title: "Observação",
          type: "string",
          description: "Texto manuscrito ao lado do botão. Ex.: “a gente responde rápido!”.",
        }),
        defineField({ name: "submitLabel", title: "Texto do botão", type: "string" }),
        defineField({
          name: "sendingLabel",
          title: "Texto do botão durante o envio",
          type: "string",
          description: "Ex.: “Enviando…”. Em branco, o site usa esse mesmo padrão.",
        }),
        defineField({
          name: "sentLabel",
          title: "Texto do botão após envio",
          type: "string",
          description: "Ex.: “Anotado ✓”.",
        }),
        defineField({
          name: "sentMessage",
          title: "Confirmação após envio",
          type: "string",
          description:
            "Frase exibida abaixo do formulário quando a mensagem sai. " +
            "Em branco, o site usa “Mensagem enviada. Obrigado!”.",
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: "Contato" }) },
});
