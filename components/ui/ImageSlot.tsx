import Image from "next/image";

/**
 * Renderiza um asset de imagem. Com `src` (URL do CDN do Sanity) mostra a foto
 * preenchendo o slot; sem ele, cai no texto de `placeholder`, para o slot
 * continuar ocupando a área certa e dizendo o que entra ali.
 *
 * As props espelham o `ImageRef` compartilhado, então quem chama pode espalhar
 * a imagem inteira: `<ImageSlot {...item.image} />`.
 */
type Props = {
  slotId: string;
  placeholder: string;
  alt?: string;
  src?: string;
  width?: number;
  height?: number;
  blurDataURL?: string;
  /** Largura do slot no layout, para o Next escolher a resolução certa. Os
   * slots do site vão de ~1/3 da tela (galeria) à coluna inteira, então o
   * padrão de 50vw só serve como chute — quem renderiza deve passar o seu. */
  sizes?: string;
};

export function ImageSlot({
  slotId,
  placeholder,
  alt = "",
  src,
  blurDataURL,
  sizes = "50vw",
}: Props) {
  if (src) {
    return (
      <div className="image-slot has-image" data-slot-id={slotId}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          style={{ objectFit: "cover" }}
          {...(blurDataURL ? { placeholder: "blur" as const, blurDataURL } : {})}
        />
      </div>
    );
  }

  return (
    <div className="image-slot" data-slot-id={slotId}>
      {placeholder}
    </div>
  );
}
