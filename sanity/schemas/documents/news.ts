import { defineField, defineType } from "sanity";
import { richBodyOf } from "../objects/richBody";
import { SLUG_DESCRIPTION, slugOptions } from "../slug";

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
      // O gerador compartilhado (`../slug`) tira acento e Markdown, que o
      // padrão do Sanity deixava passar: “Campanha 2025 no inselberg #07”
      // gerava um endereço com `#` e dois-pontos dentro.
      options: slugOptions,
      description: `${SLUG_DESCRIPTION} Ex.: /noticias/campanha-2025-inselberg-07.`,
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
      // Deixou de ser obrigatória com a importação do acervo antigo (ADR
      // 0006): nem toda Notícia nasce com foto, e uma Publicação convertida em
      // Notícia nunca tem. Exigir imagem transformaria dezenas de registros
      // válidos em inválidos, e o `ImageSlot` já sabe desenhar o vazio.
      description: "Aparece no card do feed e no topo da notícia. Pode ficar vazia.",
    }),
    defineField({
      name: "body",
      title: "Texto",
      type: "array",
      of: richBodyOf,
      validation: (Rule) => Rule.required().min(1),
    }),
    /**
     * Marca de onde o documento veio, e existe só por causa da camada de
     * compatibilidade do ADR 0006: as Publicações do acervo antigo são
     * gravadas **também** como Notícia, para aparecerem enquanto `/publicacoes`
     * não existe.
     *
     * O `CONTEXT.md` mantém os dois conceitos separados de propósito — uma
     * Publicação passou por revisão de pares, uma Notícia não — e este campo
     * não os funde: ele permite que as consultas voltem a separá-los, filtrando
     * por `origin == "noticia"`. Sem ele, os dois viram uma coisa só e não há
     * como desfazer.
     *
     * Quando a tela de Publicações existir, as Notícias com `origin ==
     * "publicacao"` podem ser apagadas em bloco e este campo, removido.
     */
    defineField({
      name: "origin",
      title: "Origem",
      type: "string",
      readOnly: true,
      hidden: ({ document }) => !document?.origin,
      options: {
        list: [
          { title: "Notícia", value: "noticia" },
          { title: "Publicação (compatibilidade)", value: "publicacao" },
        ],
      },
      initialValue: "noticia",
      description:
        "Preenchido pela importação. “Publicação” marca um registro que só " +
        "está aqui até a página de Publicações existir.",
    }),
    defineField({
      name: "excerpt",
      title: "Resumo",
      type: "text",
      rows: 3,
      // Era “reservado para uso futuro”, vazio e sem consumidor nenhum. Esta é
      // a finalidade (ADR 0005).
      description:
        "Uma ou duas frases. Não aparece na página: é a descrição que a busca " +
        "e o link compartilhado mostram. Deixando vazio, o site usa o começo " +
        "do texto — que costuma servir bem.",
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
