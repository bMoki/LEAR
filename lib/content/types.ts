import type { CSSProperties } from "react";
import type { PortableTextBlock } from "@portabletext/types";

/**
 * Content model for the whole site. Every text field is a plain string
 * (Markdown where inline emphasis is needed — see `components/ui/RichText`),
 * and every image is an `ImageRef`. There is **no JSX/React.ReactNode** here so
 * the same shapes can be served from the local source today or a headless CMS
 * (Sanity) later without changing components. Mirrors the `lib/news` pattern.
 */

/** A single image. `src` is filled by the CMS later; until then the slot shows
 * its `placeholder` text (see `components/ui/ImageSlot`). */
export type ImageRef = {
  slotId: string;
  alt: string;
  placeholder: string;
  src?: string;
  width?: number;
  height?: number;
  /** LQIP do Sanity — miniatura embutida em base64, usada como blur enquanto a
   * foto real carrega. */
  blurDataURL?: string;
};

export type NavLink = { label: string; href: string; pin?: boolean };

export type Nav = {
  brandName: string;
  brandTag: string;
  links: NavLink[];
};

/** kicker / title / blurb shared by every numbered section. `title` is inline
 * Markdown (supports `*emphasis*` and `\n` line breaks). */
export type SectionHeadContent = {
  kicker: string;
  title: string;
  blurb: string;
};

export type PolaroidContent = {
  image: ImageRef;
  caption: string;
  stamp?: string;
};

export type Cta = { label: string; href: string };

export type Hero = {
  margin: string;
  eyebrow: string;
  /** each entry is one rendered line (inline Markdown) */
  titleLines: string[];
  /** last line, rendered with the handwritten "squiggle" style */
  squiggleWord: string;
  lede: string;
  ctas: Cta[];
  polaroid: PolaroidContent;
};

/** `num` is inline Markdown (e.g. `"17*+*"`, `"4 *biomas*"`). */
export type Stat = { num: string; lbl: string };

export type Manifesto = {
  quote: string;
  sig: string;
};

/**
 * Frente de pesquisa (ver CONTEXT.md). O que o cartão e a página do projeto
 * têm em comum.
 *
 * Os campos da ficha são todos opcionais: um projeto com título e descrição é
 * um projeto válido, e nenhum campo pode travar a publicação (ADR 0005).
 */
type ProjectBase = {
  /** Campo próprio e estável: editar o título não muda a URL. */
  slug: string;
  number: string;
  status: string;
  /** Markdown inline. */
  title: string;
  description: string;
  image: ImageRef;
  bioma?: string;
  /** Nome em texto livre — não precisa ser alguém da equipe cadastrada. */
  responsavel?: string;
  periodoInicio?: string;
  /** Vazio enquanto o projeto estiver em curso. */
  periodoFim?: string;
  financiador?: string;
  /** `_updatedAt` do Sanity, ISO 8601. Vira `lastmod` no sitemap. */
  updatedAt: string;
};

/** O projeto inteiro, como a rota `/projetos/[slug]` precisa dele. */
export type Project = ProjectBase & {
  /** Ver **Táxon** no CONTEXT.md: as duas formas convivem, e as duas são
   * opcionais. */
  taxonCientifico?: string;
  taxonPopular: string[];
  /** Opcional. É ele que faz a página valer por si (ADR 0005). */
  body: PortableTextBlock[];
};

/**
 * O projeto como cartão — na home e em `/projetos`.
 *
 * `variant` e `doodle` são decoração derivada da **posição na lista**, e não
 * conteúdo do CMS (ADR 0003). Por isso não estão em `Project`: numa rota por
 * slug não existe posição em lista nenhuma, e inventar uma seria decidir a cor
 * de um cartão que não é exibido.
 */
export type ProjectCard = ProjectBase & {
  doodle: string;
  variant: "c-1" | "c-2" | "c-3" | "c-4";
};

/**
 * Página institucional — a coleção herpetológica, o programa de extensão, as
 * visitas de escolas (ver **Página** no CONTEXT.md).
 *
 * É o tipo mais magro do site de propósito: título, texto e endereço. Se um
 * conteúdo precisa ser filtrado, agrupado ou relacionado, ele não é uma Página
 * — é um tipo próprio.
 */
export type SitePage = {
  slug: string;
  title: string;
  subtitle?: string;
  image: ImageRef;
  body: PortableTextBlock[];
  /** Vazio, a busca usa o começo do texto. */
  excerpt?: string;
  /** `_updatedAt` do Sanity, ISO 8601. Vira `lastmod` no sitemap. */
  updatedAt: string;
};

export type Coordinator = {
  image: ImageRef;
  caption: string;
  name: string;
  role: string;
  bio: string;
  lines: string;
};

export type Doodle = {
  glyph: string;
  position: CSSProperties;
};

export type GalleryItem = {
  variant: "pc-1" | "pc-2" | "pc-3" | "pc-4" | "pc-5" | "pc-6";
  image: ImageRef;
  caption: string;
  stamp?: string;
  doodle?: Doodle;
};

/** `value` is inline Markdown (supports links + `\n`); `note` renders small. */
export type ContactRow = {
  label: string;
  value: string;
  note?: string;
};

export type ContactInfo = {
  heading: string;
  body: string;
  rows: ContactRow[];
};

export type ContactForm = {
  heading: string;
  nameLabel: string;
  namePlaceholder: string;
  orgLabel: string;
  orgPlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  subjectLabel: string;
  subjectOptions: { value: string; label: string }[];
  messageLabel: string;
  messagePlaceholder: string;
  note: string;
  submitLabel: string;
  /** Texto do botão enquanto a Server Action está em voo. */
  sendingLabel: string;
  sentLabel: string;
  /** Confirmação exibida abaixo do formulário depois do envio. */
  sentMessage: string;
};

export type FooterColumn = { title: string; links: { label: string; href: string }[] };

export type Footer = {
  brandName: string;
  brandText: string;
  columns: FooterColumn[];
  fine: string[];
};

/** Stable keys for each section header. */
export type SectionHeadKey =
  | "news"
  | "newsArchive"
  | "projects"
  | "coordinators"
  | "gallery"
  | "contact";
