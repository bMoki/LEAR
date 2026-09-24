# 0006 — Importação do site antigo: quatro tipos novos e o fim do conteúdo de exemplo

- **Status:** Proposto
- **Data:** 2026-08-11
- **Contexto:** [CONTEXT.md](../../CONTEXT.md) · estende o modelo de conteúdo do
  [ADR 0003](./0003-integracao-sanity-executada.md) e a estrutura de rotas do
  [ADR 0005](./0005-estrutura-do-site-para-busca.md)

## Contexto

O dataset do Sanity nunca teve conteúdo de verdade. O que está lá veio do
`scripts/seed.ts`, e os textos são descrições de placeholder — bons para
desenhar a tela, inúteis para responder uma busca. O ADR 0005 montou toda a
estrutura de indexação em cima de páginas que não têm o que indexar.

Ao mesmo tempo existia um despejo do WordPress do site anterior
(`herpetologia.ufsc.br`, hospedado na UFSC), com 15 anos de trabalho do
laboratório. O levantamento do que ele contém:

- **3.009 registros** em `wp_posts`, dos quais só **67 são conteúdo**: 2.259 são
  revisões, 651 anexos e o resto menu e template do Elementor.
- **264 espécies** de anfíbios e répteis catalogadas em nove páginas de
  levantamento, com nome científico, nome popular, ordem, família, foto e
  crédito do fotógrafo.
- **70 publicações** acadêmicas de 1993 a 2024, separadas em artigos, livro e
  capítulos.
- **30 pessoas** da equipe, com biografia, retrato, e-mail e Lattes.
- 14 projetos, 7 notícias e cinco textos institucionais.
- As imagens **continuam servidas** pelo servidor da UFSC.

Medido em caracteres, **84% desse conteúdo não tinha onde morar** no schema:
541 KB de listas de espécies, Herpetoteca e Publicações contra 102 KB que
caberiam em `project`, `coordinator` e `news`. Importar só o que coubesse
significaria jogar fora o acervo e ficar com a moldura.

## Decisão

### Modelar antes de importar

Quatro tipos novos, nesta ordem de importância:

**`species`** — a antiga Herpetoteca, 267 documentos. É o tipo de maior alcance
do site inteiro, e a razão é a do ADR 0005 invertida: aquele ADR reconhece que
"LEAR" não é consulta vencível porque disputa com a Lear Corporation.
*"Brachycephalus actaeus"* e *"sapinho-pingo-de-ouro"* não disputam com
ninguém — e são 267 páginas delas.

Por isso **nomes populares são campo de primeira classe**, um array, não uma
nota no texto. O público digita "cobra dormideira"; o pesquisador escreve
*Sibynomorphus neuwiedii*. As duas formas convivem — é a mesma regra do Táxon
de Projeto, agora com peso próprio.

**`locality`** — os seis recortes geográficos com levantamento. No site antigo
cada lugar rendia duas páginas ("ANFÍBIOS (X)" e "RÉPTEIS (X)") com o mesmo
cabeçalho copiado. Aqui é um documento só; a separação por grupo é filtro de
exibição, não estrutura duplicada.

**`publication`** — os 70 títulos. Já estava no CONTEXT.md como termo do
domínio ("permanece como está hoje"), então isto é implementar o que já estava
descrito, não ampliar o escopo.

**`page`** — o escape: CHUFSC, Herpeto Sem Fronteiras, Visitas, Herpetoteca,
política de privacidade. Sem ele, cada texto solto viraria um tipo de um
documento só, ou um Projeto que não é projeto.

### A referência da Publicação é texto, não formulário

`publication` guarda a citação inteira num campo de texto, com apenas `year`,
`kind` e `url` extraídos ao lado.

A alternativa — autor, título, periódico, volume, número, páginas — dá um
formulário de dez campos que erra em toda publicação fora do padrão (*et al.*,
número especial, preprint, capítulo com organizador) e que ninguém preenche
direito. O pesquisador copia a referência pronta do Lattes; o formato de saída
já está certo na origem. `year` e `kind` existem porque são o que **ordena e
agrupa** a lista, e `url` porque vira link.

### Quase nada é obrigatório em `species`

Das 267 espécies, **duas** têm ficha completa (habitat, descrição, reprodução).
207 têm foto, 143 têm nome popular, 266 têm família.

Exigir a ficha para publicar transformaria 265 registros bons em zero. Uma
espécie com nome, família e foto já é uma página útil e já responde uma busca.
É o mesmo princípio do ADR 0005 — nenhum campo pode travar a publicação —
aplicado a um acervo real em vez de a um formulário hipotético.

Pelo mesmo motivo, `coordinator.caption` e `coordinator.lines` **deixaram de
ser obrigatórios**. As 30 fichas reais têm nome, foto e biografia; nenhuma tem
legenda manuscrita nem linhas de pesquisa separadas do texto corrido. Mantê-los
obrigatórios marcaria as 30 como inválidas no Studio — um alerta permanente que
só se resolve inventando o dado.

### Extrair e importar são dois programas

`scripts/wp/extract.ts` lê o despejo e escreve `content.json`. Não fala com a
rede nem com o Sanity. `scripts/wp/import.ts` lê esse JSON, sobe as imagens e
grava.

A separação existe porque a etapa que interpreta HTML de três construtores de
página diferentes é a que erra, e precisa poder rodar cem vezes, ser lida num
diff e ser corrigida sem nunca tocar no dataset.

Efeito colateral que vale por si: com `content.json` versionado, o despejo de
125 MB não precisa entrar no repositório, e a importação continua reproduzível
depois que o servidor da UFSC sair do ar.

### `mapa.ts` isola o julgamento

O site antigo não tinha tipos de conteúdo — **tudo era `page`**, e o que
distinguia uma espécie de um projeto era o menu em que a página estava
pendurada. Esse menu não sobreviveu à exportação de forma utilizável.

A correspondência foi levantada à mão e mora num arquivo só, comentado. É a
única parte da importação que é decisão em vez de regra, e quem for consertar
uma página na gaveta errada precisa saber onde olhar.

### A moldura é escrita, e fica num arquivo só

O acervo antigo tem espécies, projetos e pessoas; não tem menu, rodapé, títulos
de seção nem texto de abertura. Sem esses documentos o site **não renderiza** —
`lib/content/source.cms.ts` lança quando `siteSettings` ou `homePage` faltam.

Então a moldura é redigida por nós, e mora inteira em `scripts/wp/moldura.ts`
para que a fronteira entre "o que o laboratório disse" e "o que escrevemos"
seja um arquivo, não um julgamento caso a caso. As regras:

- Fato do despejo entra como está — `brandName` e `brandTag` são o
  `blogname`/`blogdescription` do WordPress; o parágrafo de abertura é o texto
  da página inicial antiga.
- Número é **contado** do acervo importado, nunca arredondado.
- Texto de interface é redigido, porque é embalagem e não afirmação.
- **Dado de contato não é inventado.** E-mail, telefone e endereço completo não
  constam do despejo. Um endereço plausível e errado é pior que um campo vazio:
  alguém escreveria para o vazio achando que fala com o laboratório. Ficam
  marcados `— a preencher —`, e o import lista a pendência ao terminar.

### Uma ponte para o que ainda não tem tela

Espécie, Publicação, Local e Página existem no Studio e no dataset, e não têm
rota. Sem nada, 87% do que foi importado seria invisível ao público por tempo
indeterminado.

`scripts/wp/compat.ts` projeta o acervo nos tipos que já têm tela: **Espécie →
Foto da galeria** e **Publicação → Notícia**.

É uma ponte, não o modelo, e o custo é real: uma Espécie tem ordem, família,
nomes populares, grau de ameaça e locais; uma Foto da galeria tem imagem,
legenda e selo. Nada disso fica filtrável enquanto for foto de galeria.

Por isso **os documentos ricos continuam sendo gravados** — eles são a fonte da
verdade, e os projetados são derivados e descartáveis. Para permitir desfazer,
cada projeção é rastreável: Notícia carrega `origin == "publicacao"`, Foto da
galeria usa `_id` com prefixo `gallery-sp-`. Quando `/especies` e
`/publicacoes` existirem, apagam-se os dois conjuntos e nada se perde.
`--sem-compat` desliga a projeção.

### O seed de exemplo foi apagado

`scripts/seed.ts`, `scripts/seed-data.json` e `scripts/markdown-to-portable-text.ts`
saíram do repositório. Eles criavam os documentos de exemplo com `_id` fixo
(`project-1`, `news-nova-especie-liolaemus-confirmada`), que a importação não
sobrescreve — conviveriam com os reais, e rodar o seed por engano reintroduziria
conteúdo inventado num dataset que passou a ter conteúdo verdadeiro.

### Campo obrigatório que a realidade não preenche deixa de ser obrigatório

`news.image`, `galleryItem.image`, `project.number`, `project.status`,
`coordinator.caption`, `coordinator.lines` e a polaroid da abertura passaram a
opcionais.

O critério não é "afrouxar por conveniência": é que **exigir um campo que o
acervo real não tem não produz o dado, produz centenas de documentos marcados
como inválidos no Studio** — um alerta permanente que só se resolve inventando.
Onde o valor existe, ele entra; onde não existe, o campo fica vazio e visível.

## Consequências

**As imagens têm prazo.** 648 fotos são baixadas do servidor da UFSC, que
responde hoje e não é nosso. A importação deveria rodar antes de qualquer
desligamento do site antigo — depois disso, `content.json` preserva os textos,
mas as fotos só existem em backup de terceiro.

**Rodar o import de novo sobrescreve.** Mesma ressalva do `seed.ts`, agora
sobre 399 documentos: `createOrReplace` com `_id` derivado do slug restaura o
estado do site antigo por cima do que houver. Enquanto o dataset só tem
conteúdo importado isso é inofensivo. Depois que um pesquisador escrever no
Studio, passa a apagar trabalho.

**Os endereços mudam, e por isso existe um mapa de redirecionamento.** O
WordPress servia tudo na raiz — `/{post_name}/` valia para página, notícia e
projeto igualmente. Aqui notícia e projeto ganham prefixo, e três slugs
encolhem no corte de 96 caracteres do ADR 0005. São 41 endereços indexados que
deixariam de responder na troca de DNS. `scripts/wp/redirects.ts` deriva o mapa
do **mesmo** `slugDe` que a importação usa, confere cada destino contra o
conteúdo importado e escreve `lib/seo/redirects.ts`, que o `next.config.ts`
serve como 308. Gerar, e não escrever à mão, é o que garante que os dois lados
usam a mesma conta.

Treze páginas ficam **de fora de propósito**: nove fichas de espécie, duas
listas estaduais e duas do Distrito do Saí. Todas viraram documentos `species`,
e nenhuma tem rota — redirecionar para destino sem relação seria pior que o
404, porque o buscador trata como *soft 404* e o leitor não descobre que o
conteúdo mudou de lugar. É mais um item na conta de `/especies` não existir.

**O site ainda não tem telas para o que foi importado.** `species`, `locality`,
`publication` e `page` existem no Studio e no dataset; `/especies/[slug]`,
`/locais/[slug]` e as listagens são trabalho seguinte. Até lá o conteúdo está
salvo e editável, mas não publicado — e o sitemap do ADR 0005 não os inclui.

**Quatro campos ficam vazios em todo projeto importado:** bioma, responsável,
período e financiador. O site antigo não os registrava. São opcionais por
decisão do ADR 0005, então nada quebra, mas as etiquetas do cartão nascem
pobres até alguém preencher.

**A numeração e a situação dos projetos são chute.** `number` sai da posição na
página e `status` recebe "em campo" para todos, porque o site antigo não
classificava. Ambos são obrigatórios no schema; ambos precisam de revisão
humana.

## Alternativas descartadas

**Importar só o que cabia no schema atual.** Descartada: entregaria 16% do
acervo e deixaria a herpetofauna — a parte com valor de busca real — no
`.sql`. A moldura já existia; o que faltava era conteúdo.

**Um tipo `page` genérico para tudo, sem `species`.** Descartada: 267 páginas
sem ordem, família, grupo ou local não podem ser filtradas nem agrupadas, e a
lista por Local (que o site antigo tinha) deixaria de existir. Um acervo que
precisa ser indexado por assunto pede tipo próprio.

**Quebrar a referência da Publicação em campos.** Ver acima.

**Rodar o `seed.ts` e o import juntos.** Descartada: o seed escreve `project-1`
… `project-N` e o import escreve `project-<slug>`, então os projetos de exemplo
sobreviveriam ao lado dos reais. O seed passa a ser histórico — ver PENDÊNCIAS.
