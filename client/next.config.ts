import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for PWA — served as static files, no Next.js server needed
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
