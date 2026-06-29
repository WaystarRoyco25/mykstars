import { articles, artists, events, galleries, predictions, rankings } from "./seed";
import { getSupabase } from "./supabase";
import type {
  Article,
  Artist,
  CategoryTag,
  EmbedPlatform,
  EventRegion,
  EventType,
  Gallery,
  GallerySort,
  MediaItem,
  Pillar,
  Prediction,
  PredictionStatus,
  PredictionTally,
  Ranking,
  StarEvent,
} from "./types";
import { PILLAR_ORDER } from "./types";

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

// Densest sets first (by photo count). Ties keep newest-first so the "most
// photos" view stays chronologically sensible within a tie.
function byPhotoCountDesc(items: Gallery[]): Gallery[] {
  return [...items].sort(
    (a, b) => b.media.length - a.media.length || (a.date < b.date ? 1 : -1),
  );
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

// The photo archive (/photos): the full library, narrowed by any combination of
// pillar, tag and artist, then ordered. Tag filtering is delegated to the
// existing helpers so matchesTag stays the single source of truth: the pillar
// branch reuses getGalleriesForPillar (incl. the Fashion & Beauty lens); the
// no-pillar branch reuses getGalleries({ tag }). Sort adds the one order those
// helpers don't (most photos); latest/oldest reuse the date sorters.
export async function getArchiveGalleries(opts?: {
  pillar?: Pillar;
  tag?: CategoryTag;
  artist?: string;
  sort?: GallerySort;
}): Promise<Gallery[]> {
  let list = opts?.pillar
    ? await getGalleriesForPillar(opts.pillar, opts.tag)
    : await getGalleries({ tag: opts?.tag });
  if (opts?.artist) list = list.filter((g) => g.artistSlugs.includes(opts.artist!));
  switch (opts?.sort) {
    case "oldest":
      return byDateAsc(list);
    case "photos":
      return byPhotoCountDesc(list);
    default:
      return list; // already newest-first from the helpers above
  }
}

export async function getArtists(): Promise<Artist[]> {
  return [...artists].sort((a, b) => a.name.localeCompare(b.name));
}

export async function getArtistsByPillar(pillar: Pillar): Promise<Artist[]> {
  return (await getArtists()).filter((a) => (a.pillars ?? ["k-pop"]).includes(pillar));
}

// People in focus on the home page: a pillar-spread teaser. Round-robins across
// PILLAR_ORDER (one fresh artist per pillar per round, A to Z within a pillar),
// de-duping cross-pillar names by slug, then attaches each one's photo-set count.
export async function getArtistsInFocus(
  limit = 6,
): Promise<{ artist: Artist; photoSets: number }[]> {
  const byPillar = await Promise.all(PILLAR_ORDER.map((p) => getArtistsByPillar(p)));
  const cursors = byPillar.map(() => 0);
  const picked: Artist[] = [];
  const seen = new Set<string>();
  let progressed = true;
  while (picked.length < limit && progressed) {
    progressed = false;
    for (let i = 0; i < byPillar.length && picked.length < limit; i++) {
      const list = byPillar[i];
      while (cursors[i] < list.length && seen.has(list[cursors[i]].slug)) cursors[i]++;
      if (cursors[i] < list.length) {
        const a = list[cursors[i]++];
        seen.add(a.slug);
        picked.push(a);
        progressed = true;
      }
    }
  }
  return Promise.all(
    picked.map(async (a) => ({
      artist: a,
      photoSets: (await getGalleriesByArtist(a.slug)).length,
    })),
  );
}

export async function getArtist(slug: string): Promise<Artist | undefined> {
  return artists.find((a) => a.slug === slug);
}

const PLATFORM_NAMES: Record<EmbedPlatform, string> = {
  instagram: "Instagram",
  x: "X",
  tiktok: "TikTok",
  youtube: "YouTube",
};

// Official-account tiles for an artist. We only link out (the photo stays on the
// source platform, always credited) — the embed-first, legally-safe pattern.
export function artistEmbeds(artist: Artist): MediaItem[] {
  return (artist.social ?? []).map(
    (s): MediaItem => ({
      id: `${artist.slug}-${s.platform}`,
      kind: "embed",
      platform: s.platform,
      embedUrl: s.url,
      alt: `${artist.name} on ${PLATFORM_NAMES[s.platform]}`,
      credit: { name: s.handle, url: s.url, kind: "embed" },
    }),
  );
}

// Ground rule: a grid never renders sparse. When a page has fewer than `minTiles`
// galleries (a full desktop row is 3), top it up to fill the empty columns: first
// with the artist's official-account embeds, then, if still short (e.g. directors
// with no linked accounts), with related galleries from the same pillar. Both link
// out and stay credited; nothing is rehosted or fabricated. Each list is capped so
// a grid that is already full never grows.
export async function sparseFill(
  artist: Artist,
  ownGalleries: Gallery[],
  minTiles = 3,
): Promise<{ embeds: MediaItem[]; galleries: Gallery[] }> {
  const deficit = minTiles - ownGalleries.length;
  if (deficit <= 0) return { embeds: [], galleries: [] };
  const embeds = artistEmbeds(artist).slice(0, deficit);
  const stillShort = deficit - embeds.length;
  if (stillShort <= 0) return { embeds, galleries: [] };
  const pillar = artist.pillars?.[0] ?? "k-pop";
  const own = new Set(ownGalleries.map((g) => g.slug));
  const related = (await getGalleriesForPillar(pillar))
    .filter((g) => !own.has(g.slug))
    .slice(0, stillShort);
  return { embeds, galleries: related };
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

// ---------------------------------------------------------------------------
// Predictions — the Fan Forecast. Curated, vote-only sentiment questions on
// professional outcomes. The data layer derives a ready-to-render tally so pages
// stay declarative. Live vote counts come from Supabase (table `votes`, read via
// the `prediction_tallies` aggregate view); question metadata still comes from
// the seed.
// ---------------------------------------------------------------------------

// open → closed → resolved. The open→closed cut is a REAL-CLOCK decision — a
// question stays open until the wall clock passes closesAt — so voting actually
// closes on time, no scheduler needed. Defaults to the live clock; callers that
// need a deterministic snapshot pass nowIso explicitly. A stored "resolved" status
// (or a resolution record) is time-independent and always wins.
export function effectiveStatus(
  p: Prediction,
  nowIso: string = new Date().toISOString(),
): PredictionStatus {
  if (p.status === "resolved" || p.resolution) return "resolved";
  return Date.parse(p.closesAt) <= Date.parse(nowIso) ? "closed" : "open";
}

const PREDICTION_STATUS_ORDER: Record<PredictionStatus, number> = {
  open: 0,
  closed: 1,
  resolved: 2,
};

// Live counts per option from the `prediction_tallies` view. Degrades to an
// empty map (→ "no votes yet") when Supabase is unconfigured or errors, so a
// tally read never throws and the page still renders.
async function fetchVoteCounts(slug: string): Promise<Map<string, number>> {
  const supabase = getSupabase();
  if (!supabase) return new Map();
  const { data, error } = await supabase
    .from("prediction_tallies")
    .select("option_id, votes")
    .eq("prediction_slug", slug);
  if (error || !data) return new Map();
  return new Map(data.map((r) => [r.option_id as string, Number(r.votes)]));
}

function buildTally(p: Prediction, counts: Map<string, number>): PredictionTally {
  const perOption = p.options.map((o) => ({ optionId: o.id, votes: counts.get(o.id) ?? 0 }));
  const totalVotes = perOption.reduce((sum, o) => sum + o.votes, 0);
  return {
    predictionSlug: p.slug,
    totalVotes,
    perOption: perOption.map((o) => ({
      ...o,
      pct: totalVotes > 0 ? Math.round((o.votes / totalVotes) * 100) : 0,
    })),
    revealed: totalVotes >= p.tallyVisibleThreshold,
    asOf: p.asOf,
  };
}

// Open questions first (soonest cutoff leads, for urgency), then closed-awaiting,
// then resolved (most recently resolved first).
export async function getPredictions(opts?: { pillar?: Pillar }): Promise<Prediction[]> {
  let list = [...predictions];
  if (opts?.pillar) list = list.filter((p) => p.pillar === opts.pillar);
  const now = new Date().toISOString();
  return list.sort((a, b) => {
    const sa = PREDICTION_STATUS_ORDER[effectiveStatus(a, now)];
    const sb = PREDICTION_STATUS_ORDER[effectiveStatus(b, now)];
    if (sa !== sb) return sa - sb;
    if (sa === PREDICTION_STATUS_ORDER.resolved) {
      return (
        Date.parse(b.resolution?.resolvedAt ?? b.closesAt) -
        Date.parse(a.resolution?.resolvedAt ?? a.closesAt)
      );
    }
    return Date.parse(a.closesAt) - Date.parse(b.closesAt);
  });
}

export async function getOpenPredictions(opts?: { pillar?: Pillar }): Promise<Prediction[]> {
  const now = new Date().toISOString();
  return (await getPredictions(opts)).filter((p) => effectiveStatus(p, now) === "open");
}

export async function getPrediction(slug: string): Promise<Prediction | undefined> {
  return predictions.find((p) => p.slug === slug);
}

export async function getPredictionTally(slug: string): Promise<PredictionTally | undefined> {
  const p = predictions.find((x) => x.slug === slug);
  if (!p) return undefined;
  return buildTally(p, await fetchVoteCounts(slug));
}

// Cookie carrying the anonymous voter id (set by the castVote action). Exported
// so the detail page and the action agree on the name — and a "use server" file
// can't export plain constants, only async functions, so it lives here.
export const VOTER_COOKIE = "myk_voter";

// The current visitor's pick for a question (by anonymous voter id), or null if
// they haven't voted. Drives the "Your pick" highlight on the detail page.
export async function getVotedOptionId(
  slug: string,
  voterId: string | undefined,
): Promise<string | null> {
  if (!voterId) return null;
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase
    .from("votes")
    .select("option_id")
    .eq("prediction_slug", slug)
    .eq("voter_id", voterId)
    .maybeSingle();
  return (data?.option_id as string | undefined) ?? null;
}

export function allPredictionSlugs(): string[] {
  return predictions.map((p) => p.slug);
}
