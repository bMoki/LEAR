import { InlineText } from "@/components/ui/RichText";
import { getManifesto } from "@/lib/content";

export async function Manifesto() {
  const manifesto = await getManifesto();

  return (
    <section className="section" style={{ paddingTop: 80 }}>
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
