/**
 * Importa o conteúdo original do site para o Sanity — roda **uma vez**.
 *
 *     npx tsx --env-file=.env.local scripts/seed.ts
 *
 * A entrada é `scripts/seed-data.json`, o snapshot fiel das antigas fontes
 * locais (`lib/content/source.local.ts` e `lib/news/source.local.ts`) tirado
 * antes de elas serem removidas. Depois da migração ele continua sendo o único
 * backup do conteúdo original fora do Sanity — não apague.
 *
 * O que **não** é migrado: imagens. O site nunca teve foto de verdade, só os
 * textos de placeholder que descrevem o que entra em cada slot. Eles são
 * preservados, e os pesquisadores sobem as fotos pelo Studio depois.
 *
 * Exige `SANITY_WRITE_TOKEN` — um token temporário que deve ser revogado
 * depois (ver PENDENCIAS.md).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { createClient, type IdentifiedSanityDocumentStub } from "@sanity/client";
import { LexoRank } from "lexorank";
import { markdownToPortableText } from "./markdown-to-portable-text";

// ---------------------------------------------------------------------------
// Cliente
// ---------------------------------------------------------------------------

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_WRITE_TOKEN;

if (!projectId || !dataset || !token) {
  throw new Error(
    "Faltam variáveis de ambiente. Rode com: npx tsx --env-file=.env.local scripts/seed.ts"
  );
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2026-08-04",
  useCdn: false,
});

// ---------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------

const key = () => randomUUID().slice(0, 12);

/** Ranks iniciais para as listas arrastáveis. Mesmo formato LexoRank que o
 * plugin `@sanity/orderable-document-list` usa ao reordenar no Studio. */
function ranks(count: number): string[] {
  const out: string[] = [];
  let rank = LexoRank.min();
  for (let i = 0; i < count; i++) {
    rank = rank.genNext();
    out.push(rank.toString());
  }
  return out;
}

type ImageRefJson = { slotId: string; placeholder: string; alt: string };

/** Imagem sem asset: só o texto alternativo e a descrição do slot. O
 * `ImageSlot` continua renderizando o placeholder até alguém subir a foto. */
const image = (source: ImageRefJson) => ({
  _type: "imageWithAlt",
  alt: source.alt,
  placeholder: source.placeholder,
});

// ---------------------------------------------------------------------------
// Montagem dos documentos
// ---------------------------------------------------------------------------

type SeedData = typeof import("./seed-data.json");

// Caminho a partir da raiz do projeto — o script é feito para rodar de lá.
const data = JSON.parse(
  readFileSync(join(process.cwd(), "scripts", "seed-data.json"), "utf8")
) as SeedData;

const { content, news } = data;

const siteSettings = {
  _id: "siteSettings",
  _type: "siteSettings",
  brandName: content.nav.brandName,
  brandTag: content.nav.brandTag,
  navLinks: content.nav.links.map((link) => ({
    _type: "navLink",
    _key: key(),
    label: link.label,
    href: link.href,
    pin: "pin" in link ? Boolean(link.pin) : false,
  })),
  footerText: content.footer.brandText,
  footerColumns: content.footer.columns.map((column) => ({
    _type: "footerColumn",
    _key: key(),
    title: column.title,
    links: column.links.map((link) => ({
      _type: "link",
      _key: key(),
      label: link.label,
      href: link.href,
    })),
  })),
  footerFine: content.footer.fine,
};

const homePage = {
  _id: "homePage",
  _type: "homePage",
  hero: {
    margin: content.hero.margin,
    eyebrow: content.hero.eyebrow,
    titleLines: content.hero.titleLines,
    squiggleWord: content.hero.squiggleWord,
    lede: content.hero.lede,
    ctas: content.hero.ctas.map((cta) => ({
      _type: "link",
      _key: key(),
      label: cta.label,
      href: cta.href,
    })),
    polaroid: {
      image: image(content.hero.polaroid.image),
      caption: content.hero.polaroid.caption,
      stamp: content.hero.polaroid.stamp,
    },
  },
  stats: content.stats.map((stat) => ({
    _type: "stat",
    _key: key(),
    num: stat.num,
    lbl: stat.lbl,
  })),
  manifesto: { quote: content.manifesto.quote, sig: content.manifesto.sig },
};

const contactSection = {
  _id: "contactSection",
  _type: "contactSection",
  heading: content.contactInfo.heading,
  body: content.contactInfo.body,
  rows: content.contactInfo.rows.map((row) => ({
    _type: "contactRow",
    _key: key(),
    label: row.label,
    value: row.value,
    note: "note" in row ? row.note : undefined,
  })),
  form: {
    heading: content.contactForm.heading,
    nameLabel: content.contactForm.nameLabel,
    namePlaceholder: content.contactForm.namePlaceholder,
    orgLabel: content.contactForm.orgLabel,
    orgPlaceholder: content.contactForm.orgPlaceholder,
    emailLabel: content.contactForm.emailLabel,
    emailPlaceholder: content.contactForm.emailPlaceholder,
    subjectLabel: content.contactForm.subjectLabel,
    subjectOptions: content.contactForm.subjectOptions.map((option) => ({
      _type: "subjectOption",
      _key: key(),
      value: option.value,
      label: option.label,
    })),
    messageLabel: content.contactForm.messageLabel,
    messagePlaceholder: content.contactForm.messagePlaceholder,
    note: content.contactForm.note,
    submitLabel: content.contactForm.submitLabel,
    sentLabel: content.contactForm.sentLabel,
  },
};

const sectionHeads = Object.entries(content.sectionHeads).map(([headKey, head]) => ({
  _id: `sectionHead-${headKey}`,
  _type: "sectionHead",
  key: headKey,
  kicker: head.kicker,
  title: head.title,
  blurb: head.blurb,
}));

const projectRanks = ranks(content.projects.length);
const projects = content.projects.map((project, index) => ({
  _id: `project-${index + 1}`,
  _type: "project",
  number: project.number,
  status: project.status,
  title: project.title,
  description: project.description,
  pins: project.pins.map((pin) => ({
    _type: "pin",
    _key: key(),
    label: pin.label,
    warm: "warm" in pin ? Boolean(pin.warm) : false,
  })),
  orderRank: projectRanks[index],
}));

const coordinatorRanks = ranks(content.coordinators.length);
const coordinators = content.coordinators.map((coordinator, index) => ({
  _id: `coordinator-${index + 1}`,
  _type: "coordinator",
  name: coordinator.name,
  role: coordinator.role,
  image: image(coordinator.image),
  caption: coordinator.caption,
  bio: coordinator.bio,
  lines: coordinator.lines,
  orderRank: coordinatorRanks[index],
}));

const galleryRanks = ranks(content.galleryItems.length);
const galleryItems = content.galleryItems.map((item, index) => ({
  _id: `gallery-${index + 1}`,
  _type: "galleryItem",
  image: image(item.image),
  caption: item.caption,
  stamp: "stamp" in item ? item.stamp : undefined,
  orderRank: galleryRanks[index],
}));

const newsDocs = news.map((item) => ({
  _id: `news-${item.slug}`,
  _type: "news",
  title: item.title,
  slug: { _type: "slug", current: item.slug },
  author: item.author,
  publishedAt: item.publishedAt,
  image: image(item.image),
  body: markdownToPortableText(item.body),
}));

// ---------------------------------------------------------------------------
// Escrita
// ---------------------------------------------------------------------------

const documents: IdentifiedSanityDocumentStub[] = [
  siteSettings,
  homePage,
  contactSection,
  ...sectionHeads,
  ...projects,
  ...coordinators,
  ...galleryItems,
  ...newsDocs,
];

async function main() {
  const transaction = client.transaction();
  for (const document of documents) {
    // `createOrReplace` deixa o script repetível: rodar de novo restaura o
    // conteúdo original por cima, sem duplicar documentos.
    transaction.createOrReplace(document);
  }

  await transaction.commit();

  console.log(`✔ ${documents.length} documentos gravados em ${projectId}/${dataset}`);
  console.log(
    [
      `  singletons: 3`,
      `  cabeçalhos de seção: ${sectionHeads.length}`,
      `  projetos: ${projects.length}`,
      `  pesquisadores: ${coordinators.length}`,
      `  galeria: ${galleryItems.length}`,
      `  notícias: ${newsDocs.length}`,
    ].join("\n")
  );
  console.log("\nNenhuma imagem foi migrada (o site não tinha nenhuma). Suba as fotos pelo Studio.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
