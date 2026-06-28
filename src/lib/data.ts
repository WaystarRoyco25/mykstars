import { NOW, articles, artists, events, galleries, predictions, rankings } from "./seed";
import { getSupabase } from "./supabase";
import type {
  Article,
  Artist,
  CategoryTag,
  EventRegion,
  EventType,
  Gallery,
  Pillar,
  Prediction,
  PredictionStatus,
  PredictionTally,
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

// ---------------------------------------------------------------------------
// Predictions — the Fan Forecast. Curated, vote-only sentiment questions on
// professional outcomes. The data layer derives a ready-to-render tally so pages
// stay declarative. Live vote counts come from Supabase (table `votes`, read via
// the `prediction_tallies` aggregate view); question metadata still comes from
// the seed. The legacy per-option `sampleVotes` are no longer read.
// ---------------------------------------------------------------------------

// open → closed → resolved. The open→closed cut is time-derived from closesAt
// (anchored to NOW for deterministic SSR, like the rest of the site), so closing
// a question needs no scheduler. A stored "resolved" status (or a resolution
// record) always wins.
export function effectiveStatus(p: Prediction, nowIso: string = NOW): PredictionStatus {
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
  return list.sort((a, b) => {
    const sa = PREDICTION_STATUS_ORDER[effectiveStatus(a)];
    const sb = PREDICTION_STATUS_ORDER[effectiveStatus(b)];
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
  return (await getPredictions(opts)).filter((p) => effectiveStatus(p) === "open");
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
