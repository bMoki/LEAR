import type { Viewport } from "next";
import { Topbar } from "@/components/sections/Topbar";
import "./globals.css";

/**
 * Layout do site público. Concentra tudo que o Studio não pode herdar:
 * o `globals.css` (importado aqui, então só entra nas rotas deste grupo),
 * o viewport fixo de 1280 e a `Topbar`.
 *
 * A `Topbar` fica **só** aqui — as páginas de notícia renderizavam uma segunda
 * por conta própria, e como `.topbar` é `position: sticky`, as duas empilhavam.
 */

export const viewport: Viewport = {
  width: 1280,
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Topbar />
      {children}
    </>
  );
}
