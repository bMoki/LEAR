import { defineField, defineType } from "sanity";

const hrefDescription =
  "Endereço do link. Pode ser uma âncora da própria página (#projetos), " +
  "um caminho interno (/noticias) ou uma URL completa (https://…).";

/**
 * Esquemas aceitos numa URL absoluta — os mesmos que o link do corpo das
 * Notícias já exigia (`sanity/schemas/documents/news.ts`). A regra aqui é a
 * mesma, adaptada para também aceitar o que a descrição do campo promete:
 * âncora (`#projetos`) e caminho interno (`/noticias`).
 *
 * O que isso evita não é XSS — o React 19 bloqueia `javascript:` em `href` por
 * conta própria, e navegador nenhum navega para `data:` no nível de topo. É
 * redirecionamento aberto: uma conta de editor comprometida troca o "Fale
 * conosco" do menu por um domínio hostil, e o link passa a ostentar a
 * credibilidade do domínio do laboratório.
 */
const ALLOWED_SCHEMES = ["http", "https", "mailto"];

/** `//evil.com` é URL protocolo-relativa: parece caminho interno e navega para
 * fora. Por isso a âncora e o caminho interno são testados com esse cuidado. */
const INTERNAL_HREF = /^(#[^\s]*|\/(?!\/)[^\s]*)$/;

function validateHref(href: unknown): true | string {
  if (typeof href !== "string" || href.trim() === "") {
    return "Obrigatório.";
  }

  const value = href.trim();

  if (INTERNAL_HREF.test(value)) return true;

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return "Use uma âncora (#projetos), um caminho interno (/noticias) ou uma URL completa (https://…).";
  }

  if (!ALLOWED_SCHEMES.includes(parsed.protocol.replace(":", ""))) {
    return `Esquema não permitido. Use ${ALLOWED_SCHEMES.join(", ")}.`;
  }

  return true;
}

/** Link simples — usado nos botões do hero, nas colunas do rodapé, etc. */
export const link = defineType({
  name: "link",
  title: "Link",
  type: "object",
  fields: [
    defineField({
      name: "label",
      title: "Texto",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "href",
      title: "Endereço",
      type: "string",
      description: hrefDescription,
      validation: (Rule) => Rule.required().custom(validateHref),
    }),
  ],
  preview: { select: { title: "label", subtitle: "href" } },
});

/** Link do menu do topo — igual ao `link`, mais o destaque visual. */
export const navLink = defineType({
  name: "navLink",
  title: "Link do menu",
  type: "object",
  fields: [
    defineField({
      name: "label",
      title: "Texto",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "href",
      title: "Endereço",
      type: "string",
      description: hrefDescription,
      validation: (Rule) => Rule.required().custom(validateHref),
    }),
    defineField({
      name: "pin",
      title: "Destacar",
      type: "boolean",
      description: "Desenha o link como um selo destacado, no fim do menu.",
      initialValue: false,
    }),
  ],
  preview: {
    select: { title: "label", subtitle: "href", pin: "pin" },
    prepare: ({ title, subtitle, pin }) => ({
      title: pin ? `${title} ★` : title,
      subtitle,
    }),
  },
});
