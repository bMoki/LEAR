# Plano — Feed de Notícias

> Etapa de planejamento. Este documento descreve **o que** construir e **como**
> estruturar. Implementação de código é etapa separada.
>
> Glossário: [CONTEXT.md](../CONTEXT.md) · Decisão de arquitetura:
> [ADR 0001](./adr/0001-noticias-fonte-de-dados-desacoplada.md)

## 1. Objetivo

Adicionar um **Feed de notícias** ao site do LEAR: posts curtos e avulsos
(título, texto, imagem, autor) listados da mais recente para a mais antiga, com
um resumo visual na home e uma página própria por notícia.

**Nesta fase: apenas a UI**, com dados-mock e placeholder de imagem, já
estruturada para plugar um **CMS headless** depois sem reescrever a UI (ver ADR
0001).

## 2. Decisões fechadas (grill)

| Tema | Decisão |
|------|---------|
| Fonte do conteúdo | CMS headless **no futuro**; agora só UI, com camada de acesso desacoplada |
| Conceito | "Notícia" é distinta de _Boletim_ e _Publicação_ |
| Autor | Nome em **texto livre** (não precisa ser da equipe cadastrada) |
| Corpo do texto | **Markdown** |
| Imagem | **Uma, obrigatória** (renderizada como placeholder nesta fase) |
| Data de publicação | **Automática** no momento da publicação |
| Abrir notícia | **Página própria** `/noticias/[slug]` |
| Onde aparece | Home: **3 recentes** (após Manifesto, antes de Projetos) + arquivo completo em `/noticias` |
| Navegação | Link "Notícias" no **topbar e no rodapé** |
| Slug | **Campo próprio**, gerado do título e armazenado (URL estável) |

## 3. Restrições do projeto a respeitar

- **Desktop fixo:** `app/layout.tsx` define `viewport: { width: 1280 }`. As
  novas telas seguem o mesmo layout fixo, sem responsivo/mobile.
- **Estilo:** CSS semântico em `app/globals.css` (classes como `.section`,
  `.section-head`) usando tokens `@theme`. Seguir esse padrão — **não** encher
  de utility-classes do Tailwind.
- **Imagem:** o site não renderiza imagem real (`ImageSlot` é placeholder).
  Notícias seguem o mesmo padrão de slot nesta fase.
- **Seções:** toda seção numerada usa `SectionHead` (kicker / título / blurb).

## 4. Modelo de dados

```ts
// lib/news/types.ts
export type NewsItem = {
  slug: string;        // campo próprio, gerado do título, estável (URL)
  title: string;       // obrigatório
  body: string;        // Markdown
  author: string;      // nome em texto livre
  publishedAt: string; // ISO 8601, automática na publicação
  image: {             // obrigatória
    slotId: string;    // segue o padrão atual de ImageSlot
    placeholder: string;
    alt: string;
  };
  excerpt?: string;    // opcional/futuro — não usado no card por ora
};
```

Notas:
- O **card do feed** mostra apenas **título + prévia de imagem + data**
  (sem resumo), conforme pedido. `excerpt` fica reservado para o futuro.
- `slug` é dado, não calculado em tempo de render — mantém a URL estável se o
  título for editado.

## 5. Camada de acesso (a parte "pronta para CMS")

```
lib/news/
├── types.ts          # NewsItem
├── slug.ts           # slugify(title) — helper de geração de slug
├── source.local.ts   # FONTE ATUAL: array de notícias-mock
└── index.ts          # API pública (async): getRecentNews / getNews / getNewsBySlug
```

```ts
// lib/news/index.ts — única superfície que a UI conhece
export async function getRecentNews(limit: number): Promise<NewsItem[]>;
export async function getNews(): Promise<NewsItem[]>;              // todas, ordenadas desc por data
export async function getNewsBySlug(slug: string): Promise<NewsItem | null>;
```

- Funções **assíncronas desde já** (mesmo lendo local), para a borda do CMS não
  mudar assinaturas depois.
- Migração futura = criar `source.cms.ts` e trocar o import dentro de `index.ts`.
  Nenhum componente ou página muda.

## 6. Estrutura de UI a criar

**Páginas (App Router):**
- `app/noticias/page.tsx` — arquivo completo: `await getNews()`, lista todos os
  cards.
- `app/noticias/[slug]/page.tsx` — detalhe: `await getNewsBySlug(params.slug)`,
  renderiza o Markdown do corpo; `notFound()` se não existir.

**Componentes:**
- `components/sections/News.tsx` — seção da home. Usa `SectionHead`
  (ex.: kicker `§ ?? · notícias`), lista 3 cards de `getRecentNews(3)` e um
  link "ver todas →" para `/noticias`.
- `components/news/NewsCard.tsx` — card: prévia de imagem (`ImageSlot`), título,
  data formatada (pt-BR). É o link para `/noticias/[slug]`.
- `components/news/NewsArticle.tsx` — corpo da página de detalhe: título, autor,
  data, imagem e Markdown renderizado.

**Edições em arquivos existentes:**
- `app/page.tsx` — inserir `<News />` entre `<Manifesto />` e `<Projects />`.
- `lib/data.tsx` — `navLinks`: adicionar `{ label: "Notícias", href: "#noticias" }`;
  `footerColumns` (coluna "Navegar"): adicionar link "Notícias".
- `app/globals.css` — classes da seção/cards/artigo (`.news`, `.news-card`,
  `.news-article`…), no mesmo estilo das seções existentes.

**Renderização de Markdown:**
- Única dependência nova: um renderizador de Markdown (ex.: `react-markdown`),
  usado só na página de detalhe. Avaliar sanitização ao trocar mock por CMS.

## 7. Escopo desta fase (UI) — e o que fica fora

**Dentro:**
- Tipos + camada de acesso `lib/news` com dados-mock (3–5 notícias de exemplo).
- Seção na home (3 recentes) + página de arquivo + página de detalhe.
- Navegação (topbar + rodapé) e estilos.
- Imagem como placeholder estilizado.

**Fora (fases futuras):**
- Integração concreta com o CMS headless (definir qual: Sanity, Notion, etc.).
- Upload/hospedagem de imagem real (substituir `ImageSlot` por `next/image`).
- Autenticação / painel de publicação.
- Workflow de rascunho vs. publicado (`status`).
- Paginação/filtro em `/noticias` quando o volume crescer.
- Resumo (`excerpt`) no card; responsividade (site é desktop fixo 1280).

## 8. Etapas de implementação (ordem sugerida)

1. `lib/news/` — `types.ts`, `slug.ts`, `source.local.ts` (mock), `index.ts`.
2. `components/news/NewsCard.tsx` + estilos do card.
3. `components/sections/News.tsx` (3 recentes + "ver todas") e inserir na home.
4. `app/noticias/page.tsx` (arquivo completo).
5. `app/noticias/[slug]/page.tsx` + `NewsArticle.tsx` + render de Markdown.
6. Navegação: `navLinks` e `footerColumns` em `lib/data.tsx`.
7. Revisão visual no layout fixo 1280 e `typecheck`/`lint`.

## 9. Pendências a decidir antes do CMS (não bloqueiam esta fase)

- Qual CMS headless (Sanity / Notion / outro) e modelo de campos lá.
- Política de imagem real (formato, tamanho, alt obrigatório, hospedagem).
- Necessidade de `status` (rascunho/publicado) e de agendamento de data.
