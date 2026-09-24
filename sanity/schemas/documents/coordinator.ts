import { orderRankField, orderRankOrdering } from "@sanity/orderable-document-list";
import { defineField, defineType } from "sanity";

/** Pesquisador responsável, na seção “Equipe”. */
export const coordinator = defineType({
  name: "coordinator",
  title: "Pesquisador",
  type: "document",
  orderings: [orderRankOrdering],
  fields: [
    defineField({
      name: "name",
      title: "Nome",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "role",
      title: "Função",
      type: "string",
      description: "Ex.: “Coordenação geral · Sistemática”.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "image",
      title: "Retrato",
      type: "imageWithAlt",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "caption",
      title: "Legenda do retrato",
      type: "string",
      description:
        "Texto manuscrito abaixo da foto. Ex.: “Dra. Clarice — campo de '24”. " +
        "Vazio, o site usa o nome.",
    }),
    defineField({
      name: "bio",
      title: "Minibiografia",
      type: "text",
      rows: 5,
      validation: (Rule) => Rule.required(),
    }),
    // `caption` e `lines` deixaram de ser obrigatórios quando a equipe real
    // entrou no lugar do conteúdo de exemplo (ADR 0006). As 30 fichas do site
    // antigo têm nome, foto e biografia; nenhuma tem legenda manuscrita nem
    // linhas de pesquisa separadas do texto corrido. Exigi-las marcaria as 30
    // como inválidas no Studio — um alerta permanente que ninguém consegue
    // resolver a não ser inventando o dado.
    defineField({
      name: "lines",
      title: "Linhas de pesquisa",
      type: "string",
      description: "Lista curta separada por vírgula. Ex.: “filogenia, viperídeos, coleções”.",
    }),
    defineField({
      name: "email",
      title: "E-mail",
      type: "string",
      description: "Contato de trabalho. Aparece na ficha da pessoa.",
      validation: (Rule) =>
        Rule.regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { name: "e-mail" }).warning(
          "Não parece um endereço de e-mail."
        ),
    }),
    defineField({
      name: "lattes",
      title: "Currículo Lattes",
      type: "url",
      description: "Endereço completo. Ex.: http://lattes.cnpq.br/1315649023145433.",
      validation: (Rule) => Rule.uri({ scheme: ["http", "https"] }),
    }),
    orderRankField({ type: "coordinator" }),
  ],
  preview: {
    select: { title: "name", subtitle: "role", media: "image.image" },
  },
});
