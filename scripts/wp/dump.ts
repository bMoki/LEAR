import { createReadStream, existsSync } from "node:fs";
import { createInterface } from "node:readline";

/**
 * Leitor do despejo do WordPress antigo (`herpetologia.json`, ~125 MB).
 *
 * O arquivo é o export "to JSON" do phpMyAdmin: um array gigante em que cada
 * tabela é um objeto `{type:"table", name, data:[…]}` e **cada linha da tabela
 * ocupa exatamente uma linha do arquivo**. Por isso a leitura é por streaming e
 * o parse é linha a linha — `JSON.parse` no arquivo inteiro estoura a heap
 * padrão do Node, e não há motivo para carregar `wp_options` para extrair
 * notícia.
 *
 * O `.sql` ao lado tem o mesmo conteúdo. Ficamos com o JSON porque não exige
 * MySQL nem um parser de `INSERT`.
 */

export type Row = Record<string, string | null>;

/** Só o que interessa. `wp_postmeta` sozinha tem 8 mil linhas de lixo de
 * plugin — filtrar na leitura evita segurar tudo em memória. */
const TABELAS = new Set(["wp_posts", "wp_postmeta", "wp_users", "wp_terms"]);

export type Dump = {
  posts: Row[];
  postmeta: Row[];
  users: Row[];
  terms: Row[];
};

const ABERTURA = /^,?\{"type":"table","name":"([^"]+)"/;

export async function readDump(path: string): Promise<Dump> {
  if (!existsSync(path)) {
    throw new Error(
      `Despejo não encontrado em ${path}.\n` +
        `Baixe o export do WordPress antigo e aponte para ele com WP_DUMP=/caminho/herpetologia.json`
    );
  }

  const tabelas: Record<string, Row[]> = {};
  let atual: string | null = null;
  let buffer = "";

  const linhas = createInterface({
    input: createReadStream(path, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  for await (const linha of linhas) {
    const abertura = linha.match(ABERTURA);
    if (abertura) {
      atual = TABELAS.has(abertura[1]) ? abertura[1] : null;
      if (atual) tabelas[atual] = [];
      buffer = "";
      continue;
    }
    if (!atual) continue;

    // `]` fecha o `data` da tabela; `}` fecha o objeto da tabela.
    const t = linha.trim();
    if (t === "]" || t === "}" || t === "[") {
      if (t === "]") atual = null;
      continue;
    }

    // Linha completa é o caso normal. O acúmulo existe só para a linha rara
    // que quebra ao meio — o parse falha, guardamos e tentamos com a próxima.
    buffer += buffer ? "\n" + linha : linha;
    const candidato = buffer.replace(/^,/, "").replace(/,$/, "");
    if (!candidato.startsWith("{")) {
      buffer = "";
      continue;
    }
    try {
      tabelas[atual].push(JSON.parse(candidato) as Row);
      buffer = "";
    } catch {
      // segue acumulando
    }
  }

  return {
    posts: tabelas.wp_posts ?? [],
    postmeta: tabelas.wp_postmeta ?? [],
    users: tabelas.wp_users ?? [],
    terms: tabelas.wp_terms ?? [],
  };
}

/** Índice `post_id → valor` de uma chave de meta. */
export function metaIndex(postmeta: Row[], key: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const m of postmeta) {
    if (m.meta_key === key && m.post_id && m.meta_value) out.set(m.post_id, m.meta_value);
  }
  return out;
}
