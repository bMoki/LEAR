import { orderRankField, orderRankOrdering } from "@sanity/orderable-document-list";
import { defineArrayMember, defineField, defineType } from "sanity";
import { INLINE_MD_EMPHASIS } from "../inline";
import { richBodyOf } from "../objects/richBody";
import { SLUG_DESCRIPTION, slugOptions } from "../slug";

/**
 * Uma frente de pesquisa do laboratório (ver CONTEXT.md).
 *
 * Passou a ter **endereço próprio** — `/projetos/<slug>` — em vez de existir só
 * como cartão da landing (ADR 0005). Com isso, o que antes eram etiquetas de
 * texto solto (`pins`) virou campo tipado: bioma, responsável, período e
 * financiador. As etiquetas do cartão continuam existindo na tela; agora são
 * *derivadas* desses campos, em `lib/content/project.ts`.
 *
 * `variant` e `doodle` do tipo `ProjectCard` **não** estão aqui de propósito:
 * são decoração (rotação, cor de fundo, glifo do canto) derivada da posição do
 * projeto na lista. Ver `docs/plano-cms-headless.md` §6.
 *
 * Nenhum campo novo é obrigatório. É o princípio do ADR 0005: nada de SEO pode
 * travar a publicação — um projeto só com título e descrição continua válido, e
 * o valor padrão sai sempre do conteúdo que já existe.
 */
export const project = defineType({
  name: "project",
  title: "Projeto",
  type: "document",
  orderings: [orderRankOrdering],
  groups: [
    { name: "conteudo", title: "Conteúdo", default: true },
    { name: "ficha", title: "Ficha" },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Título",
      type: "text",
      rows: 2,
      group: "conteudo",
      description: INLINE_MD_EMPHASIS,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Endereço (slug)",
      type: "slug",
      group: "conteudo",
      options: slugOptions,
      description: `${SLUG_DESCRIPTION} Ex.: /projetos/serpentes-cripticas-da-serra-do-mar.`,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "number",
      title: "Numeração",
      type: "string",
      group: "conteudo",
      // Opcional desde o ADR 0006: o site antigo não numerava projetos, então
      // todo projeto importado receberia um número inventado a partir da
      // posição na página. Melhor vazio do que falsamente preciso.
      description: "Como aparece no canto do cartão. Ex.: “Projeto 01”. Opcional.",
    }),
    defineField({
      name: "status",
      title: "Situação",
      type: "string",
      group: "conteudo",
      // Lista fechada no lugar de texto livre: são três estados do domínio
      // (CONTEXT.md), e escrever “em Campo” num projeto e “em campo” noutro
      // dava dois valores diferentes para a mesma coisa.
      options: {
        list: [
          { title: "Em campo", value: "em campo" },
          { title: "Em análise", value: "em análise" },
          { title: "Concluído", value: "concluído" },
        ],
        layout: "radio",
      },
      initialValue: "em campo",
      // Também opcional pelo ADR 0006. O site antigo não classificava
      // situação, e marcar os 14 projetos importados como "em campo" afirmaria
      // que todos estão ativos — o que não se sabe.
    }),
    defineField({
      name: "description",
      title: "Descrição",
      type: "text",
      rows: 5,
      group: "conteudo",
      description:
        "Um parágrafo. Aparece no cartão da página inicial, na abertura da " +
        "página do projeto e é a descrição que a busca mostra.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "image",
      title: "Imagem",
      type: "imageWithAlt",
      group: "conteudo",
      description: "Aparece no topo da página do projeto e no card compartilhado.",
    }),
    defineField({
      name: "body",
      title: "Texto",
      type: "array",
      group: "conteudo",
      of: richBodyOf,
      description:
        "Opcional, e é o que faz a página do projeto valer por si. Sem ele a " +
        "página é uma ficha de fatos; com dois ou três parágrafos sobre método, " +
        "área de estudo e resultados, ela passa a responder buscas próprias.",
    }),

    defineField({
      name: "bioma",
      title: "Bioma",
      type: "string",
      group: "ficha",
      description: "Ex.: “Mata Atlântica”, “Cerrado”, “Caatinga”, “Restinga”.",
    }),
    defineField({
      name: "taxonCientifico",
      title: "Táxon — nome científico",
      type: "string",
      group: "ficha",
      description: "O grupo estudado, em nome científico. Ex.: “Liolaemus occipitalis”.",
    }),
    defineField({
      name: "taxonPopular",
      title: "Táxon — nomes populares",
      type: "array",
      group: "ficha",
      of: [defineArrayMember({ type: "string" })],
      // A orientação combinada, e é orientação — nunca validação. Um projeto
      // sem táxon é um projeto válido (CONTEXT.md).
      description:
        "Vale a pena preencher junto do nome científico: é o nome popular que " +
        "o público digita na busca. Ex.: “lagarto-da-areia”, " +
        "“lagartinho-das-dunas”.",
    }),
    defineField({
      name: "responsavel",
      title: "Responsável",
      type: "string",
      group: "ficha",
      description:
        "Nome de quem lidera a frente, em texto livre. Não precisa ser alguém " +
        "da equipe cadastrada no site — mesma regra do autor de uma notícia.",
    }),
    defineField({
      name: "periodoInicio",
      title: "Período — início",
      type: "string",
      group: "ficha",
      description: "O ano. Ex.: “2024”.",
    }),
    defineField({
      name: "periodoFim",
      title: "Período — fim",
      type: "string",
      group: "ficha",
      description: "O ano de encerramento. Deixe vazio enquanto o projeto estiver em curso.",
    }),
    defineField({
      name: "financiador",
      title: "Financiador",
      type: "string",
      group: "ficha",
      description: "Ex.: “CNPq”, “FAPERJ”, “ICMBio”.",
    }),

    orderRankField({ type: "project" }),
  ],
  preview: {
    select: { title: "title", number: "number", status: "status", media: "image.image" },
    prepare: ({ title, number, status, media }) => ({
      title: title?.replace(/\*/g, ""),
      subtitle: [number, status].filter(Boolean).join(" · "),
      media,
    }),
  },
});
