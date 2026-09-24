import { defineField, defineType } from "sanity";
import { richBodyOf } from "../objects/richBody";
import { SLUG_DESCRIPTION, slugOptions } from "../slug";

/**
 * Página institucional — texto que existe por si e não é Notícia, Projeto nem
 * Espécie: a coleção herpetológica (CHUFSC), o programa de extensão, as visitas
 * de escolas.
 *
 * É o **escape** do modelo, e é por isso que existe. Sem ele, cada texto solto
 * do laboratório viraria ou um tipo novo no schema (que só um documento usa) ou
 * um Projeto que não é projeto. Um tipo genérico com título, texto e endereço
 * resolve os dois casos sem distorcer nenhum conceito do domínio.
 *
 * A contrapartida: nada aqui é indexado por assunto, filtrado ou relacionado.
 * Um conteúdo que **precise** disso — como as espécies, que precisam de ordem,
 * família e local — pede tipo próprio, não uma Página.
 */
export const page = defineType({
  name: "page",
  title: "Página",
  type: "document",
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
      options: slugOptions,
      description: `${SLUG_DESCRIPTION} Ex.: /colecao-herpetologica.`,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "subtitle",
      title: "Subtítulo",
      type: "string",
      description: "Linha de apoio abaixo do título. Opcional.",
    }),
    defineField({
      name: "image",
      title: "Imagem",
      type: "imageWithAlt",
      description: "Aparece no topo da página e no link compartilhado.",
    }),
    defineField({
      name: "body",
      title: "Texto",
      type: "array",
      of: richBodyOf,
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "excerpt",
      title: "Resumo",
      type: "text",
      rows: 3,
      description:
        "Uma ou duas frases. Não aparece na página: é a descrição que a busca " +
        "e o link compartilhado mostram. Deixando vazio, o site usa o começo " +
        "do texto.",
    }),
  ],
  preview: {
    select: { title: "title", subtitle: "slug.current", media: "image.image" },
    prepare: ({ title, subtitle, media }) => ({
      title,
      subtitle: subtitle ? `/${subtitle}` : undefined,
      media,
    }),
  },
});
