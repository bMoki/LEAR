import { SectionHead } from "./SectionHead";
import { ContactForm } from "./ContactForm";
import { InlineText } from "@/components/ui/RichText";
import { getContactForm, getContactInfo, getSectionHead } from "@/lib/content";

export async function Contact() {
  const [head, info, form] = await Promise.all([
    getSectionHead("contact"),
    getContactInfo(),
    getContactForm(),
  ]);

  return (
    <section className="section" id="contato">
      <SectionHead kicker={head.kicker} title={head.title} blurb={head.blurb} />

      <div className="contact-wrap">
        <div className="contact-info">
          <h3>
            <InlineText>{info.heading}</InlineText>
          </h3>
          <p>{info.body}</p>

          <div className="contact-rows">
            {info.rows.map((row) => (
              <div className="contact-row" key={row.label}>
                <div className="contact-label">{row.label}</div>
                <div className="contact-value">
                  <InlineText>{row.value}</InlineText>
                  {row.note ? <span className="small">{row.note}</span> : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        <ContactForm content={form} />
      </div>
    </section>
  );
}
