import { ImageSlot } from "@/components/ui/ImageSlot";
import { PortableBody } from "@/components/ui/PortableBody";
import { InlineText } from "@/components/ui/RichText";
import { projectPeriod } from "@/lib/content/project";
import type { Project } from "@/lib/content/types";

/**
 * A página de um Projeto.
 *
 * Três camadas, da mais garantida à mais opcional: a abertura (numeração,
 * situação, título e descrição, que todo projeto tem), a **ficha** de campos
 * tipados, e o corpo em texto longo — que quase sempre estará vazio no começo.
 *
 * A ficha é o que dá substância à página sem exigir ninguém escrever: táxon,
 * bioma, período e financiador são texto único e servem consulta de cauda longa
 * ("projeto lagarto inselberg São Francisco"). É também o teto declarado no
 * ADR 0005 — sem o corpo preenchido, isto é uma tabela de fatos, e o critério
 * de reversão está registrado lá.
 */

type Fact = { label: string; value: string };

function facts(project: Project): Fact[] {
  const taxon = [project.taxonCientifico, project.taxonPopular.join(", ")]
    .filter(Boolean)
    .join(" · ");

  return [
    { label: "Bioma", value: project.bioma },
    { label: "Táxon", value: taxon },
    { label: "Responsável", value: project.responsavel },
    { label: "Período", value: projectPeriod(project) },
    { label: "Financiador", value: project.financiador },
    { label: "Situação", value: project.status },
  ].filter((fact): fact is Fact => Boolean(fact.value));
}

export function ProjectArticle({ project }: { project: Project }) {
  const rows = facts(project);

  return (
    <article className="project-article">
      <header className="project-article-header">
        <div className="project-article-kicker">{project.number}</div>
        <h1 className="project-article-title">
          <InlineText>{project.title}</InlineText>
        </h1>
        <p className="project-article-lede">{project.description}</p>
      </header>

      <div className="project-article-img">
        <ImageSlot {...project.image} sizes="(max-width: 768px) 100vw, 720px" />
      </div>

      {rows.length > 0 ? (
        <dl className="project-facts">
          {rows.map((fact) => (
            // `<div>` entre `<dl>` e `<dt>` é HTML válido e é o que mantém
            // rótulo e valor juntos numa linha da malha.
            <div className="project-fact" key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {project.body.length > 0 ? (
        <div className="article-body">
          <PortableBody value={project.body} />
        </div>
      ) : null}
    </article>
  );
}
