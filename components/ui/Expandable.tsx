"use client";

import { useId, useRef, useState, type ReactNode } from "react";

/** Um pouco mais que a transição de `.expandable` (0.6s), para pegar o fim. */
const COLLAPSE_MS = 700;

/**
 * Fechando, a lista encolhe *acima* do botão e a página, que não rola sozinha,
 * fica onde estava — quem clicou cai na seção de baixo. A cada quadro da
 * animação, desfaz na rolagem o quanto o botão subiu: ele fica parado sob o
 * cursor e a lista se recolhe por cima.
 */
function keepInPlace(el: HTMLElement | null) {
  if (!el) return;
  const start = performance.now();
  const anchor = el.getBoundingClientRect().top;
  const frame = (now: number) => {
    window.scrollBy(0, el.getBoundingClientRect().top - anchor);
    if (now - start < COLLAPSE_MS) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

/**
 * O resto de uma lista, escondido atrás de um "ver todos" que abre no lugar,
 * animado — para a seção que não tem página própria para onde mandar.
 *
 * Os itens escondidos continuam no HTML (o rastreador lê tudo); `inert` os tira
 * do foco e do leitor de tela enquanto estão fechados. A animação é a de
 * `grid-template-rows` de `0fr` a `1fr`, que dispensa medir altura.
 */
export function Expandable({ children }: { children: ReactNode }) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const id = useId();
  const [open, setOpen] = useState(false);

  const toggle = () => {
    if (open) keepInPlace(buttonRef.current);
    setOpen((value) => !value);
  };

  return (
    <>
      <div id={id} className="expandable" data-open={open || undefined} inert={!open}>
        <div className="expandable-inner">{children}</div>
      </div>

      <div className="news-footer">
        <button
          ref={buttonRef}
          type="button"
          className="btn ghost"
          aria-expanded={open}
          aria-controls={id}
          onClick={toggle}
        >
          {open ? "ver menos ↑" : "ver todos ↓"}
        </button>
      </div>
    </>
  );
}
