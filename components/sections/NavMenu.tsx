"use client";

import { useState } from "react";
import type { NavLink } from "@/lib/content/types";

/**
 * Os links da `Topbar`, com o padrão de menu que as telas estreitas exigem
 * (ADR 0004).
 *
 * Acima de 768 não existe menu nenhum: os cinco links ficam na barra e o botão
 * é `display: none`. Abaixo disso o botão aparece e a lista vira um painel que
 * cai por baixo da barra — que é `sticky`, então empilhar os links dentro dela
 * comeria um terço da tela do celular a cada rolagem.
 *
 * É o único pedaço de navegação que precisa de estado, e por isso o único
 * componente de cliente aqui. A `Topbar` continua no servidor e busca o
 * conteúdo; este recebe os links prontos.
 *
 * Os links continuam no HTML nos dois casos — o painel é escondido por CSS, e
 * não removido da árvore. Importa para o rastreador, que lê a marcação servida.
 */

const PANEL_ID = "nav-principal";

export function NavMenu({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="nav-toggle"
        aria-expanded={open}
        aria-controls={PANEL_ID}
        onClick={() => setOpen((value) => !value)}
      >
        Menu
      </button>

      <nav
        id={PANEL_ID}
        className={`nav${open ? " nav--open" : ""}`}
        // Fecha ao navegar. Os links são âncoras da própria página (`#projetos`)
        // — sem isso o painel ficaria aberto por cima do destino.
        onClick={() => setOpen(false)}
      >
        {/* A chave é a posição, e não o `href`: um endereço recusado pela
            sanitização vira `#` (ver `lib/content/href.ts`), e dois deles
            colidiriam. */}
        {links.map((link, i) => (
          <a key={i} href={link.href} className={link.pin ? "pin" : undefined}>
            {link.label}
          </a>
        ))}
      </nav>
    </>
  );
}
