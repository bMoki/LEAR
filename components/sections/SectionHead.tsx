import { InlineText } from "@/components/ui/RichText";

/**
 * Shared header used by every numbered section. Keeps the three-column
 * kicker / title / blurb layout consistent across the page. `title` is inline
 * Markdown (`*emphasis*`, `\n` line breaks) coming from the content layer.
 */
type Props = {
  kicker: string;
  title: string;
  blurb: string;
};

export function SectionHead({ kicker, title, blurb }: Props) {
  return (
    <div className="section-head">
      <div>
        <div className="section-kicker">{kicker}</div>
        <h2>
          <InlineText>{title}</InlineText>
        </h2>
      </div>
      <div />
      <div className="blurb">{blurb}</div>
    </div>
  );
}
