# Plano — Migração de todo o conteúdo para CMS headless (Sanity)

> Etapa de planejamento. Descreve **o que** construir e **como** estruturar.
> Implementação é etapa separada.
>
> Glossário: [CONTEXT.md](../CONTEXT.md) · Decisões:
> [ADR 0001](./adr/0001-noticias-fonte-de-dados-desacoplada.md) ·
> [ADR 0002](./adr/0002-conteudo-do-site-desacoplado-para-cms.md)
>
> Este plano executa a **Etapa 2** prevista no ADR 0002.

---

## 1. Objetivo

Tornar **100% do texto e das imagens do site** editáveis por pesquisadores num
CMS headless gratuito, sem tocar em código — incluindo a **imagem e o texto do
Hero**, que hoje vêm de `lib/content/source.local.ts`.

Ao fim: `lib/content/source.local.ts` e `lib/news/source.local.ts` deixam de
existir; toda leitura passa por adapters do CMS.

## 2. Decisões fechadas

| Tema | Decisão |
|------|---------|
| CMS | **Sanity** (free plan) — confirma o ADR 0002 |
| Studio (painel) | **Embutido** no próprio Next, em `/studio` |
| Corpo das Notícias | **Portable Text** nativo (muda `NewsItem.body`) |
| Textos curtos com ênfase | Continuam **string Markdown inline** (`*itálico*`, `\n`) — como no ADR 0002 |
| Fonte local | **Removida** após a migração; o site passa a exigir credenciais do Sanity |
| Imagens | Asset do Sanity + `@sanity/image-url` preenchendo `ImageRef.src` |
| Cache | ISR por tag + webhook do Sanity chamando `revalidateTag` |
| Preview / visual editing | **Fora desta fase** (ver §14) |

## 3. Por que Sanity — números verificados (ago/2026)

Free plan, $0 permanente:

- **20 seats** de usuário (papéis: Administrador e Viewer)
- **10.000 documentos**, 2.000 atributos únicos por dataset
- **2 datasets** — atenção: **apenas públicos**
- **100 GB** de assets + **100 GB** de banda/mês, CDN global
- **1M** requisições API CDN/mês + 250k requisições API/mês
- **2 webhooks GROQ**
- Studio hospedado grátis; pipeline de imagem com transformações nativas

Compatibilidade com este projeto (verificada em npm):

| Pacote | Versão | Peer deps | Projeto |
|--------|--------|-----------|---------|
| `next-sanity` | 13.3.1 | `next ^16`, `react ^19.2.3`, `sanity ^5.29 \|\| ^6` | `next 16.2.6`, `react 19.2.6` ✅ |
| `sanity` | 6.9.0 | `react ^19.2.2`, `styled-components ^6.1` | ✅ |
| `@sanity/image-url` | 2.1.1 | — | ✅ |
| `@portabletext/react` | 7.0.1 | `react ^19` | ✅ |
| `@sanity/orderable-document-list` | 2.0.18 | `sanity ^6` | ✅ |

**Consequências a aceitar:**

1. **Dataset público no free plan.** Todo o conteúdo — inclusive rascunhos — é
   legível por quem souber o `projectId`. Para um site institucional público
   isso é aceitável, mas vira regra: **nada confidencial no CMS** (dados de
   localização precisa de espécies ameaçadas, contatos privados, etc.).
2. **2 webhooks** — o desenho usa **um só** (§11), sobra folga.
3. **Vendor lock-in mitigado**: os adapters isolam o Sanity em 2 arquivos. Trocar
   de CMS depois custa reescrever `source.cms.ts` × 2, não a UI.

## 4. Ponto de partida — o que já está pronto

A Etapa 1 do ADR 0002 já foi feita, e isso encurta muito este trabalho:

- ✅ `lib/content/` e `lib/news/` já expõem **API assíncrona** (`getHero`,
  `getNav`, `getNewsBySlug`, …). Nenhuma assinatura muda.
- ✅ Nenhum JSX nos dados — só strings Markdown e `ImageRef`.
- ✅ Todas as seções já são Server Components `async`.
- ✅ `ImageSlot` já renderiza `next/image` quando `src` existe.
- ✅ `next.config.ts` já libera `cdn.sanity.io`.

**Portanto: nenhum componente de seção muda.** As exceções, todas justificadas,
estão em §10 (Portable Text), §12 (rotas do Studio) e §15 (correções).

## 5. Modelo de conteúdo no Sanity

### 5.1 Objetos reutilizáveis

```ts
// sanity/schemas/objects/
imageWithAlt   // object { image (hotspot), alt, placeholder }
link           // label + href          — usado nos CTAs do hero e no rodapé
navLink        // label + href + pin    — menu do topo
contactRow     // label + value (md inline) + note
```

`placeholder` continua existindo: é a **instrução editorial** de que foto entra
no slot ("foto · serpente · close em folhagem · vertical"). Enquanto o
pesquisador não subir a imagem, `ImageSlot` segue mostrando esse texto — o
comportamento atual do site é preservado durante toda a migração.

Dois ajustes feitos na implementação, em relação ao esboço acima:

- **`imageWithAlt` é `object`, não `image` com campos extras.** Num campo do
  tipo `image`, o Studio só revela os subcampos **depois** que uma foto é
  enviada — e o `placeholder` precisa ser editável justamente **antes** disso,
  porque é ele que o site mostra enquanto a foto não existe. Como `object`, os
  três campos ficam sempre visíveis. Custo: uma camada a mais na GROQ
  (`image{ alt, placeholder, image{...} }`) e `alt` obrigatório só via regra
  condicional (`Rule.custom`), já que a foto é opcional.
- **`cta` foi absorvido por `link`** — os dois tinham exatamente `label + href`.
  O que de fato diferia era o menu do topo, que tem `pin`; virou `navLink`.

### 5.2 Singletons (documento único, sem botão "criar novo")

| Documento | Campos | Alimenta |
|-----------|--------|----------|
| `siteSettings` | `brandName`, `brandTag`, `navLinks[link + pin]`, `footerText`, `footerColumns[]`, `footerFine[]` | `getNav`, `getFooter` |
| `homePage` | `hero{...}`, `stats[num, lbl]`, `manifesto{quote, sig}` | `getHero`, `getStats`, `getManifesto` |
| `contactSection` | `heading`, `body`, `rows[contactRow]`, `form{...15 labels}` (fieldset colapsado) | `getContactInfo`, `getContactForm` |

`hero` mapeia 1:1 com o tipo atual: `margin`, `eyebrow`, `titleLines[string]`,
`squiggleWord`, `lede`, `ctas[cta]`, `polaroid{image, caption, stamp}`.

`brandName`/`brandTag` ficam **num lugar só** em `siteSettings`; o adapter
preenche tanto `Nav` quanto `Footer`. Os tipos não mudam, o editor não digita
duas vezes.

### 5.3 Documento com chave

`sectionHead` — `key` (select: `news`, `newsArchive`, `projects`,
`coordinators`, `gallery`, `contact`), `kicker`, `title` (md inline), `blurb`.
Validação: `key` obrigatória e **única**. São 6 documentos, mapeando 1:1 com
`getSectionHead(key)`.

### 5.4 Coleções ordenáveis

Ordenação por **drag-and-drop** via `@sanity/orderable-document-list` (plugin
oficial, gratuito) — os arrays locais tinham ordem implícita que o CMS não tem.

| Documento | Campos | Ordem |
|-----------|--------|-------|
| `project` | `number`, `status`, `title` (md), `description`, `pins[label, warm]` | `orderRank` |
| `coordinator` | `image`, `caption`, `name`, `role`, `bio`, `lines` | `orderRank` |
| `galleryItem` | `image`, `caption`, `stamp` | `orderRank` |
| `news` | `title`, `slug` (auto do título), `author`, `publishedAt`, `image`, `body` (Portable Text), `excerpt` | por `publishedAt desc` |

## 6. O que **não** vai para o CMS

Três campos dos tipos atuais são **decoração acoplada ao CSS**, não conteúdo.
Pedir para um pesquisador escolher `c-3` ou `pc-5` seria expor detalhe de
implementação. Eles saem do schema e passam a ser **derivados no adapter**, pelo
índice do item:

| Campo | Hoje | Depois |
|-------|------|--------|
| `Project.variant` | `"c-1"…"c-4"` no dado | `["c-1","c-2","c-3","c-4"][i % 4]` |
| `Project.doodle` | `"✱" \| "↗" \| "◯" \| "✷"` | tabela fixa de 4 glifos, `[i % 4]` |
| `GalleryItem.variant` | `"pc-1"…"pc-6"` | `pc-${(i % 6) + 1}` |
| `GalleryItem.doodle` | glifo + `CSSProperties` | tabela fixa de 6 posições, `[i % 6]` |

Verificado em `app/globals.css:559-578` e `:705-738`: essas classes só definem
`background-color`, `transform: rotate()` e `margin-top` — é o "desalinhamento
de caderno" do design. Derivar pelo índice tem um bônus: **um 5º projeto passa a
funcionar sozinho**, reciclando o visual, em vez de quebrar por falta de
variante.

`ImageRef.slotId` também deixa de ser digitado: o adapter usa o `_id` do
documento (ou `_key` do item), que já é único e estável — importante porque
`Gallery.tsx` e `Coordinators.tsx` usam `slotId` como `key` do React.

## 7. Arquivos novos

```
sanity.config.ts                    # defineConfig: projectId, dataset, structureTool, visionTool, orderableDocumentListDeskItem
sanity.cli.ts                       # para `sanity schema extract` / `sanity typegen`
sanity/
  env.ts                            # leitura validada das env vars
  structure.ts                      # menu do Studio: singletons sem "criar novo", coleções ordenáveis
  schemas/
    index.ts
    objects/{imageWithAlt,link,cta,contactRow}.ts
    singletons/{siteSettings,homePage,contactSection}.ts
    documents/{sectionHead,project,coordinator,galleryItem,news}.ts
lib/sanity/
  client.ts                         # createClient do next-sanity
  image.ts                          # urlFor + toImageRef(sanityImage, fallback)
  queries.ts                        # todas as GROQ com defineQuery
lib/content/source.cms.ts           # mapeia resultado GROQ -> tipos de lib/content/types.ts
lib/news/source.cms.ts              # idem para NewsItem
app/(studio)/studio/[[...tool]]/page.tsx
app/api/revalidate/route.ts
scripts/seed.ts                     # importa o conteúdo atual para o Sanity (rodado uma vez)
.env.example
```

**Arquivos alterados:** `lib/content/index.ts` e `lib/news/index.ts` (troca do
import), `lib/news/types.ts` (`body`), `components/news/NewsArticle.tsx`
(Portable Text), `components/ui/ImageSlot.tsx` (blur + sizes), `app/layout.tsx`
+ novo `app/(site)/layout.tsx`, `package.json`, `next.config.ts`.

**Arquivos removidos:** `lib/content/source.local.ts`, `lib/news/source.local.ts`.

## 8. Queries e tipagem

Cada query em `lib/sanity/queries.ts` usando `defineQuery` (habilita o typegen a
inferir o retorno). Exemplo:

```ts
export const homePageQuery = defineQuery(`*[_type == "homePage"][0]{
  hero{
    margin, eyebrow, titleLines, squiggleWord, lede,
    ctas[]{label, href},
    polaroid{ caption, stamp, image{ alt, placeholder, asset->{url, metadata{dimensions, lqip}} } }
  },
  stats[]{num, lbl},
  manifesto{quote, sig}
}`);
```

Pipeline de tipos (script `npm run typegen`):

```
sanity schema extract     ->  schema.json
sanity typegen generate   ->  sanity.types.ts
```

O adapter então mapeia `HomePageQueryResult` → `Hero | Stat[] | Manifesto`. Se
uma query e o schema divergirem, **o typecheck quebra** em vez de o site quebrar
em produção.

Alternativa mais barata se o typegen atrapalhar no começo: tipar as queries à
mão no adapter e adicionar o typegen depois. Não bloqueia nada.

## 9. Imagens

`lib/sanity/image.ts` expõe:

```ts
toImageRef(source, { slotId, fallbackPlaceholder }): ImageRef
```

- `src` = `urlFor(source).width(1400).auto("format").url()` — respeita o
  **hotspot** definido pelo editor (por isso `options: { hotspot: true }` no
  schema), o que importa porque `ImageSlot` usa `object-fit: cover`.
- `width`/`height` de `asset->metadata.dimensions`.
- `blurDataURL` de `asset->metadata.lqip` → **campo novo, opcional**, em
  `ImageRef`. `ImageSlot` passa `placeholder="blur"` quando existir. Aditivo, não
  quebra nada.
- Sem asset ⇒ retorna `ImageRef` sem `src`, e o slot segue no placeholder.

Ajuste em `next.config.ts`: restringir o `remotePattern` a
`pathname: "/images/<projectId>/**"` em vez de liberar o host inteiro.

## 10. Portable Text nas Notícias

Única mudança de tipo do plano:

```ts
// lib/news/types.ts
- body: string;                       // Markdown
+ body: PortableTextBlock[];          // blocos do Sanity
```

- `components/news/NewsArticle.tsx` troca `<RichText>` por `<PortableText>` de
  `@portabletext/react`, com componentes customizados mapeando para as classes
  já existentes em `.news-article-body`.
- `components/ui/RichText.tsx` **não some**: `InlineText` continua sendo usado
  por Hero, Stats, SectionHead, Manifesto, Projects e Contact. O export
  `RichText` (bloco) fica sem uso e pode ser removido.
- `react-markdown` continua como dependência por causa do `InlineText`.
- Ganho: o pesquisador escreve no editor visual do Studio, e o corpo aceita
  imagens/blocos no meio do texto no futuro sem mudar o tipo de novo.

Os demais campos com ênfase (`hero.titleLines`, `stat.num`,
`sectionHead.title`, `manifesto.quote`, `project.title`, `contactRow.value`)
**continuam string Markdown inline**, como o ADR 0002 decidiu. São textos de uma
linha; trocá-los por Portable Text mexeria em 7 tipos e 6 componentes sem ganho
proporcional. O custo — o editor precisa saber `*itálico*` — é mitigado com
`description` explicativa em cada campo do schema.

## 11. Cache e revalidação

Sem `defineLive` nesta fase — o site é estático, o público é de leitura, e
`defineLive` obrigaria a reestruturar layouts e a gerenciar um read token.

```ts
// lib/sanity/client.ts
export const client = createClient({
  projectId, dataset, apiVersion,
  useCdn: false,                 // frescor controlado pelo cache do Next, não pelo CDN
  perspective: "published",      // rascunhos nunca vazam (relevante: dataset público)
});
```

Cada fetch leva uma **tag por tipo de documento**:

```ts
client.fetch(query, params, { next: { revalidate: false, tags: ["homePage"] } })
```

Webhook único (dos 2 disponíveis no free plan) → `app/api/revalidate/route.ts`:

1. `parseBody` de `next-sanity/webhook` valida a assinatura com
   `SANITY_WEBHOOK_SECRET` (não é comparação de string na query — é assinatura).
2. Projeção do webhook devolve `_type` e, para notícias, o `slug`.
3. `revalidateTag(_type)` + `revalidateTag("news:<slug>")` quando aplicável.

Publicar no Studio ⇒ site atualizado em segundos, sem rebuild.

## 12. Studio embutido — reestruturação de rotas

O `app/layout.tsx` atual renderiza `<Topbar />`, importa `globals.css` e declara
`viewport: { width: 1280 }`. Nenhuma dessas três coisas pode valer para o
Studio (que precisa de `width: device-width` e não pode herdar o CSS do site).
Solução: **route groups**.

```
app/
  layout.tsx                       # só <html className={fontes}><body>{children}</body>
  (site)/
    layout.tsx                     # import "./globals.css" + viewport 1280 + <Topbar/>
    page.tsx                       # (movido)
    noticias/page.tsx              # (movido)
    noticias/[slug]/page.tsx       # (movido)
  (studio)/
    studio/[[...tool]]/page.tsx    # NextStudio + metadata/viewport de next-sanity
  api/revalidate/route.ts
```

CSS importado num layout de grupo só entra nas rotas daquele grupo — então
`globals.css` deixa de vazar para o Studio. As URLs públicas **não mudam**
(route groups não aparecem no path).

A rota do Studio usa `export const dynamic = "force-static"` e os
`metadata`/`viewport` exportados por `next-sanity/studio` (que já trazem
`robots: noindex`).

Custo: o build do site passa a incluir o bundle do Studio (~40 MB de
dependências, code-split para fora das páginas públicas). Se isso incomodar
depois, o Studio migra para `sanity deploy` sem afetar os adapters.

## 13. Variáveis de ambiente

```bash
# .env.example  (o .gitignore já cobre .env* e libera .env.example)
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2026-08-04
SANITY_WEBHOOK_SECRET=              # valida o webhook de revalidação
SANITY_WRITE_TOKEN=                 # SÓ local, só para rodar o seed uma vez
```

`sanity/env.ts` valida a presença das obrigatórias e falha com mensagem clara no
boot — melhor do que um `undefined` virar query silenciosamente vazia.

## 14. Migração do conteúdo atual

Ordem importa, porque a decisão foi **remover** as fontes locais:

1. `scripts/seed.ts` importa `source.local.ts` (ainda existente) e cria os
   documentos no Sanity via `@sanity/client` com `SANITY_WRITE_TOKEN`:
   3 singletons com `_id` fixo, 6 `sectionHead`, 4 `project`, 3 `coordinator`,
   6 `galleryItem`, N `news`.
2. O corpo das notícias (hoje Markdown) é convertido para Portable Text no seed
   com `@sanity/block-tools` — evita recopiar os textos à mão.
3. **Imagens não são migradas**: hoje não existe imagem real no repositório, só
   `placeholder`. O seed grava o texto do placeholder; os pesquisadores fazem o
   upload pelo Studio depois. O site continua idêntico ao atual até o primeiro
   upload.
4. Conferir no Studio que tudo chegou.
5. Só então: trocar o import em `lib/content/index.ts` e `lib/news/index.ts`, e
   **apagar** os dois `source.local.ts`.
6. `scripts/seed.ts` vira código morto após o passo 5 (ele importava o arquivo
   apagado) — remover junto, ou preservar o snapshot como JSON em
   `scripts/seed-data.json`. **Recomendo preservar**: é o único backup do
   conteúdo original fora do Sanity.

⚠️ A partir do passo 5, `npm run build` e `npm run dev` **exigem** as env vars do
Sanity. Isso afeta qualquer CI e qualquer clone novo do repositório — precisa
estar documentado no README.

## 15. Correções colaterais encontradas na leitura do código

Três coisas que apareceram ao mapear o projeto. Não são causadas pela migração,
mas ficam no caminho dela:

1. **Topbar duplicada em `/noticias`.** `app/layout.tsx:41` renderiza
   `<Topbar />` e `app/noticias/page.tsx:12` renderiza outro dentro de `.page`
   (idem `[slug]/page.tsx:16`). Como `.topbar` é `position: sticky`
   (`globals.css:80-91`), as duas empilham. A reestruturação de rotas da §12
   mexe exatamente nesses arquivos — corrigir junto, removendo os `<Topbar />`
   das páginas.
2. **Links não funcionam no `InlineText`.** `RichText.tsx:36` passa
   `allowedElements={["p","em","strong"]}` com `unwrapDisallowed`, então o `<a>`
   é desembrulhado. O e-mail em `contactInfo.rows` está escrito como link
   Markdown (`[lear@bio.ufrj.br](mailto:…)`) e renderiza como texto morto. O ADR
   0002 afirma que `InlineText` suporta links — a implementação não suporta.
   Adicionar `"a"` ao `allowedElements`. Vira mais relevante agora: o editor vai
   escrever esses links pelo CMS.
3. **`ImageSlot` com `sizes="50vw"` fixo** (`ImageSlot.tsx:28`) para slots de
   tamanhos muito diferentes (polaroid do hero, card de notícia, item de
   galeria). Irrelevante enquanto tudo é placeholder; vira desperdício de banda
   quando as imagens forem reais. Passar `sizes` como campo opcional do
   `ImageRef`, definido por quem renderiza.

## 16. Etapas de implementação

| # | Etapa | Entrega verificável |
|---|-------|---------------------|
| 1 | Criar projeto Sanity + dataset `production`; `.env.local` e `.env.example` | `sanity/env.ts` valida e passa |
| 2 | Instalar deps: `sanity`, `next-sanity`, `@sanity/image-url`, `@sanity/vision`, `@sanity/orderable-document-list`, `@portabletext/react`, `styled-components` | `npm run build` ainda passa |
| 3 | Schema completo (§5) + `sanity.config.ts` + `structure.ts` | — |
| 4 | Reestruturar rotas em `(site)`/`(studio)` (§12) + corrigir Topbar duplicada (§15.1) | Site idêntico; `/studio` abre e lista os tipos |
| 5 | `lib/sanity/{client,image,queries}.ts` + typegen (§8, §9) | `npm run typegen` gera `sanity.types.ts` |
| 6 | `lib/content/source.cms.ts` + `lib/news/source.cms.ts`, com as derivações da §6 | Typecheck passa; ainda não plugado |
| 7 | `scripts/seed.ts` e rodar (§14.1–14.4) | Conteúdo visível no Studio |
| 8 | Trocar imports nos dois `index.ts`; apagar os `source.local.ts` | Site renderiza do CMS |
| 9 | Portable Text no `NewsArticle` (§10) | `/noticias/[slug]` renderiza |
| 10 | `ImageSlot`: `blurDataURL` + `sizes` (§9, §15.3); `remotePatterns` restrito | Upload de uma foto real no Studio aparece no site |
| 11 | Webhook `/api/revalidate` + configurar no Sanity Manage (§11) | Publicar no Studio muda o site sem rebuild |
| 12 | Corrigir links no `InlineText` (§15.2) | E-mail do contato clicável |
| 13 | ADR 0003 registrando a Etapa 2 como executada + README com as env vars | — |

Etapas 1–6 não alteram o comportamento do site — é possível parar em qualquer
ponto delas sem quebrar nada. O ponto de virada é a **etapa 8**.

## 17. Verificação

- `npm run typecheck` e `npm run build` limpos.
- Comparação visual em 1280px: home e `/noticias` **pixel-idênticas** ao estado
  atual logo após a etapa 8 (mesmo conteúdo, mesmos placeholders).
- Editar o Hero no Studio → publicar → texto muda no site.
- Subir uma foto no polaroid do Hero → imagem real substitui o placeholder.
- Criar uma notícia no Studio → aparece na home (3 recentes) e em `/noticias`.
- Reordenar projetos por drag-and-drop → ordem e variantes visuais reciclam
  corretamente.
- `/studio` sem o CSS do site e sem a Topbar.

## 18. Fora de escopo

- **Preview / visual editing** (`defineLive`, draft mode, Presentation tool).
  Vale a pena depois; exige read token e mais reestruturação de layout.
- **Envio real do formulário de contato** — `ContactForm.tsx` só faz
  `setSent(true)`. O CMS passa a controlar os rótulos, não o destino da mensagem.
- Paginação em `/noticias`, `status` rascunho/publicado além do nativo do Sanity,
  agendamento de publicação, i18n, responsividade (o site é desktop fixo 1280).
- Migração de imagens reais (não existem ainda).

## 19. Riscos

| Risco | Mitigação |
|-------|-----------|
| Dataset público expõe rascunhos | Regra escrita: nada confidencial no CMS. `perspective: "published"` no client. |
| Site deixa de buildar sem credenciais (decisão da §14) | `sanity/env.ts` com erro explícito; env vars no README e no CI. |
| Singleton ausente/despublicado derruba a página | `validation: Rule.required()` no schema + adapter falha com mensagem nomeando o documento, em vez de `undefined` silencioso. |
| Bundle do Studio pesa no build | Code-split para fora das rotas públicas; se incomodar, migrar para `sanity deploy` (não afeta os adapters). |
| Editor esquece a convenção `*itálico*` | `description` em cada campo inline; se virar atrito recorrente, migrar esses campos para Portable Text inline num passo posterior. |
| Plugin `orderable-document-list` desatualizar | Fallback trivial: campo `order: number` + `| order(order asc)` na GROQ. |
