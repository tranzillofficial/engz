import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server Actions payload size limit for image uploads
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
};

export default nextConfig;
