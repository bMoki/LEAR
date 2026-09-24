# 0005 — Estrutura do site para busca: Projeto vira rota, metadados derivados

- **Status:** Aceito
- **Data:** 2026-08-06
- **Contexto:** [CONTEXT.md](../../CONTEXT.md) · depende do
  [ADR 0004](./0004-site-responsivo.md) · estende o modelo de conteúdo do
  [ADR 0003](./0003-integracao-sanity-executada.md)

## Contexto

O site estava pronto para ser editado e não estava pronto para ser encontrado.
O levantamento do estado inicial:

- Todo o conteúdo que não é Notícia mora numa **única URL**. Os cinco links do
  menu são âncoras (`#projetos`, `#coords`, `#galeria`, `#contato`), não rotas.
- `/noticias/[slug]` **não exporta `generateMetadata`**. As cinco notícias
  herdam o título e a descrição da home — na busca, sairiam indistinguíveis.
- Não existem `sitemap.ts`, `robots.ts`, `opengraph-image`, favicon nem dado
  estruturado. `metadata` tem só `title` e `description`, sem `metadataBase`.
- Nenhuma das 14 imagens do CMS tem foto enviada, então todo link
  compartilhado gera card vazio.

O Google ranqueia páginas, não sites: cada URL disputa sozinha. Uma página que
fala de serpentes, lagartos, equipe, galeria e contato ao mesmo tempo não é a
melhor resposta para nenhuma consulta específica.

## Decisão

### Público-alvo, e o que ele exclui

O site otimiza para três públicos, nesta ordem de esforço: **estudantes**
procurando laboratório, **público geral e imprensa**, e **fomento e
institucional**.

**Pesquisador internacional ficou de fora, e essa é a decisão de maior
consequência aqui:** o site é monolíngue em pt-BR. Sem versão em inglês, sem
`hreflang`. É o maior alcance possível para um laboratório e também o maior
custo recorrente — dobra o conteúdo a manter, e o conteúdo já é escasso.

Consequência do público geral ter entrado: o vocabulário do site (`Liolaemus`,
`Tropidurus`, viperídeos, elapídeos, cecílias) é correto e é vocabulário que
ninguém digita. Daí o **Táxon** com nomes populares (ver `CONTEXT.md`).

Nota realista: a sigla "LEAR" não é consulta vencível — disputa com a Lear
Corporation e com Edward Lear. A consulta institucional a perseguir é
"Laboratório de Ecologia de Anfíbios e Répteis" e variações com
"herpetologia".

### Projeto vira rota — e o risco assumido nisso

`Projeto` passa a ser assunto de primeira classe, com **slug próprio e
estável** — mesma regra da Notícia, cujo tipo já documenta a intenção: *"editar
o título não muda a URL"*.

A página reúne campos tipados (bioma, financiador, período, Responsável,
Táxon, situação), a foto, a descrição atual e um corpo em texto longo que é
**opcional**.

**Risco declarado, e é o ponto fraco desta decisão.** O modelo atual tem 18 a
26 palavras por projeto. A recomendação original se apoiava num segundo pilar —
agregar na página do projeto as Notícias ligadas a ele, o que a faria crescer
sozinha sem ninguém escrever. Esse pilar caiu: **Notícia e Projeto são
conceitos independentes**, e a correlação observada no `seed-data.json` (uma
notícia sobre *Liolaemus*, outra sobre o inselberg, outra sobre *Tropidurus*) é
coincidência do conteúdo de exemplo, não relação do domínio.

Sem ele, a página de projeto é uma **página de entidade**: título, foto e uma
tabela de fatos. Continua legítima — táxon, bioma, período e financiador são
texto único e servem consulta de cauda longa como "projeto lagarto inselberg
São Francisco" — mas o teto é mais baixo do que o previsto quando a decisão foi
tomada, e ela passa a depender de o corpo opcional ser preenchido para competir
por qualquer coisa disputada. Se em seis meses os corpos continuarem vazios e o
Search Console não mostrar impressão nessas URLs, a decisão certa é reverter e
devolver os projetos à landing.

`/equipe/[slug]`, `/publicacoes` e `/boletim` foram considerados e ficaram de
fora desta fase. Publicação e Boletim seguem no `CONTEXT.md` como termos do
domínio sem representação no site.

### Notícia: otimizada isoladamente

A Notícia não depende de Projeto nem de nenhuma outra entidade. É a parte do
site com mais texto real (~900 a 1100 caracteres de corpo, contra 20 palavras
de um projeto), a que já tem slug estável e a que cresce sozinha. **É o ativo
de busca mais forte que o site tem hoje**, e é tratada por conta própria.

Já está correto e não se mexe: o cliente do Sanity usa
`perspective: "published"`, então rascunho nunca é indexado — o que importa
porque o dataset é público; as queries filtram `defined(slug.current)`; e
`NewsArticle` já emite `<article>`, um `<h1>` único e `<time dateTime>` em ISO.

O que muda:

- **`generateMetadata` em `/noticias/[slug]`**, que hoje não existe — as cinco
  notícias herdam título e descrição da home e sairiam indistinguíveis na
  busca. Título derivado do título da notícia (sem os asteriscos de Markdown),
  descrição do "Resumo" ou do início do corpo, mais `canonical`.
- **`openGraph` do tipo `article`**, com `publishedTime`, `modifiedTime` e
  `authors` — é o que faz o link compartilhado mostrar data e assinatura.
- **JSON-LD `NewsArticle`**: `headline`, `image`, `datePublished`,
  `dateModified`, `author` como `Person` (nome, sem URL — Pessoa não tem página)
  e `publisher` como a organização do laboratório.
- **`BreadcrumbList`** (Início › Notícias › título). É o único dado estruturado
  desta lista que muda a aparência do resultado na busca: troca a URL crua pela
  trilha.
- **`_updatedAt` entra nas três queries de notícia.** Nenhuma traz hoje, e sem
  ele não há `dateModified` no JSON-LD nem `lastModified` no sitemap.
- **`generateStaticParams`**, para as notícias serem pré-renderizadas.
- **`/noticias` ganha `<h1>` e metadados próprios.** Hoje a página não tem
  `<h1>` nenhum: `SectionHead` emite `<h2>` e `NewsCard` emite `<h3>`, então a
  hierarquia começa no nível 2.
- **Ligação interna entre notícias**, ao pé do artigo — as mais recentes, por
  data. Sem Projeto para agrupá-las, nada liga uma notícia a outra hoje, e
  página órfã é página mal rastreada. Ordem cronológica não exige campo novo
  nem trabalho editorial. Se um dia fizer sentido agrupar por assunto, o
  caminho é um campo de tema na Notícia — deliberadamente fora desta fase.

### Nenhum campo de SEO bloqueia a publicação

Princípio que atravessa todas as escolhas de modelagem aqui: o valor padrão é
sempre derivado do conteúdo, e o campo manual é sempre override opcional.

- **Título** = título do documento, com os asteriscos de Markdown removidos,
  mais o sufixo do laboratório. Aviso (não erro) no Studio acima de ~55
  caracteres.
- **Descrição** = campo "Resumo" se preenchido; senão, o início do corpo. O
  `excerpt` já existia de ponta a ponta — schema, GROQ, adapter e tipo — vazio e
  sem nenhum consumidor, declarado no Studio como "reservado para uso futuro".
  Esta é a finalidade.
- **Táxon** e **corpo do projeto** são opcionais.

A remoção dos asteriscos não é detalhe: os quatro títulos de projeto contêm
Markdown inline (`Serpentes *crípticas* da Serra do Mar`), que um `<title>` não
interpreta. Já houve esse vazamento em produção uma vez, com `17*+*`.

### Card social: foto quando houver, gerado quando não

`og:image` usa a foto do documento. Sem foto — que é o estado de 14 slots em 14
hoje — o card é desenhado com `next/og` a partir do título e da marca. Funciona
sem foto nenhuma e melhora sozinho conforme as fotos chegam.

### Medição sem abrir a CSP

**Search Console apenas, verificado por registro TXT no DNS.** Nenhum analytics
de terceiro entra no site: a CSP de `next.config.ts` continua com
`script-src 'self'`, preservando o que a revisão de segurança do repositório
(§5, fora do git) registrou como benefício — *"impede script de origem
externa"*. Uma tag do Google
Analytics exigiria abrir `googletagmanager.com` e `google-analytics.com`.

O Search Console cobre o que SEO precisa medir (consultas, impressões, cliques,
CTR, posição, indexação, Core Web Vitals de campo) e não usa script. Efeito
colateral: sem cookie de terceiro, não há banner de consentimento a construir.

### Pessoa continua texto livre

O Responsável de Projeto é nome em texto livre, seguindo o precedente já
estabelecido para o Autor de Notícia. O levantamento confirmou que a distinção
é real e não teórica: Renata Holanda lidera um projeto e assina uma notícia,
mas não está entre os três coordenadores cadastrados. Sem `/equipe/[slug]`, uma
entidade Pessoa não teria URL e não renderia ganho de busca.

## Consequências

**Positivas**
- Sai de 1 URL rankeável para 1 + N projetos + N notícias, cada uma com assunto
  próprio, título próprio e descrição própria.
- As notícias — a parte do site com texto de verdade — deixam de ser
  indistinguíveis entre si na busca, que é o defeito mais caro do estado atual.
- O `excerpt` deixa de ser campo órfão.

**Negativas / custos**
- O schema de `project` muda bastante (slug, imagem, campos tipados) e o
  conteúdo existente precisa ser migrado.
- Slug é compromisso permanente: uma vez indexado, mudar exige redirecionamento.
- **A página de projeto é o ponto fraco.** Sem o vínculo com Notícia, ela não
  cresce sozinha: um projeto sem corpo escrito continua sendo uma tabela de
  fatos. Ver o risco declarado acima, com o critério de reversão.
- Sem analytics, não há dado de comportamento dentro do site — só o que a busca
  mostra até o clique.

## Alternativas consideradas

- **Manter tudo na landing única.** Concentra autoridade numa URL e evita
  páginas rasas, mas abre mão de busca por bioma, espécie e método — que era a
  razão de otimizar.
- **Só publicar projeto com ~300 palavras escritas.** Melhor teto por página,
  mas deixa o site parado esperando texto que ninguém tinha prazo para escrever.
- **Um breakpoint mobile só**, em vez do responsivo do ADR 0004.
- **Analytics de primeira mão sem cookie** (Vercel Analytics). Abriria a CSP
  para uma origem só e dispensaria banner, mas amarra o site à hospedagem por
  um dado que o Search Console já não fornece.

## Pendências que dependem de decisão externa

Registradas em `PENDENCIAS.md`, porque não dependem de código:

- **O endereço definitivo do site não existe.** Domínio próprio ou subdomínio
  da universidade — para o código não muda nada (`NEXT_PUBLIC_SITE_URL`), mas a
  escolha tem prazo: trocar depois de indexado é migração de domínio.
- Cadastro no Search Console e envio do sitemap.
- Envio das fotos reais, sem as quais os cards sociais seguem sendo gerados.
