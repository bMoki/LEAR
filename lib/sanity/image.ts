import { createImageUrlBuilder, type SanityImageSource } from "@sanity/image-url";
import type { ImageRef } from "@/lib/content/types";
import { dataset, projectId } from "@/sanity/env";
import type {
  SanityImageCrop,
  SanityImageDimensions,
  SanityImageHotspot,
} from "@/sanity/types.generated";

const builder = createImageUrlBuilder({ projectId, dataset });

/**
 * Largura máxima pedida ao CDN do Sanity. O maior slot do site é a foto do
 * artigo de notícia; 1400px cobre telas retina no layout fixo de 1280.
 */
const MAX_WIDTH = 1400;

/**
 * O que toda query precisa projetar num campo `imageWithAlt`. Espelha
 * exatamente o que o `sanity typegen` infere da projeção abaixo, repetida
 * literalmente em cada query de `queries.ts` — o typegen só lê strings
 * literais, então extrair um fragmento desligaria a checagem:
 *
 *     alt,
 *     placeholder,
 *     image{ ..., asset->{ _id, metadata { dimensions, lqip } } }
 */
export type ImageQueryResult = {
  alt: string | null;
  placeholder: string | null;
  image: {
    asset: {
      _id: string;
      metadata: {
        dimensions: SanityImageDimensions | null;
        lqip: string | null;
      } | null;
    } | null;
    hotspot?: SanityImageHotspot;
    crop?: SanityImageCrop;
    _type: "image";
  } | null;
} | null;

/**
 * Converte a imagem vinda do Sanity no `ImageRef` que os componentes já
 * conhecem. Sem foto enviada, devolve um `ImageRef` sem `src` — e o
 * `ImageSlot` segue mostrando o texto de placeholder, exatamente como o site
 * se comporta hoje.
 *
 * `slotId` vem do `_id` do documento (ou de uma chave estável do array), e não
 * de um campo digitado: ele é usado como `key` do React em Galeria e Equipe.
 */
export function toImageRef(source: ImageQueryResult, slotId: string): ImageRef {
  const alt = source?.alt ?? "";
  const placeholder = source?.placeholder || alt || "imagem";
  const asset = source?.image?.asset;

  if (!source?.image || !asset?._id) {
    return { slotId, alt, placeholder };
  }

  const dimensions = asset.metadata?.dimensions;

  return {
    slotId,
    alt,
    placeholder,
    // O hotspot/crop definidos no Studio viajam no spread e são aplicados pelo
    // builder — importante porque o `ImageSlot` recorta com `object-fit: cover`.
    //
    // O cast existe porque `@sanity/image-url` e o typegen descrevem o *mesmo*
    // JSON com tipos diferentes: o builder declara x/y/width/height como
    // obrigatórios no hotspot, o typegen os declara opcionais. Em runtime é o
    // mesmo objeto que o Sanity devolveu.
    src: builder
      .image({ ...source.image, asset: { _id: asset._id } } as SanityImageSource)
      .width(MAX_WIDTH)
      .auto("format")
      .url(),
    width: dimensions?.width ?? undefined,
    height: dimensions?.height ?? undefined,
    blurDataURL: asset.metadata?.lqip ?? undefined,
  };
}
