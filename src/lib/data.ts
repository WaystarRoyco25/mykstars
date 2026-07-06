import { articles, artists, clips, events, galleries, predictions, rankings } from "./seed";
import { getSupabase } from "./supabase";
import { clipMedia } from "./media";
import type {
  Article,
  Artist,
  CategoryTag,
  Clip,
  ClipGenre,
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
  SocialLink,
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

// Fashion & Beauty is a lens as well as a pillar: idol pictorials and airport
// fashion live in K-Pop but should also surface under /fashion.
const FASHION_LENS_TAGS: CategoryTag[] = [
  "pictorial",
  "campaign",
  "beauty",
  "fashion-week",
  "airport",
];

// ---------------------------------------------------------------------------
// Roster tiers (docs/roster-playbook.md). A benched artist keeps their
// /artists/{slug} hub, galleries and analysis links, but drops off every surface
// that actively promotes the roster: the home hero/bands/rails, the pillar-page
// People strip, ranking links, the Fan Forecast, and clip/account grid fill.
// Absent tier = "featured", so pre-existing records are unaffected.
// ---------------------------------------------------------------------------
function isFeatured(a: Artist): boolean {
  return (a.tier ?? "featured") === "featured";
}

const BENCHED_SLUGS: ReadonlySet<string> = new Set(
  artists.filter((a) => !isFeatured(a)).map((a) => a.slug),
);

// True when at least one slug belongs to a featured artist. Slugs that don't
// resolve to a roster record count as featured — rankings, events and clips may
// name people we don't cover, and those must keep rendering.
function anyFeaturedSlug(slugs: string[]): boolean {
  return slugs.length === 0 || slugs.some((s) => !BENCHED_SLUGS.has(s));
}

// Gallery-level view of the same rule, used by the home page to keep bench-only
// galleries out of the hero and bands. The galleries themselves stay live in
// /photos, the pillar grids and the artist hub — benching never unpublishes.
export function hasFeaturedArtist(g: Gallery): boolean {
  return anyFeaturedSlug(g.artistSlugs);
}

export async function getGalleries(): Promise<Gallery[]> {
  return byDateDesc(galleries);
}

// Galleries for a pillar landing page. For fashion-beauty this applies the lens
// (native fashion galleries OR any gallery carrying a fashion tag).
export async function getGalleriesForPillar(pillar: Pillar): Promise<Gallery[]> {
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
  return list;
}

export async function getGallery(slug: string): Promise<Gallery | undefined> {
  return galleries.find((g) => g.slug === slug);
}

export async function getFeaturedGallery(): Promise<Gallery> {
  // Newest gallery with a featured artist; falls back to newest overall so the
  // hero never renders empty even if the whole roster were benched.
  const list = byDateDesc(galleries);
  return list.find(hasFeaturedArtist) ?? list[0];
}

export async function getGalleriesByArtist(artistSlug: string): Promise<Gallery[]> {
  return byDateDesc(galleries).filter((g) => g.artistSlugs.includes(artistSlug));
}

// The photo archive (/photos): the full library, narrowed by any combination of
// pillar and artist, then ordered. The pillar branch reuses getGalleriesForPillar
// (incl. the Fashion & Beauty lens); the no-pillar branch reuses getGalleries.
// Sort adds the one order those helpers don't (most photos); latest/oldest reuse
// the date sorters.
export async function getArchiveGalleries(opts?: {
  pillar?: Pillar;
  artist?: string;
  sort?: GallerySort;
}): Promise<Gallery[]> {
  let list = opts?.pillar
    ? await getGalleriesForPillar(opts.pillar)
    : await getGalleries();
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
  // Feeds the pillar-page People strip — a promotion surface, so benched artists
  // are excluded (their hubs stay reachable via their galleries and articles).
  return (await getArtists())
    .filter(isFeatured)
    .filter((a) => (a.pillars ?? ["k-pop"]).includes(pillar));
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
  tiktok: "TikTok",
  youtube: "YouTube",
};

// Official-account tiles for an artist. We only link out (the media stays on the
// source platform, always credited) — the embed-first, legally-safe pattern.
// Restricted to platforms the site still embeds: the retired Instagram/X handles
// stay in the seed as verification records and never render.
export function artistEmbeds(artist: Artist): MediaItem[] {
  return (artist.social ?? [])
    .filter(
      (s): s is SocialLink & { platform: EmbedPlatform } =>
        s.platform === "youtube" || s.platform === "tiktok",
    )
    .map(
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

// Distinct artist slugs across a set of galleries, in first-seen order.
function distinctArtistSlugs(galleries: Gallery[]): string[] {
  const slugs: string[] = [];
  const seen = new Set<string>();
  for (const g of galleries) {
    for (const s of g.artistSlugs) {
      if (!seen.has(s)) {
        seen.add(s);
        slugs.push(s);
      }
    }
  }
  return slugs;
}

// Curated clips for a set of artists, as grid-ready MediaItems. These upgrade
// grid fill from a plain account link-out to a real, click-to-play player (see
// EmbedCard), and their landscape 16:9 frames double as the horizontal bricks
// that break up the portrait masonry. Newest-first across genres, deduped to the
// cap. Sync — reads the already-loaded seed arrays.
function artistClipEmbeds(slugs: string[], cap: number): MediaItem[] {
  if (cap <= 0) return [];
  return clips
    .filter(
      (c) =>
        c.artistSlugs.some((s) => slugs.includes(s)) &&
        anyFeaturedSlug(c.artistSlugs),
    )
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, cap)
    .map(clipMedia);
}

// Ground rule: a grid never renders sparse. When a page has fewer than `minTiles`
// galleries (a full desktop row is 3), top it up to fill the empty columns: first
// with the artist's curated clips (real, click-to-play players), then their
// official-channel link-outs, then related galleries from the same pillar (e.g.
// directors with no clips or channels). Everything links out and stays credited;
// nothing is rehosted or fabricated. Each list is capped so a full grid never grows.
export async function sparseFill(
  artist: Artist,
  ownGalleries: Gallery[],
  minTiles = 3,
): Promise<{ embeds: MediaItem[]; galleries: Gallery[] }> {
  const deficit = minTiles - ownGalleries.length;
  if (deficit <= 0) return { embeds: [], galleries: [] };
  const posts = artistClipEmbeds([artist.slug], deficit);
  const postIds = new Set(posts.map((m) => m.id));
  const accounts = artistEmbeds(artist).filter((m) => !postIds.has(m.id));
  const embeds = [...posts, ...accounts].slice(0, deficit);
  const stillShort = deficit - embeds.length;
  if (stillShort <= 0) return { embeds, galleries: [] };
  const pillar = artist.pillars?.[0] ?? "k-pop";
  const own = new Set(ownGalleries.map((g) => g.slug));
  const related = (await getGalleriesForPillar(pillar))
    .filter((g) => !own.has(g.slug))
    .slice(0, stillShort);
  return { embeds, galleries: related };
}

// Top up a whole pillar band on the home page so a thin band (K-Movie, Fashion)
// never renders with empty columns. Clips first: the band artists' curated
// YouTube players (landscape tiles that also loosen the portrait masonry). Then
// official-channel link-outs as a backstop for artists with no curated clips.
// Deduped by id and capped at `cap` (the band's deficit) so a full band never
// grows. Sync — reads the loaded seed.
export function pillarFillEmbeds(bandGalleries: Gallery[], cap: number): MediaItem[] {
  if (cap <= 0) return [];
  const slugs = distinctArtistSlugs(bandGalleries);
  const out: MediaItem[] = [];
  const idSeen = new Set<string>();
  // Returns true once the cap is reached, so callers can stop early.
  const push = (m: MediaItem): boolean => {
    if (!idSeen.has(m.id)) {
      idSeen.add(m.id);
      out.push(m);
    }
    return out.length >= cap;
  };
  for (const m of artistClipEmbeds(slugs, cap)) {
    if (push(m)) return out;
  }
  for (const slug of slugs) {
    const artist = artists.find((a) => a.slug === slug);
    if (!artist || !isFeatured(artist)) continue;
    for (const m of artistEmbeds(artist)) {
      if (push(m)) return out;
    }
  }
  return out;
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
// A benched artist's row keeps its place in the table (the chart is the chart),
// but loses its hub link — RankingTable renders a link iff artistSlug is set.
function stripBenchedLinks(r: Ranking): Ranking {
  if (!r.rows.some((row) => row.artistSlug && BENCHED_SLUGS.has(row.artistSlug))) {
    return r;
  }
  return {
    ...r,
    rows: r.rows.map((row) =>
      row.artistSlug && BENCHED_SLUGS.has(row.artistSlug)
        ? { ...row, artistSlug: undefined }
        : row,
    ),
  };
}

export async function getRankings(): Promise<Ranking[]> {
  return rankings.map(stripBenchedLinks);
}

export async function getRankingForPillar(pillar: Pillar): Promise<Ranking | undefined> {
  const ranking = rankings.find((r) => r.pillar === pillar);
  return ranking && stripBenchedLinks(ranking);
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

// ---------------------------------------------------------------------------
// Clips — standalone official YouTube videos that power the home rails.
// Newest-first like galleries; clips never enter the photo archive and generate
// no route.
// ---------------------------------------------------------------------------
export async function getClips(opts?: {
  platform?: EmbedPlatform;
  genre?: ClipGenre;
  pillar?: Pillar;
  artist?: string;
}): Promise<Clip[]> {
  let list = byDateDesc(clips);
  if (opts?.platform) list = list.filter((c) => c.platform === opts.platform);
  if (opts?.genre) list = list.filter((c) => c.genre === opts.genre);
  if (opts?.pillar) list = list.filter((c) => c.pillar === opts.pillar);
  if (opts?.artist) list = list.filter((c) => c.artistSlugs.includes(opts.artist!));
  return list;
}

// The home "In motion" rail: official music videos and performance clips,
// newest-first. Bench-only clips are excluded — the home rails are promotion
// surfaces.
export async function getMusicClips(limit = 12): Promise<Clip[]> {
  return (await getClips({ genre: "music" }))
    .filter((c) => anyFeaturedSlug(c.artistSlugs))
    .slice(0, limit);
}

// The home "On air" rail: the roster's comedy, variety and talk-show
// appearances on official program channels, newest-first.
export async function getVarietyClips(limit = 12): Promise<Clip[]> {
  return (await getClips({ genre: "variety" }))
    .filter((c) => anyFeaturedSlug(c.artistSlugs))
    .slice(0, limit);
}

export async function getClipsByArtist(artistSlug: string): Promise<Clip[]> {
  return byDateDesc(clips).filter((c) => c.artistSlugs.includes(artistSlug));
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

// A question whose only artist-tagged options point at benched artists is a
// bench-promotion surface — keep it off the open-forecast teasers. Content-side,
// a roster refresh should retire such questions; this is the safety net.
function promotesOnlyBenched(p: Prediction): boolean {
  const tagged = p.options
    .map((o) => o.artistSlug)
    .filter((s): s is string => typeof s === "string");
  return tagged.length > 0 && tagged.every((s) => BENCHED_SLUGS.has(s));
}

export async function getOpenPredictions(opts?: { pillar?: Pillar }): Promise<Prediction[]> {
  const now = new Date().toISOString();
  return (await getPredictions(opts)).filter(
    (p) => effectiveStatus(p, now) === "open" && !promotesOnlyBenched(p),
  );
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
