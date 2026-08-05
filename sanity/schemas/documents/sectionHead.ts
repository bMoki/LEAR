import { defineField, defineType } from "sanity";
import { apiVersion } from "../../env";
import { INLINE_MD_EMPHASIS } from "../inline";

/**
 * Cabeçalho (chapéu / título / blurb) de cada seção numerada. Um documento por
 * chave, mapeando 1:1 com `getSectionHead(key)` em `lib/content`.
 *
 * As chaves são fechadas: correspondem ao tipo `SectionHeadKey`. Adicionar uma
 * nova seção exige mudar o código, então não faz sentido deixar o campo livre.
 */
const KEYS = [
  { value: "news", title: "Notícias (página inicial)" },
  { value: "newsArchive", title: "Notícias (arquivo completo)" },
  { value: "projects", title: "Projetos" },
  { value: "coordinators", title: "Equipe" },
  { value: "gallery", title: "Galeria" },
  { value: "contact", title: "Contato" },
];

export const sectionHead = defineType({
  name: "sectionHead",
  title: "Cabeçalho de seção",
  type: "document",
  fields: [
    defineField({
      name: "key",
      title: "Seção",
      type: "string",
      options: { list: KEYS, layout: "dropdown" },
      description: "Cada seção só pode ter um cabeçalho.",
      validation: (Rule) =>
        Rule.required().custom(async (key, context) => {
          if (!key) return true;
          const id = context.document?._id?.replace(/^drafts\./, "");
          const duplicates = await context
            .getClient({ apiVersion })
            .fetch<number>(
              `count(*[_type == "sectionHead" && key == $key && !(_id in [$id, "drafts." + $id])])`,
              { key, id: id ?? "" }
            );
          return duplicates === 0 ? true : "Já existe um cabeçalho para esta seção.";
        }),
    }),
    defineField({
      name: "kicker",
      title: "Chapéu",
      type: "string",
      description: "Linha pequena acima do título. Ex.: “§ 02 · pesquisas”.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "title",
      title: "Título",
      type: "text",
      rows: 2,
      description: `${INLINE_MD_EMPHASIS} A quebra de linha é parte do design — ex.: “O que estamos\n*investigando*”.`,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "blurb",
      title: "Descrição",
      type: "text",
      rows: 3,
      description: "Parágrafo à direita do título.",
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: { key: "key", title: "title", subtitle: "kicker" },
    prepare: ({ key, title, subtitle }) => ({
      title: KEYS.find((k) => k.value === key)?.title ?? key ?? "Sem seção",
      subtitle: [subtitle, title?.replace(/\n/g, " ")].filter(Boolean).join(" — "),
    }),
  },
});
