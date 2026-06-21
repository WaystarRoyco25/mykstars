import { articles, artists, galleries } from "./seed";
import type { Article, Artist, Category, Gallery } from "./types";

// ---------------------------------------------------------------------------
// Data access layer (the "CMS seam").
// Every page reads through these functions, never the seed file directly. To
// move onto a headless CMS later, re-implement this module against the CMS
// client while keeping the same signatures — no page or component changes.
// Functions are async so the swap to a real (awaited) data source is invisible.
// ---------------------------------------------------------------------------

function byDateDesc<T extends { date: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getGalleries(opts?: { category?: Category }): Promise<Gallery[]> {
  const list = byDateDesc(galleries);
  if (opts?.category) return list.filter((g) => g.category === opts.category);
  return list;
}

export async function getGallery(slug: string): Promise<Gallery | undefined> {
  return galleries.find((g) => g.slug === slug);
}

export async function getFeaturedGallery(): Promise<Gallery> {
  return byDateDesc(galleries)[0];
}

export async function getGalleriesByArtist(artistSlug: string): Promise<Gallery[]> {
  return byDateDesc(galleries).filter((g) => g.artistSlugs.includes(artistSlug));
}

export async function getArtists(): Promise<Artist[]> {
  return [...artists].sort((a, b) => a.name.localeCompare(b.name));
}

export async function getArtist(slug: string): Promise<Artist | undefined> {
  return artists.find((a) => a.slug === slug);
}

export async function getArticles(): Promise<Article[]> {
  return byDateDesc(articles);
}

export async function getArticle(slug: string): Promise<Article | undefined> {
  return articles.find((a) => a.slug === slug);
}

export async function getRelatedArticles(artistSlug: string): Promise<Article[]> {
  return byDateDesc(articles).filter((a) =>
    a.related?.artistSlugs?.includes(artistSlug),
  );
}

// Synchronous slug lists for generateStaticParams.
export function allGallerySlugs(): string[] {
  return galleries.map((g) => g.slug);
}
export function allArtistSlugs(): string[] {
  return artists.map((a) => a.slug);
}
export function allArticleSlugs(): string[] {
  return articles.map((a) => a.slug);
}
