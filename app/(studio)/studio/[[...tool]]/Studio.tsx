"use client";

import { NextStudio } from "next-sanity/studio";
import config from "@/sanity.config";

/**
 * Fronteira de cliente do Studio.
 *
 * A `sanity.config.ts` precisa ser importada **só** do lado do cliente: o
 * pacote `sanity` faz `import useSWR from "swr"`, e sob a condição de
 * resolução `react-server` o `swr` não expõe `default` — o build quebra se a
 * config entrar no grafo de Server Component. Por isso o `page.tsx` ao lado
 * não importa a config: ele só renderiza este componente.
 */
export default function Studio() {
  return <NextStudio config={config} />;
}
