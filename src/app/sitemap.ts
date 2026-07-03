import type { MetadataRoute } from "next";
import { allArticleSlugs, allArtistSlugs, allGallerySlugs } from "@/lib/data";
import { PILLAR_ORDER, PILLAR_SLUGS, PILLAR_TAGS, REGION_ORDER, pillarSlug } from "@/lib/types";

const BASE = "https://mykstars.com";

const PILLAR_ROOTS = new Set(PILLAR_ORDER.map((p) => `/${PILLAR_SLUGS[p]}`));

export default function sitemap(): MetadataRoute.Sitemap {
  const paths: string[] = [
    "",
    "/photos",
    "/analysis",
    "/schedule",
    "/legal/dmca",
    "/about/editorial-standards",
    // Pillar landings + each pillar's tag-filtered views.
    ...PILLAR_ORDER.map((p) => `/${pillarSlug(p)}`),
    ...PILLAR_ORDER.flatMap((p) =>
      PILLAR_TAGS[p].map((t) => `/${pillarSlug(p)}?tag=${t}`),
    ),
    // Schedule region-filtered views.
    ...REGION_ORDER.map((r) => `/schedule?region=${r}`),
    ...allGallerySlugs().map((s) => `/photos/${s}`),
    ...allArtistSlugs().map((s) => `/artists/${s}`),
    ...allArticleSlugs().map((s) => `/analysis/${s}`),
  ];

  const isFresh = (path: string) =>
    path === "" ||
    path === "/photos" ||
    path.startsWith("/photos/") ||
    path.split("?")[0] === "/schedule" ||
    PILLAR_ROOTS.has(path.split("?")[0]);

  return paths.map((path) => ({
    url: `${BASE}${path}`,
    changeFrequency: isFresh(path) ? "hourly" : "weekly",
    priority: path === "" ? 1 : isFresh(path) ? 0.8 : 0.6,
  }));
}
