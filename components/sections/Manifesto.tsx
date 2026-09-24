import { InlineText } from "@/components/ui/RichText";
import { getManifesto } from "@/lib/content";

export async function Manifesto() {
  const manifesto = await getManifesto();

  return (
    // O espaçamento saiu de um `style` embutido para `.section--manifesto`:
    // estilo em atributo vence media query, e este bloco precisa encolher nas
    // telas menores (ADR 0004).
    <section className="section section--manifesto">
      <div className="manifesto">
        <span className="quote-mark">&ldquo;</span>
        <p>
          <InlineText>{manifesto.quote}</InlineText>
        </p>
        <div className="sig">{manifesto.sig}</div>
      </div>
    </section>
  );
}
