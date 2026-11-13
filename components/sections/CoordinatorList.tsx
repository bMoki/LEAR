"use client";

import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Polaroid } from "@/components/ui/Polaroid";
import { Expandable } from "@/components/ui/Expandable";
import type { Coordinator } from "@/lib/content/types";

/** Quantos aparecem antes do "ver todos". Múltiplo de 3 e de 2, as colunas da
 * malha no desktop e no tablet. */
const VISIBLE_COORDINATORS = 6;

/**
 * A malha de profissionais e o modal com a bio inteira.
 *
 * O card "vira" o modal pela View Transitions API: o card clicado e o modal
 * recebem o mesmo `view-transition-name` (um de cada vez — o nome tem de ser
 * único na página), e o navegador anima a passagem de um para o outro. Sem a
 * API, ou com movimento reduzido, o modal só abre.
 *
 * O modal é um `<dialog>` nativo: foco preso, `Esc` e `inert` no resto da
 * página vêm de graça.
 */
export function CoordinatorList({ coordinators }: { coordinators: Coordinator[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cardRefs = useRef(new Map<number, HTMLElement>());
  const [active, setActive] = useState<number | null>(null);

  const transition = (update: () => void, card: HTMLElement | undefined) => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!document.startViewTransition || reduce || !card) {
      update();
      return;
    }
    const name = (on: boolean) => {
      card.style.viewTransitionName = on ? "coord-card" : "";
      card.querySelector<HTMLElement>(".coord-polaroid")!.style.viewTransitionName = on ? "coord-photo" : "";
    };
    // Abrindo, o nome sai do card e vai para o modal; fechando, o inverso.
    const opening = active === null;
    name(opening);
    const vt = document.startViewTransition(() => {
      name(!opening);
      update();
    });
    vt.finished.finally(() => name(false));
  };

  const open = (index: number) =>
    transition(() => {
      flushSync(() => setActive(index));
      dialogRef.current?.showModal();
    }, cardRefs.current.get(index));

  const close = () => {
    if (active === null) return;
    transition(() => {
      dialogRef.current?.close();
      flushSync(() => setActive(null));
    }, cardRefs.current.get(active));
  };

  const card = (c: Coordinator, index: number) => (
    <article
      className="coord"
      key={c.image.slotId}
      ref={(el) => {
        if (el) cardRefs.current.set(index, el);
        else cardRefs.current.delete(index);
      }}
    >
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

      <dialog
        ref={dialogRef}
        className="coord-modal"
        aria-labelledby="coord-modal-name"
        onCancel={(event) => {
          // `Esc` fecharia sem a animação de volta.
          event.preventDefault();
          close();
        }}
        onClick={(event) => {
          // Clique no fundo escurecido: o alvo é o próprio `<dialog>`.
          if (event.target === event.currentTarget) close();
        }}
      >
        {current ? (
          <div className="coord-modal-body">
            <Polaroid className="coord-polaroid" image={current.image} caption={current.caption} />
            <div className="coord-modal-text">
              <h3 className="coord-name" id="coord-modal-name">
                {current.name}
              </h3>
              <div className="coord-role">{current.role}</div>
              <p className="coord-bio">{current.bio}</p>
              {current.lines ? (
                <div className="coord-foot">
                  <strong>Linhas de pesquisa:</strong> {current.lines}
                </div>
              ) : null}
            </div>
            <button type="button" className="coord-modal-close" onClick={close} aria-label="Fechar">
              ×
            </button>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
