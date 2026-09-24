/**
 * Endereços do site antigo (WordPress em `herpetologia.ufsc.br`) para os do
 * site novo. **Gerado** por `npx tsx scripts/wp/redirects.ts` — não editar à mão.
 *
 * O WordPress servia tudo na raiz; aqui notícia e projeto ganharam prefixo, e
 * alguns slugs encolheram no corte de 96 caracteres do ADR 0005. Sem esta
 * tabela, a troca de DNS transforma os links indexados em 404.
 *
 * `permanent: true` emite **308**, que instrui o buscador a transferir o sinal
 * da URL antiga para a nova — é o que preserva 15 anos de indexação.
 */
export type LegacyRedirect = {
  source: string;
  destination: string;
  permanent: boolean;
};

export const legacyRedirects: LegacyRedirect[] = [
  { source: "/2377-2", destination: "/projetos/2377-2", permanent: true },
  { source: "/anfibios", destination: "/projetos/lista-de-especies-dos-anfibios-e-repteis-do-parque-nacional-de-sao-joaquim", permanent: true },
  { source: "/anfibios-ilha-de-santa-catarina-florianopolis", destination: "/projetos/lista-de-especies-dos-anfibios-e-repteis-da-ilha-de-santa-catarina-florianopolis", permanent: true },
  { source: "/anfibios-ilha-do-arvoredo", destination: "/projetos/lista-de-especies-dos-anfibios-e-repteis-da-reserva-biologica-marinha-do-arvoredo", permanent: true },
  { source: "/anfibios-parque-estadual-da-serra-do-tabuleiro", destination: "/projetos/lista-de-especies-dos-anfibios-e-repteis-do-parque-estadual-da-serra-do-tabuleiro", permanent: true },
  { source: "/avaliacao-e-monitoramento-da-biodiversidade-do-parque-nacional-de-sao-joaquim-santa-catarina-brasil", destination: "/projetos/avaliacao-e-monitoramento-da-biodiversidade-do-parque-nacional-de-sao-joaquim-santa-catarina", permanent: true },
  { source: "/colaboradores", destination: "/#coords", permanent: true },
  { source: "/colecao", destination: "/colecao-herpetologica", permanent: true },
  { source: "/conversacao-dos-sapinhos-da-montanha-brachycephalus-spp-do-sul-do-brasil", destination: "/projetos/conversacao-dos-sapinhos-da-montanha-brachycephalus-spp-do-sul-do-brasil", permanent: true },
  { source: "/diagnostico-socioambiental-para-criacao-de-unidade-de-conservacao-na-vila-da-gloria-sao-f-do-sul-sc", destination: "/projetos/diagnostico-socioambiental-para-criacao-de-unidade-de-conservacao-na-vila-da-gloria-sao-f-do", permanent: true },
  { source: "/dna-ambiental-usando-insetos-hematofagos-na-conservacao-de-anfibios-anuros-da-mata-atlantica", destination: "/projetos/dna-ambiental-usando-insetos-hematofagos-na-conservacao-de-anfibios-anuros-da-mata-atlantica", permanent: true },
  { source: "/doutorado", destination: "/#coords", permanent: true },
  { source: "/e-a-herpeto-ufsc-vira-noticia", destination: "/noticias/e-a-herpeto-ufsc-vira-noticia", permanent: true },
  { source: "/estudo-da-interacao-entre-insetos-parasitas-e-seus-vertebrados-hospedeiros", destination: "/projetos/estudo-da-interacao-entre-insetos-parasitas-e-seus-vertebrados-hospedeiros", permanent: true },
  { source: "/galeria", destination: "/#galeria", permanent: true },
  { source: "/graduacao", destination: "/#coords", permanent: true },
  { source: "/guia-dos-anfibios-anuros-da-ilha-de-santa-catarina", destination: "/noticias/guia-dos-anfibios-anuros-da-ilha-de-santa-catarina", permanent: true },
  { source: "/guia-dos-repteis-da-ilha-de-santa-catarina", destination: "/noticias/guia-dos-repteis-da-ilha-de-santa-catarina", permanent: true },
  { source: "/lancamento-livro-o-parque-das-memorias-infinitas", destination: "/noticias/lancamento-livro-o-parque-das-memorias-infinitas", permanent: true },
  { source: "/lancamento-livro-ofidismo-em-santa-catarina", destination: "/noticias/lancamento-livro-ofidismo-em-santa-catarina", permanent: true },
  { source: "/lista-de-especies-dos-anfibios-e-repteis-da-ilha-de-santa-catarina-florianopolis", destination: "/projetos/lista-de-especies-dos-anfibios-e-repteis-da-ilha-de-santa-catarina-florianopolis", permanent: true },
  { source: "/lista-de-especies-dos-anfibios-e-repteis-da-reserva-biologica-marinha-do-arvoredo", destination: "/projetos/lista-de-especies-dos-anfibios-e-repteis-da-reserva-biologica-marinha-do-arvoredo", permanent: true },
  { source: "/lista-de-especies-dos-anfibios-e-repteis-do-parque-estadual-da-serra-do-tabuleiro", destination: "/projetos/lista-de-especies-dos-anfibios-e-repteis-do-parque-estadual-da-serra-do-tabuleiro", permanent: true },
  { source: "/lista-de-especies-dos-anfibios-e-repteis-do-parque-nacional-de-sao-joaquim", destination: "/projetos/lista-de-especies-dos-anfibios-e-repteis-do-parque-nacional-de-sao-joaquim", permanent: true },
  { source: "/membros", destination: "/#coords", permanent: true },
  { source: "/monitoramento-acustico-automatizado-em-larga-escala-de-anfibios-anuros", destination: "/projetos/monitoramento-acustico-automatizado-em-larga-escala-de-anfibios-anuros", permanent: true },
  { source: "/monitoramento-de-boana-poaju", destination: "/projetos/monitoramento-de-boana-poaju", permanent: true },
  { source: "/noticia-ischnocnema-manezinho", destination: "/noticias/noticia-ischnocnema-manezinho", permanent: true },
  { source: "/novidades", destination: "/noticias", permanent: true },
  { source: "/pagina-inicial", destination: "/", permanent: true },
  { source: "/pesquisadores", destination: "/#coords", permanent: true },
  { source: "/pos-doutorado", destination: "/#coords", permanent: true },
  { source: "/prof-responsavel", destination: "/#coords", permanent: true },
  { source: "/programa-herpeto-sem-fronteiras", destination: "/herpeto-sem-fronteiras", permanent: true },
  { source: "/projeto-ppbio-na-midia-2", destination: "/noticias/projeto-ppbio-na-midia-2", permanent: true },
  { source: "/projetos2", destination: "/projetos", permanent: true },
  { source: "/publicacoes", destination: "/noticias", permanent: true },
  { source: "/rede-de-pesquisa-em-bioacustica", destination: "/projetos/rede-de-pesquisa-em-bioacustica", permanent: true },
  { source: "/repteis", destination: "/projetos/lista-de-especies-dos-anfibios-e-repteis-do-parque-nacional-de-sao-joaquim", permanent: true },
  { source: "/repteis-ilha-de-santa-catarina", destination: "/projetos/lista-de-especies-dos-anfibios-e-repteis-da-ilha-de-santa-catarina-florianopolis", permanent: true },
  { source: "/sapos-serpentes-e-lagartos-da-colecao-herpetologica-da-ufsc-porque-eles-sao-importantes-para-a-divulgacao-e-conhecimento-da-fauna-catarinense", destination: "/projetos/sapos-serpentes-e-lagartos-da-colecao-herpetologica-da-ufsc-porque-eles-sao-importantes-para-a", permanent: true },
];
