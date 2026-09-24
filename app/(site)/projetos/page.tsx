import type { Metadata } from "next";
import { Footer } from "@/components/sections/Footer";
import { SectionHead } from "@/components/sections/SectionHead";
import { ProjectCard } from "@/components/sections/ProjectCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { getProjects, getSectionHead } from "@/lib/content";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";

/**
 * O índice dos projetos. Reaproveita o cabeçalho “§ 02 · pesquisas” que a home
 * já usa — é a mesma seção, agora com endereço próprio, e ninguém precisa
 * manter dois textos iguais no Studio.
 */
export async function generateMetadata(): Promise<Metadata> {
  const head = await getSectionHead("projects");

  return buildMetadata({
    title: head.title,
    path: "/projetos",
    description: head.blurb,
  });
}

export default async function ProjetosPage() {
  const [head, projects] = await Promise.all([getSectionHead("projects"), getProjects()]);

  return (
    <div className="page">
      <JsonLd data={breadcrumbJsonLd([{ name: "Projetos", path: "/projetos" }])} />
      <section className="section">
        <SectionHead as="h1" kicker={head.kicker} title={head.title} blurb={head.blurb} />
        <div className="projects">
          {projects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
}
