/**
 * API pública de conteúdo — a única superfície que os componentes conhecem.
 *
 * A implementação vive em `source.cms.ts` (Sanity). Trocar de CMS um dia é
 * escrever outro `source.*.ts` e mudar o import desta linha; nenhum componente
 * ou página muda. Mesma razão e mesmo padrão de `lib/news`. Ver ADR 0002.
 *
 * As funções são assíncronas desde o começo — eram, mesmo quando liam um
 * arquivo local — justamente para que a chegada do CMS não mudasse assinatura
 * nenhuma. Foi o que aconteceu.
 */
export {
  getContactForm,
  getContactInfo,
  getCoordinators,
  getFooter,
  getGallery,
  getHero,
  getManifesto,
  getNav,
  getProjects,
  getSectionHead,
  getStats,
} from "./source.cms";
