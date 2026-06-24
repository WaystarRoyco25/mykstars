import { articles, artists, events, galleries, rankings } from "./seed";
import type {
  Article,
  Artist,
  CategoryTag,
  EventRegion,
  EventType,
  Gallery,
  Pillar,
  Ranking,
  StarEvent,
} from "./types";

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

// Schedule reads soonest-first (the opposite of the newest-first photo feed).
function byDateAsc<T extends { date: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.date > b.date ? 1 : -1));
}

function matchesTag(g: Gallery, tag: CategoryTag): boolean {
  return g.category === tag || (g.tags?.includes(tag) ?? false);
}

// Fashion & Beauty is a lens as well as a pillar: idol pictorials and airport
// fashion live in K-Pop but should also surface under /fashion.
const FASHION_LENS_TAGS: CategoryTag[] = [
  "pictorial",
  "campaign",
  "beauty",
  "fashion-week",
  "airport",
];

export async function getGalleries(opts?: { tag?: CategoryTag }): Promise<Gallery[]> {
  const list = byDateDesc(galleries);
  if (opts?.tag) return list.filter((g) => matchesTag(g, opts.tag!));
  return list;
}

// Galleries for a pillar landing page. For fashion-beauty this applies the lens
// (native fashion galleries OR any gallery carrying a fashion tag).
export async function getGalleriesForPillar(
  pillar: Pillar,
  tag?: CategoryTag,
): Promise<Gallery[]> {
  let list = byDateDesc(galleries);
  if (pillar === "fashion-beauty") {
    list = list.filter(
      (g) =>
        g.pillar === "fashion-beauty" ||
        FASHION_LENS_TAGS.includes(g.category) ||
        (g.tags?.some((t) => FASHION_LENS_TAGS.includes(t)) ?? false),
    );
  } else {
    list = list.filter((g) => g.pillar === pillar);
  }
  if (tag) list = list.filter((g) => matchesTag(g, tag));
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

export async function getArtistsByPillar(pillar: Pillar): Promise<Artist[]> {
  return (await getArtists()).filter((a) => (a.pillars ?? ["k-pop"]).includes(pillar));
}

export async function getArtist(slug: string): Promise<Artist | undefined> {
  return artists.find((a) => a.slug === slug);
}

export async function getArticles(opts?: { pillar?: Pillar }): Promise<Article[]> {
  const list = byDateDesc(articles);
  if (opts?.pillar) return list.filter((a) => a.pillar === opts.pillar);
  return list;
}

export async function getArticle(slug: string): Promise<Article | undefined> {
  return articles.find((a) => a.slug === slug);
}

export async function getRelatedArticles(artistSlug: string): Promise<Article[]> {
  return byDateDesc(articles).filter((a) =>
    a.related?.artistSlugs?.includes(artistSlug),
  );
}

// Rankings — scannable chart tables interleaved into the feed. Today there is one
// per pillar (K-Pop brand reputation, K-Drama viewership); pillars without one
// resolve to undefined so callers render nothing.
export async function getRankings(): Promise<Ranking[]> {
  return rankings;
}

export async function getRankingForPillar(pillar: Pillar): Promise<Ranking | undefined> {
  return rankings.find((r) => r.pillar === pillar);
}

// Schedule of upcoming concerts & fan meetings, soonest-first. `region` accepts a
// concrete region or the "international" pseudo-view (everything except Korea),
// honoring the site's non-Korean audience; `upcomingFrom` drops past dates
// (compare on the run's last day so a multi-night event stays listed until over).
export async function getEvents(opts?: {
  region?: EventRegion | "international";
  type?: EventType;
  upcomingFrom?: string;
}): Promise<StarEvent[]> {
  let list = byDateAsc(events);
  if (opts?.upcomingFrom) {
    const from = opts.upcomingFrom.slice(0, 10);
    list = list.filter((e) => (e.endDate ?? e.date) >= from);
  }
  if (opts?.region === "international") {
    list = list.filter((e) => e.region !== "korea");
  } else if (opts?.region) {
    list = list.filter((e) => e.region === opts.region);
  }
  if (opts?.type) list = list.filter((e) => e.type === opts.type);
  return list;
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
