import { Polaroid } from "@/components/ui/Polaroid";
import { SectionHead } from "./SectionHead";
import { getCoordinators, getSectionHead } from "@/lib/content";

export async function Coordinators() {
  const [head, coordinators] = await Promise.all([
    getSectionHead("coordinators"),
    getCoordinators(),
  ]);

  return (
    <section className="section" id="coords">
      <SectionHead kicker={head.kicker} title={head.title} blurb={head.blurb} />

      <div className="coords">
        {coordinators.map((c) => (
          <article className="coord" key={c.image.slotId}>
            <Polaroid className="coord-polaroid" image={c.image} caption={c.caption} />
            <h3 className="coord-name">{c.name}</h3>
            <div className="coord-role">{c.role}</div>
            <p className="coord-bio">{c.bio}</p>
            <div className="coord-foot">
              <strong>Linhas:</strong> {c.lines}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
