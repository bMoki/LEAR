import type { Metadata } from "next";
import { Fraunces, Caveat, JetBrains_Mono } from "next/font/google";

/**
 * Layout raiz — deliberadamente mínimo. Só o `<html>`/`<body>` e as fontes.
 *
 * O CSS do site, o `viewport` fixo de 1280 e a `Topbar` vivem em
 * `app/(site)/layout.tsx`, porque o Sanity Studio (`app/(studio)/studio`)
 * compartilha esta raiz e **não** pode herdar nada disso: ele precisa de
 * viewport responsivo e dos próprios estilos. Ver
 * `docs/plano-cms-headless.md` §12.
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

export const metadata: Metadata = {
  title: "LEAR — Laboratório de Ecologia de Anfíbios e Répteis",
  description:
    "Pesquisa, ensino e conservação da herpetofauna sul-americana. Serpentes, lagartos, sapos e cecílias em florestas, cerrados, caatingas e restingas.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${fraunces.variable} ${caveat.variable} ${jetbrains.variable}`}>
      <body>{children}</body>
    </html>
  );
}
