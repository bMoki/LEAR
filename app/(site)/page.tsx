import type { Metadata } from "next";
import { Hero } from "@/components/sections/Hero";
import { Stats } from "@/components/sections/Stats";
import { Manifesto } from "@/components/sections/Manifesto";
import { News } from "@/components/sections/News";
import { Projects } from "@/components/sections/Projects";
import { Coordinators } from "@/components/sections/Coordinators";
import { Gallery } from "@/components/sections/Gallery";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/sections/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildMetadata } from "@/lib/seo/metadata";
import { organizationJsonLd } from "@/lib/seo/json-ld";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/seo/site";

/**
 * Título e descrição da home. Estavam no layout raiz, que o Studio compartilha
 * — e o título da home não é o título do painel de edição (ADR 0005).
 *
 * `absoluteTitle` ignora o sufixo `· LEAR` do template: esta página **é** a
 * marca, e o nome por extenso é a consulta institucional que vale perseguir.
 */
export const metadata: Metadata = buildMetadata({
  title: SITE_TITLE,
  path: "/",
  description: SITE_DESCRIPTION,
  absoluteTitle: true,
});

export default function LandingPage() {
  return (
    <div className="page">
      {/* A home é a página do laboratório como entidade — é aqui que o
          `Organization` mora, e em nenhuma outra rota. */}
      <JsonLd data={organizationJsonLd()} />
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
