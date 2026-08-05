import { Hero } from "@/components/sections/Hero";
import { Stats } from "@/components/sections/Stats";
import { Manifesto } from "@/components/sections/Manifesto";
import { News } from "@/components/sections/News";
import { Projects } from "@/components/sections/Projects";
import { Coordinators } from "@/components/sections/Coordinators";
import { Gallery } from "@/components/sections/Gallery";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/sections/Footer";

export default function LandingPage() {
  return (
    <div className="page">
      <Hero />
      <Stats />
      <Manifesto />
      <News />
      <Projects />
      <Coordinators />
      <Gallery />
      <Contact />
      <Footer />
    </div>
  );
}
