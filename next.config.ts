import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  disable: process.env.NODE_ENV !== "production",
  additionalPrecacheEntries: [{ url: "/offline", revision: crypto.randomUUID() }],
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
});

const nextConfig: NextConfig = {
  turbopack: {}, // silenzia l'errore: webpack config da @serwist/next, Turbopack default in Next 16
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb", // 3 foto × 5 MB + overhead form
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/**",
      },
    ],
  },
};

export default withSerwist(nextConfig);
