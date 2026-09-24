import { cache } from "react";
import type { PortableTextBlock } from "@portabletext/types";
import { sanityFetch } from "@/lib/sanity/client";
import { toImageRef } from "@/lib/sanity/image";
import { safeHref } from "./href";
import {
  coordinatorsQuery,
  contactSectionQuery,
  galleryQuery,
  homePageQuery,
  pageBySlugQuery,
  pagesQuery,
  projectBySlugQuery,
  projectsQuery,
  sectionHeadsQuery,
  siteSettingsQuery,
  siteUpdatedAtQuery,
} from "@/lib/sanity/queries";
import { TAGS } from "@/lib/sanity/tags";
import type {
  ContactSectionQueryResult,
  CoordinatorsQueryResult,
  GalleryQueryResult,
  HomePageQueryResult,
  PageBySlugQueryResult,
  PagesQueryResult,
  ProjectBySlugQueryResult,
  ProjectsQueryResult,
  SectionHeadsQueryResult,
  SiteSettingsQueryResult,
  SiteUpdatedAtQueryResult,
} from "@/sanity/types.generated";
import type {
  ContactForm,
  ContactInfo,
  Coordinator,
  Doodle,
  Footer,
  GalleryItem,
  Hero,
  Manifesto,
  Nav,
  Project,
  ProjectCard,
  SectionHeadContent,
  SectionHeadKey,
  SitePage,
  Stat,
} from "./types";

/**
 * Fonte CMS (Sanity). Implementa a mesma API assíncrona que `index.ts` expõe —
 * os componentes não sabem que ela existe. Ver ADR 0002 (Etapa 2) e
 * `docs/plano-cms-headless.md`.
 *
 * Duas responsabilidades além de buscar dados:
 *
 * 1. **Achatar a nulabilidade.** O typegen marca todo campo como opcional
 *    (a obrigatoriedade vive na validação do Studio, não no schema extraído),
 *    então aqui tudo vira string. Campo vazio aparece vazio na página — é
 *    visível na revisão, e melhor do que derrubar o site inteiro.
 * 2. **Derivar a decoração** que não vai para o CMS: `variant` e `doodle`.
 *    Ver §6 do plano.
 */

const str = (value: string | null | undefined): string => value ?? "";

/** Documento único ausente é erro de configuração, não conteúdo vazio: sem ele
 * a seção não tem o que renderizar, e falhar nomeando o documento é mais útil
 * do que uma página em branco. */
function requireDoc<T>(value: T | null, name: string): T {
  if (value == null) {
    throw new Error(
      `Documento “${name}” não encontrado no Sanity. ` +
        `Crie-o no Studio (/studio) ou rode a importação: ` +
        `npx tsx --env-file=.env.local scripts/wp/import.ts`
    );
  }
  return value;
}

// ---------------------------------------------------------------------------
// Decoração derivada da posição na lista (não editável no CMS — ver §6)
// ---------------------------------------------------------------------------

const PROJECT_VARIANTS = ["c-1", "c-2", "c-3", "c-4"] as const;
const PROJECT_DOODLES = ["✱", "↗", "◯", "✷"];

const GALLERY_VARIANTS = ["pc-1", "pc-2", "pc-3", "pc-4", "pc-5", "pc-6"] as const;

/** Os rabiscos aparecem só em alguns cartões, sempre nas mesmas posições — é o
 * ritmo visual do design, não um dado do conteúdo. */
const GALLERY_DOODLES: (Doodle | undefined)[] = [
  undefined,
  { glyph: "↗", position: { top: "-18px", right: "18px", transform: "rotate(20deg)" } },
  undefined,
  {
    glyph: "✱",
    position: { bottom: "64px", left: "-14px", transform: "rotate(-15deg)", color: "#fff" },
  },
  undefined,
  { glyph: "✷", position: { top: "-16px", left: "18px", transform: "rotate(-20deg)" } },
];

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

async function fetchSiteSettings() {
  const data = await sanityFetch<SiteSettingsQueryResult>({
    query: siteSettingsQuery,
    tags: [TAGS.siteSettings],
  });
  return requireDoc(data, "Configurações do site");
}

export async function getNav(): Promise<Nav> {
  const settings = await fetchSiteSettings();
  return {
    brandName: str(settings.brandName),
    brandTag: str(settings.brandTag),
    links: (settings.navLinks ?? []).map((link) => ({
      label: str(link.label),
      href: safeHref(link.href),
      pin: link.pin ?? undefined,
    })),
  };
}

export async function getFooter(): Promise<Footer> {
  const settings = await fetchSiteSettings();
  return {
    brandName: str(settings.brandName),
    brandText: str(settings.footerText),
    columns: (settings.footerColumns ?? []).map((column) => ({
      title: str(column.title),
      links: (column.links ?? []).map((link) => ({
        label: str(link.label),
        href: safeHref(link.href),
      })),
    })),
    fine: settings.footerFine ?? [],
  };
}

async function fetchHomePage() {
  const data = await sanityFetch<HomePageQueryResult>({
    query: homePageQuery,
    tags: [TAGS.homePage],
  });
  return requireDoc(data, "Página inicial");
}

export async function getHero(): Promise<Hero> {
  const { hero } = await fetchHomePage();
  return {
    margin: str(hero?.margin),
    eyebrow: str(hero?.eyebrow),
    titleLines: hero?.titleLines ?? [],
    squiggleWord: str(hero?.squiggleWord),
    lede: str(hero?.lede),
    ctas: (hero?.ctas ?? []).map((cta) => ({
      label: str(cta.label),
      href: safeHref(cta.href),
    })),
    polaroid: {
      image: toImageRef(hero?.polaroid?.image ?? null, "hero-pic"),
      caption: str(hero?.polaroid?.caption),
      stamp: hero?.polaroid?.stamp ?? undefined,
    },
  };
}

export async function getStats(): Promise<Stat[]> {
  const { stats } = await fetchHomePage();
  return (stats ?? []).map((stat) => ({ num: str(stat.num), lbl: str(stat.lbl) }));
}

export async function getManifesto(): Promise<Manifesto> {
  const { manifesto } = await fetchHomePage();
  return { quote: str(manifesto?.quote), sig: str(manifesto?.sig) };
}

/** Memoizada porque `/noticias` lê o cabeçalho duas vezes: uma no
 * `generateMetadata`, que deriva dele o título e a descrição da rota, e outra
 * na própria página. Vale por requisição. */
const fetchSectionHeads = cache(async () =>
  sanityFetch<SectionHeadsQueryResult>({
    query: sectionHeadsQuery,
    tags: [TAGS.sectionHead],
  })
);

export async function getSectionHead(key: SectionHeadKey): Promise<SectionHeadContent> {
  const heads = await fetchSectionHeads();

  const head = heads.find((candidate) => candidate.key === key);
  if (!head) {
    throw new Error(
      `Cabeçalho da seção “${key}” não encontrado no Sanity. ` +
        `Crie-o em /studio → Cabeçalhos de seção.`
    );
  }

  return { kicker: str(head.kicker), title: str(head.title), blurb: str(head.blurb) };
}

export async function getProjects(): Promise<ProjectCard[]> {
  const projects = await sanityFetch<ProjectsQueryResult>({
    query: projectsQuery,
    tags: [TAGS.project],
  });

  return projects.map((project, index) => ({
    slug: str(project.slug),
    number: str(project.number),
    status: str(project.status),
    title: str(project.title),
    description: str(project.description),
    image: toImageRef(project.image ?? null, project._id),
    bioma: project.bioma ?? undefined,
    responsavel: project.responsavel ?? undefined,
    periodoInicio: project.periodoInicio ?? undefined,
    periodoFim: project.periodoFim ?? undefined,
    financiador: project.financiador ?? undefined,
    updatedAt: project._updatedAt,
    doodle: PROJECT_DOODLES[index % PROJECT_DOODLES.length],
    variant: PROJECT_VARIANTS[index % PROJECT_VARIANTS.length],
  }));
}

/** Memoizada: a rota `/projetos/[slug]` lê o mesmo projeto em
 * `generateMetadata`, na página e no card social. */
export const getProjectBySlug = cache(async (slug: string): Promise<Project | null> => {
  const project = await sanityFetch<ProjectBySlugQueryResult, { slug: string }>({
    query: projectBySlugQuery,
    params: { slug },
    tags: [TAGS.project],
  });

  if (!project) return null;

  return {
    slug: str(project.slug),
    number: str(project.number),
    status: str(project.status),
    title: str(project.title),
    description: str(project.description),
    image: toImageRef(project.image ?? null, project._id),
    bioma: project.bioma ?? undefined,
    taxonCientifico: project.taxonCientifico ?? undefined,
    taxonPopular: project.taxonPopular ?? [],
    responsavel: project.responsavel ?? undefined,
    periodoInicio: project.periodoInicio ?? undefined,
    periodoFim: project.periodoFim ?? undefined,
    financiador: project.financiador ?? undefined,
    body: (project.body ?? []) as PortableTextBlock[],
    updatedAt: project._updatedAt,
  };
});

/**
 * As páginas institucionais, para o índice e o sitemap. Sem o corpo — é o campo
 * mais pesado do documento e nenhuma lista o usa.
 */
export async function getPages(): Promise<Omit<SitePage, "body" | "image">[]> {
  const pages = await sanityFetch<PagesQueryResult>({
    query: pagesQuery,
    tags: [TAGS.page],
  });

  return pages.map((page) => ({
    slug: str(page.slug),
    title: str(page.title),
    subtitle: page.subtitle ?? undefined,
    excerpt: page.excerpt ?? undefined,
    updatedAt: page._updatedAt,
  }));
}

/** Memoizada pelo mesmo motivo de `getProjectBySlug`: a rota lê a página em
 * `generateMetadata` e de novo no corpo. */
export const getPageBySlug = cache(async (slug: string): Promise<SitePage | null> => {
  const page = await sanityFetch<PageBySlugQueryResult, { slug: string }>({
    query: pageBySlugQuery,
    params: { slug },
    tags: [TAGS.page],
  });

  if (!page) return null;

  return {
    slug: str(page.slug),
    title: str(page.title),
    subtitle: page.subtitle ?? undefined,
    image: toImageRef(page.image ?? null, page._id),
    body: (page.body ?? []) as PortableTextBlock[],
    excerpt: page.excerpt ?? undefined,
    updatedAt: page._updatedAt,
  };
});

export async function getCoordinators(): Promise<Coordinator[]> {
  const coordinators = await sanityFetch<CoordinatorsQueryResult>({
    query: coordinatorsQuery,
    tags: [TAGS.coordinator],
  });

  return coordinators.map((coordinator) => ({
    image: toImageRef(coordinator.image ?? null, coordinator._id),
    caption: str(coordinator.caption),
    name: str(coordinator.name),
    role: str(coordinator.role),
    bio: str(coordinator.bio),
    lines: str(coordinator.lines),
  }));
}

export async function getGallery(): Promise<GalleryItem[]> {
  const items = await sanityFetch<GalleryQueryResult>({
    query: galleryQuery,
    tags: [TAGS.galleryItem],
  });

  return items.map((item, index) => ({
    variant: GALLERY_VARIANTS[index % GALLERY_VARIANTS.length],
    image: toImageRef(item.image ?? null, item._id),
    caption: str(item.caption),
    stamp: item.stamp ?? undefined,
    doodle: GALLERY_DOODLES[index % GALLERY_DOODLES.length],
  }));
}

/**
 * Data da edição mais recente de qualquer conteúdo da home — o `lastmod` de
 * `/` no sitemap. Declara **todas** as tags porque lê todos os tipos: assim o
 * webhook de revalidação atualiza o sitemap junto com a página que mudou, sem
 * código novo.
 */
export async function getSiteLastModified(): Promise<Date | undefined> {
  const updatedAt = await sanityFetch<SiteUpdatedAtQueryResult>({
    query: siteUpdatedAtQuery,
    tags: Object.values(TAGS),
  });
  return updatedAt ? new Date(updatedAt) : undefined;
}

async function fetchContactSection() {
  const data = await sanityFetch<ContactSectionQueryResult>({
    query: contactSectionQuery,
    tags: [TAGS.contactSection],
  });
  return requireDoc(data, "Contato");
}

export async function getContactInfo(): Promise<ContactInfo> {
  const contact = await fetchContactSection();
  return {
    heading: str(contact.heading),
    body: str(contact.body),
    rows: (contact.rows ?? []).map((row) => ({
      label: str(row.label),
      value: str(row.value),
      note: row.note ?? undefined,
    })),
  };
}

export async function getContactForm(): Promise<ContactForm> {
  const { form } = await fetchContactSection();
  return {
    heading: str(form?.heading),
    nameLabel: str(form?.nameLabel),
    namePlaceholder: str(form?.namePlaceholder),
    orgLabel: str(form?.orgLabel),
    orgPlaceholder: str(form?.orgPlaceholder),
    emailLabel: str(form?.emailLabel),
    emailPlaceholder: str(form?.emailPlaceholder),
    subjectLabel: str(form?.subjectLabel),
    subjectOptions: (form?.subjectOptions ?? []).map((option) => ({
      value: str(option.value),
      label: str(option.label),
    })),
    messageLabel: str(form?.messageLabel),
    messagePlaceholder: str(form?.messagePlaceholder),
    note: str(form?.note),
    submitLabel: str(form?.submitLabel),
    // Rótulos do envio: chegaram depois que o documento já existia no Sanity,
    // então caem num padrão em vez de renderizar vazio. Assim que alguém
    // preencher no Studio, o valor do CMS manda.
    sendingLabel: form?.sendingLabel || "Enviando…",
    sentLabel: str(form?.sentLabel),
    sentMessage: form?.sentMessage || "Mensagem enviada. Obrigado!",
  };
}
