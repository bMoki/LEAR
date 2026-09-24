# Site do LEAR

Site do Laboratório de Ecologia de Anfíbios e Répteis. Next.js (App Router) com
todo o conteúdo — texto e imagens — vindo de um CMS headless (Sanity).

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # preencha (ver abaixo)
npm run dev
```

- Site: http://localhost:3000
- Painel de edição: http://localhost:3000/studio

> **O site não builda sem as variáveis do Sanity.** Não há mais fonte de
> conteúdo local — a decisão está registrada no
> [ADR 0003](docs/adr/0003-integracao-sanity-executada.md). Isso vale para
> qualquer CI e para clones novos.

### Variáveis de ambiente

| Variável | Para quê |
|----------|----------|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Projeto Sanity. Vai no bundle do navegador. |
| `NEXT_PUBLIC_SANITY_DATASET` | `production`. |
| `NEXT_PUBLIC_SANITY_API_VERSION` | Versão da API travada por data. |
| `SANITY_WEBHOOK_SECRET` | Valida a assinatura do webhook de revalidação. |
| `SANITY_WRITE_TOKEN` | **Só local**, só para os scripts de `scripts/wp/`. Não configure em produção. |
| `SITE_URL` | Endereço do site. Vazio enquanto não houver domínio — tudo cai em `http://localhost:3000`. |

## Scripts

| Comando | O que faz |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento. |
| `npm run build` | Build de produção (busca o conteúdo no Sanity). |
| `npm run typecheck` | `tsc --noEmit`. |
| `npm run typegen` | Extrai o schema do Sanity e gera `sanity/types.generated.ts`. |

**Rode `npm run typegen` sempre que mexer no schema (`sanity/schemas/`) ou nas
queries (`lib/sanity/queries.ts`).** É ele que mantém schema, GROQ e adapters
amarrados — sem isso, uma divergência só aparece em produção.

## Como o conteúdo chega na tela

```
Sanity  ──GROQ──▶  lib/sanity/queries.ts
                          │
                   lib/content/source.cms.ts   (mapeia para os tipos do domínio,
                   lib/news/source.cms.ts       deriva a decoração)
                          │
                   lib/content/index.ts        ← única superfície que os
                   lib/news/index.ts             componentes conhecem
                          │
                   components/sections/*       (Server Components async)
```

Nenhum componente sabe que existe Sanity. Trocar de CMS é reescrever os dois
`source.cms.ts`.

### Cache

Cada leitura leva uma tag por tipo de documento. Publicar no Studio dispara o
webhook em `/api/revalidate`, que invalida só as páginas afetadas. Há um
`revalidate` de 1h como rede de segurança caso o webhook falhe.

## Estrutura

```
app/
  layout.tsx      raiz mínima — fontes e metadataBase
  (site)/         páginas públicas — globals.css, viewport, Topbar, title.template
    page.tsx        /
    noticias/       /noticias e /noticias/[slug]
    projetos/       /projetos e /projetos/[slug]
    opengraph-*     card social de cada rota
  (studio)/       Sanity Studio em /studio
  api/revalidate/ webhook de revalidação
  _fonts/         .ttf usados só pelos cards sociais
  sitemap.ts      robots.ts      favicon.ico / icon.svg
components/       seções, UI, notícias, projetos e JSON-LD
lib/content/      conteúdo do site (tipos + adapter Sanity)
lib/news/         notícias (tipos + adapter Sanity)
lib/sanity/       cliente, queries GROQ, imagem, tags de cache
lib/seo/          títulos, descrições, dado estruturado, card social e redirecionamentos
sanity/           schema, estrutura do Studio, tipos gerados
scripts/wp/       importação do site antigo (ADR 0006) + gerador de redirecionamentos
docs/             ADRs e planos
```

### Rotas

| Rota | O que é |
|---|---|
| `/` | Landing. Todas as seções, e o `Organization` do dado estruturado. |
| `/noticias` | Arquivo cronológico. |
| `/noticias/[slug]` | A notícia. Pré-renderizada, com `NewsArticle` + trilha. |
| `/projetos` | Índice das frentes de pesquisa. |
| `/projetos/[slug]` | A frente de pesquisa: ficha tipada + texto opcional. |
| `/sitemap.xml`, `/robots.txt` | Gerados; leem o CMS pelas mesmas tags de cache. |

## Documentação

- [CONTEXT.md](CONTEXT.md) — glossário do domínio. Fonte da verdade da
  linguagem do projeto.
- [docs/adr/](docs/adr/) — decisões de arquitetura.
- [docs/plano-cms-headless.md](docs/plano-cms-headless.md) — plano da migração
  para o CMS.
- [docs/plano-seo.md](docs/plano-seo.md) — plano de responsividade e estrutura
  para busca. Executa os ADRs 0004 e 0005. **Implementado.**

Três documentos de operação ficam **fora do git**, por decisão registrada no
`.gitignore`: o runbook de publicação (`docs/publicacao.md`), o pedido de
registros DNS (`docs/pedido-dns.md`) e a revisão de segurança
(`REVISAO-SEGURANCA.md`). Eles descrevem em que painel cada segredo é colado e
o que ainda está aberto — informação de operação, não de projeto. As decisões
que eles executam estão nos ADRs.

## Notas

- **Site responsivo**, com breakpoints em 480 / 768 / 1024 / 1280
  ([ADR 0004](docs/adr/0004-site-responsivo.md), que reverteu o antigo viewport
  fixo de 1280). As media queries ficam **junto de cada bloco** do
  `globals.css`, não reunidas no fim — mexer na galeria tem de ser uma leitura
  só. Os limites são inclusivos (`max-width: 768px`): 480 e 768 são larguras de
  aparelho, e conferir nelas precisa mostrar o layout daquele aparelho.
  Não há teste que pegue regressão visual: confira as quatro larguras a cada
  ajuste, tratando 1280 como a referência a preservar.
- **CSS semântico** em `app/(site)/globals.css` com tokens `@theme`. Seguir esse
  padrão em vez de encher os componentes de utility-classes.
- **Nenhum campo de SEO bloqueia a publicação.** Título, descrição e card social
  são derivados do conteúdo por `lib/seo/metadata.ts`; o campo manual (o
  "Resumo" da Notícia) é só override. Rota nova = um `buildMetadata`, um
  `opengraph-image.tsx` e uma linha no `sitemap.ts`.
- **Card social por rota, não na raiz.** `openGraph` definido num segmento
  substitui o do segmento anterior, então um `opengraph-image` só na raiz é
  descartado por toda página que declare metadata. Ver `lib/seo/og-card.tsx`.
- **Dataset público** (limitação do plano gratuito do Sanity): nada
  confidencial no CMS.
