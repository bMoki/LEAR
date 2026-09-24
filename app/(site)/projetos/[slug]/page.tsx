import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/sections/Footer";
import { ProjectArticle } from "@/components/projects/ProjectArticle";
import { JsonLd } from "@/components/seo/JsonLd";
import { getProjectBySlug, getProjects } from "@/lib/content";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, projectJsonLd } from "@/lib/seo/json-ld";
import { stripInlineMarkdown } from "@/lib/seo/text";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) return {};

  return buildMetadata({
    title: project.title,
    path: `/projetos/${project.slug}`,
    // A descrição do projeto é um parágrafo escrito para ser lido — serve de
    // resumo sem ninguém preencher campo nenhum. O corpo entra como reserva
    // para quando alguém escrever mais do que cabe nela.
    description: project.description,
    body: project.body,
  });
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) notFound();

  return (
    <div className="page">
      <JsonLd data={projectJsonLd(project)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Projetos", path: "/projetos" },
          { name: stripInlineMarkdown(project.title), path: `/projetos/${project.slug}` },
        ])}
      />
      <section className="section">
        <ProjectArticle project={project} />
      </section>
      <Footer />
    </div>
  );
}
