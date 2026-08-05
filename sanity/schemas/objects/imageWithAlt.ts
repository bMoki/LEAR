import { defineField, defineType } from "sanity";

/**
 * Toda imagem do site. Modelado como `object` (e não como `image` com campos
 * extras) de propósito: num campo `image`, o Studio só mostra os subcampos
 * depois que uma foto é enviada — e o `placeholder` precisa ser editável
 * **antes** disso, porque é ele que o site exibe enquanto a foto não existe.
 *
 * Mapeia para `ImageRef` em `lib/content/types.ts`.
 */
export const imageWithAlt = defineType({
  name: "imageWithAlt",
  title: "Imagem",
  type: "object",
  fields: [
    defineField({
      name: "image",
      title: "Foto",
      type: "image",
      options: { hotspot: true },
      description:
        "O ponto de foco (hotspot) define o que fica visível quando a foto é " +
        "cortada para caber no espaço. Pode ficar vazio: o site mostra a " +
        "descrição do slot até a foto ser enviada.",
    }),
    defineField({
      name: "alt",
      title: "Texto alternativo",
      type: "string",
      description:
        "Descreve a foto para quem usa leitor de tela. Ex.: “Serpente em close sobre folhagem”.",
      validation: (Rule) =>
        Rule.max(160).custom((alt, context) => {
          const parent = context.parent as { image?: unknown } | undefined;
          if (parent?.image && !alt) return "Obrigatório quando há foto.";
          return true;
        }),
    }),
    defineField({
      name: "placeholder",
      title: "Descrição do slot",
      type: "string",
      description:
        "Exibido no lugar da foto enquanto nenhuma imagem for enviada — serve " +
        "de instrução do que entra aqui. Ex.: “foto · serpente · close em " +
        "folhagem · vertical”.",
    }),
  ],
  preview: {
    select: { media: "image", title: "alt", subtitle: "placeholder" },
    prepare: ({ media, title, subtitle }) => ({
      media,
      title: title || subtitle || "Imagem sem descrição",
      subtitle: title ? subtitle : undefined,
    }),
  },
});
