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
| `SANITY_WRITE_TOKEN` | **Só local**, só para rodar o seed. Não configure em produção. |

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
  (site)/         páginas públicas — globals.css, viewport 1280, Topbar
  (studio)/       Sanity Studio em /studio
  api/revalidate/ webhook de revalidação
components/       seções, UI e notícias
lib/content/      conteúdo do site (tipos + adapter Sanity)
lib/news/         notícias (tipos + adapter Sanity)
lib/sanity/       cliente, queries GROQ, imagem, tags de cache
sanity/           schema, estrutura do Studio, tipos gerados
scripts/          seed inicial + snapshot do conteúdo pré-CMS
docs/             ADRs e planos
```

## Documentação

- [CONTEXT.md](CONTEXT.md) — glossário do domínio. Fonte da verdade da
  linguagem do projeto.
- [docs/adr/](docs/adr/) — decisões de arquitetura.
- [docs/plano-cms-headless.md](docs/plano-cms-headless.md) — plano da migração
  para o CMS.

## Notas

- **Layout desktop fixo em 1280px** (`app/(site)/layout.tsx`). Não é
  responsivo, por decisão de design.
- **CSS semântico** em `app/(site)/globals.css` com tokens `@theme`. Seguir esse
  padrão em vez de encher os componentes de utility-classes.
- **Dataset público** (limitação do plano gratuito do Sanity): nada
  confidencial no CMS.
