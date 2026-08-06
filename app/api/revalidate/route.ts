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
 *
 * As checagens antes do `parseBody` existem porque autenticar aqui **exige ler
 * o corpo inteiro** — é sobre ele que o HMAC é calculado. Route Handlers do App
 * Router não têm limite de corpo (o `bodyParser.sizeLimit` é só do Pages
 * Router), então sem essa triagem qualquer pessoa na internet materializa na
 * memória do servidor o que quiser mandar, antes de qualquer verificação. Tudo
 * que dá para rejeitar olhando só os cabeçalhos, rejeita-se aqui.
 */

/** O payload real do webhook é da ordem de KB — a projeção é `{_type}`. 64 KB é
 * folga generosa e ainda assim três ordens de grandeza abaixo do que uma
 * requisição sem teto consegue alocar. */
const MAX_BODY_BYTES = 64 * 1024;

/** Janela de validade da assinatura. O `@sanity/webhook` só confere se o
 * timestamp é posterior a 2021 — não há tolerância de minutos, como em
 * Stripe/GitHub. Sem isto, um par corpo+assinatura válido observado uma vez (em
 * log de proxy, em APM, num header capturado) pode ser reenviado para sempre.
 * O timestamp entra no HMAC, então forjar um recente exige o segredo. */
const MAX_SIGNATURE_AGE_MS = 5 * 60 * 1000;

/**
 * Nome do cabeçalho e formato da assinatura, do protocolo do Sanity —
 * `sanity-webhook-signature: t=<ms>,v1=<hmac>`.
 *
 * Escritos aqui em vez de importados de `@sanity/webhook`: aquele pacote é
 * dependência transitiva do `next-sanity`, não nossa, e importar dele direto
 * seria uma phantom dependency, que quebra conforme o npm resolve a árvore. Se
 * o Sanity um dia mudar o nome, esta rota passa a recusar tudo — falha fechada,
 * que é a direção certa de errar.
 */
const SIGNATURE_HEADER_NAME = "sanity-webhook-signature";
const SIGNATURE_TIMESTAMP = /^t=(\d+)[, ]+v1=/;

export async function POST(request: NextRequest) {
  const secret = process.env.SANITY_WEBHOOK_SECRET;

  if (!secret) {
    console.error("SANITY_WEBHOOK_SECRET não configurado.");
    return Response.json({ error: "Webhook não configurado" }, { status: 500 });
  }

  const signature = request.headers.get(SIGNATURE_HEADER_NAME);

  if (!signature) {
    return Response.json({ error: "Assinatura ausente" }, { status: 401 });
  }

  const timestamp = signature.match(SIGNATURE_TIMESTAMP)?.[1];

  if (!timestamp) {
    return Response.json({ error: "Assinatura malformada" }, { status: 401 });
  }

  if (Math.abs(Date.now() - Number(timestamp)) > MAX_SIGNATURE_AGE_MS) {
    return Response.json({ error: "Assinatura expirada" }, { status: 401 });
  }

  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return Response.json({ error: "Content-Type inesperado" }, { status: 415 });
  }

  const declaredLength = Number(request.headers.get("content-length"));

  // `content-length` ausente (requisição em chunks) não é motivo para recusar: o
  // Sanity manda o cabeçalho, e o que passar daqui ainda precisa de assinatura
  // válida. O teto pega o caso óbvio, que é justamente o do corpo gigante.
  if (declaredLength > MAX_BODY_BYTES) {
    return Response.json({ error: "Corpo grande demais" }, { status: 413 });
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
