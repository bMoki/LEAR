"use client";

import { useRef, useState, type MouseEvent, type SyntheticEvent } from "react";
import { flushSync } from "react-dom";

/** A duração de `tag-in` em globals.css: a etiqueta some antes da foto voltar. */
const TAG_IN_MS = 260;

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * O modal de foto solta + etiqueta de coleção, que a malha de profissionais e
 * a galeria dividem.
 *
 * A foto do card "voa" até o modal pela View Transitions API: a do card e a do
 * modal recebem o mesmo `view-transition-name` (uma de cada vez — o nome tem
 * de ser único na página), e o navegador anima a passagem. Depois que ela
 * pousa, a etiqueta sai de trás dela (CSS); ao fechar, a etiqueta volta
 * primeiro e só então a foto retorna ao card. Sem a API, ou com movimento
 * reduzido, o modal só abre e fecha.
 *
 * O modal é um `<dialog>` nativo: foco preso, `Esc` e `inert` no resto da
 * página vêm de graça.
 *
 * `photo` é o seletor da foto dentro do card; sem ele, o card inteiro voa.
 */
export function usePhotoModal(photo?: string) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const cardRefs = useRef(new Map<number, HTMLElement>());
  const closing = useRef(false);
  const [active, setActive] = useState<number | null>(null);

  const transition = (update: () => void, card: HTMLElement | undefined) => {
    if (!document.startViewTransition || reducedMotion() || !card) {
      update();
      return;
    }
    const el = photo ? card.querySelector<HTMLElement>(photo)! : card;
    const name = (on: boolean) => {
      el.style.viewTransitionName = on ? "modal-photo" : "";
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
      // Sem isto o `<dialog>` foca o primeiro focável, que pode ser uma área
      // rolável da etiqueta. O `autoFocus` do React não serve: ele foca ao
      // montar, antes do `showModal`, e não deixa o atributo no HTML.
      closeRef.current?.focus();
    }, cardRefs.current.get(index));

  const close = () => {
    const dialog = dialogRef.current;
    if (active === null || !dialog || closing.current) return;
    closing.current = true;
    dialog.setAttribute("data-closing", "");
    window.setTimeout(
      () =>
        transition(() => {
          dialog.close();
          dialog.removeAttribute("data-closing");
          closing.current = false;
          flushSync(() => setActive(null));
        }, cardRefs.current.get(active)),
      reducedMotion() ? 0 : TAG_IN_MS
    );
  };

  /** Para o `ref` de cada card. */
  const cardRef = (index: number) => (el: HTMLElement | null) => {
    if (el) cardRefs.current.set(index, el);
    else cardRefs.current.delete(index);
  };

  /** Para espalhar no `<dialog>`. */
  const dialogProps = {
    ref: dialogRef,
    className: "photo-modal",
    onCancel: (event: SyntheticEvent) => {
      // `Esc` fecharia sem a animação de volta.
      event.preventDefault();
      close();
    },
    onClick: (event: MouseEvent) => {
      // Clique fora da foto e da etiqueta: o alvo é o palco, não o conteúdo.
      const target = event.target as HTMLElement;
      if (target === event.currentTarget || target.classList.contains("photo-modal-body")) close();
    },
  };

  return { active, open, close, cardRef, closeRef, dialogProps };
}
