import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Sanity image CDN (used once the CMS adapter fills ImageRef.src). Harmless
    // until then — no component sets a remote src yet. See ADR 0002 / Etapa 2.
    remotePatterns: [{ protocol: "https", hostname: "cdn.sanity.io" }],
  },
};

export default nextConfig;
