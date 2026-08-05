import { ImageSlot } from "@/components/ui/ImageSlot";
import { SectionHead } from "./SectionHead";
import { getGallery, getSectionHead } from "@/lib/content";

export async function Gallery() {
  const [head, galleryItems] = await Promise.all([getSectionHead("gallery"), getGallery()]);

  return (
    <section className="section" id="galeria">
      <SectionHead kicker={head.kicker} title={head.title} blurb={head.blurb} />

      <div className="gallery">
        {galleryItems.map((item) => (
          <div className={`poly-card ${item.variant}`} key={item.image.slotId}>
            {item.stamp ? <div className="stamp">{item.stamp}</div> : null}
            <div className="pic">
              <ImageSlot {...item.image} />
            </div>
            <div className="cap">{item.caption}</div>
            {item.doodle ? (
              <div className="doodle" style={item.doodle.position}>
                {item.doodle.glyph}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
