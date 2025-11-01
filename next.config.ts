import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removed 'output: export' to support dynamic routes with [id]
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        // Apply COOP headers to all routes for Google Sign-In One Tap
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
