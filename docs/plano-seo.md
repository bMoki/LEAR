# Plano — Responsividade e estrutura para busca

> **Status: implementado em 07/08/2026.** As sete etapas foram executadas e a
> verificação da §12 rodou contra `npm run build && npm start`. O que divergiu
> do plano está na **§15**, no fim. O que continua pendente é só o que depende
> de domínio (§13, `PENDENCIAS.md`).
>
> Etapa de planejamento. Descreve **o que** construir e em que ordem.
>
> Glossário: [CONTEXT.md](../CONTEXT.md) · Decisões:
> [ADR 0004](./adr/0004-site-responsivo.md) ·
> [ADR 0005](./adr/0005-estrutura-do-site-para-busca.md)
>
> **Sem deploy e sem publicação.** Todo este plano roda e se verifica na
> máquina local. O que depende de domínio, DNS ou host está isolado na §12 e
> registrado em `PENDENCIAS.md` — nada aqui espera por isso.

---

## 1. Objetivo

Preparar o site para ser encontrado na busca, sem publicá-lo. Ao fim, com
`npm run build && npm start` local:

- o site responde bem em 480, 768, 1024 e 1280;
- cada rota tem `<title>`, `<meta description>`, canonical e card social
  próprios;
- `/sitemap.xml`, `/robots.txt` e o favicon existem e respondem;
- notícia e projeto emitem dado estruturado válido;
- `/projetos/[slug]` existe.

O que **não** é objetivo: subir o site, cadastrar domínio, verificar no Search
Console. Nada disso é pré-requisito do que está aqui.

---

## 2. Ponto de partida

### 2.1 O que já está certo — não mexer

Levantado durante a sessão de decisão. Vale registrar para ninguém "consertar"
o que não está quebrado:

| Item | Onde | Por quê importa |
|---|---|---|
| `perspective: "published"` | `lib/sanity/client.ts:19` | Rascunho nunca é indexado. Crítico: o dataset é público. |
| `defined(slug.current)` nas queries | `lib/sanity/queries.ts` | Notícia sem slug não entra em lista nem em sitemap. |
| `<article>`, `<h1>` único, `<time dateTime>` | `components/news/NewsArticle.tsx` | Marcação semântica do artigo já correta. |
| `alt` obrigatório quando há foto | `sanity/schemas/objects/imageWithAlt.ts:32-37` | Validação condicional já existe. |
| Um `<h1>` por página | `Hero.tsx:15`, `NewsArticle.tsx:20` | Home e notícia já corretas. |
| CSP sem script de terceiro | `next.config.ts:62-79` | Nada neste plano exige abrir. JSON-LD é bloco de dados, não script executável. |

### 2.2 Defeitos verificados

| # | Defeito | Evidência |
|---|---|---|
| D1 | Viewport fixo em 1280, zero media queries | `app/(site)/layout.tsx:14`; `globals.css` com 0 ocorrências de `@media` |
| D2 | `/noticias/[slug]` sem `generateMetadata` | As 5 notícias herdam título e descrição da home |
| D3 | `/noticias` sem `<h1>` | `SectionHead` emite `<h2>`, `NewsCard` emite `<h3>` |
| D4 | `/noticias` sem metadados próprios | Nenhum export de `metadata` em `app/(site)/noticias/page.tsx` |
| D5 | Nenhuma query traz `_updatedAt` | Sem `dateModified` e sem `lastModified` |
| D6 | Sem `metadataBase` | Impede canonical e `og:image` relativos |
| D7 | Sem `sitemap.ts`, `robots.ts`, ícone | `/favicon.ico` retorna 404 |
| D8 | Sem dado estruturado | Nenhum `application/ld+json` no projeto |
| D9 | Títulos com Markdown inline | Os 4 projetos têm `*`; sairia literal no `<title>` |
| D10 | Sem `generateStaticParams` | Notícias renderizadas sob demanda |
| D11 | Nada liga uma notícia a outra | Página órfã é mal rastreada |

---

## 3. A variável que desbloqueia tudo

Os docs do Next instalado são explícitos (`generate-metadata.md:428`):

> *"Using a relative path in a URL-based metadata field without configuring a
> `metadataBase` will cause a build error."*

Como não há domínio e não haverá deploy, o valor **precisa ter padrão local**,
senão o build quebra na máquina de quem clonar:

```ts
// app/layout.tsx
metadataBase: new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
),
```

Adicionar `NEXT_PUBLIC_SITE_URL` ao `.env.example`, comentado, explicando que
fica vazio até o domínio existir. Quando existir, é a única linha a mudar —
canonical, `og:image`, `sitemap.xml` e `robots.txt` derivam dela.

---

## 4. Etapa 1 — Responsividade (ADR 0004)

**Vem primeiro de propósito.** As etapas seguintes criam dois tipos de página
novos (`/projetos` e `/projetos/[slug]`). Fazer o responsivo depois significa
construir essas páginas em 1280 e refazê-las.

### 4.1 Viewport

`app/(site)/layout.tsx` — trocar `{ width: 1280 }` por
`{ width: "device-width", initialScale: 1 }`. O export fica onde está: o
Studio não pode herdá-lo (ADR 0003, *Rotas em grupos*).

### 4.2 Os 12 grids

Levantados por leitura do `globals.css`. Cada um precisa de decisão própria de
como colapsa — não é substituição mecânica por `1fr`:

| Linha | Seletor | Hoje |
|---|---|---|
| 148 | `.hero` | `1.4fr 1fr` |
| 329 | `.stats` | `repeat(4, 1fr)` |
| 370 | `.section-head` | `auto 1fr auto` |
| 455 | `.projects` | `1fr 1fr` |
| 582 | `.coords` | `repeat(3, 1fr)` |
| 649 | `.gallery` | `repeat(12, 1fr)` |
| 768 | `.contact-wrap` | `1fr 1fr` |
| 801 | `.contact-row` | `140px 1fr` |
| 923 | `.field-row` | `1fr 1fr` |
| 1003 | `.footer` | `2fr 1fr 1fr 1fr` |
| 1058 | `.news-grid` | `repeat(3, 1fr)` |
| 1062 | `.news-grid--full` | `repeat(3, 1fr)` |

Mais `.wrap` (linha 74), com `max-width: 1180px` — precisa de padding lateral
para não encostar na borda em telas estreitas.

### 4.3 O que exige decisão de design, não de CSS

- **Escala tipográfica** — 227 valores em `px`, todos dimensionados para uma
  largura só.
- **Os 13 `position: absolute`** (linhas 192, 265, 272, 282, 309, 474, 486,
  667, 674, 685, 699, 853, 986) — doodles e carimbos das polaroides. Decoração
  em coordenada fixa não sobrevive à mudança de largura; parte vai precisar
  sumir abaixo de certo breakpoint.
- **`.topbar`**, que é `sticky` com 5 links — precisa de padrão de menu para
  tela estreita.
- **`.gallery`** em 12 colunas — o layout mais denso do site.
- **`.hero`** — ao empilhar, definir se a polaroide vem antes ou depois do
  texto.

### 4.4 Verificação

DevTools em 480 / 768 / 1024 / 1280 e conferência de que nada estourou
horizontalmente. Sem teste automatizado que pegue regressão visual — registrado
como risco no ADR 0004.

---

## 5. Etapa 2 — Helpers compartilhados

Três funções puras que as etapas seguintes consomem. Ficam antes porque metade
das etapas depende delas.

### 5.1 `lib/seo/text.ts`

- **`stripInlineMarkdown(s: string): string`** — remove os marcadores de ênfase
  antes de qualquer coisa virar `<title>` ou `og:title` (D9).
  *Limitação aceita:* remoção simples de `*`. No conteúdo atual isso transforma
  `17 *+*` em `17 +`, que é o resultado desejado. Não é parser CommonMark e não
  precisa ser.
- **`portableTextToPlain(blocks): string`** — extrai o texto corrido do
  Portable Text, para servir de descrição quando o "Resumo" está vazio.
- **`truncateAtWord(s, max)`** — corta em ~155 caracteres sem partir palavra.

### 5.2 `lib/seo/metadata.ts`

`buildMetadata()`, que centraliza a regra do ADR 0005 — derivado por padrão,
override opcional:

```
title       = override ?? stripInlineMarkdown(titulo) + sufixo do lab
description = override ?? resumo ?? truncate(portableTextToPlain(body))
canonical   = caminho relativo (resolvido pelo metadataBase)
openGraph   = { title, description, url, images, type, locale: "pt_BR" }
```

Uma função só, usada por todas as rotas. Evita cada página inventar a sua.

---

## 6. Etapa 3 — Metadados por rota

### 6.1 `_updatedAt` nas queries (D5)

Adicionar aos três blocos de notícia em `lib/sanity/queries.ts`
(`allNewsQuery`, `recentNewsQuery`, `newsBySlugQuery`), ao tipo `NewsItem` e ao
adapter `lib/news/source.cms.ts`.

**Rodar `npm run typegen` depois** — o README é explícito: é ele que mantém
schema, GROQ e adapters amarrados.

### 6.2 `/noticias/[slug]` (D2, D10)

- `generateMetadata` usando `buildMetadata`, mais `openGraph.type: "article"`
  com `publishedTime`, `modifiedTime` e `authors`.
- `generateStaticParams` retornando todos os slugs.
- **Memoizar a leitura**: `generateMetadata` e a página buscam a mesma notícia.
  Os docs do Next instalado indicam `cache()` do React para isso
  (`14-metadata-and-og-images.md:133-146`).

### 6.3 `/noticias` (D3, D4)

- Export de `metadata` próprio.
- **Ganhar um `<h1>`.** O `SectionHead` emite `<h2>` e é usado em toda seção da
  home, onde `<h2>` está certo. Solução: prop opcional `as` no `SectionHead`,
  com `<h2>` como padrão, e `/noticias` passando `h1`.

### 6.4 Home

Mover o `metadata` de `app/layout.tsx` para `app/(site)/page.tsx`, deixando na
raiz só `metadataBase` e o `title.template`. Motivo: o layout raiz é
compartilhado com o Studio, e o título da home não é o título do Studio.

---

## 7. Etapa 4 — Arquivos de metadata

### 7.1 `app/sitemap.ts` (D7)

Rotas fixas (`/`, `/noticias`) mais as dinâmicas, com `lastModified` vindo de
`_updatedAt`.

Detalhe dos docs (`sitemap.md`): *"sitemap.js is a special Route Handler that
is cached by default"*. Como ele lê do Sanity, deve usar `sanityFetch` com as
mesmas **tags de cache** de `lib/sanity/tags.ts` — assim o webhook de
revalidação já existente atualiza o sitemap junto com as páginas, sem código
novo.

### 7.2 `app/robots.ts` (D7)

Libera tudo, bloqueia `/studio` e `/api`, aponta o sitemap.

### 7.3 Ícone (D7)

`app/icon.png` resolve o 404 registrado no `PENDENCIAS.md`.

### 7.4 Card social

- `app/opengraph-image.tsx` — card do site, gerado com `next/og`.
- `app/(site)/noticias/[slug]/opengraph-image.tsx` — por notícia: a foto quando
  houver, o card gerado quando não (hoje: 14 slots de 14 sem foto).

Duas restrições dos docs (`14-metadata-and-og-images.md:344-348`): o
`ImageResponse` só aceita **flexbox e um subconjunto de CSS** — `display: grid`
não funciona; e para o card sair na tipografia do site, o arquivo da fonte
precisa estar disponível ao servidor. **Commitar o `.ttf` da Fraunces** em vez
de buscar do Google em tempo de execução.

---

## 8. Etapa 5 — Dado estruturado (D8)

Um componente `<JsonLd>` que serializa e emite `<script type="application/ld+json">`.
A CSP não atrapalha: bloco de dados não é script executável, e `script-src` já
tem `'unsafe-inline'` de qualquer forma.

| Rota | Tipo | Observação |
|---|---|---|
| `/` | `Organization` | `name` por extenso, `alternateName: "LEAR"`. A sigla sozinha não é consulta vencível — disputa com a Lear Corporation. |
| `/noticias/[slug]` | `NewsArticle` | `headline` (≤110 caracteres; o maior hoje tem 62), `image`, `datePublished`, `dateModified`, `author` como `Person` só com nome — Pessoa não tem página. |
| `/projetos/[slug]` | `WebPage` + `about` | Sem resultado rico no Google; serve para entendimento de entidade. |
| Toda rota interna | `BreadcrumbList` | O único da lista que **muda a aparência** do resultado: troca a URL crua pela trilha. |

---

## 9. Etapa 6 — Projeto vira rota (ADR 0005)

A maior mudança de modelo. Depende das etapas 2–5 para reaproveitar tudo.

### 9.1 Schema

`sanity/schemas/documents/project.ts` ganha:

| Campo | Obrigatório | Nota |
|---|---|---|
| `slug` | sim | Gerado do título, editável. Compromisso permanente. |
| `image` | não | `imageWithAlt`, como o resto do site. |
| `taxonCientifico` | não | Ver **Táxon** no `CONTEXT.md`. |
| `taxonPopular` | não | Array de strings. |
| `bioma` | não | Sai de `pins[0]`. |
| `financiador` | não | Sai de `pins[3]`. |
| `periodoInicio` / `periodoFim` | não | Sai de `pins[2]`, hoje `"2024 →"`. |
| `responsavel` | não | Texto livre, ver `CONTEXT.md`. Sai de `pins[1]`. |
| `body` | não | Portable Text, como a Notícia. |

`pins[]` sai. `status` vira lista fechada em vez de string solta.

**Descrição de campo com a orientação combinada**, no campo de táxon popular:
citar o nome popular junto do científico, porque é o que o público digita.
Orientação, nunca validação.

### 9.2 Migração — e a janela para fazê-la barato

Os 4 projetos precisam virar o modelo novo: slug gerado do título, `pins`
distribuídas em campos.

**O caminho barato só existe agora.** O `scripts/seed.ts` é repetível
(`createOrReplace`, ADR 0003) e o CMS ainda tem **só conteúdo de exemplo** —
verificado: os 4 projetos no dataset são idênticos ao `seed-data.json`, e os 14
slots de imagem estão vazios. Basta atualizar o `seed-data.json` e rodar o seed
de novo.

No dia em que houver conteúdo real, esse caminho apaga trabalho de pesquisador
e passa a exigir script de migração de verdade. **Fazer antes disso.**

### 9.3 Restante

- `projectsQuery` ganha os campos novos, mais `projectBySlugQuery` e
  `_updatedAt`. Rodar `npm run typegen`.
- `lib/content/types.ts` e `source.cms.ts` — atenção: `variant` e `doodle`
  continuam **derivados do índice**, não vêm do CMS (ADR 0003). Numa rota por
  slug não há índice de lista; a decoração precisa derivar de algo estável
  (o próprio slug serve).
- Rotas `app/(site)/projetos/page.tsx` e `app/(site)/projetos/[slug]/page.tsx`,
  com `generateStaticParams` e `generateMetadata`.
- A seção `#projetos` da home passa a **linkar** para as páginas.
- Sitemap ganha as rotas de projeto.

---

## 10. Etapa 7 — Ligação interna entre notícias (D11)

Bloco "Outras notícias" ao pé de `/noticias/[slug]`: as mais recentes, exceto a
atual. Sem campo novo, sem trabalho editorial.

Se um dia fizer sentido agrupar por assunto, o caminho é um campo de tema na
Notícia — deliberadamente fora desta fase.

---

## 11. Ordem e dependências

```
Etapa 1  Responsividade          ── independente, mas vem antes das rotas novas
Etapa 2  Helpers (lib/seo)       ── §3 (metadataBase) é pré-requisito
Etapa 3  Metadados por rota      ── depende de 2
Etapa 4  sitemap/robots/ícone/OG ── depende de 2 e 3
Etapa 5  Dado estruturado        ── depende de 3
Etapa 6  Projeto vira rota       ── depende de 2,3,4,5 (reaproveita tudo)
Etapa 7  Notícias relacionadas   ── independente, pode vir a qualquer momento
```

Etapa 1 e etapas 2–5 não se tocam (CSS de um lado, `lib/` e `app/` de outro) e
podem andar em paralelo.

---

## 12. Verificação local — tudo sem deploy

```bash
npm run typecheck
npm run build      # confere quais rotas foram pré-renderizadas
npm start
```

| O quê | Como |
|---|---|
| Título e descrição por rota | Ver o fonte de `/`, `/noticias` e de duas notícias — os títulos têm de ser diferentes entre si |
| Sem Markdown vazado | Nenhum `*` dentro de `<title>` ou `og:title` |
| Canonical | Uma `<link rel="canonical">` por página, apontando para ela mesma |
| Sitemap | `curl -s localhost:3000/sitemap.xml` — toda notícia e todo projeto presentes, com `lastmod` |
| Robots | `curl -s localhost:3000/robots.txt` — `/studio` e `/api` bloqueados |
| Ícone | `curl -sI localhost:3000/favicon.ico` deixa de dar 404 |
| Card social | Abrir `/noticias/<slug>/opengraph-image` direto no navegador |
| Dado estruturado | Colar o bloco `ld+json` no **Rich Results Test** do Google — ele aceita código colado, não exige URL pública |
| Rascunho não vaza | Criar rascunho no Studio sem publicar e conferir que não aparece em `/noticias` nem no sitemap |
| Responsivo | DevTools em 480 / 768 / 1024 / 1280, sem rolagem horizontal |
| Desempenho | Lighthouse contra o `npm start`, não contra o `dev` |

---

## 13. Fora de escopo — depende de deploy ou domínio

Nada aqui bloqueia as etapas acima. Já registrado em `PENDENCIAS.md`:

- Escolher o endereço definitivo. **Tem prazo:** trocar depois de indexado vira
  migração de domínio, com 301 em tudo.
- Cadastrar no Search Console (verificação por TXT no DNS) e enviar o sitemap.
- Bloquear indexação de endereços de preview.
- CORS da origem de produção no Sanity, webhook de revalidação, variáveis no
  host.
- Subir as fotos reais — os 14 slots seguem vazios.

Também fora, por decisão registrada nos ADRs: versão em inglês e `hreflang`;
analytics de terceiro; `/equipe/[slug]`, `/publicacoes` e `/boletim`; campo de
tema na Notícia.

---

## 14. Riscos

| Risco | Mitigação |
|---|---|
| **Regressão visual no desktop** ao mexer nos 12 grids e nos 227 valores em `px`. Não há teste que pegue. | Conferir as quatro larguras a cada bloco; tratar 1280 como referência a preservar. |
| **A janela da migração barata fecha.** Assim que houver conteúdo real no CMS, refazer o seed apaga trabalho. | Fazer a Etapa 6 antes de qualquer pesquisador começar a preencher. |
| **Slug é permanente.** Uma vez indexado, mudar exige redirecionamento. | Revisar os 4 slugs com calma antes de publicar. Sem deploy, ainda são gratuitos de mudar. |
| **A página de projeto pode não se pagar.** Sem o vínculo com Notícia, é uma tabela de fatos e ~20 palavras. | Risco declarado no ADR 0005, com critério de reversão pelo Search Console. |
| **Fonte no `ImageResponse`** — buscar do Google em execução é frágil. | Commitar o arquivo da fonte. |
| **Divergência schema/GROQ/adapter** ao mudar `project`. | `npm run typegen` a cada mudança de schema ou query, como o README exige. |

---

## 15. O que divergiu na execução

Registrado aqui, e não corrigido acima: o plano é o que foi decidido, esta
seção é o que a execução mostrou.

### Onde o plano estava certo e o código precisou de outra forma

| § | O plano dizia | O que ficou | Por quê |
|---|---|---|---|
| 6.4 | `title.template` na raiz | em `app/(site)/layout.tsx` | A raiz é compartilhada com o Studio — que é a razão que o próprio §6.4 dá para tirar o `metadata` de lá. Na raiz, o template também alcançaria o título do Studio. A raiz ficou só com `metadataBase`. |
| 7.3 | `app/icon.png` | `app/favicon.ico` + `app/icon.svg` | `icon.png` responde em `/icon`, e não em `/favicon.ico` — não fecharia o 404 que a §12 manda conferir. Só um arquivo `favicon.ico` responde ali, e ele não pode ser gerado por código (docs, `app-icons.md:171`). O SVG entrou junto porque é texto: legível e editável no diff. |
| 7.4 | um `opengraph-image` na raiz | um por rota | `openGraph` declarado num segmento **substitui** o do anterior (docs, `generate-metadata.md:1330`). Como toda rota usa `buildMetadata`, o card da raiz era descartado por todas: verificado, nenhuma página emitia `og:image`. |
| 5.2 | `openGraph.images` no `buildMetadata` | não declarado | O arquivo `opengraph-image.tsx` de cada rota já injeta a imagem. Declarar de novo seria a mesma imagem descrita em dois lugares. |
| 9.3 | decoração derivada do slug | `Project` e `ProjectCard` separados | `variant` e `doodle` só existem no cartão. Derivá-los de um hash do slug daria decoração a uma página que não a exibe — e quebraria o revezamento de cores da lista, que é o que dá o ar de papéis na mesa. Quem tem posição em lista recebe decoração; quem não tem, não. |
| 4.2 | breakpoints em 480/768/1024/1280 | limites **inclusivos** | `max-width: 768px`, e não `767px`. 480 e 768 são larguras de aparelho: se 480 renderizasse o layout de tablet, conferir em 480 não diria nada sobre celular — que é o motivo de o ADR listar essas larguras. |
| 4.3 | “padrão de menu para tela estreita” | sanfona em painel, `NavMenu.tsx` | Os cinco links não cabem em uma linha abaixo de 768, e empilhá-los dentro da barra — que é `sticky` — comeria ~120px de tela a cada rolagem. O painel cai por baixo. É o único componente de cliente da navegação. |

### O que entrou além do plano

- **`lastmod` honesto para `/`.** A home agrega vários tipos de documento, então
  a data dela não sai de um só. Entrou `siteUpdatedAtQuery`, que devolve a
  edição mais recente de qualquer tipo e declara **todas** as tags de cache —
  o webhook atualiza o sitemap junto com a página que mudou.
- **Geração de slug compartilhada** (`sanity/schemas/slug.ts`), aplicada
  **também à Notícia**. O `slugify` padrão do Sanity não tira acento nem
  Markdown: `Campanha 2025 no inselberg #07` geraria um endereço com `#` e
  dois-pontos. Era defeito latente na Notícia, e slug é compromisso permanente —
  o §14 lista isso como risco.
- **`generateStaticParams` nos `opengraph-image` de `[slug]`**, reexportado da
  página. Sem ele os cards ficavam fora do build e o build deixava de avisar se
  algum não renderizasse.
- **`twitter: { card: "summary_large_image" }`**, uma linha. Sem `twitter-image`
  próprio o X cai no `og:image` sozinho; o que faltava era dizer que o card é o
  grande, e não a miniatura ao lado do texto — que é o ponto da §7.4.
- **`richBodyOf` compartilhado** entre Notícia e Projeto, em vez de repetir as
  ~40 linhas de configuração do editor.
- **`.news-article-body` virou `.article-body`**, agora que as duas rotas de
  texto longo dividem a mesma tipografia.
- **`--force` no `npm run typegen`.** O script falhava na segunda execução
  (`Schema file already exists`), e o README manda rodá-lo a cada mudança de
  schema ou query.

### O que a verificação mostrou

Tudo da §12 passou. Lighthouse contra o `npm start`:

| Rota | Desempenho | Acessibilidade | Boas práticas | SEO |
|---|---|---|---|---|
| `/` (desktop) | 100 | 96 | 100 | 100 |
| `/noticias/[slug]` (celular) | 92 | 95 | 100 | 100 |
| `/projetos/[slug]` (celular) | 93 | 95 | 100 | 100 |

Os pontos de acessibilidade que faltam são **três contrastes da paleta
original**, nenhum introduzido aqui: `.btn`/`.nav .pin` e o carimbo das
polaroides (branco sobre o laranja `#e26a2c`, 3.31:1) e o texto dos slots de
imagem vazios (4.42:1, que some quando as fotos entrarem). Escurecer o laranja
para o `--color-carrot-deep` que já existe resolveria os dois primeiros, ao
custo de mudar a cor de destaque do site — é decisão de design, e está
registrada em `PENDENCIAS.md`, não decidida.

O teste de rascunho da §12 foi feito criando um rascunho pela API e consultando
o dataset das duas formas: `perspective=raw` devolveu 6 notícias, `published` —
o que o site usa — devolveu 5. O rascunho não apareceu em `/noticias` nem no
sitemap, e foi removido em seguida.

### Migração dos projetos (§9.2)

Feita. Antes de rodar o seed, os 4 documentos no dataset foram conferidos:
idênticos ao `seed-data.json`, sem slug, sem imagem, sem corpo, todos com o
`_updatedAt` do seed original — nada escrito por pesquisador. A janela barata
que a §9.2 descreve estava aberta e agora está fechada: **o `scripts/seed.ts`
passa a apagar trabalho se rodar de novo.**

Os quatro slugs, que são compromisso permanente e ainda são gratuitos de mudar
enquanto o site não estiver no ar:

```
/projetos/serpentes-cripticas-da-serra-do-mar
/projetos/termorregulacao-de-tropidurus-sob-o-fogo
/projetos/lagartos-endemicos-dos-inselbergs-do-sao-francisco
/projetos/demografia-silenciosa-de-liolaemus
```

**Táxon e corpo ficaram vazios de propósito.** Os `pins` antigos davam bioma,
responsável, período e financiador — e nada mais. Nome científico e nome popular
não existiam no conteúdo, e inventá-los para um laboratório de pesquisa seria
fabricar dado. São os dois campos que fazem a página de projeto valer por si
(§14, *A página de projeto pode não se pagar*), e são os dois que dependem de
alguém do laboratório preencher.
