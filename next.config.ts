import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.cloudfront.net" },
      { protocol: "https", hostname: "*.s3.amazonaws.com" },
      { protocol: "https", hostname: "images.unsplash.com" }, // dev/seed only
    ],
  },
  // Turbopack is the default bundler in Next.js 16
  turbopack: {},
};

export default nextConfig;
