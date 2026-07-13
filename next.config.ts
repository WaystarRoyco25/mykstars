import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project (a stray lockfile exists in $HOME).
  turbopack: { root: import.meta.dirname },
  images: {
    // The core differentiator: serve AVIF/WebP (40–60% smaller than the
    // JPEG-only incumbents). next/image negotiates per Accept header.
    formats: ["image/avif", "image/webp"],
    // Permitted imagery only: the Supabase Storage media bucket (MediaAsset
    // registry) and YouTube thumbnails (embed facades). Anything else fails
    // loudly instead of optimizing an unvetted host.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
    qualities: [75],
    // Asset URLs are content-addressed (assetId in the path), so a long CDN
    // TTL is safe; a replaced image gets a new URL.
    minimumCacheTTL: 2678400,
  },
  async redirects() {
    return [
      // The News section is now Analysis; keep live inbound links + search results working.
      { source: "/news", destination: "/analysis", permanent: true },
      { source: "/news/:slug", destination: "/analysis/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
