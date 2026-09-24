import { InlineText } from "@/components/ui/RichText";

/**
 * Shared header used by every numbered section. Keeps the three-column
 * kicker / title / blurb layout consistent across the page. `title` is inline
 * Markdown (`*emphasis*`, `\n` line breaks) coming from the content layer.
 *
 * `as` existe por causa da hierarquia de títulos: na home cada seção é um
 * `<h2>` sob o `<h1>` do Hero, e esse é o padrão. Numa rota onde a seção **é**
 * a página — `/noticias`, `/projetos` — ela precisa ser o `<h1>`, senão a
 * página inteira começa no nível 2 e não declara assunto nenhum (ADR 0005).
 */
type Props = {
  kicker: string;
  title: string;
  blurb: string;
  as?: "h1" | "h2";
};

export function SectionHead({ kicker, title, blurb, as: Heading = "h2" }: Props) {
  return (
    <div className="section-head">
      <div>
        <div className="section-kicker">{kicker}</div>
        <Heading>
          <InlineText>{title}</InlineText>
        </Heading>
      </div>
      <div />
      <div className="blurb">{blurb}</div>
    </div>
  );
}
