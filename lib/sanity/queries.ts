import { defineQuery } from "next-sanity";

/**
 * Todas as GROQ do site, em `defineQuery` para o `sanity typegen` conseguir
 * inferir o tipo de retorno de cada uma (ver `npm run typegen`).
 *
 * A projeção de imagem aparece repetida em vez de extraída num fragmento: o
 * typegen só lê strings literais, então interpolar uma constante desligaria a
 * checagem justamente onde ela é mais útil. Forma canônica em
 * `lib/sanity/image.ts`.
 *
 * As tags de cache de cada query estão em `lib/sanity/tags.ts`.
 */

/**
 * A edição mais recente de qualquer conteúdo que a home mostra — vira o
 * `lastmod` de `/` no sitemap. A home agrega vários tipos de documento, então
 * a data dela não sai de um documento só.
 */
export const siteUpdatedAtQuery = defineQuery(
  `*[_type in ["siteSettings", "homePage", "contactSection", "sectionHead",
    "project", "coordinator", "galleryItem", "news"]]
  | order(_updatedAt desc)[0]._updatedAt`
);

export const siteSettingsQuery = defineQuery(`*[_type == "siteSettings"][0]{
  brandName,
  brandTag,
  navLinks[]{ label, href, pin },
  footerText,
  footerColumns[]{ title, links[]{ label, href } },
  footerFine
}`);

export const homePageQuery = defineQuery(`*[_type == "homePage"][0]{
  hero{
    margin,
    eyebrow,
    titleLines,
    squiggleWord,
    lede,
    ctas[]{ label, href },
    polaroid{
      caption,
      stamp,
      image{
        alt,
        placeholder,
        image{ ..., asset->{ _id, metadata { dimensions, lqip } } }
      }
    }
  },
  stats[]{ num, lbl },
  manifesto{ quote, sig }
}`);

export const sectionHeadsQuery = defineQuery(`*[_type == "sectionHead"]{
  key,
  kicker,
  title,
  blurb
}`);

/**
 * A lista de projetos — cartões da home e da rota `/projetos`.
 *
 * Não traz `body` nem os campos de táxon: nenhum dos dois aparece num cartão, e
 * o corpo é o campo mais pesado do documento. Quem precisa deles é
 * `projectBySlugQuery`.
 *
 * `defined(slug.current)` pela mesma razão que na Notícia: projeto sem endereço
 * não pode virar link nem entrar no sitemap.
 */
export const projectsQuery = defineQuery(`*[_type == "project" && defined(slug.current)]
  | order(orderRank){
  _id,
  _updatedAt,
  number,
  status,
  title,
  "slug": slug.current,
  description,
  bioma,
  responsavel,
  periodoInicio,
  periodoFim,
  financiador,
  image{
    alt,
    placeholder,
    image{ ..., asset->{ _id, metadata { dimensions, lqip } } }
  }
}`);

export const projectBySlugQuery = defineQuery(`*[_type == "project" && slug.current == $slug][0]{
  _id,
  _updatedAt,
  number,
  status,
  title,
  "slug": slug.current,
  description,
  bioma,
  taxonCientifico,
  taxonPopular,
  responsavel,
  periodoInicio,
  periodoFim,
  financiador,
  body,
  image{
    alt,
    placeholder,
    image{ ..., asset->{ _id, metadata { dimensions, lqip } } }
  }
}`);

/**
 * Páginas institucionais. Só o que o índice e o sitemap precisam — o corpo é
 * o campo mais pesado do documento e não é lido em lista.
 */
export const pagesQuery = defineQuery(`*[_type == "page" && defined(slug.current)]
  | order(title asc){
  _id,
  _updatedAt,
  title,
  "slug": slug.current,
  subtitle,
  excerpt
}`);

export const pageBySlugQuery = defineQuery(`*[_type == "page" && slug.current == $slug][0]{
  _id,
  _updatedAt,
  title,
  "slug": slug.current,
  subtitle,
  excerpt,
  body,
  image{
    alt,
    placeholder,
    image{ ..., asset->{ _id, metadata { dimensions, lqip } } }
  }
}`);

export const coordinatorsQuery = defineQuery(`*[_type == "coordinator"] | order(orderRank){
  _id,
  name,
  role,
  caption,
  bio,
  lines,
  image{
    alt,
    placeholder,
    image{ ..., asset->{ _id, metadata { dimensions, lqip } } }
  }
}`);

export const galleryQuery = defineQuery(`*[_type == "galleryItem"] | order(orderRank){
  _id,
  caption,
  stamp,
  image{
    alt,
    placeholder,
    image{ ..., asset->{ _id, metadata { dimensions, lqip } } }
  }
}`);

export const contactSectionQuery = defineQuery(`*[_type == "contactSection"][0]{
  heading,
  body,
  rows[]{ label, value, note },
  form{
    heading,
    nameLabel, namePlaceholder,
    orgLabel, orgPlaceholder,
    emailLabel, emailPlaceholder,
    subjectLabel, subjectOptions[]{ value, label },
    messageLabel, messagePlaceholder,
    note, submitLabel, sendingLabel, sentLabel, sentMessage
  }
}`);

export const allNewsQuery = defineQuery(`*[_type == "news" && defined(slug.current)]
  | order(publishedAt desc){
  _id,
  _updatedAt,
  title,
  "slug": slug.current,
  author,
  publishedAt,
  excerpt,
  body,
  image{
    alt,
    placeholder,
    image{ ..., asset->{ _id, metadata { dimensions, lqip } } }
  }
}`);

export const recentNewsQuery = defineQuery(`*[_type == "news" && defined(slug.current)]
  | order(publishedAt desc)[0...$limit]{
  _id,
  _updatedAt,
  title,
  "slug": slug.current,
  author,
  publishedAt,
  excerpt,
  body,
  image{
    alt,
    placeholder,
    image{ ..., asset->{ _id, metadata { dimensions, lqip } } }
  }
}`);

export const newsBySlugQuery = defineQuery(`*[_type == "news" && slug.current == $slug][0]{
  _id,
  _updatedAt,
  title,
  "slug": slug.current,
  author,
  publishedAt,
  excerpt,
  body,
  image{
    alt,
    placeholder,
    image{ ..., asset->{ _id, metadata { dimensions, lqip } } }
  }
}`);
