"use client";

import { useRef, useState, type CSSProperties } from "react";
import { flushSync } from "react-dom";
import { ImageSlot } from "@/components/ui/ImageSlot";
import { usePhotoModal } from "@/components/ui/usePhotoModal";
import type { GalleryItem } from "@/lib/content/types";

/** Quantas fotos cada "ver mais" acrescenta. Múltiplo de 3 e de 2, as colunas
 * da malha no desktop e no tablet. São mais de 200 — abrir todas de uma vez
 * despejaria a página inteira de uma só vez. */
const GALLERY_STEP = 12;

/** A legenda é "Nome científico — nome popular"; sem o travessão, é só nome. */
function splitCaption(caption: string) {
  const [species, common] = caption.split(/\s+—\s+/, 2);
  return { species, common };
}

/** O carimbo é a família, às vezes com uma observação entre parênteses:
 * "Gekkonidae (ESPÉCIE EXÓTICA)". */
function splitStamp(stamp: string) {
  const match = stamp.match(/^(.*?)\s*\((.+)\)\s*$/);
  return match ? { family: match[1], note: match[2] } : { family: stamp, note: undefined };
}

/** A galeria, aberta de `GALLERY_STEP` em `GALLERY_STEP`, e o modal de cada
 * foto (ver `usePhotoModal`). */
export function GalleryList({ items }: { items: GalleryItem[] }) {
  const { active, open, close, cardRef, closeRef, dialogProps } = usePhotoModal();
  const footerRef = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(GALLERY_STEP);

  // Recolher tira de uma vez a altura de dezenas de fotos acima do botão; a
  // rolagem compensa a diferença para ele não sumir de baixo do cursor.
  const collapse = () => {
    const footer = footerRef.current;
    const before = footer?.getBoundingClientRect().top ?? 0;
    flushSync(() => setShown(GALLERY_STEP));
    if (footer) window.scrollBy(0, footer.getBoundingClientRect().top - before);
  };

  const current = active === null ? null : items[active];
  const caption = current ? splitCaption(current.caption) : null;
  const stamp = current?.stamp ? splitStamp(current.stamp) : null;

  return (
    <>
      <div className="gallery">
        {items.slice(0, shown).map((item, index) => (
          <div
            className={`poly-card ${item.variant}`}
            key={item.image.slotId}
            ref={cardRef(index)}
            data-new={index >= GALLERY_STEP || undefined}
            style={{ "--i": index % GALLERY_STEP } as CSSProperties}
          >
            {item.stamp ? <div className="stamp">{item.stamp}</div> : null}
            <div className="pic">
              <ImageSlot {...item.image} sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw" />
            </div>
            <div className="cap">{splitCaption(item.caption).species}</div>
            {item.doodle ? (
              <div className="doodle" style={item.doodle.position}>
                {item.doodle.glyph}
              </div>
            ) : null}
            {/* Cobre o card pelo `::after`, como nos profissionais. */}
            <button type="button" className="poly-trigger" onClick={() => open(index)}>
              <span className="visually-hidden">Ampliar: {item.caption}</span>
            </button>
          </div>
        ))}
      </div>

      {items.length > GALLERY_STEP ? (
        <div className="news-footer gallery-footer" ref={footerRef}>
          <span className="gallery-count">
            {Math.min(shown, items.length)} de {items.length}
          </span>
          {shown > GALLERY_STEP ? (
            <button type="button" className="btn ghost" onClick={collapse}>
              ver menos ↑
            </button>
          ) : null}
          {shown < items.length ? (
            <button type="button" className="btn ghost" onClick={() => setShown((n) => n + GALLERY_STEP)}>
              ver mais ↓
            </button>
          ) : null}
        </div>
      ) : null}

      <dialog {...dialogProps} className="photo-modal gallery-modal" aria-labelledby="gallery-modal-name">
        {current && caption ? (
          <div className="photo-modal-body">
            <div className="poly-card photo-modal-photo">
              {current.stamp ? <div className="stamp">{current.stamp}</div> : null}
              <div
                className="pic"
                style={
                  current.image.width && current.image.height
                    ? { aspectRatio: `${current.image.width} / ${current.image.height}` }
                    : undefined
                }
              >
                <ImageSlot {...current.image} sizes="(max-width: 768px) 90vw, 480px" />
              </div>
              <div className="cap">{caption.species}</div>
            </div>
            <article className="specimen-tag">
              <div className="specimen-tag-top">
                <span>LEAR · Galeria</span>
                <span>Registro nº {String(active! + 1).padStart(3, "0")}</span>
              </div>
              <dl>
                <dt>{caption.common ? "Espécie" : "Registro"}</dt>
                <dd className="specimen-tag-name" id="gallery-modal-name">
                  {caption.species}
                </dd>
                {caption.common ? (
                  <>
                    <dt>Nome popular</dt>
                    <dd>{caption.common}</dd>
                  </>
                ) : null}
                {stamp ? (
                  <>
                    <dt>Família</dt>
                    <dd>{stamp.family}</dd>
                  </>
                ) : null}
                {stamp?.note ? (
                  <>
                    <dt>Nota</dt>
                    <dd className="specimen-tag-role">{stamp.note}</dd>
                  </>
                ) : null}
              </dl>
            </article>
            <button ref={closeRef} type="button" className="photo-modal-close" onClick={close} aria-label="Fechar">
              ×
            </button>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
