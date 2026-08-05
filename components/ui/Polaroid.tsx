import { ImageSlot } from "./ImageSlot";
import type { ImageRef } from "@/lib/content/types";

type Props = {
  image: ImageRef;
  caption: string;
  stamp?: string;
  className?: string;
};

export function Polaroid({ image, caption, stamp, className = "" }: Props) {
  return (
    <div className={`polaroid ${className}`.trim()}>
      {stamp ? <div className="stamp">{stamp}</div> : null}
      <div className="pic">
        <ImageSlot {...image} />
      </div>
      <div className="cap">{caption}</div>
    </div>
  );
}
