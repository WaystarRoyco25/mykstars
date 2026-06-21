import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project (a stray lockfile exists in $HOME).
  turbopack: { root: import.meta.dirname },
  images: {
    // The core differentiator: serve AVIF/WebP (40–60% smaller than the
    // JPEG-only incumbents). next/image negotiates per Accept header.
    formats: ["image/avif", "image/webp"],
    // Allow remote licensed/embedded imagery once real sources are wired in.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
