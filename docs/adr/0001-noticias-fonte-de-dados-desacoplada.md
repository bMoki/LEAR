# 0001 — Notícias: UI desacoplada da fonte de dados, pronta para CMS headless

- **Status:** Aceito
- **Data:** 2026-06-16
- **Contexto:** [CONTEXT.md](../../CONTEXT.md) → _Notícia_, _Feed de notícias_

## Contexto

O site é hoje 100% estático: todo conteúdo vive hardcoded em `lib/data.tsx`
como JSX, não há backend, banco, autenticação nem hospedagem de imagem (o
`ImageSlot` só renderiza placeholder). A feature de **Feed de notícias** exige
um conteúdo que cresce com o tempo e que, no futuro, será publicado por
pesquisadores via um **CMS headless** — sem mexer em código.

A decisão é construir **agora apenas a UI**, com dados-mock, mas estruturada
para que a troca para o CMS não exija reescrever componentes nem páginas.

## Decisão

Toda leitura de notícia passa por uma **camada de acesso a dados** (`lib/news`)
que expõe funções assíncronas — `getRecentNews(n)`, `getNews()`,
`getNewsBySlug(slug)`. Os componentes e páginas só conhecem essas funções e o
tipo `NewsItem`; **nunca** a origem concreta dos dados.

- Fase atual: a camada lê de uma fonte local (`source.local.ts`, dados-mock).
- Fase futura: troca-se apenas a implementação da fonte por um adapter de CMS
  (`source.cms.ts`), sem tocar em UI.

As funções são `async` desde já (retornam `Promise`), mesmo lendo dados
locais, para que a borda de I/O do CMS não altere as assinaturas depois.

O `NewsItem` é modelado com os campos que um CMS headless naturalmente fornece:
`slug` (campo próprio, estável), `title`, `body` (Markdown), `author` (texto
livre), `publishedAt` (ISO), `image` (referência + alt).

## Consequências

**Positivas**
- A migração para o CMS fica isolada a um único arquivo de adapter.
- Páginas (App Router, Server Components) já fazem `await getNews()` — o
  modelo de dados assíncrono é idêntico ao de buscar do CMS.
- O modelo de dados antecipa o shape do CMS, evitando refatoração de tipos.

**Negativas / custos**
- Uma indireção a mais do que hardcodar direto no `data.tsx` (custo aceito em
  troca de não reescrever a UI depois).
- Enquanto a fonte é local, `async` é "desnecessário" tecnicamente — mantido de
  propósito pela borda futura.

## Alternativas consideradas

1. **Hardcodar no `lib/data.tsx`** como o resto do site. Mais simples hoje,
   mas a migração para o CMS obrigaria a reescrever componentes que importam o
   array direto. Rejeitada.
2. **Construir o CMS/backend agora** (banco + admin + auth + upload). Resolve
   tudo de uma vez, mas muda a natureza do projeto e adia a entrega da UI.
   Rejeitada para esta fase.
3. **Markdown/MDX versionado no Git** como fonte definitiva. Boa para devs, mas
   não atende ao requisito de publicação por pesquisadores sem código.
   Rejeitada como destino final (segue válida como _fonte local_ desta fase).
