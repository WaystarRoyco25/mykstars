import type { MetadataRoute } from "next";
import { allArticleSlugs, allArtistSlugs, allGallerySlugs } from "@/lib/data";
import { CATEGORY_ORDER } from "@/lib/types";

const BASE = "https://mykstars.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths: string[] = [
    "",
    "/photos",
    "/artists",
    "/news",
    "/legal/dmca",
    "/about/editorial-standards",
    ...CATEGORY_ORDER.map((c) => `/photos?category=${c}`),
    ...allGallerySlugs().map((s) => `/photos/${s}`),
    ...allArtistSlugs().map((s) => `/artists/${s}`),
    ...allArticleSlugs().map((s) => `/news/${s}`),
  ];

  return paths.map((path) => ({
    url: `${BASE}${path}`,
    changeFrequency: path.startsWith("/photos") || path === "" ? "hourly" : "weekly",
    priority: path === "" ? 1 : path.startsWith("/photos") ? 0.8 : 0.6,
  }));
}
