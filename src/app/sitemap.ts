import type { MetadataRoute } from "next";
import { allArticleSlugs, allArtistSlugs, publishedGallerySlugs } from "@/lib/data";
import { PILLAR_ORDER, REGION_ORDER, pillarSlug } from "@/lib/types";

const BASE = "https://mykstars.com";

const PILLAR_ROOTS = new Set(PILLAR_ORDER.map((p) => `/${pillarSlug(p)}`));

export default function sitemap(): MetadataRoute.Sitemap {
  const paths: string[] = [
    "",
    "/artists",
    "/photos",
    "/analysis",
    "/schedule",
    "/predictions",
    "/legal/dmca",
    "/about/editorial-standards",
    // Pillar landings.
    ...PILLAR_ORDER.map((p) => `/${pillarSlug(p)}`),
    // Schedule region-filtered views.
    ...REGION_ORDER.map((r) => `/schedule?region=${r}`),
    // Archived galleries stay reachable but leave the sitemap (noindex).
    ...publishedGallerySlugs().map((s) => `/photos/${s}`),
    ...allArtistSlugs().map((s) => `/artists/${s}`),
    ...allArticleSlugs().map((s) => `/analysis/${s}`),
  ];

  const isFresh = (path: string) =>
    path === "" ||
    path === "/photos" ||
    path.startsWith("/photos/") ||
    path === "/predictions" ||
    path.split("?")[0] === "/schedule" ||
    PILLAR_ROOTS.has(path.split("?")[0]);

  return paths.map((path) => ({
    url: `${BASE}${path}`,
    changeFrequency: isFresh(path) ? "hourly" : "weekly",
    priority: path === "" ? 1 : isFresh(path) ? 0.8 : 0.6,
  }));
}
