import { SectionHead } from "./SectionHead";
import { InlineText } from "@/components/ui/RichText";
import { getProjects, getSectionHead } from "@/lib/content";

export async function Projects() {
  const [head, projects] = await Promise.all([getSectionHead("projects"), getProjects()]);

  return (
    <section className="section" id="projetos">
      <SectionHead kicker={head.kicker} title={head.title} blurb={head.blurb} />

      <div className="projects">
        {projects.map((p) => (
          <article className={`card ${p.variant}`} key={p.number}>
            <div className="corner-doodle">{p.doodle}</div>
            <div className="num">
              <span>{p.number}</span>
              <span className="right">{p.status}</span>
            </div>
            <h3>
              <InlineText>{p.title}</InlineText>
            </h3>
            <p className="desc">{p.description}</p>
            <div className="pin-row">
              {p.pins.map((pin) => (
                <span key={pin.label} className={`pin${pin.warm ? " warm" : ""}`}>
                  {pin.label}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
