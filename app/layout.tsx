import type { Metadata } from "next";
import { Fraunces, Caveat, JetBrains_Mono } from "next/font/google";
import { SITE_URL } from "@/lib/seo/site";

/**
 * Layout raiz — deliberadamente mínimo. Só o `<html>`/`<body>` e as fontes.
 *
 * O CSS do site, o `viewport` e a `Topbar` vivem em `app/(site)/layout.tsx`,
 * porque o Sanity Studio (`app/(studio)/studio`) compartilha esta raiz e
 * **não** pode herdar nada disso: ele precisa dos próprios estilos e do
 * próprio viewport. Ver `docs/plano-cms-headless.md` §12.
 *
 * Pela mesma razão, o único metadado aqui é o `metadataBase`: título,
 * descrição e card social são do site público e ficam no grupo `(site)`. O
 * Studio traz os seus do `next-sanity`, com `robots: noindex`.
 */

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-caveat",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});

/**
 * A base de todo endereço absoluto que o Next monta sozinho — canonical,
 * `og:url`, `og:image`. Sem ela, um campo de metadata com caminho relativo é
 * **erro de build** (docs do Next instalado, `generate-metadata.md:428`), e é
 * por isso que `SITE_URL` tem padrão local: o domínio ainda não existe.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${fraunces.variable} ${caveat.variable} ${jetbrains.variable}`}>
      <body>{children}</body>
    </html>
  );
}
