import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb", // 3 foto × 5 MB + overhead form
    },
  },
};

export default nextConfig;
