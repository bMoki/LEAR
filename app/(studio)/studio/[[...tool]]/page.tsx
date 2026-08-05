import Studio from "./Studio";

/**
 * Sanity Studio embutido, servido em `/studio`.
 *
 * Fica no grupo `(studio)` para não herdar o `globals.css`, o viewport de 1280
 * nem a `Topbar` do site — ver `app/(site)/layout.tsx`.
 *
 * `metadata` e `viewport` vêm do próprio next-sanity: trazem `robots: noindex`
 * (o painel não deve ser indexado) e o viewport responsivo que o Studio exige.
 * Precisam ser exportados daqui, de um Server Component — daí a separação em
 * `Studio.tsx`, que carrega a config do lado do cliente.
 */
export { metadata, viewport } from "next-sanity/studio";

export const dynamic = "force-static";

export default function StudioPage() {
  return <Studio />;
}
