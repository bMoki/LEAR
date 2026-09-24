import type { Conteudo } from "./extract";

/**
 * A moldura do site: menu, rodapé, abertura, cabeçalhos de seção e contato.
 *
 * **Este arquivo é o único da importação que contém texto escrito por nós.**
 * Todo o resto (`extract.ts`) transcreve o que existia no WordPress antigo;
 * aqui há redação. A separação é proposital: quando alguém for revisar o site
 * procurando o que é do laboratório e o que é nosso, é só este arquivo.
 *
 * A regra que orientou cada campo:
 *
 * - **Fato verificável do despejo** entra como está. `brandName` e `brandTag`
 *   são o `blogname`/`blogdescription` do WordPress; o título e o parágrafo de
 *   abertura são o texto da página inicial antiga.
 * - **Número** é contado do acervo importado, nunca arredondado para impressionar.
 * - **Texto de interface** (rótulo de menu, título de seção, rótulo de
 *   formulário) é redigido aqui, porque é embalagem e não afirmação.
 * - **Dado de contato não é inventado.** E-mail, telefone e endereço completo
 *   não constam do despejo, e um endereço plausível porém errado é pior que um
 *   campo vazio — alguém escreveria para o vazio achando que fala com o
 *   laboratório. Os campos ficam marcados para preenchimento.
 */

const A_PREENCHER = "— a preencher —";

/** O que precisa da mão de um pesquisador antes de o site ir ao ar. O import
 * imprime esta lista no fim para a pendência não passar despercebida. */
export const PENDENTE_DE_REVISAO = [
  "contactSection · e-mail, telefone e endereço completo do laboratório",
  "homePage · a foto da polaroid de abertura",
  "siteSettings · conferir se os links do rodapé apontam para os perfis certos",
];

export function moldura(c: Conteudo) {
  const key = (() => {
    let n = 0;
    return () => `m${(++n).toString(36)}`;
  })();

  const link = (label: string, href: string) => ({ _type: "link", _key: key(), label, href });

  const siteSettings = {
    _id: "siteSettings",
    _type: "siteSettings",
    // `blogname` e `blogdescription` do WordPress antigo — não é invenção nossa.
    brandName: "LEAR",
    brandTag: "Laboratório de Ecologia de Anfíbios e Répteis",
    navLinks: [
      { label: "Projetos", href: "#projetos" },
      { label: "Espécies", href: "#galeria" },
      { label: "Equipe", href: "#coords" },
      { label: "Notícias", href: "/noticias" },
      { label: "Contato", href: "#contato", pin: true },
    ].map((l) => ({ _type: "navLink", _key: key(), pin: false, ...l })),
    footerText:
      "Laboratório de Ecologia de Anfíbios e Répteis — Departamento de Ecologia e " +
      "Zoologia, Centro de Ciências Biológicas, Universidade Federal de Santa Catarina.",
    footerColumns: [
      {
        _type: "footerColumn",
        _key: key(),
        title: "Pesquisa",
        links: [link("Projetos", "#projetos"), link("Publicações", "#projetos")],
      },
      {
        _type: "footerColumn",
        _key: key(),
        title: "Acervo",
        links: [link("Espécies", "#galeria"), link("Equipe", "#coords")],
      },
      {
        _type: "footerColumn",
        _key: key(),
        title: "Contato",
        links: [link("Fale conosco", "#contato"), link("UFSC", "https://ufsc.br")],
      },
    ],
    footerFine: [
      "Universidade Federal de Santa Catarina · Florianópolis, Santa Catarina",
      "As fotografias são de autoria da equipe e de colaboradores, creditadas individualmente.",
    ],
  };

  // Números contados do que foi importado. Se o acervo crescer, crescem junto —
  // é o motivo de serem calculados aqui em vez de digitados.
  const stats = [
    { num: String(c.especies.length), lbl: "espécies catalogadas" },
    { num: String(c.publicacoes.length), lbl: "publicações" },
    { num: String(c.equipe.length), lbl: "pesquisadores" },
    { num: String(c.locais.length), lbl: "áreas de estudo" },
  ];

  const homePage = {
    _id: "homePage",
    _type: "homePage",
    hero: {
      margin: "§ 01",
      eyebrow: "UFSC · Florianópolis",
      // Texto da página inicial do site antigo, quebrado nas linhas que o
      // desenho pede. O conteúdo é deles; a quebra é nossa.
      titleLines: ["Ecologia de", "*anfíbios e répteis*"],
      squiggleWord: "em Santa Catarina",
      lede:
        "O LEAR é formado por professores e estudantes de graduação, mestrado, " +
        "doutorado, pós-mestrado e pós-doutorado que participam de diversos projetos " +
        "de pesquisa e divulgação científica, em diferentes áreas do estado de Santa " +
        "Catarina e do Brasil.",
      ctas: [link("Ver os projetos", "#projetos"), link("Conhecer a equipe", "#coords")],
      polaroid: {
        image: {
          _type: "imageWithAlt",
          alt: "",
          placeholder: "foto · anfíbio ou réptil em campo · vertical",
        },
        caption: "Campo em Santa Catarina",
        stamp: "acervo LEAR",
      },
    },
    stats: stats.map((s) => ({ _type: "stat", _key: key(), ...s })),
    manifesto: {
      quote:
        "Anfíbios e répteis são os primeiros a sentir o que muda numa paisagem. " +
        "Estudá-los é acompanhar, de perto e por muitos anos, o estado de saúde " +
        "dos ambientes onde vivem — e contar isso a quem não estava lá.",
      sig: "LEAR · UFSC",
    },
  };

  const CABECALHOS: { key: string; kicker: string; title: string; blurb: string }[] = [
    {
      key: "projects",
      kicker: "§ 02 · pesquisas",
      title: "O que estamos\n*investigando*",
      blurb:
        "Frentes de pesquisa em andamento e concluídas, do monitoramento de uma " +
        "única espécie ao levantamento de uma unidade de conservação inteira.",
    },
    {
      key: "coordinators",
      kicker: "§ 03 · equipe",
      title: "Quem faz\n*o trabalho*",
      blurb:
        "Professores, colaboradores e estudantes de graduação, mestrado, doutorado " +
        "e pós-doutorado.",
    },
    {
      key: "gallery",
      kicker: "§ 04 · herpetoteca",
      title: "A fauna que\n*registramos*",
      blurb:
        "Anfíbios e répteis encontrados em Santa Catarina, com nome científico, " +
        "nome popular e foto. É o acervo que o laboratório mantém há anos.",
    },
    {
      key: "news",
      kicker: "§ 05 · notícias",
      title: "O que saiu\n*do laboratório*",
      blurb: "Publicações, lançamentos, campanhas de campo e o que mais aparecer.",
    },
    {
      key: "newsArchive",
      kicker: "arquivo",
      title: "Todas as\n*notícias*",
      blurb: "Da mais recente à mais antiga.",
    },
    {
      key: "contact",
      kicker: "§ 06 · contato",
      title: "Fale com\n*a gente*",
      blurb:
        "Para parcerias, visitas de escolas, dúvidas sobre um animal encontrado ou " +
        "interesse em fazer pesquisa no laboratório.",
    },
  ];

  const sectionHeads = CABECALHOS.map((h) => ({
    _id: `sectionHead-${h.key}`,
    _type: "sectionHead",
    ...h,
  }));

  const contactSection = {
    _id: "contactSection",
    _type: "contactSection",
    heading: "Fale com\n*a gente*",
    body:
      "Respondemos dúvidas sobre anfíbios e répteis, recebemos visitas de escolas " +
      "e conversamos sobre parcerias de pesquisa. Escreva contando o que você precisa.",
    rows: [
      // Os dois primeiros são fato: constam das biografias dos professores no
      // site antigo. Os dois últimos não constam de lugar nenhum do despejo.
      { label: "Instituição", value: "Departamento de Ecologia e Zoologia · CCB · UFSC" },
      { label: "Cidade", value: "Florianópolis, Santa Catarina" },
      { label: "E-mail", value: A_PREENCHER, note: "Não constava do site antigo." },
      { label: "Telefone", value: A_PREENCHER, note: "Não constava do site antigo." },
    ].map((r) => ({ _type: "contactRow", _key: key(), ...r })),
    form: {
      heading: "Escreva para o laboratório",
      nameLabel: "Nome",
      namePlaceholder: "Como podemos te chamar",
      orgLabel: "Instituição",
      orgPlaceholder: "Escola, universidade, empresa — ou deixe vazio",
      emailLabel: "E-mail",
      emailPlaceholder: "para onde respondemos",
      subjectLabel: "Assunto",
      subjectOptions: [
        { value: "pesquisa", label: "Pesquisa e parcerias" },
        { value: "visita", label: "Visita de escola ou grupo" },
        { value: "especie", label: "Dúvida sobre um animal" },
        { value: "imprensa", label: "Imprensa" },
        { value: "outro", label: "Outro assunto" },
      ].map((o) => ({ _type: "subjectOption", _key: key(), ...o })),
      messageLabel: "Mensagem",
      messagePlaceholder: "Conte o que você precisa",
      note: "Respondemos em dias úteis.",
      submitLabel: "Enviar",
      sendingLabel: "Enviando…",
      sentLabel: "Enviado",
      sentMessage: "Recebemos sua mensagem. Obrigado!",
    },
  };

  return [siteSettings, homePage, contactSection, ...sectionHeads];
}
