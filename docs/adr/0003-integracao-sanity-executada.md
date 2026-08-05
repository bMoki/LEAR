# 0003 — Integração com o Sanity executada (Etapa 2 do ADR 0002)

- **Status:** Aceito
- **Data:** 2026-08-04
- **Contexto:** [CONTEXT.md](../../CONTEXT.md) · executa a Etapa 2 de
  [ADR 0002](./0002-conteudo-do-site-desacoplado-para-cms.md) · plano detalhado
  em [docs/plano-cms-headless.md](../plano-cms-headless.md)

## Contexto

O ADR 0002 deixou o site inteiro lendo de `lib/content` e `lib/news` — API
assíncrona, dados sem JSX — mas ainda servido por fontes locais em código. A
Etapa 2 (integrar o CMS de fato) ficou adiada.

## Decisão

Executada. Projeto Sanity `gkwqpxk1`, dataset `production`, plano gratuito.
Todo texto e toda imagem do site, **incluindo o Hero**, vêm do CMS.

O que este ADR registra além do que o 0002 já previa:

### Rich text: Portable Text só nas Notícias

O corpo da Notícia virou **Portable Text** (`NewsItem.body` deixou de ser
`string`), renderizado por `components/ui/PortableBody.tsx`. É o único texto
longo do site e o que os pesquisadores mais vão escrever — vale o editor visual
nativo em vez da convenção de Markdown.

Os textos curtos (títulos do Hero, `stat.num`, cabeçalhos de seção, manifesto,
linhas de contato) **continuam strings com Markdown inline**, como o ADR 0002
decidiu. Trocá-los custaria 7 tipos e 6 componentes sem ganho proporcional.

### Decoração não é conteúdo

`Project.variant`, `Project.doodle`, `GalleryItem.variant` e
`GalleryItem.doodle` **não existem no schema do CMS**. São classes de CSS
(rotação, cor do cartão, glifo) derivadas do índice do item em
`lib/content/source.cms.ts`. Pedir a um pesquisador que escolha `pc-5` seria
expor detalhe de implementação. Efeito colateral bom: um 5º projeto passa a
funcionar sozinho, reciclando o visual, em vez de faltar variante.

### `imageWithAlt` é `object`, não `image`

Num campo `image`, o Studio só revela os subcampos depois que uma foto é
enviada — e o `placeholder` (o texto que o site mostra **enquanto não há foto**)
precisa ser editável antes disso. Como `object`, os três campos ficam sempre
visíveis. Foi o que permitiu migrar sem nenhuma imagem: o site seguiu idêntico
ao anterior até o primeiro upload.

### Cache: tags + webhook, sem preview

`sanityFetch` marca cada leitura com uma tag por `_type`; o webhook em
`app/api/revalidate/route.ts` valida a **assinatura** do corpo e chama
`revalidateTag(tipo, { expire: 0 })`. Um `revalidate` de 1h fica como rede de
segurança para o caso de o webhook falhar — sem ele, um webhook quebrado
deixaria o site permanentemente velho sem nenhum sinal.

`defineLive`/visual editing ficou fora: exigiria read token e reestruturação de
layout, e o site é estático e de leitura pública.

### Rotas em grupos

`app/(site)` e `app/(studio)`. O layout raiz ficou mínimo porque o Studio não
pode herdar `globals.css`, o `viewport: 1280` nem a `Topbar`. As URLs públicas
não mudaram.

A config do Studio é importada atrás de uma fronteira `"use client"`
(`Studio.tsx`): o pacote `sanity` faz `import useSWR from "swr"`, e o `swr` não
expõe `default` sob a condição de resolução `react-server` — importar a config
de um Server Component quebra o build.

## Consequências

**Positivas**
- Pesquisadores publicam sem tocar em código, em `/studio`.
- Nenhum componente de seção mudou: a aposta do ADR 0001/0002 (API assíncrona
  desde o início) se pagou.
- `sanity typegen` liga schema, GROQ e adapters: divergência quebra o
  `typecheck`, não a página.

**Negativas / custos**
- **O site não builda sem as variáveis de ambiente do Sanity.** Vale para
  qualquer CI e clone novo. Foi decisão consciente ao remover as fontes locais.
- Dataset público (limitação do plano gratuito): nada confidencial no CMS.
- O bundle do Studio entra no build do site (~40 MB de dependências,
  code-split para fora das rotas públicas).

## Notas de execução

- `scripts/seed-data.json` é o snapshot do conteúdo pré-CMS e o único backup
  fora do Sanity. `scripts/seed.ts` é repetível (`createOrReplace`).
- A conversão Markdown → Portable Text do seed cobre só o subconjunto que os
  corpos originais usavam (parágrafos, `##`, listas, `**forte**`, `*ênfase*`),
  verificado sem perda de texto. Não é um parser genérico e não precisa ser.
- Três defeitos pré-existentes foram corrigidos no caminho: Topbar duplicada em
  `/noticias`, links inertes no `InlineText` (o e-mail do contato não era
  clicável) e `stat.num = "17*+*"`, que o CommonMark não consegue interpretar
  como ênfase — um `*` colado em alfanumérico e seguido de pontuação não abre
  delimitador. Corrigido no conteúdo para `17 *+*`.
