import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/imoveis/:path*", destination: "/properties/:path*", permanent: true },
      { source: "/favoritos", destination: "/favorites", permanent: true },
      { source: "/agendar/:path*", destination: "/schedule/:path*", permanent: true },
      { source: "/sobre", destination: "/about", permanent: true },
      { source: "/contato", destination: "/contact", permanent: true },
      { source: "/como-funciona", destination: "/how-it-works", permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  // ESLint is run separately (`npm run lint`); never block production builds on it.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
