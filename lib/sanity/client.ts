import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "@/sanity/env";

/**
 * Cliente de leitura do Sanity.
 *
 * `useCdn: false` de propósito: o frescor do conteúdo é controlado pelo cache
 * do Next (tags + webhook de revalidação), não pelo CDN do Sanity. Ter as duas
 * camadas caching independentes só produziria conteúdo velho sem sinal.
 *
 * `perspective: "published"` garante que rascunho nunca vaza — o que importa
 * porque o dataset é **público** no plano gratuito.
 */
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  perspective: "published",
});

/**
 * Rede de segurança: se o webhook de revalidação falhar ou não estiver
 * cadastrado, o conteúdo ainda se atualiza sozinho neste intervalo. Uma hora
 * consome ~720 requisições/mês por página cacheada, contra as 250 mil do plano
 * gratuito — barato pelo que evita (site permanentemente velho, sem aviso).
 */
const FALLBACK_REVALIDATE_SECONDS = 3600;

type FetchArgs<Params> = {
  query: string;
  params?: Params;
  /** Tags de cache — o webhook em `/api/revalidate` invalida por elas. */
  tags: string[];
};

export async function sanityFetch<Result, Params extends Record<string, unknown> = Record<string, never>>({
  query,
  params,
  tags,
}: FetchArgs<Params>): Promise<Result> {
  return client.fetch<Result>(query, params ?? {}, {
    next: { revalidate: FALLBACK_REVALIDATE_SECONDS, tags },
  });
}
