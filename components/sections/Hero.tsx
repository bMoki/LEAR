import { Fragment } from "react";
import { Polaroid } from "@/components/ui/Polaroid";
import { InlineText } from "@/components/ui/RichText";
import { getHero } from "@/lib/content";

export async function Hero() {
  const hero = await getHero();

  return (
    <section className="hero" id="hero">
      <div className="hero-margin">{hero.margin}</div>

      <div>
        <div className="hero-eyebrow">{hero.eyebrow}</div>
        <h1>
          {hero.titleLines.map((line, i) => (
            <Fragment key={i}>
              <InlineText>{line}</InlineText>
              <br />
            </Fragment>
          ))}
          <span className="squiggle">{hero.squiggleWord}</span>
        </h1>
        <p className="hero-lede">
          <InlineText>{hero.lede}</InlineText>
        </p>
        <div className="hero-cta">
          {hero.ctas.map((cta, i) => (
            <a key={cta.href} href={cta.href} className={i === 0 ? "btn" : "btn ghost"}>
              {cta.label}
            </a>
          ))}
        </div>
      </div>

      <Polaroid
        className="hero-polaroid"
        image={hero.polaroid.image}
        caption={hero.polaroid.caption}
        stamp={hero.polaroid.stamp}
      />
    </section>
  );
}
