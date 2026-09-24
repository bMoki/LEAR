import { defineArrayMember, defineField, defineType } from "sanity";
import { INLINE_MD_EMPHASIS } from "../inline";

/**
 * Documento único (`_id: "homePage"`). Alimenta `getHero`, `getStats` e
 * `getManifesto` — as três primeiras faixas da página inicial.
 */
export const homePage = defineType({
  name: "homePage",
  title: "Página inicial",
  type: "document",
  groups: [
    { name: "hero", title: "Abertura", default: true },
    { name: "stats", title: "Números" },
    { name: "manifesto", title: "Manifesto" },
  ],
  fields: [
    defineField({
      name: "hero",
      title: "Abertura",
      type: "object",
      group: "hero",
      options: { collapsible: false },
      fields: [
        defineField({
          name: "eyebrow",
          title: "Chapéu",
          type: "string",
          description: "Linha pequena acima do título. Ex.: “Caderno de campo · vol. XVII”.",
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: "titleLines",
          title: "Título",
          type: "array",
          of: [defineArrayMember({ type: "string" })],
          description: `Uma linha do título por item — a quebra é intencional no design. ${INLINE_MD_EMPHASIS}`,
          validation: (Rule) => Rule.required().min(1),
        }),
        defineField({
          name: "squiggleWord",
          title: "Palavra manuscrita",
          type: "string",
          description:
            "Última linha do título, desenhada com a fonte manuscrita e o " +
            "rabisco embaixo. Ex.: “escutam.”",
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: "lede",
          title: "Parágrafo de abertura",
          type: "text",
          rows: 5,
          description: INLINE_MD_EMPHASIS,
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: "ctas",
          title: "Botões",
          type: "array",
          of: [defineArrayMember({ type: "link" })],
          description: "O primeiro é o botão sólido; o segundo, o contornado.",
          validation: (Rule) => Rule.max(2),
        }),
        defineField({
          name: "margin",
          title: "Anotação de margem",
          type: "string",
          description:
            "Texto manuscrito na lateral esquerda. Ex.: “↑ cad. de campo · folha 24 · março/26”.",
        }),
        defineField({
          name: "polaroid",
          title: "Foto polaroid",
          type: "object",
          fields: [
            // Sem `required` desde o ADR 0006: as fotos do acervo ainda não
            // subiram, e a página inicial não pode depender delas para existir.
            defineField({
              name: "image",
              title: "Imagem",
              type: "imageWithAlt",
            }),
            defineField({
              name: "caption",
              title: "Legenda",
              type: "string",
              description:
                "Texto manuscrito abaixo da foto. Ex.: “Bothrops jararaca, Serra do Mar — 14.03”.",
            }),
            defineField({
              name: "stamp",
              title: "Selo",
              type: "string",
              description: "Etiqueta girada no canto da foto. Ex.: “esp. da semana”. Opcional.",
            }),
          ],
        }),
      ],
    }),

    defineField({
      name: "stats",
      title: "Números",
      type: "array",
      group: "stats",
      of: [
        defineArrayMember({
          type: "object",
          name: "stat",
          title: "Número",
          fields: [
            defineField({
              name: "num",
              title: "Valor",
              type: "string",
              description: `Ex.: “17*+*”, “243”, “4 *biomas*”. ${INLINE_MD_EMPHASIS}`,
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "lbl",
              title: "Legenda",
              type: "string",
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: { select: { title: "num", subtitle: "lbl" } },
        }),
      ],
    }),

    defineField({
      name: "manifesto",
      title: "Manifesto",
      type: "object",
      group: "manifesto",
      fields: [
        defineField({
          name: "quote",
          title: "Citação",
          type: "text",
          rows: 4,
          description: INLINE_MD_EMPHASIS,
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: "sig",
          title: "Assinatura",
          type: "string",
          description: "Ex.: “do credo fundador, 2009”.",
          validation: (Rule) => Rule.required(),
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: "Página inicial" }) },
});
