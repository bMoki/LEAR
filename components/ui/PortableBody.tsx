import { PortableText, type PortableTextComponents } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";

/**
 * Renderiza o corpo de uma Notícia (Portable Text, vindo do Sanity).
 *
 * Só emite HTML semântico — os estilos são os que `.news-article-body` já
 * define em `globals.css`. O conjunto de blocos e marcas aqui espelha
 * exatamente o que o schema `news.body` oferece ao editor: se o Studio não
 * deixa criar, não precisa ser renderizado.
 */

const components: PortableTextComponents = {
  marks: {
    link: ({ children, value }) => {
      const href = typeof value?.href === "string" ? value.href : undefined;
      if (!href) return <>{children}</>;
      const external = /^https?:\/\//.test(href);
      return (
        <a
          href={href}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {children}
        </a>
      );
    },
  },
};

export function PortableBody({ value }: { value: PortableTextBlock[] }) {
  return <PortableText value={value} components={components} />;
}
