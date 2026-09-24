import { orderRankField, orderRankOrdering } from "@sanity/orderable-document-list";
import { defineField, defineType } from "sanity";
import { richBodyOf } from "../objects/richBody";
import { SLUG_DESCRIPTION, slugOptions } from "../slug";

/**
 * Recorte geográfico com lista de herpetofauna levantada — uma unidade de
 * conservação, uma ilha, o estado inteiro (ver CONTEXT.md).
 *
 * Existe para não repetir o nome do lugar dentro de cada Espécie. No site
 * antigo cada Local rendia **duas** páginas, "ANFÍBIOS (X)" e "RÉPTEIS (X)",
 * com o mesmo cabeçalho copiado — aqui é um documento só, e a separação por
 * grupo é filtro de exibição, não estrutura.
 *
 * Não confundir com `bioma` do Projeto: bioma é classificação ecológica
 * ("Mata Atlântica"), Local é lugar com limite definido no mapa.
 */
export const locality = defineType({
  name: "locality",
  title: "Local",
  type: "document",
  orderings: [orderRankOrdering],
  fields: [
    defineField({
      name: "name",
      title: "Nome",
      type: "string",
      description: "Como o lugar é citado. Ex.: “Parque Nacional de São Joaquim”.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Endereço (slug)",
      type: "slug",
      options: { ...slugOptions, source: "name" },
      description: `${SLUG_DESCRIPTION} Ex.: /locais/parque-nacional-de-sao-joaquim.`,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "shortName",
      title: "Nome curto",
      type: "string",
      description:
        "Como aparece na etiqueta de uma espécie, onde o nome inteiro não " +
        "cabe. Ex.: “PNSJ”, “Ilha de SC”. Vazio, o site usa o nome completo.",
    }),
    defineField({
      name: "description",
      title: "Descrição",
      type: "text",
      rows: 4,
      description:
        "Um parágrafo sobre o lugar e o levantamento feito ali. É a descrição " +
        "que a busca mostra.",
    }),
    defineField({
      name: "image",
      title: "Imagem",
      type: "imageWithAlt",
      description: "Paisagem do local. Aparece no topo da página e no link compartilhado.",
    }),
    defineField({
      name: "body",
      title: "Texto",
      type: "array",
      of: richBodyOf,
      description:
        "Opcional. Método do levantamento, campanhas realizadas, quem " +
        "participou — o que faz a página valer por si além da lista de espécies.",
    }),
    orderRankField({ type: "locality" }),
  ],
  preview: {
    select: { title: "name", subtitle: "shortName", media: "image.image" },
  },
});
