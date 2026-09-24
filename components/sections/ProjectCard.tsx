import Link from "next/link";
import { InlineText } from "@/components/ui/RichText";
import { projectPins } from "@/lib/content/project";
import type { ProjectCard as ProjectCardContent } from "@/lib/content/types";

/**
 * O cartão de papel de um projeto — na home e em `/projetos`.
 *
 * O cartão inteiro é link para `/projetos/<slug>`: antes ele era um beco sem
 * saída, e o projeto só existia dentro da landing (ADR 0005).
 *
 * As etiquetas do rodapé eram um array digitado à mão no CMS; agora saem dos
 * campos tipados, por `projectPins`. O desenho é o mesmo — o que mudou é que
 * bioma, responsável, período e financiador passaram a ser dados consultáveis
 * em vez de quatro textos numa ordem combinada.
 */
export function ProjectCard({ project }: { project: ProjectCardContent }) {
  return (
    <Link href={`/projetos/${project.slug}`} className={`card ${project.variant}`}>
      <div className="corner-doodle">{project.doodle}</div>
      <div className="num">
        <span>{project.number}</span>
        <span className="right">{project.status}</span>
      </div>
      <h3>
        <InlineText>{project.title}</InlineText>
      </h3>
      <p className="desc">{project.description}</p>
      <div className="pin-row">
        {projectPins(project).map((pin) => (
          <span key={pin.label} className={`pin${pin.warm ? " warm" : ""}`}>
            {pin.label}
          </span>
        ))}
      </div>
    </Link>
  );
}
