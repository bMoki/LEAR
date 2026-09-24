import Link from "next/link";
import { SectionHead } from "./SectionHead";
import { ProjectCard } from "./ProjectCard";
import { getProjects, getSectionHead } from "@/lib/content";

export async function Projects() {
  const [head, projects] = await Promise.all([getSectionHead("projects"), getProjects()]);

  return (
    <section className="section" id="projetos">
      <SectionHead kicker={head.kicker} title={head.title} blurb={head.blurb} />

      <div className="projects">
        {projects.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>

      {/* Mesma saída que a seção de notícias já tinha. Sem ela `/projetos`
          ficaria órfã: nada na home apontaria para o índice, e página que
          ninguém linka é página mal rastreada. */}
      <div className="news-footer">
        <Link href="/projetos" className="btn ghost">
          ver todos →
        </Link>
      </div>
    </section>
  );
}
