import { defineArrayMember, defineField, defineType } from "sanity";

/**
 * Notícia — post curto e avulso (ver CONTEXT.md). Único tipo com corpo em
 * **Portable Text**: é o texto longo do site e o que os pesquisadores mais vão
 * escrever, então vale o editor visual em vez da convenção de Markdown.
 *
 * `slug` é campo próprio e estável: editar o título não muda a URL.
 */
export const news = defineType({
  name: "news",
  title: "Notícia",
  type: "document",
  orderings: [
    {
      name: "publishedAtDesc",
      title: "Mais recentes primeiro",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Título",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Endereço (slug)",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      description:
        "Parte final da URL: /noticias/<slug>. Gerado do título, mas fica " +
        "fixo depois — mudar quebra links já publicados.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "author",
      title: "Autor",
      type: "string",
      description:
        "Nome de quem escreveu, em texto livre. Não precisa ser alguém da " +
        "equipe cadastrada no site.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "publishedAt",
      title: "Data de publicação",
      type: "datetime",
      description: "Define a ordem do feed — a mais recente aparece primeiro.",
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "image",
      title: "Imagem",
      type: "imageWithAlt",
      description: "Aparece no card do feed e no topo da notícia.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "body",
      title: "Texto",
      type: "array",
      of: [
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
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "excerpt",
      title: "Resumo",
      type: "text",
      rows: 3,
      description:
        "Ainda não é exibido em lugar nenhum — o card do feed mostra só " +
        "título, imagem e data. Reservado para uso futuro.",
    }),
  ],
  preview: {
    select: { title: "title", author: "author", date: "publishedAt", media: "image.image" },
    prepare: ({ title, author, date, media }) => ({
      title,
      subtitle: [date ? new Date(date).toLocaleDateString("pt-BR") : null, author]
        .filter(Boolean)
        .join(" · "),
      media,
    }),
  },
});
