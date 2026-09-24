import type { NextConfig } from "next";
import { legacyRedirects } from "./lib/seo/redirects";

/**
 * O `projectId` é lido do ambiente (e não escrito aqui) por dois motivos: é a
 * mesma fonte que `sanity/env.ts` usa, e mantém o id fora do git — a convenção
 * do repositório (ver `.gitignore`). Ele não é segredo (viaja no bundle do
 * navegador, por necessidade), mas não custa manter o hábito.
 *
 * O Next carrega os arquivos `.env*` **antes** de avaliar este arquivo, então
 * `process.env` já está preenchido aqui. Falhar alto é melhor do que gerar um
 * `remotePatterns` com `undefined` no caminho, que silenciosamente rejeitaria
 * toda imagem do site.
 */
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;

if (!projectId) {
  throw new Error(
    "Variável de ambiente ausente: NEXT_PUBLIC_SANITY_PROJECT_ID. " +
      "Copie .env.example para .env.local e preencha (docs/plano-cms-headless.md §13)."
  );
}

/**
 * Cabeçalhos que valem para tudo, site e Studio.
 *
 * `frame-ancestors 'none'` é o que mais importa aqui, e por causa do Studio: é
 * um painel autenticado servido na mesma origem do site público. Sem isso, um
 * terceiro embute `/studio` num iframe e faz clickjacking em cima da sessão de
 * um pesquisador logado — publicar, despublicar ou apagar conteúdo com um
 * clique disfarçado. O `X-Frame-Options` cobre o mesmo para navegadores antigos,
 * que não entendem `frame-ancestors`.
 */
const baseHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Ignorado pelo navegador em http, então não atrapalha o desenvolvimento.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

/**
 * CSP do site público.
 *
 * `script-src` precisa de `'unsafe-inline'`: o App Router injeta scripts inline
 * (bootstrap e dados de RSC) e a alternativa — nonce por requisição — exige um
 * middleware, que este site não tem e que não se paga aqui. O que a política
 * ainda entrega, e não é pouco: nenhum script de origem externa carrega,
 * `object-src 'none'` mata plugins, `base-uri 'self'` impede sequestro de URL
 * relativa e `form-action 'self'` impede exfiltração por formulário injetado.
 *
 * `img-src` inclui `data:` por causa do blur placeholder (o `lqip` do Sanity
 * chega como data URI) e o CDN do Sanity para o caso de uma imagem escapar do
 * otimizador.
 */
/**
 * `'unsafe-eval'` **só** em desenvolvimento. O React em modo dev usa `eval()`
 * para remontar callstacks entre ambientes; sem isso o console enche de erro e
 * a depuração piora. Em produção ele nunca usa — então a política servida ao
 * público continua sem a brecha. Verificado no navegador: com a CSP de produção
 * em `next dev`, o React reclama; com esta condicional, não.
 */
const scriptSrc =
  process.env.NODE_ENV === "development"
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'";

const siteCsp = [
  "default-src 'self'",
  scriptSrc,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://cdn.sanity.io",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    /**
     * `cdn.sanity.io` é o CDN **compartilhado de todos os projetos Sanity**, e o
     * caminho é `/images/<projectId>/<dataset>/<asset>`. Travar só o hostname
     * deixaria `/_next/image` otimizar e cachear imagem de qualquer projeto de
     * qualquer pessoa — cota de otimização (faturada, em Vercel) gasta com
     * conteúdo de terceiro. O `pathname` fecha isso no projeto.
     */
    remotePatterns: [
      { protocol: "https", hostname: "cdn.sanity.io", pathname: `/images/${projectId}/**` },
    ],
  },

  /**
   * Os endereços do site antigo.
   *
   * `herpetologia.ufsc.br` responde desde 2010 e tem URLs indexadas. O
   * WordPress servia tudo na raiz — `/{post_name}/` valia para página, notícia
   * e projeto igualmente — e o site novo separa por prefixo. Sem esta tabela, a
   * troca de DNS transforma quinze anos de links em 404, inclusive os citados
   * em artigo.
   *
   * A lista é **gerada** por `npx tsx scripts/wp/redirects.ts`, que a deriva do
   * mesmo `slugDe` que a importação usa, e confere cada destino contra o
   * conteúdo importado antes de escrever. Editar `lib/seo/redirects.ts` à mão
   * perde essa garantia.
   *
   * O Next normaliza a barra final antes de casar (`/x/` → `/x`), então as
   * origens são gravadas sem ela.
   */
  async redirects() {
    return legacyRedirects;
  },

  async headers() {
    return [
      /**
       * O Studio fica **fora** da CSP do site: ele precisa de `'unsafe-eval'`,
       * de workers `blob:` e de conexão com vários domínios do Sanity
       * (`*.api.sanity.io`, `*.apicdn.sanity.io`, websocket de tempo real). Uma
       * política apertada demais aqui quebra o painel de um jeito difícil de
       * diagnosticar, e o risco que a CSP endereçaria lá é menor: quem escreve
       * no Studio é o próprio time. O que ele precisa mesmo é do
       * `frame-ancestors`, que vem do `baseHeaders`.
       */
      { source: "/studio/:path*", headers: baseHeaders },

      /**
       * Tudo que **não** é `/studio`. A exclusão é necessária porque duas regras
       * casando com a mesma rota emitem dois `Content-Security-Policy`, e o
       * navegador aplica a interseção das duas — o que derrubaria o Studio.
       */
      {
        source: "/((?!studio(?:/|$)).*)",
        headers: [
          ...baseHeaders,
          { key: "Content-Security-Policy", value: siteCsp },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
