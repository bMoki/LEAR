# 0004 — Site responsivo (reverte o viewport fixo de 1280)

- **Status:** Aceito
- **Data:** 2026-08-06
- **Contexto:** [CONTEXT.md](../../CONTEXT.md) · reverte a nota de layout do
  [README](../../README.md) · pré-requisito do
  [ADR 0005](./0005-estrutura-do-site-para-busca.md)

## Contexto

O site nasceu com largura de tela fixa. `app/(site)/layout.tsx` exportava
`viewport: { width: 1280 }`, e o `README` registrava a escolha como
deliberada: *"Layout desktop fixo em 1280px. Não é responsivo, por decisão de
design."* O `globals.css` era coerente com isso — 1219 linhas, **nenhuma**
media query.

O que `width=1280` produz é `<meta name="viewport" content="width=1280">`. Num
aparelho de 390px de largura, o navegador encaixa 1280px de layout em 390px de
tela: escala de ~30%, texto de 16px renderizado a ~5px. A página não quebra —
ela fica ilegível sem pinçar e arrastar.

Isso passou a conflitar com um requisito novo: o site precisa ser encontrado
por busca. O Google rastreia e avalia com o agente de celular desde que a
indexação mobile-first passou a valer para todos os sites. O HTML é o mesmo nos
dois casos, então o conteúdo continua sendo indexado — o que se perde são os
sinais de experiência de página e os Core Web Vitals, medidos em campo e
majoritariamente em aparelhos móveis. Some-se o comportamento real: dois dos
três públicos escolhidos no ADR 0005 (público geral, imprensa) chegam por link
compartilhado, quase sempre no celular.

Não havia como manter as duas coisas. "Excelente SEO" e "não responsivo" são
requisitos incompatíveis, e o requisito novo venceu.

## Decisão

O site passa a ser responsivo de verdade, com breakpoints em **480 / 768 /
1024 / 1280**. O `viewport` volta ao padrão (`width=device-width`,
`initialScale: 1`).

Foi considerada — e recusada — a saída barata: um único breakpoint colapsando
os grids em uma coluna, preservando o desktop intocado. Ela removia a
penalidade sem entregar uma experiência móvel boa, e o custo de fazer duas
vezes é maior que o de fazer certo uma vez.

O que a revisão alcança, além de trocar `grid-template-columns`:

- **Escala tipográfica.** Os 227 valores em `px` do `globals.css` foram
  dimensionados para uma largura só.
- **Os 13 elementos com `position: absolute`** — os doodles e os carimbos das
  polaroides. Decoração posicionada em coordenada fixa não sobrevive à mudança
  de largura.
- **O Hero**, hoje `1.4fr / 1fr`, precisa de uma ordem de leitura definida ao
  empilhar.
- **A Topbar**, que é `sticky` e tem cinco links, precisa de um padrão de menu
  para telas estreitas.
- **A Galeria**, em 12 colunas.

## Consequências

**Positivas**
- Remove o teto que impedia qualquer resultado de busca decente. Sem isso, todo
  o trabalho do ADR 0005 seria feito sobre uma base penalizada.
- O site passa a servir o tráfego de celular, que é a maior parte do que vem de
  link compartilhado.

**Negativas / custos**
- É a maior mudança de CSS desde o início do projeto, e mexe em decisão de
  design tomada — o desenho precisa ser revisto em quatro larguras, não
  traduzido mecanicamente.
- O `README.md` fica desatualizado no ponto que declarava o layout fixo; a nota
  foi corrigida junto com este ADR.
- Regressão visual no desktop passa a ser possível a cada ajuste de breakpoint,
  e não há teste automatizado que a pegue.

## Notas

- `app/(site)/layout.tsx` é o único lugar que exporta `viewport`, e ele existe
  separado da raiz justamente porque o Studio não pode herdá-lo
  ([ADR 0003](./0003-integracao-sanity-executada.md), *Rotas em grupos*). O
  Studio já era responsivo por conta própria; esta mudança não o afeta.
- O `viewport` do Next é export próprio desde a versão 14 — `metadata.viewport`
  está depreciado (`generate-metadata.md:754` nos docs instalados). O código já
  usa a forma correta.
