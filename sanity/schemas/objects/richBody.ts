import { defineArrayMember, defineField } from "sanity";

/**
 * O que o editor visual oferece num corpo de texto longo — os mesmos blocos e
 * as mesmas marcas na Notícia e no Projeto.
 *
 * Exportado como a lista `of` de um array, e não como um tipo nomeado: assim os
 * dois campos continuam declarando a própria obrigatoriedade (o corpo da
 * Notícia é exigido, o do Projeto é opcional) e nada muda no formato gravado.
 *
 * `components/ui/PortableBody.tsx` renderiza exatamente este conjunto: se o
 * Studio não deixa criar, não precisa ser renderizado — e o contrário também
 * vale, então mexer aqui pede mexer lá.
 */
export const richBodyOf = [
  defineArrayMember({
    type: "block",
    styles: [
      { title: "Parágrafo", value: "normal" },
      { title: "Subtítulo", value: "h2" },
      { title: "Subtítulo menor", value: "h3" },
      { title: "Citação", value: "blockquote" },
    ],
    lists: [
      { title: "Lista", value: "bullet" },
      { title: "Lista numerada", value: "number" },
    ],
    marks: {
      decorators: [
        { title: "Negrito", value: "strong" },
        { title: "Itálico", value: "em" },
      ],
      annotations: [
        defineArrayMember({
          type: "object",
          name: "link",
          title: "Link",
          fields: [
            defineField({
              name: "href",
              title: "Endereço",
              type: "url",
              validation: (Rule) =>
                Rule.required().uri({ scheme: ["http", "https", "mailto"] }),
            }),
          ],
        }),
      ],
    },
  }),
];
