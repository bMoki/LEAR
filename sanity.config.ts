import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";

import { apiVersion, dataset, projectId, studioBasePath } from "./sanity/env";
import { SINGLETON_TYPES, schemaTypes } from "./sanity/schemas";
import { structure } from "./sanity/structure";

/**
 * Configuração do Sanity Studio embutido, servido em `/studio`
 * (`app/(studio)/studio/[[...tool]]/page.tsx`).
 *
 * Os singletons perdem “criar novo” e “excluir”: são documentos de `_id` fixo
 * que o site espera encontrar, e um segundo `homePage` deixaria a página inicial
 * ambígua.
 */
export default defineConfig({
  name: "lear",
  title: "LEAR — conteúdo do site",
  basePath: studioBasePath,

  projectId,
  dataset,

  plugins: [structureTool({ structure }), visionTool({ defaultApiVersion: apiVersion })],

  schema: {
    types: schemaTypes,
    templates: (prev) => prev.filter(({ schemaType }) => !SINGLETON_TYPES.has(schemaType)),
  },

  document: {
    actions: (prev, { schemaType }) =>
      SINGLETON_TYPES.has(schemaType)
        ? prev.filter(({ action }) =>
            action ? ["publish", "discardChanges", "restore"].includes(action) : false
          )
        : prev,
  },
});
