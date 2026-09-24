/**
 * Apaga **todo** o conteúdo do dataset do Sanity.
 *
 *     npx tsx --env-file=.env.local scripts/wp/limpar.ts          # só lista
 *     npx tsx --env-file=.env.local scripts/wp/limpar.ts --sim    # apaga
 *
 * Existe para o passo que antecede a importação do site antigo: o dataset
 * nasceu com o conteúdo de exemplo do `scripts/seed.ts`, que é texto inventado
 * para desenhar as telas, e a importação usa `_id` derivado de slug — então os
 * documentos de exemplo **não** são sobrescritos, eles conviveriam com os
 * reais.
 *
 * ⚠️ Sem volta pelo script. O que dá para recuperar:
 *   · o conteúdo de exemplo, rodando `scripts/seed.ts` de novo;
 *   · o conteúdo importado, rodando `scripts/wp/import.ts` de novo.
 * O que **não** volta: qualquer coisa escrita à mão no Studio.
 *
 * Não toca em assets. Imagem já enviada continua na biblioteca de mídia, e é
 * de propósito — subir de novo custa uma janela de acesso ao servidor da UFSC,
 * que é de terceiro e tem proteção contra rajada.
 */
import { createClient } from "@sanity/client";

const confirmado = process.argv.includes("--sim");

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const token = process.env.SANITY_WRITE_TOKEN;

if (!projectId || !dataset || !token) {
  throw new Error(
    "Faltam variáveis de ambiente. Rode com:\n" +
      "  npx tsx --env-file=.env.local scripts/wp/limpar.ts"
  );
}

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2026-08-04",
  useCdn: false,
});

/** Tudo que não é documento de sistema. Os `_.groups.*` e `_.retention.*` são
 * configuração do projeto (papéis de acesso, retenção de histórico); apagá-los
 * não limpa conteúdo, quebra o dataset. */
const ALVO = '*[!(_id in path("_.**"))]';

async function main() {
  const docs: { _id: string; _type: string }[] = await client.fetch(`${ALVO}{_id, _type}`);

  const porTipo = docs.reduce<Record<string, number>>((a, d) => {
    a[d._type] = (a[d._type] ?? 0) + 1;
    return a;
  }, {});

  console.log(`Dataset ${projectId}/${dataset} — ${docs.length} documentos:`);
  for (const [tipo, n] of Object.entries(porTipo).sort()) {
    console.log(`  ${tipo.padEnd(16)} ${n}`);
  }

  if (docs.length === 0) return;

  if (!confirmado) {
    console.log("\nNada foi apagado. Para apagar de verdade, repita com --sim.");
    return;
  }

  await client.delete({ query: ALVO });
  const restantes: string[] = await client.fetch(`${ALVO}._id`);
  console.log(`\n✔ ${docs.length} documentos apagados; restam ${restantes.length}.`);
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
