import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: 'img.clerk.com' }
    ]
  },
  // Allow server actions and API routes to receive up to 50 MB (for PDF uploads)
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
};

export default nextConfig;
