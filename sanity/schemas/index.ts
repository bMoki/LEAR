import type { SchemaTypeDefinition } from "sanity";

import { contactRow } from "./objects/contactRow";
import { imageWithAlt } from "./objects/imageWithAlt";
import { link, navLink } from "./objects/link";

import { contactSection } from "./singletons/contactSection";
import { homePage } from "./singletons/homePage";
import { siteSettings } from "./singletons/siteSettings";

import { coordinator } from "./documents/coordinator";
import { galleryItem } from "./documents/galleryItem";
import { news } from "./documents/news";
import { project } from "./documents/project";
import { sectionHead } from "./documents/sectionHead";

/** Documentos que só existem uma vez — o Studio esconde o botão “criar novo”
 * e a ação de excluir para eles (ver `sanity.config.ts`). */
export const SINGLETON_TYPES = new Set(["siteSettings", "homePage", "contactSection"]);

/** `_id` fixo de cada singleton — igual ao nome do tipo, para o seed e a
 * estrutura do Studio apontarem sempre para o mesmo documento. */
export const SINGLETON_IDS = ["siteSettings", "homePage", "contactSection"] as const;

export const schemaTypes: SchemaTypeDefinition[] = [
  // objetos reutilizáveis
  imageWithAlt,
  link,
  navLink,
  contactRow,
  // documentos únicos
  siteSettings,
  homePage,
  contactSection,
  // coleções
  sectionHead,
  project,
  coordinator,
  galleryItem,
  news,
];
