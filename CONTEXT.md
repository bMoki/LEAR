# CONTEXT — Glossário do site LEAR

Linguagem ubíqua do projeto. Apenas definições de termos do domínio —
sem detalhes de implementação. Quando um termo aqui conflitar com o uso no
código ou numa conversa, este arquivo é a fonte da verdade até ser revisado.

---

## Notícia

Post curto e avulso publicado a qualquer momento (ex.: "saímos a campo",
"novo edital aberto", "palestra na próxima semana"). Tem **título**
(obrigatório), texto, imagem e **autor** (quem escreveu).

- Não confundir com **Boletim**: a Notícia é avulsa e contínua, não periódica.
- Não confundir com **Publicação**: a Notícia é divulgação informal, não
  produção acadêmica.

A Notícia **não se liga a Projeto**. Ela é avulsa também nesse sentido: um
congresso, um edital, uma expedição e um artigo aceito são todos Notícia, e não
existe estrutura que os agrupe. Se um texto de notícia menciona um projeto, é
menção no texto — não é relação do domínio.

## Feed de notícias

Lista de **Notícias** ordenada da mais recente para a mais antiga, exibida na
página principal. Cada item mostra título, prévia de imagem e data de
publicação; ao ser clicado, abre o texto principal da Notícia.

## Projeto

Frente de pesquisa do laboratório, com **assunto próprio** — um táxon, um
bioma, uma pergunta. Tem título, situação (em campo, em análise, concluído),
período, bioma, financiador e **Responsável**.

- Não confundir com **Publicação**: o Projeto é a investigação em curso; a
  Publicação é um resultado dela, já submetido a pares.
- Não confundir com **Notícia**: são conceitos independentes, sem relação no
  modelo. Uma Notícia pode mencionar um projeto no texto, e isso não cria
  vínculo nenhum.

## Táxon (de Projeto)

O grupo estudado por um **Projeto**, nomeado de duas formas: o **nome
científico** (*Liolaemus occipitalis*) e os **nomes populares**
(lagarto-da-areia, lagartinho-das-dunas). As duas formas convivem — não é
uma escolha entre elas.

Existe porque o laboratório e o público chamam o mesmo animal por nomes
diferentes, e o site precisa atender aos dois. É **opcional**: um Projeto sem
Táxon informado é um Projeto válido.

## Responsável (de Projeto)

Pessoa que lidera um **Projeto**, informada como **nome em texto livre** —
mesma regra do **Autor (de Notícia)**, e pelo mesmo motivo: quem lidera uma
frente não é necessariamente alguém da equipe cadastrada do site.

## Boletim

Periódico fechado do laboratório, com quatro edições por ano ("Boletim
trimestral"). Conceito distinto da **Notícia** — permanece como está hoje.

## Publicação

Produção acadêmica do laboratório, já submetida a pares: **artigo**, **livro**
ou **capítulo de livro**. Conceito distinto da **Notícia**, que é divulgação
informal, e do **Projeto**, que é a investigação em curso — a Publicação é
resultado dela.

A Publicação é guardada como **referência em texto corrido** — a citação
inteira, do jeito que sai do Lattes. Só o **ano**, o **tipo** e o **link** são
campos à parte, porque são o que ordena, agrupa e vira endereço clicável.

## Autor (de Notícia)

Pessoa que escreveu uma **Notícia**, informada como **nome em texto livre**.
Não é necessariamente alguém da equipe cadastrada do site — qualquer pessoa do
laboratório pode assinar uma Notícia.

## Espécie

Uma espécie de anfíbio ou réptil da herpetofauna catarinense, no acervo que o
laboratório mantém — historicamente chamado de **Herpetoteca**.

Tem **nome científico** (o binômio, obrigatório) e **nomes populares** (vários,
opcionais). As duas formas convivem, e não é escolha entre elas: o público
digita "cobra dormideira", o pesquisador escreve *Sibynomorphus neuwiedii*, e o
site precisa atender aos dois. Mesma regra do **Táxon (de Projeto)**.

Classifica-se por **grupo** (anfíbio ou réptil), **ordem**, **família** e
**subfamília**, e pode ter ficha — habitat, descrição, reprodução,
distribuição, grau de ameaça e referências.

Quase tudo é opcional de propósito. Uma Espécie com nome, família e foto já é
um registro válido: o acervo tem centenas assim e duas com ficha completa.

- Não confundir com **Táxon (de Projeto)**: o Táxon é o assunto de um Projeto,
  escrito em texto livre no próprio Projeto. A Espécie é um registro do acervo,
  com endereço próprio. Não existe relação entre os dois no modelo.

## Local

Recorte geográfico onde o laboratório levantou herpetofauna — uma unidade de
conservação, uma ilha, o estado inteiro. Uma **Espécie** registra em quais
Locais ocorre, e é isso que monta a lista de cada Local.

- Não confundir com **bioma** (de Projeto): bioma é classificação ecológica
  ("Mata Atlântica"); Local é lugar com limite definido no mapa.

## Página

Texto institucional que existe por si e não é Notícia, Projeto nem Espécie — a
coleção herpetológica, o programa de extensão, as visitas de escolas.

É deliberadamente o **escape** do modelo: tem título, endereço e texto, e nada
mais. Nada numa Página é indexado por assunto, filtrado ou relacionado. Um
conteúdo que precise disso pede tipo próprio.
