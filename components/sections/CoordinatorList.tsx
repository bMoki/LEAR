"use client";

import { Polaroid } from "@/components/ui/Polaroid";
import { Expandable } from "@/components/ui/Expandable";
import { usePhotoModal } from "@/components/ui/usePhotoModal";
import type { Coordinator } from "@/lib/content/types";

/** Quantos aparecem antes do "ver todos". Múltiplo de 3 e de 2, as colunas da
 * malha no desktop e no tablet. */
const VISIBLE_COORDINATORS = 6;

/** A malha de profissionais e o modal com a bio inteira (ver `usePhotoModal`). */
export function CoordinatorList({ coordinators }: { coordinators: Coordinator[] }) {
  const { active, open, close, cardRef, closeRef, dialogProps } = usePhotoModal(".coord-polaroid");

  const card = (c: Coordinator, index: number) => (
    <article className="coord" key={c.image.slotId} ref={cardRef(index)}>
      <Polaroid className="coord-polaroid" image={c.image} caption={c.caption} />
      <h3 className="coord-name">
        {/* O `::after` do botão cobre o card inteiro: o card todo é clicável,
            e o leitor de tela ouve um botão com o nome, não um card mudo. */}
        <button type="button" className="coord-trigger" onClick={() => open(index)}>
          {c.name}
        </button>
      </h3>
      <div className="coord-role">{c.role}</div>
      <p className="coord-bio clamp" data-overflow>
        {c.bio}
      </p>
    </article>
  );

  const current = active === null ? null : coordinators[active];

  return (
    <>
      <div className="coords">{coordinators.slice(0, VISIBLE_COORDINATORS).map(card)}</div>

      {coordinators.length > VISIBLE_COORDINATORS ? (
        <Expandable>
          <div className="coords">
            {coordinators.slice(VISIBLE_COORDINATORS).map((c, i) => card(c, i + VISIBLE_COORDINATORS))}
          </div>
        </Expandable>
      ) : null}

      <dialog {...dialogProps} aria-labelledby="coord-modal-name">
        {current ? (
          <div className="photo-modal-body">
            <Polaroid className="coord-polaroid photo-modal-photo" image={current.image} caption={current.caption} />
            <article className="specimen-tag">
              <div className="specimen-tag-top">
                <span>LEAR · UFSC</span>
                <span>Equipe · nº {String(active! + 1).padStart(2, "0")}</span>
              </div>
              <dl>
                <dt>Nome</dt>
                <dd className="specimen-tag-name" id="coord-modal-name">
                  {current.name}
                </dd>
                <dt>Função</dt>
                <dd className="specimen-tag-role">{current.role}</dd>
                {current.lines ? (
                  <>
                    <dt>Linhas</dt>
                    <dd>{current.lines}</dd>
                  </>
                ) : null}
              </dl>
              <div className="specimen-tag-notes">
                <h4>Notas</h4>
                <p>{current.bio}</p>
              </div>
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
