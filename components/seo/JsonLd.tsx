import type { JsonLdNode } from "@/lib/seo/json-ld";

/**
 * Emite um bloco `application/ld+json`.
 *
 * **A CSP não atrapalha.** `script-src 'self' 'unsafe-inline'` já vale para o
 * site, e um bloco de dados não é script executável — o navegador nem tenta
 * rodá-lo. Nada precisou ser aberto em `next.config.ts` (ADR 0005).
 *
 * O `<` no lugar de `<` é a recomendação dos docs do Next instalado
 * (`json-ld.md:11`): `JSON.stringify` não escapa HTML, e uma string de conteúdo
 * contendo `</script>` fecharia a tag aqui dentro. Todo texto deste bloco vem
 * do CMS, cujo dataset é público — não é hipótese distante.
 */
export function JsonLd({ data }: { data: JsonLdNode }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
