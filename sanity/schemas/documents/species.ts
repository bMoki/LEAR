import { defineArrayMember, defineField, defineType } from "sanity";
import { richBodyOf } from "../objects/richBody";
import { SLUG_DESCRIPTION, slugOptions } from "../slug";

/** Ordens que o laboratório registra, e de que grupo cada uma é. Serve para o
 * Studio sugerir o grupo sozinho e para o site agrupar sem depender de alguém
 * ter marcado o rádio certo. */
export const ORDENS = {
  Anura: "anfibio",
  Caudata: "anfibio",
  Gymnophiona: "anfibio",
  Squamata: "reptil",
  Testudines: "reptil",
  Crocodylia: "reptil",
} as const;

/**
 * Uma espécie de anfíbio ou réptil da herpetofauna catarinense — o conteúdo da
 * antiga **Herpetoteca** (ver CONTEXT.md).
 *
 * É o tipo com mais documentos do site e o de maior alcance na busca: quem
 * procura "sapinho-pingo-de-ouro" ou "*Brachycephalus actaeus*" digita o nome
 * da espécie, não o nome do laboratório. É exatamente a consulta vencível que
 * o ADR 0005 diz que a sigla "LEAR" não é.
 *
 * Por isso os **nomes populares** são campo de primeira classe e não uma nota
 * dentro do texto: são eles que o público digita, enquanto o nome científico é
 * o que o pesquisador usa. As duas formas convivem — mesma regra do Táxon de
 * Projeto.
 *
 * Quase tudo é opcional de propósito. O site antigo tinha 264 espécies listadas
 * e ficha completa em duas: exigir habitat, reprodução e distribuição para
 * publicar transformaria 262 registros bons em zero. Uma espécie com nome,
 * família e foto já é uma página útil.
 */
export const species = defineType({
  name: "species",
  title: "Espécie",
  type: "document",
  groups: [
    { name: "identificacao", title: "Identificação", default: true },
    { name: "ficha", title: "Ficha" },
    { name: "midia", title: "Mídia" },
  ],
  orderings: [
    {
      name: "scientificAsc",
      title: "Nome científico (A–Z)",
      by: [{ field: "scientificName", direction: "asc" }],
    },
    {
      name: "taxonomia",
      title: "Taxonomia",
      by: [
        { field: "familia", direction: "asc" },
        { field: "scientificName", direction: "asc" },
      ],
    },
  ],
  fields: [
    defineField({
      name: "scientificName",
      title: "Nome científico",
      type: "string",
      group: "identificacao",
      description:
        "O binômio, sem itálico — o site formata. Ex.: “Boana poaju”. " +
        "Gênero com maiúscula, epíteto com minúscula.",
      validation: (Rule) =>
        Rule.required().custom((name) =>
          !name || /^[A-Z][a-z]+ [a-z]+/.test(name)
            ? true
            : "Esperado o formato “Genero especie”, como “Boana poaju”."
        ),
    }),
    defineField({
      name: "slug",
      title: "Endereço (slug)",
      type: "slug",
      group: "identificacao",
      options: { ...slugOptions, source: "scientificName" },
      description: `${SLUG_DESCRIPTION} Ex.: /especies/boana-poaju.`,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "commonNames",
      title: "Nomes populares",
      type: "array",
      group: "identificacao",
      of: [defineArrayMember({ type: "string" })],
      description:
        "Um por linha. É o nome que o público digita na busca, então vale " +
        "listar todas as variantes que se ouve em campo. Ex.: " +
        "“perereca-de-riacho”, “rã-de-riacho”.",
    }),
    defineField({
      name: "group",
      title: "Grupo",
      type: "string",
      group: "identificacao",
      options: {
        list: [
          { title: "Anfíbio", value: "anfibio" },
          { title: "Réptil", value: "reptil" },
        ],
        layout: "radio",
      },
      description: "Separa as duas galerias da Herpetoteca.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "ordem",
      title: "Ordem",
      type: "string",
      group: "identificacao",
      options: {
        list: Object.keys(ORDENS).map((value) => ({ title: value, value })),
        layout: "dropdown",
      },
      description: "Ex.: “Anura”, “Squamata”.",
    }),
    defineField({
      name: "familia",
      title: "Família",
      type: "string",
      group: "identificacao",
      description: "Só o nome, sem a palavra “Família”. Ex.: “Hylidae”.",
    }),
    defineField({
      name: "subfamilia",
      title: "Subfamília",
      type: "string",
      group: "identificacao",
      description: "Quando houver. Ex.: “Scinaxinae”.",
    }),
    defineField({
      name: "localities",
      title: "Onde ocorre",
      type: "array",
      group: "identificacao",
      of: [defineArrayMember({ type: "reference", to: [{ type: "locality" }] })],
      description:
        "Os levantamentos em que esta espécie foi registrada. É o que monta a " +
        "lista de cada Local — marcar aqui já faz a espécie aparecer lá.",
    }),

    defineField({
      name: "habitat",
      title: "Habitat e hábitos",
      type: "text",
      rows: 4,
      group: "ficha",
      description: "Onde vive, quando está ativa, onde vocaliza.",
    }),
    defineField({
      name: "description",
      title: "Descrição",
      type: "text",
      rows: 4,
      group: "ficha",
      description: "Como reconhecer o animal: tamanho, coloração, dimorfismo sexual.",
    }),
    defineField({
      name: "reproduction",
      title: "Reprodução",
      type: "text",
      rows: 4,
      group: "ficha",
    }),
    defineField({
      name: "distribution",
      title: "Distribuição",
      type: "text",
      rows: 3,
      group: "ficha",
      description: "Onde a espécie ocorre no Brasil e no mundo. Ex.: “RS, SC, PR, SP, MG”.",
    }),
    defineField({
      name: "threatStatus",
      title: "Grau de ameaça",
      type: "string",
      group: "ficha",
      // Categorias da IUCN. Texto livre dava "pouco preocupante", "Pouco
      // Preocupante" e "LC" para o mesmo estado — e o grau de ameaça é
      // justamente o que alguém vai querer filtrar.
      options: {
        list: [
          { title: "LC · Pouco preocupante", value: "LC" },
          { title: "NT · Quase ameaçada", value: "NT" },
          { title: "VU · Vulnerável", value: "VU" },
          { title: "EN · Em perigo", value: "EN" },
          { title: "CR · Criticamente em perigo", value: "CR" },
          { title: "DD · Dados insuficientes", value: "DD" },
          { title: "NE · Não avaliada", value: "NE" },
        ],
        layout: "dropdown",
      },
      description: "Categoria da IUCN.",
    }),
    defineField({
      name: "body",
      title: "Texto livre",
      type: "array",
      group: "ficha",
      of: richBodyOf,
      description:
        "Opcional, para o que não cabe nos campos acima — história natural, " +
        "observações do laboratório, curiosidades.",
    }),
    defineField({
      name: "references",
      title: "Referências",
      type: "text",
      rows: 4,
      group: "ficha",
      description: "De onde vieram as informações da ficha. Uma por linha.",
    }),

    defineField({
      name: "image",
      title: "Foto de capa",
      type: "imageWithAlt",
      group: "midia",
      description:
        "A que representa a espécie na Herpetoteca, no topo da página e no " +
        "link compartilhado. É uma escolha, não um acervo — as demais ficam " +
        "na galeria.",
    }),
    defineField({
      name: "gallery",
      title: "Galeria",
      type: "array",
      group: "midia",
      of: [defineArrayMember({ type: "imageWithAlt" })],
      // Inclui a capa de propósito: a mesma espécie costuma ter sido
      // fotografada em campanhas diferentes, e quem abre a galeria quer ver
      // todas — inclusive a que já viu no topo. Trocar a capa passa a ser
      // escolher qual delas sobe, sem mexer no acervo.
      description: "Todas as fotos da espécie, inclusive a de capa.",
    }),
    defineField({
      name: "audioUrl",
      title: "Canto",
      type: "url",
      group: "midia",
      description:
        "Endereço da gravação da vocalização. Só anuros vocalizam — deixe " +
        "vazio para répteis.",
      validation: (Rule) => Rule.uri({ scheme: ["http", "https"] }),
    }),
    defineField({
      name: "videoUrl",
      title: "Vídeo",
      type: "url",
      group: "midia",
      description: "Endereço de um vídeo da espécie (YouTube ou repositório).",
      validation: (Rule) => Rule.uri({ scheme: ["http", "https"] }),
    }),
  ],
  preview: {
    select: {
      title: "scientificName",
      commonNames: "commonNames",
      familia: "familia",
      media: "image.image",
    },
    prepare: ({ title, commonNames, familia, media }) => ({
      title,
      subtitle: [commonNames?.[0], familia].filter(Boolean).join(" · "),
      media,
    }),
  },
});
