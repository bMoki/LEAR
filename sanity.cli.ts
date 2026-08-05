import { defineCliConfig } from "sanity/cli";

/**
 * Configuração da CLI do Sanity — usada por `sanity schema extract`,
 * `sanity typegen generate` e pelos comandos de dataset/webhook.
 *
 * Lê `process.env` direto (e não `sanity/env.ts`) porque a CLI roda fora do
 * Next: aqui não há substituição de variáveis no bundle, e a CLI carrega os
 * arquivos `.env*` do diretório do projeto por conta própria.
 */
export default defineCliConfig({
  api: {
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  },
});
