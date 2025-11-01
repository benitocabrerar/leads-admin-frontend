import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removed 'output: export' to support dynamic routes with [id]
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
