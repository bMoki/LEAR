/**
 * Leitura validada das variáveis de ambiente do Sanity.
 *
 * Falha alto e cedo, com o nome da variável faltando: sem isso, um `undefined`
 * vira uma query silenciosamente vazia e o site renderiza em branco em vez de
 * quebrar. Ver `docs/plano-cms-headless.md` §13 e §19.
 *
 * Os nomes precisam ser escritos por extenso (`process.env.NEXT_PUBLIC_…`) para
 * o Next conseguir substituí-los no bundle do cliente.
 */
function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Variável de ambiente ausente: ${name}. ` +
        `Copie .env.example para .env.local e preencha (docs/plano-cms-headless.md §13).`
    );
  }
  return value;
}

export const projectId = required(
  "NEXT_PUBLIC_SANITY_PROJECT_ID",
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
);

export const dataset = required(
  "NEXT_PUBLIC_SANITY_DATASET",
  process.env.NEXT_PUBLIC_SANITY_DATASET
);

/**
 * Data fixa. A API do Sanity é versionada por data: travar aqui garante que
 * uma mudança futura na API não altere o comportamento do site sem revisão.
 */
export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2026-08-04";

/** Caminho da rota do Studio dentro do Next. */
export const studioBasePath = "/studio";
