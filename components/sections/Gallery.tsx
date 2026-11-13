import { SectionHead } from "./SectionHead";
import { GalleryList } from "./GalleryList";
import { getGallery, getSectionHead } from "@/lib/content";

export async function Gallery() {
  const [head, galleryItems] = await Promise.all([getSectionHead("gallery"), getGallery()]);

  return (
    <section className="section" id="galeria">
      <SectionHead kicker={head.kicker} title={head.title} blurb={head.blurb} />
      <GalleryList items={galleryItems} />
    </section>
  );
}
