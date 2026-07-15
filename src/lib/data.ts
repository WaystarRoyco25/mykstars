import {
  NOW,
  articles,
  artists,
  clips,
  editions,
  events,
  galleries,
  predictions,
  pulses,
  rankings,
} from "./content";
import { getSupabase } from "./supabase";
import { clipMedia } from "./media";
import type {
  Article,
  Artist,
  CareerStage,
  CategoryTag,
  Clip,
  ClipGenre,
  CoverageLevel,
  EmbedPlatform,
  EventRegion,
  EventType,
  FeedEdition,
  Gallery,
  GallerySort,
  MediaItem,
  Pillar,
  Prediction,
  PredictionStatus,
  PredictionTally,
  Pulse,
  Ranking,
  SocialLink,
  StarEvent,
} from "./types";
import { EMBED_PLATFORM_LABELS } from "./types";

// ---------------------------------------------------------------------------
// Data access layer (the "CMS seam").
// Every page reads through these functions, never the content files directly. To
// move onto a headless CMS later, re-implement this module against the CMS
// client while keeping the same signatures — no page or component changes.
// Functions are async so the swap to a real (awaited) data source is invisible.
// ---------------------------------------------------------------------------

function byDateDesc<T extends { date: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.date.localeCompare(a.date));
}

// Schedule reads soonest-first (the opposite of the newest-first photo feed).
function byDateAsc<T extends { date: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.date.localeCompare(b.date));
}

// Densest sets first (by photo count). Ties keep newest-first so the "most
// photos" view stays chronologically sensible within a tie.
function byPhotoCountDesc(items: Gallery[]): Gallery[] {
  return [...items].sort(
    (a, b) => b.media.length - a.media.length || b.date.localeCompare(a.date),
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
// Promotion surfaces (docs/roster-playbook.md). A profile is promoted while it
// is published AND actively covered (coverageLevel "active"). Catalog and
// unpublished profiles keep their /artists/{slug} hub, galleries and analysis
// links, but drop off every surface that actively promotes the roster: the home
// hero/bands/rails, the pillar-page People strip, ranking links, the Fan
// Forecast, and clip/account grid fill — the same semantics the old
// featured/bench tier carried.
// ---------------------------------------------------------------------------
function isPromoted(a: Artist): boolean {
  return a.coverageLevel === "active" && a.publicationState === "published";
}

const UNPROMOTED_SLUGS: ReadonlySet<string> = new Set(
  artists.filter((a) => !isPromoted(a)).map((a) => a.slug),
);

const ARTIST_BY_SLUG = new Map(artists.map((artist) => [artist.slug, artist]));
const PREDICTION_BY_SLUG = new Map(
  predictions.map((prediction) => [prediction.slug, prediction]),
);
const PULSE_BY_SLUG = new Map(pulses.map((pulse) => [pulse.slug, pulse]));

// True when at least one slug belongs to a promoted artist. Slugs that don't
// resolve to a roster record count as promoted — rankings, events and clips may
// name people we don't cover, and those must keep rendering.
function anyPromotedSlug(slugs: string[]): boolean {
  return slugs.length === 0 || slugs.some((s) => !UNPROMOTED_SLUGS.has(s));
}

// Gallery-level view of the same rule, used by the home page to keep galleries
// whose subjects are all unpromoted out of the hero and bands. The galleries
// themselves stay live in /photos, the pillar grids and the artist hub — moving
// a profile to catalog never unpublishes content. (The exported name predates
// the coverage vocabulary; every page imports it, so it stays.)
export function hasFeaturedArtist(g: Gallery): boolean {
  return anyPromotedSlug(g.artistSlugs);
}

// Publication filter: an archived gallery keeps its /photos/{slug} route (it
// renders an archival notice) but leaves every listing, grid, band and the
// sitemap. All placeholder galleries are archived until permitted photography
// replaces them (docs/roster-playbook.md).
function isPublishedGallery(g: Gallery): boolean {
  return (g.publicationState ?? "published") !== "archived";
}

async function getGalleries(): Promise<Gallery[]> {
  return byDateDesc(galleries.filter(isPublishedGallery));
}

// Galleries for a pillar landing page. For fashion-beauty this applies the lens
// (native fashion galleries OR any gallery carrying a fashion tag).
export async function getGalleriesForPillar(pillar: Pillar): Promise<Gallery[]> {
  let list = byDateDesc(galleries.filter(isPublishedGallery));
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

export async function getFeaturedGallery(): Promise<Gallery | undefined> {
  // Newest published gallery with a promoted artist, falling back to newest
  // published overall. Undefined while every gallery is archived — the interim
  // state — in which case the home hero leads with a clip (getHomeHero).
  const list = byDateDesc(galleries.filter(isPublishedGallery));
  return list.find(hasFeaturedArtist) ?? list[0];
}

// What the home hero leads with: the featured gallery when one is published,
// else the newest promoted clip (music first — the lead rail's genre), else
// nothing (the page renders no hero rather than a fabricated one).
export type HomeHero =
  | { kind: "gallery"; gallery: Gallery }
  | { kind: "clip"; clip: Clip };

export async function getHomeHero(): Promise<HomeHero | undefined> {
  const gallery = await getFeaturedGallery();
  if (gallery) return { kind: "gallery", gallery };
  const [music] = await getMusicClips(1);
  if (music) return { kind: "clip", clip: music };
  const [variety] = await getVarietyClips(1);
  return variety ? { kind: "clip", clip: variety } : undefined;
}

export async function getGalleriesByArtist(artistSlug: string): Promise<Gallery[]> {
  return byDateDesc(galleries.filter(isPublishedGallery)).filter((g) =>
    g.artistSlugs.includes(artistSlug),
  );
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

async function getArtists(): Promise<Artist[]> {
  return [...artists].sort((a, b) => a.name.localeCompare(b.name));
}

export async function getArtistsByPillar(pillar: Pillar): Promise<Artist[]> {
  // Feeds the pillar-page People strip — a promotion surface, so catalog and
  // unpublished profiles are excluded (their hubs stay reachable via their
  // galleries and articles).
  return (await getArtists())
    .filter(isPromoted)
    .filter((a) => (a.pillars ?? ["k-pop"]).includes(pillar));
}

export async function getArtist(slug: string): Promise<Artist | undefined> {
  // Drafts never render: the hub route stays a 404 until the profile publishes.
  const artist = ARTIST_BY_SLUG.get(slug);
  return artist && artist.publicationState !== "draft" ? artist : undefined;
}

// The Stars directory (/artists): published profiles, narrowed by any
// combination of filters, name-sorted. `q` is a case-insensitive substring
// match on the English name (native aliases stay internal — source matching
// only, per the roster playbook).
export async function getStarsDirectory(opts?: {
  pillar?: Pillar;
  stage?: CareerStage;
  type?: Artist["type"];
  agency?: string;
  debutYear?: number;
  coverage?: CoverageLevel;
  q?: string;
}): Promise<Artist[]> {
  let list = (await getArtists()).filter((a) => a.publicationState === "published");
  if (opts?.pillar) list = list.filter((a) => (a.pillars ?? ["k-pop"]).includes(opts.pillar!));
  if (opts?.stage) list = list.filter((a) => a.careerStage === opts.stage);
  if (opts?.type) list = list.filter((a) => a.type === opts.type);
  if (opts?.coverage) list = list.filter((a) => a.coverageLevel === opts.coverage);
  if (opts?.agency) list = list.filter((a) => a.agency === opts.agency);
  if (opts?.debutYear) list = list.filter((a) => a.debutYear === opts.debutYear);
  const q = opts?.q?.trim().toLowerCase();
  if (q) list = list.filter((a) => a.name.toLowerCase().includes(q));
  return list;
}

// Facet values for the directory's form controls, from published profiles only.
export async function getDirectoryFacets(): Promise<{
  agencies: string[];
  debutYears: number[];
}> {
  const published = artists.filter((a) => a.publicationState === "published");
  const agencies = [
    ...new Set(published.map((a) => a.agency).filter((x): x is string => Boolean(x))),
  ].sort((a, b) => a.localeCompare(b));
  const debutYears = [
    ...new Set(published.map((a) => a.debutYear).filter((x): x is number => typeof x === "number")),
  ].sort((a, b) => b - a);
  return { agencies, debutYears };
}

// Official-account tiles for an artist. We only link out (the media stays on the
// source platform, always credited) — the embed-first, legally-safe pattern.
// Restricted to platforms the site still embeds: the retired Instagram/X handles
// stay in the content data as verification records and never render.
function artistEmbeds(artist: Artist): MediaItem[] {
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
        alt: `${artist.name} on ${EMBED_PLATFORM_LABELS[s.platform]}`,
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
// cap. Sync — reads the already-loaded content arrays.
function artistClipEmbeds(slugs: string[], cap: number): MediaItem[] {
  if (cap <= 0) return [];
  const slugSet = new Set(slugs);
  return clips
    .filter(
      (c) =>
        c.artistSlugs.some((s) => slugSet.has(s)) &&
        anyPromotedSlug(c.artistSlugs),
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
// grows. Sync — reads the loaded content.
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
    const artist = ARTIST_BY_SLUG.get(slug);
    if (!artist || !isPromoted(artist)) continue;
    for (const m of artistEmbeds(artist)) {
      if (push(m)) return out;
    }
  }
  return out;
}

// Clip tiles for a surface with no galleries to derive artists from — the
// interim fill while placeholder galleries sit archived and permitted
// photography is sourced. With a pillar, takes the pillar's own clips plus any
// clip whose artist carries that pillar (the lens — Fashion & Beauty has no
// native clips but its people do); without one, the whole promoted clip pool.
// Newest-first, capped, grid-ready. Sync — reads the loaded content.
export function clipFillMedia(cap: number, pillar?: Pillar): MediaItem[] {
  if (cap <= 0) return [];
  let list = clips.filter((c) => anyPromotedSlug(c.artistSlugs));
  if (pillar) {
    const lensArtists = new Set(
      artists
        .filter((a) => (a.pillars ?? ["k-pop"]).includes(pillar))
        .map((a) => a.slug),
    );
    list = list.filter(
      (c) => c.pillar === pillar || c.artistSlugs.some((s) => lensArtists.has(s)),
    );
  }
  return list
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, cap)
    .map(clipMedia);
}

// The home Pulse band's mixed-media fill: a few of the featured artists' official
// clips as grid-ready video tiles, so the band reads as text posts among video
// (the X-feed grammar) while permitted photography sits archived. Deduped against
// the clip ids already placed in this edition's rails (passed in) so no clip shows
// twice on the page. Newest-first, capped. Sync — reads the loaded content.
export function getPulseBandFill(
  artistSlugs: string[],
  excludeClipIds: ReadonlySet<string>,
  cap: number,
): MediaItem[] {
  if (cap <= 0) return [];
  return artistClipEmbeds(artistSlugs, cap + excludeClipIds.size)
    .filter((m) => !excludeClipIds.has(m.id))
    .slice(0, cap);
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

// Pulse is the lightest dated format. It stays deliberately simple at the CMS
// seam: newest first, optionally narrowed to an artist and capped for a band.
export async function getPulses(opts?: {
  artist?: string;
  limit?: number;
}): Promise<Pulse[]> {
  let list = byDateDesc(pulses);
  if (opts?.artist) {
    list = list.filter((pulse) => pulse.artistSlugs.includes(opts.artist!));
  }
  if (opts?.limit !== undefined) {
    list = list.slice(0, Math.max(0, opts.limit));
  }
  return list;
}

export async function getPulse(slug: string): Promise<Pulse | undefined> {
  return PULSE_BY_SLUG.get(slug);
}

// One profile's unified activity stream: published galleries, clips, related
// analysis, Pulse and events, newest first. The hub is not a
// promotion surface, so a catalog profile's timeline still renders in full.
export type TimelineEntry =
  | { format: "gallery"; date: string; gallery: Gallery }
  | { format: "clip"; date: string; clip: Clip }
  | { format: "article"; date: string; article: Article }
  | { format: "pulse"; date: string; pulse: Pulse; artists: Artist[] }
  | { format: "event"; date: string; event: StarEvent };

export async function getProfileTimeline(artistSlug: string): Promise<TimelineEntry[]> {
  const [ownGalleries, ownClips, ownArticles, ownPulses] = await Promise.all([
    getGalleriesByArtist(artistSlug),
    getClips({ artist: artistSlug }),
    getRelatedArticles(artistSlug),
    getPulses({ artist: artistSlug }),
  ]);
  const ownEvents = events.filter((e) => e.artistSlugs?.includes(artistSlug));
  const entries: TimelineEntry[] = [
    ...ownGalleries.map((gallery): TimelineEntry => ({ format: "gallery", date: gallery.date, gallery })),
    ...ownClips.map((clip): TimelineEntry => ({ format: "clip", date: clip.date, clip })),
    ...ownArticles.map((article): TimelineEntry => ({ format: "article", date: article.date, article })),
    ...ownPulses.map(
      (pulse): TimelineEntry => ({
        format: "pulse",
        date: pulse.date,
        pulse,
        artists: pulse.artistSlugs
          .map((slug) => ARTIST_BY_SLUG.get(slug))
          .filter((artist): artist is Artist => Boolean(artist)),
      }),
    ),
    ...ownEvents.map((event): TimelineEntry => ({ format: "event", date: event.date, event })),
  ];
  return byDateDesc(entries);
}

// Rankings — scannable chart tables interleaved into the feed. Today there is one
// per pillar (K-Pop brand reputation, K-Drama viewership); pillars without one
// resolve to undefined so callers render nothing.
// An unpromoted artist's row keeps its place in the table (the chart is the
// chart), but loses its hub link — RankingTable renders a link iff artistSlug is set.
function stripUnpromotedLinks(r: Ranking): Ranking {
  if (!r.rows.some((row) => row.artistSlug && UNPROMOTED_SLUGS.has(row.artistSlug))) {
    return r;
  }
  return {
    ...r,
    rows: r.rows.map((row) =>
      row.artistSlug && UNPROMOTED_SLUGS.has(row.artistSlug)
        ? { ...row, artistSlug: undefined }
        : row,
    ),
  };
}

export async function getRankings(): Promise<Ranking[]> {
  return rankings.map(stripUnpromotedLinks);
}

export async function getRankingForPillar(pillar: Pillar): Promise<Ranking | undefined> {
  const ranking = rankings.find((r) => r.pillar === pillar);
  return ranking && stripUnpromotedLinks(ranking);
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
async function getClips(opts?: {
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
    .filter((c) => anyPromotedSlug(c.artistSlugs))
    .slice(0, limit);
}

// The home "On air" rail: the roster's comedy, variety and talk-show
// appearances on official program channels, newest-first.
export async function getVarietyClips(limit = 12): Promise<Clip[]> {
  return (await getClips({ genre: "variety" }))
    .filter((c) => anyPromotedSlug(c.artistSlugs))
    .slice(0, limit);
}

// Synchronous slug lists for generateStaticParams.
export function allGallerySlugs(): string[] {
  // Archived galleries keep building their routes (they render an archival
  // notice); only listings and the sitemap narrow to published slugs.
  return galleries.map((g) => g.slug);
}
export function publishedGallerySlugs(): string[] {
  return galleries.filter(isPublishedGallery).map((g) => g.slug);
}
export function allArtistSlugs(): string[] {
  // Drafts have no route; published and archived hubs both build.
  return artists.filter((a) => a.publicationState !== "draft").map((a) => a.slug);
}
export function allArticleSlugs(): string[] {
  return articles.map((a) => a.slug);
}
export function allPulseSlugs(): string[] {
  return pulses.map((pulse) => pulse.slug);
}

// ---------------------------------------------------------------------------
// Editions — committed monthly home-page plans. Selection is deterministic
// against the supplied site clock; no request-time wall clock enters this path.
// ---------------------------------------------------------------------------
export async function getEdition(id: string): Promise<FeedEdition | undefined> {
  return editions.find((edition) => edition.id === id);
}

export async function getCurrentEdition(
  nowIso: string = NOW,
): Promise<FeedEdition | undefined> {
  const monthId = nowIso.slice(0, 7);
  const currentMonth = editions.find((edition) => edition.id === monthId);
  if (currentMonth) return currentMonth;

  const nowMs = Date.parse(nowIso);
  if (Number.isNaN(nowMs)) return undefined;
  return [...editions]
    .filter((edition) => {
      const publishedMs = Date.parse(edition.publishedAt);
      return !Number.isNaN(publishedMs) && publishedMs <= nowMs;
    })
    .sort(
      (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
    )[0];
}

export async function getSpotlightForDate(dateIso: string): Promise<Artist[]> {
  const edition = await getCurrentEdition(dateIso);
  if (!edition) return [];
  const day = Number(dateIso.slice(8, 10));
  const week = Number.isFinite(day) && day > 0
    ? day <= 7
      ? 0
      : day <= 14
        ? 1
        : day <= 21
          ? 2
          : 3
    : 0;
  return [...edition.spotlight.anchors, ...(edition.spotlight.weeks[week] ?? [])]
    .map((slug) => ARTIST_BY_SLUG.get(slug))
    .filter(
      (artist): artist is Artist => artist !== undefined && isPromoted(artist),
    );
}

// ---------------------------------------------------------------------------
// Predictions — the Fan Forecast. Curated, vote-only sentiment questions on
// professional outcomes. The data layer derives a ready-to-render tally so pages
// stay declarative. Live vote counts come from Supabase (table `votes`, read via
// the `prediction_tallies` aggregate view); question metadata still comes from
// the content files.
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

// Live counts per prediction and option from the `prediction_tallies` view.
// Degrades to an empty map (→ "no votes yet") when Supabase is unconfigured
// or errors, so a tally read never throws and the page still renders.
async function fetchVoteCounts(
  slugs: string[],
): Promise<Map<string, Map<string, number>>> {
  if (slugs.length === 0) return new Map();
  const supabase = getSupabase();
  if (!supabase) return new Map();
  const { data, error } = await supabase
    .from("prediction_tallies")
    .select("prediction_slug, option_id, votes")
    .in("prediction_slug", slugs);
  if (error || !data) return new Map();
  const counts = new Map<string, Map<string, number>>();
  for (const row of data) {
    const slug = row.prediction_slug as string;
    let byOption = counts.get(slug);
    if (!byOption) {
      byOption = new Map();
      counts.set(slug, byOption);
    }
    byOption.set(row.option_id as string, Number(row.votes));
  }
  return counts;
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

// A question whose only artist-tagged options point at unpromoted artists is a
// promotion surface for people we no longer actively cover — keep it off the
// open-forecast teasers. Content-side, a roster refresh should retire such
// questions; this is the safety net.
function promotesOnlyUnpromoted(p: Prediction): boolean {
  const tagged = p.options
    .map((o) => o.artistSlug)
    .filter((s): s is string => typeof s === "string");
  return tagged.length > 0 && tagged.every((s) => UNPROMOTED_SLUGS.has(s));
}

export async function getOpenPredictions(opts?: { pillar?: Pillar }): Promise<Prediction[]> {
  const now = new Date().toISOString();
  return (await getPredictions(opts)).filter(
    (p) => effectiveStatus(p, now) === "open" && !promotesOnlyUnpromoted(p),
  );
}

export async function getPrediction(slug: string): Promise<Prediction | undefined> {
  return PREDICTION_BY_SLUG.get(slug);
}

export async function getPredictionTallies(
  predictionList: Prediction[],
): Promise<PredictionTally[]> {
  const counts = await fetchVoteCounts([
    ...new Set(predictionList.map((prediction) => prediction.slug)),
  ]);
  return predictionList.map((prediction) =>
    buildTally(prediction, counts.get(prediction.slug) ?? new Map()),
  );
}

export async function getPredictionTally(slug: string): Promise<PredictionTally | undefined> {
  const prediction = PREDICTION_BY_SLUG.get(slug);
  if (!prediction) return undefined;
  const [tally] = await getPredictionTallies([prediction]);
  return tally;
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
