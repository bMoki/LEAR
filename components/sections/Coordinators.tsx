import { SectionHead } from "./SectionHead";
import { CoordinatorList } from "./CoordinatorList";
import { getCoordinators, getSectionHead } from "@/lib/content";

export async function Coordinators() {
  const [head, coordinators] = await Promise.all([
    getSectionHead("coordinators"),
    getCoordinators(),
  ]);

  return (
    <section className="section" id="coords">
      <SectionHead kicker={head.kicker} title={head.title} blurb={head.blurb} />
      <CoordinatorList coordinators={coordinators} />
    </section>
  );
}
