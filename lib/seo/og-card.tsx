import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cache } from "react";
import { ImageResponse } from "next/og";
import { getHero } from "@/lib/content";
import { stripInlineMarkdown } from "./text";
import { BRAND_FULL, BRAND_SHORT } from "./site";

/**
 * O card social do site, desenhado com `next/og` — a mesma imagem para a home,
 * para as notícias sem foto e para os projetos.
 *
 * Existe porque **nenhuma das 14 imagens do CMS tem foto enviada** (ADR 0005):
 * sem isto, todo link compartilhado geraria um card vazio. Desenhado a partir
 * do título e da marca, funciona sem foto nenhuma e sai de cena sozinho
 * conforme as fotos chegam.
 *
 * Duas restrições do `ImageResponse`, dos docs do Next instalado
 * (`14-metadata-and-og-images.md:342-348`):
 *
 * 1. **Só flexbox e um subconjunto de CSS.** `display: grid` não funciona, e
 *    todo elemento com mais de um filho precisa de `display: flex` explícito.
 * 2. **A fonte tem de estar disponível ao servidor** — daí os `.ttf`
 *    commitados em `app/_fonts` em vez de buscados do Google em execução.
 *
 * ---
 *
 * **Por que cada rota tem o seu `opengraph-image.tsx`, e não um só na raiz.**
 * Metadado aninhado como `openGraph` definido num segmento é *substituído* —
 * não fundido — pelo segmento seguinte que o define (docs do Next instalado,
 * `generate-metadata.md:1330`). Como toda rota do site declara o próprio
 * `openGraph` pelo `buildMetadata`, um card na raiz seria descartado por todas
 * elas. Verificado: com o arquivo só em `app/`, nenhuma página do site emitia
 * `og:image`. Cada rota declara o seu; estas funções é que são compartilhadas.
 */

/** Proporção 1,91:1, que é o que Facebook, LinkedIn, WhatsApp e X esperam. */
export const OG_SIZE = { width: 1200, height: 630 };

export const OG_CONTENT_TYPE = "image/png";

/** Texto alternativo compartilhado. Descreve a marca, porque é o que o card
 * mostra quando não há foto — e hoje nunca há. */
export const OG_ALT = BRAND_FULL;

const COLORS = {
  bg: "#0f1812",
  cream: "#ece0bb",
  soft: "#b9b08a",
  carrot: "#e26a2c",
};

type FontFile = { file: string; name: string; weight: 400 | 600 };

const FONT_FILES: FontFile[] = [
  { file: "Fraunces-Regular.ttf", name: "Fraunces", weight: 400 },
  { file: "Fraunces-SemiBold.ttf", name: "Fraunces", weight: 600 },
  { file: "JetBrainsMono-Regular.ttf", name: "JetBrains Mono", weight: 400 },
];

/**
 * Memoizado: a rota de OG de cada notícia é gerada no build, e ler três
 * arquivos de fonte por imagem seria trabalho repetido dentro da mesma
 * requisição.
 */
const loadFonts = cache(async () =>
  Promise.all(
    FONT_FILES.map(async ({ file, name, weight }) => ({
      name,
      weight,
      style: "normal" as const,
      data: await readFile(join(process.cwd(), "app", "_fonts", file)),
    }))
  )
);

type CardArgs = {
  /** Linha pequena no topo, em maiúsculas. Ex.: `"Notícia · 20 nov 2025"`. */
  kicker: string;
  /** O título, já sem Markdown. */
  title: string;
  /** Foto do documento, quando houver. Vira o card inteiro. */
  photoUrl?: string;
};

/** Título longo em corpo grande estoura os 630px de altura. */
function titleFontSize(title: string): number {
  if (title.length > 90) return 54;
  if (title.length > 55) return 64;
  return 76;
}

export async function renderOgCard({ kicker, title, photoUrl }: CardArgs): Promise<ImageResponse> {
  const fonts = await loadFonts();

  if (photoUrl) {
    try {
      return new ImageResponse(
        (
          <div style={{ display: "flex", width: "100%", height: "100%", background: COLORS.bg }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- `ImageResponse`
                renderiza no servidor; `next/image` não existe aqui. */}
            <img src={photoUrl} width={OG_SIZE.width} height={OG_SIZE.height} style={{ objectFit: "cover" }} alt="" />
          </div>
        ),
        { ...OG_SIZE, fonts }
      );
    } catch {
      // A foto é buscada do CDN do Sanity **durante a geração**. Uma falha de
      // rede aí derrubaria o build inteiro por causa de um card social — o
      // desenhado é a saída, e é o mesmo que a notícia teria sem foto.
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: "64px 72px",
          background: COLORS.bg,
          // Os mesmos halos esverdeados do fundo do site.
          backgroundImage:
            "radial-gradient(ellipse 900px 600px at 15% 0%, rgba(60, 90, 40, 0.42), transparent 62%), " +
            "radial-gradient(ellipse 700px 520px at 100% 100%, rgba(40, 70, 30, 0.35), transparent 60%)",
          fontFamily: "Fraunces",
          color: COLORS.cream,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <div style={{ fontSize: 40, fontWeight: 600, letterSpacing: "0.32em" }}>{BRAND_SHORT}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontFamily: "JetBrains Mono",
              fontSize: 20,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: COLORS.carrot,
              marginBottom: 26,
            }}
          >
            {kicker}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: titleFontSize(title),
              lineHeight: 1.06,
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", width: 56, height: 4, background: COLORS.carrot, marginRight: 22 }} />
          <div style={{ display: "flex", fontSize: 24, color: COLORS.soft }}>{BRAND_FULL}</div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts }
  );
}

/**
 * O card do site, usado por toda rota que não tenha assunto próprio para
 * mostrar. O texto vem do Hero, no CMS, e não de uma constante: é a frase que
 * abre o site, e reescrevê-la aqui seria mais um lugar para sair de sincronia.
 * Como a leitura passa por `sanityFetch`, o webhook de revalidação atualiza o
 * card junto com a página.
 */
export async function renderSiteOgCard(): Promise<ImageResponse> {
  const hero = await getHero();

  return renderOgCard({
    kicker: hero.eyebrow,
    title: stripInlineMarkdown([...hero.titleLines, hero.squiggleWord].join(" ")),
  });
}
