import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageArticle } from "@/components/pages/PageArticle";
import { Footer } from "@/components/sections/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { getPageBySlug, getPages } from "@/lib/content";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { buildMetadata } from "@/lib/seo/metadata";

/**
 * Rota das Páginas institucionais — `/colecao-herpetologica`,
 * `/herpeto-sem-fronteiras`, `/visitas`.
 *
 * Fica na **raiz** de propósito. Um prefixo (`/paginas/…`) só teria valor se
 * agrupasse coisas que se parecem, e estas não se parecem entre si: a coleção
 * herpetológica, o programa de extensão e as visitas de escolas não formam uma
 * categoria. Na raiz, cada uma tem o endereço mais curto e mais legível
 * possível, que é o que o ADR 0005 pede.
 *
 * O segmento dinâmico não conflita com `/noticias` nem com `/projetos`: o Next
 * resolve segmento estático antes de dinâmico. Ainda assim, `generateStaticParams`
 * lista só os slugs que existem no CMS, e qualquer outro cai em `notFound()` —
 * um catch-all na raiz que responde 200 para tudo transformaria erro de digitação
 * em página fantasma indexável.
 */

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const pages = await getPages();
  return pages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageBySlug(slug);

  if (!page) return {};

  return buildMetadata({
    title: page.title,
    path: `/${page.slug}`,
    description: page.excerpt ?? page.subtitle,
    body: page.body,
  });
}

export default async function InstitutionalPage({ params }: Props) {
  const { slug } = await params;
  const page = await getPageBySlug(slug);

  if (!page) notFound();

  return (
    <div className="page">
      <JsonLd data={breadcrumbJsonLd([{ name: page.title, path: `/${page.slug}` }])} />
      <section className="section">
        <PageArticle page={page} />
      </section>
      <Footer />
    </div>
  );
}
