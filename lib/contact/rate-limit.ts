/**
 * Limite de envios do formulário de contato, por IP.
 *
 * **Janela fixa, em memória do processo.** É deliberadamente a coisa mais
 * simples que resolve o problema real deste site — alguém segurando o botão de
 * enviar, um robô tentando usar o formulário como relay — e não a mais robusta.
 * As limitações, para ninguém se surpreender depois:
 *
 * - Em ambiente serverless (Vercel) a contagem é **por instância**. Várias
 *   instâncias quentes multiplicam o teto efetivo, e um cold start zera tudo.
 * - Não sobrevive a deploy nem a reinício.
 *
 * Para um formulário que manda e-mail para uma caixa de laboratório, isso é
 * suficiente: transforma "milhares de mensagens" em "algumas". Se um dia virar
 * alvo de verdade, o caminho é um limitador compartilhado (Upstash, KV) ou o
 * limitador da borda — e aí este arquivo some, sem tocar no resto.
 */

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

/** Teto de chaves guardadas, para o Map não virar vazamento de memória sob uma
 * enxurrada de IPs distintos. Ao estourar, a limpeza descarta as janelas já
 * vencidas; se ainda assim não couber, o registro mais antigo sai. */
const MAX_TRACKED_IPS = 10_000;

type Window = { count: number; resetAt: number };

const windows = new Map<string, Window>();

function sweep(now: number) {
  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key);
  }

  while (windows.size > MAX_TRACKED_IPS) {
    const oldest = windows.keys().next();
    if (oldest.done) break;
    windows.delete(oldest.value);
  }
}

export type RateLimitResult = { allowed: boolean; retryAfterSeconds: number };

export function checkRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const current = windows.get(key);

  if (!current || current.resetAt <= now) {
    if (windows.size >= MAX_TRACKED_IPS) sweep(now);
    windows.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (current.count >= MAX_PER_WINDOW) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

/**
 * IP de quem enviou.
 *
 * `x-forwarded-for` é uma lista, e só o **último** salto é confiável — os
 * anteriores são escritos pelo cliente. Em Vercel o proxy garante que o
 * primeiro valor é o IP real; em self-hosted atrás de um proxy que não
 * normaliza, isso é falsificável, e o limitador vira contornável. Está
 * documentado aqui porque a alternativa (não limitar) é pior, e porque quem
 * mudar de hospedagem precisa saber.
 *
 * Sem IP identificável, tudo cai no mesmo balde `"desconhecido"` — que limita
 * demais em vez de limitar de menos.
 */
export function clientKey(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || headers.get("x-real-ip") || "desconhecido";
}
