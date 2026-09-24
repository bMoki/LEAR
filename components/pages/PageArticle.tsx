import { ImageSlot } from "@/components/ui/ImageSlot";
import { PortableBody } from "@/components/ui/PortableBody";
import type { SitePage } from "@/lib/content/types";

/**
 * A página institucional (ver **Página** no CONTEXT.md).
 *
 * Deliberadamente sem ficha, sem etiquetas e sem data: título, subtítulo
 * opcional, imagem e texto. Se um conteúdo precisar de mais que isso, ele não é
 * uma Página — é um tipo próprio, e ganha o componente dele.
 *
 * A imagem é o único elemento condicional: `ImageSlot` desenha o placeholder
 * quando não há foto, o que é certo dentro de uma galeria mas ocuparia meia
 * tela à toa no topo de um texto. Sem foto, o texto começa direto.
 */
export function PageArticle({ page }: { page: SitePage }) {
  return (
    <article className="news-article">
      <header className="news-article-header">
        <h1 className="news-article-title">{page.title}</h1>
        {page.subtitle ? <div className="news-article-byline">{page.subtitle}</div> : null}
      </header>
      {page.image.src ? (
        <div className="news-article-img">
          <ImageSlot {...page.image} />
        </div>
      ) : null}
      <div className="article-body">
        <PortableBody value={page.body} />
      </div>
    </article>
  );
}
