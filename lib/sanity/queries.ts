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

export const projectsQuery = defineQuery(`*[_type == "project"] | order(orderRank){
  _id,
  number,
  status,
  title,
  description,
  pins[]{ label, warm }
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
    note, submitLabel, sentLabel
  }
}`);

export const allNewsQuery = defineQuery(`*[_type == "news" && defined(slug.current)]
  | order(publishedAt desc){
  _id,
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
