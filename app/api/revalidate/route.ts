import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { parseBody } from "next-sanity/webhook";
import { KNOWN_TAGS } from "@/lib/sanity/tags";

/**
 * Webhook do Sanity: publicar no Studio invalida o cache das páginas que leem
 * aquele tipo de documento, sem rebuild.
 *
 * Cadastrar em Sanity Manage → API → Webhooks apontando para
 * `https://<domínio>/api/revalidate`, com o segredo de `SANITY_WEBHOOK_SECRET`
 * e projeção que inclua `_type`.
 *
 * A autenticação é por **assinatura** do corpo (`parseBody`), não por um
 * segredo na query string: a rota é pública e a URL vaza em log de servidor,
 * proxy e histórico de navegador.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.SANITY_WEBHOOK_SECRET;

  if (!secret) {
    console.error("SANITY_WEBHOOK_SECRET não configurado.");
    return Response.json({ error: "Webhook não configurado" }, { status: 500 });
  }

  const { isValidSignature, body } = await parseBody<{ _type?: string }>(request, secret);

  if (!isValidSignature) {
    return Response.json({ error: "Assinatura inválida" }, { status: 401 });
  }

  const type = body?._type;

  if (!type || !KNOWN_TAGS.has(type)) {
    // Tipo que o site não lê (ou projeção do webhook sem `_type`): nada a
    // invalidar, mas também não é erro do remetente.
    return Response.json({ revalidated: false, reason: `tipo ignorado: ${type ?? "ausente"}` });
  }

  // `expire: 0` descarta o cache imediatamente, em vez de aguardar o
  // `revalidate` de 1h que `sanityFetch` usa como rede de segurança.
  revalidateTag(type, { expire: 0 });

  return Response.json({ revalidated: true, tag: type, now: Date.now() });
}
