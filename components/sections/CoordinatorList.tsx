"use client";

import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Polaroid } from "@/components/ui/Polaroid";
import { Expandable } from "@/components/ui/Expandable";
import type { Coordinator } from "@/lib/content/types";

/** Quantos aparecem antes do "ver todos". Múltiplo de 3 e de 2, as colunas da
 * malha no desktop e no tablet. */
const VISIBLE_COORDINATORS = 6;

/** A duração de `tag-in` em globals.css: a etiqueta some antes da foto voltar. */
const TAG_IN_MS = 260;

/**
 * A malha de profissionais e o modal com a bio inteira.
 *
 * A foto do card "voa" até o modal pela View Transitions API: a polaroide do
 * card e a do modal recebem o mesmo `view-transition-name` (uma de cada vez —
 * o nome tem de ser único na página), e o navegador anima a passagem. Depois
 * que ela pousa, a etiqueta de coleção sai de trás dela (CSS); ao fechar, a
 * etiqueta volta primeiro e só então a foto retorna ao card. Sem a API, ou com
 * movimento reduzido, o modal só abre e fecha.
 *
 * O modal é um `<dialog>` nativo: foco preso, `Esc` e `inert` no resto da
 * página vêm de graça.
 */
export function CoordinatorList({ coordinators }: { coordinators: Coordinator[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const cardRefs = useRef(new Map<number, HTMLElement>());
  const [active, setActive] = useState<number | null>(null);

  const transition = (update: () => void, card: HTMLElement | undefined) => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!document.startViewTransition || reduce || !card) {
      update();
      return;
    }
    const photo = card.querySelector<HTMLElement>(".coord-polaroid")!;
    const name = (on: boolean) => {
      photo.style.viewTransitionName = on ? "coord-photo" : "";
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
      // Sem isto o `<dialog>` foca o primeiro focável, que é a área de notas
      // (rolável, logo focável). O `autoFocus` do React não serve: ele foca
      // ao montar, antes do `showModal`, e não deixa o atributo no HTML.
      closeRef.current?.focus();
    }, cardRefs.current.get(index));

  const closing = useRef(false);
  const close = () => {
    const dialog = dialogRef.current;
    if (active === null || !dialog || closing.current) return;
    closing.current = true;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    dialog.setAttribute("data-closing", "");
    window.setTimeout(
      () =>
        transition(() => {
          dialog.close();
          dialog.removeAttribute("data-closing");
          closing.current = false;
          flushSync(() => setActive(null));
        }, cardRefs.current.get(active)),
      reduce ? 0 : TAG_IN_MS
    );
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
          // Clique fora da foto e da etiqueta: o alvo é o palco, não o conteúdo.
          const target = event.target as HTMLElement;
          if (target === event.currentTarget || target.classList.contains("coord-modal-body")) close();
        }}
      >
        {current ? (
          <div className="coord-modal-body">
            <Polaroid className="coord-polaroid" image={current.image} caption={current.caption} />
            <article className="coord-tag">
              <div className="coord-tag-top">
                <span>LEAR · UFSC</span>
                <span>Equipe · nº {String(active! + 1).padStart(2, "0")}</span>
              </div>
              <dl>
                <dt>Nome</dt>
                <dd className="coord-tag-name" id="coord-modal-name">
                  {current.name}
                </dd>
                <dt>Função</dt>
                <dd className="coord-tag-role">{current.role}</dd>
                {current.lines ? (
                  <>
                    <dt>Linhas</dt>
                    <dd>{current.lines}</dd>
                  </>
                ) : null}
              </dl>
              <div className="coord-tag-notes">
                <h4>Notas</h4>
                <p>{current.bio}</p>
              </div>
            </article>
            <button ref={closeRef} type="button" className="coord-modal-close" onClick={close} aria-label="Fechar">
              ×
            </button>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
