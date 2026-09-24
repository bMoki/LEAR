import type { Metadata, Viewport } from "next";
import { Topbar } from "@/components/sections/Topbar";
import { SITE_TITLE, TITLE_TEMPLATE } from "@/lib/seo/site";
import "./globals.css";

/**
 * Layout do site público. Concentra tudo que o Studio não pode herdar:
 * o `globals.css` (importado aqui, então só entra nas rotas deste grupo),
 * o `viewport` e a `Topbar`.
 *
 * A `Topbar` fica **só** aqui — as páginas de notícia renderizavam uma segunda
 * por conta própria, e como `.topbar` é `position: sticky`, as duas empilhavam.
 */

/**
 * `width=device-width` — o padrão. Substitui o `width: 1280` que o site trazia
 * de origem: num aparelho de 390px ele encaixava 1280px de layout em 390px de
 * tela, deixando o texto ilegível sem pinçar (ADR 0004).
 *
 * O export continua aqui, e não na raiz, porque o Studio compartilha aquele
 * layout e não pode herdar nada deste grupo (ADR 0003, *Rotas em grupos*).
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

/**
 * O sufixo dos títulos internos, aplicado pelo Next a toda rota **filha** que
 * define um `title` — `Todas as notícias` vira `Todas as notícias · LEAR`.
 *
 * Fica aqui, e não na raiz, pelo mesmo motivo de tudo neste arquivo: o Studio
 * compartilha o layout raiz e o título dele não é o título do site.
 *
 * O `default` é exigido junto do `template` (docs do Next instalado,
 * `generate-metadata.md:286`) e vale para rota que não declare título próprio.
 * A home ignora o template com `title.absolute` — ela já é a marca.
 */
export const metadata: Metadata = {
  title: { default: SITE_TITLE, template: TITLE_TEMPLATE },
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Topbar />
      {children}
    </>
  );
}
