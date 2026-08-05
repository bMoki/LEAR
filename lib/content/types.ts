import type { CSSProperties } from "react";

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

export type Project = {
  number: string;
  status: string;
  title: string;
  description: string;
  doodle: string;
  pins: { label: string; warm?: boolean }[];
  variant: "c-1" | "c-2" | "c-3" | "c-4";
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
  sentLabel: string;
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
