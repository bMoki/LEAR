import { Fragment } from "react";
import ReactMarkdown from "react-markdown";

/**
 * `InlineText` — Markdown **inline** para os textos curtos do site (títulos,
 * rótulos, números das estatísticas, linhas de contato). Mantém só ênfase
 * (`*itálico*`), forte (`**negrito**`) e links, e transforma cada `\n` em
 * quebra de linha. Substitui o antigo `<>…<em>…</em></>` espalhado nos dados.
 *
 * O corpo das Notícias não passa por aqui: é Portable Text, renderizado por
 * `components/ui/PortableBody.tsx`.
 */

type Props = { children: string };

// Descarta o <p> que o Markdown embrulha, para o resultado poder viver dentro
// de <h1>/<h2>/<span>.
const inlineComponents = {
  p: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
};

export function InlineText({ children }: Props) {
  const lines = children.split("\n");
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 ? <br /> : null}
          <ReactMarkdown
            components={inlineComponents}
            allowedElements={["p", "em", "strong", "a"]}
            unwrapDisallowed
          >
            {line}
          </ReactMarkdown>
        </Fragment>
      ))}
    </>
  );
}
