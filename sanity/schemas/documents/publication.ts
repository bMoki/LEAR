import { defineArrayMember, defineField, defineType } from "sanity";

/**
 * Produção acadêmica do laboratório — artigo, livro ou capítulo (CONTEXT.md).
 *
 * O campo principal é a **referência inteira em texto**, e isso é deliberado.
 * O site antigo guardava cada publicação como um parágrafo já formatado, e é
 * assim que o pesquisador copia do Lattes, do Google Scholar ou do gerenciador
 * de referências. Quebrar em autor/título/periódico/volume/página daria um
 * formulário de dez campos que ninguém preenche direito e que erra em toda
 * publicação fora do padrão — *et al.*, número especial, preprint, capítulo com
 * organizador.
 *
 * `year` e `kind` são separados porque são o que **ordena e agrupa** a lista.
 * `url` é separado porque vira link clicável. O resto continua sendo prosa.
 *
 * Não confundir com Notícia: a Notícia é divulgação informal; a Publicação
 * passou por revisão de pares.
 */
export const publication = defineType({
  name: "publication",
  title: "Publicação",
  type: "document",
  orderings: [
    {
      name: "yearDesc",
      title: "Mais recentes primeiro",
      by: [
        { field: "year", direction: "desc" },
        { field: "reference", direction: "asc" },
      ],
    },
  ],
  fields: [
    defineField({
      name: "reference",
      title: "Referência",
      type: "text",
      rows: 4,
      description:
        "A citação completa, como sai do Lattes ou do Google Scholar — " +
        "autores, ano, título, periódico, volume e páginas. Cole e confira; " +
        "não precisa reformatar.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "year",
      title: "Ano",
      type: "string",
      description: "Define a ordem da lista — a mais recente aparece primeiro. Ex.: “2024”.",
      validation: (Rule) =>
        Rule.required().regex(/^\d{4}$/, { name: "ano com quatro dígitos" }),
    }),
    defineField({
      name: "kind",
      title: "Tipo",
      type: "string",
      // Lista fechada: são as três seções que a página de Publicações sempre
      // teve, e "Artigo"/"artigo"/"Artigos" digitados à mão davam três grupos
      // para a mesma coisa.
      options: {
        list: [
          { title: "Artigo", value: "artigo" },
          { title: "Livro", value: "livro" },
          { title: "Capítulo de livro", value: "capitulo" },
        ],
        layout: "radio",
      },
      initialValue: "artigo",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "url",
      title: "Link",
      type: "url",
      description:
        "Endereço do artigo — DOI, página do periódico ou repositório. " +
        "Opcional: publicação sem link continua válida.",
      validation: (Rule) => Rule.uri({ scheme: ["http", "https"] }),
    }),
    defineField({
      name: "authors",
      title: "Autores do LEAR",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      description:
        "Só quem é do laboratório, um por linha, para permitir filtrar a " +
        "lista por pessoa. A referência acima continua trazendo todos os " +
        "autores — este campo não a substitui.",
    }),
  ],
  preview: {
    select: { reference: "reference", year: "year", kind: "kind" },
    prepare: ({ reference, year, kind }) => ({
      title: reference?.replace(/\s+/g, " ").slice(0, 90) ?? "Sem referência",
      subtitle: [year, { artigo: "Artigo", livro: "Livro", capitulo: "Capítulo" }[kind as string]]
        .filter(Boolean)
        .join(" · "),
    }),
  },
});
