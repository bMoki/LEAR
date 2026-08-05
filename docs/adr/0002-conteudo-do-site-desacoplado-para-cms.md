# 0002 — Todo o conteúdo do site desacoplado, pronto para CMS headless (Sanity)

- **Status:** Aceito
- **Data:** 2026-06-29
- **Contexto:** [CONTEXT.md](../../CONTEXT.md) · estende [ADR 0001](./0001-noticias-fonte-de-dados-desacoplada.md)

## Contexto

O ADR 0001 desacoplou **apenas as Notícias** da fonte de dados. O resto do site
seguia 100% estático, com conteúdo hardcoded de **duas** formas:

1. `lib/data.tsx` — dados das seções tipados com `React.ReactNode`, ou seja,
   **com JSX embutido** (ex.: `<>17<em>+</em></>`, títulos com `<em>`, linhas de
   contato com `<br>`/`<a>`/`<span>`).
2. Texto escrito direto nos componentes — `Hero`, `Manifesto`, todos os
   `SectionHead`, `Footer`, `Contact` e o micro-copy do `ContactForm`.

O requisito é que **todo texto e toda imagem sejam editáveis** por um **CMS
headless gratuito**. JSX não é serializável por um CMS (que guarda texto,
Markdown ou campos estruturados), então o JSX-nos-dados era o bloqueador central.

## Decisão

Aplicar ao **site inteiro** o mesmo padrão do ADR 0001, em duas etapas.

### Etapa 1 — Refatoração agnóstica (feita)

- **Camada de acesso `lib/content/`** espelhando `lib/news/`: `types.ts`,
  `source.local.ts` (fonte atual) e `index.ts` (API pública **assíncrona**:
  `getNav`, `getHero`, `getStats`, `getManifesto`, `getSectionHead`,
  `getProjects`, `getCoordinators`, `getGallery`, `getContactInfo`,
  `getContactForm`, `getFooter`). Componentes só conhecem essas funções.
- **Formato de texto:** strings **Markdown**, nunca JSX. Dois renderers em
  `components/ui/RichText.tsx`: `RichText` (bloco) e `InlineText` (inline-only —
  `*ênfase*`, `**forte**`, links, e `\n` → quebra de linha). `InlineText`
  substitui todo o antigo `<>…<em>…</em></>`.
- **Imagem:** tipo único `ImageRef` (`slotId`, `alt`, `placeholder`, e `src?`
  opcional). `ImageSlot` renderiza `next/image` quando há `src`; senão, mantém o
  placeholder. `next.config.ts` já libera `cdn.sanity.io`.
- **Seções viram Server Components `async`** que leem de `lib/content`.
- `lib/data.tsx` foi **removido** (substituído por `lib/content/source.local.ts`,
  `.ts` puro, sem JSX).

Funções `async` desde já (mesmo lendo local), pela mesma razão do ADR 0001: a
borda de I/O do CMS não muda assinaturas depois.

### Etapa 2 — Integração Sanity (futura, isolada)

CMS escolhido: **Sanity** (free tier generoso, Studio hospedado grátis, pipeline
de imagem nativo via CDN + transformações, rich text inline que cobre os
destaques do design).

- Adicionar `lib/content/source.cms.ts` e `lib/news/source.cms.ts` (queries
  GROQ) e trocar **só o import** dentro de cada `index.ts`. Nenhum componente ou
  página muda.
- Schema em `sanity/`: singleton `siteContent` (nav, hero, manifesto, stats,
  contact, footer, heads das seções) + coleções `project`, `coordinator`,
  `galleryItem`, `news`.
- Sanity Studio embutido em `app/studio/[[...tool]]/page.tsx` para os
  pesquisadores editarem no navegador.
- Imagem: `@sanity/image-url` preenche `ImageRef.src`.
- Revalidação: ISR por tag + webhook do Sanity chamando `revalidateTag`.

## Consequências

**Positivas**
- 100% do texto e das imagens passam por uma única superfície trocável.
- A migração para o Sanity fica isolada a dois arquivos de adapter.
- O JSX-nos-dados deixou de existir; o modelo já antecipa o shape do CMS.

**Negativas / custos**
- Uma indireção a mais que hardcodar (custo aceito — não reescrever UI depois).
- Convenção de formatação inline em Markdown (`*itálico*`, `\n`) que editores
  precisam conhecer; mapeia para o rich text do Sanity na Etapa 2.

## Alternativas consideradas

- **Manter JSX nos dados / hardcode nos componentes.** Rejeitada: não é editável
  por CMS (bloqueador central).
- **Outros CMS:** Notion (URLs de imagem expiram, formatação limitada) e
  Git-based/TinaCMS (sem CDN de imagem nativo). Sanity escolhido pelo melhor
  conjunto imagem + rich text + Studio hospedado no free tier.
- **Integrar o Sanity agora.** Adiada para a Etapa 2 para entregar primeiro a
  refatoração agnóstica, que vale para qualquer provedor.
