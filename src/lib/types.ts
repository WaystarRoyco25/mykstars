// Domain model for MyKStars.
// These types are the contract between the UI and the data layer (see data.ts).
// Today the data layer is backed by local seed data; swapping in a headless CMS
// (Sanity/Payload) later means re-implementing data.ts against these same types.

// ---------------------------------------------------------------------------
// Pillars — the primary content axis (the site's top-level navigation).
// Coverage weight: K-Pop > K-Drama > Fashion/Beauty > K-Movie.
// ---------------------------------------------------------------------------
export type Pillar = "k-pop" | "k-drama" | "k-movie" | "fashion-beauty";

export const PILLAR_LABELS: Record<Pillar, string> = {
  "k-pop": "K-Pop",
  "k-drama": "K-Drama",
  "k-movie": "K-Movie",
  "fashion-beauty": "Fashion & Beauty",
};

// Display / nav order — coverage-weighted (flip the last two to keep K-Movie third).
export const PILLAR_ORDER: Pillar[] = ["k-pop", "k-drama", "fashion-beauty", "k-movie"];

// URL slug per pillar. "fashion-beauty" surfaces as the cleaner /fashion.
export const PILLAR_SLUGS: Record<Pillar, string> = {
  "k-pop": "k-pop",
  "k-drama": "k-drama",
  "k-movie": "k-movie",
  "fashion-beauty": "fashion",
};

const SLUG_TO_PILLAR: Record<string, Pillar> = Object.fromEntries(
  (Object.entries(PILLAR_SLUGS) as [Pillar, string][]).map(([p, s]) => [s, p]),
);

export function pillarSlug(p: Pillar): string {
  return PILLAR_SLUGS[p];
}

export function pillarFromSlug(slug: string): Pillar | undefined {
  return SLUG_TO_PILLAR[slug];
}

// ---------------------------------------------------------------------------
// Tags — the secondary axis (occasion / topic within a pillar).
// One flat union keeps the data layer simple; PILLAR_TAGS scopes which tags a
// given pillar offers. A few tags (pictorial, review) are intentionally shared.
// ---------------------------------------------------------------------------
export type CategoryTag =
  // K-Pop (the original occasion categories)
  | "airport"
  | "red-carpet"
  | "comeback"
  | "event"
  | "pictorial"
  // K-Drama
  | "stills"
  | "casting"
  | "press"
  | "review"
  | "ost"
  | "calendar"
  // K-Movie ("review" shared with K-Drama)
  | "festival"
  | "director"
  | "crossover"
  // Fashion & Beauty ("pictorial" shared with K-Pop)
  | "campaign"
  | "beauty"
  | "fashion-week";

export const TAG_LABELS: Record<CategoryTag, string> = {
  airport: "Airport",
  "red-carpet": "Red carpet",
  comeback: "Comeback",
  event: "Event",
  pictorial: "Pictorial",
  stills: "Stills",
  casting: "Casting",
  press: "Press",
  review: "Reviews",
  ost: "OST",
  calendar: "Calendar",
  festival: "Festival",
  director: "Directors",
  crossover: "Crossover",
  campaign: "Campaign",
  beauty: "Beauty",
  "fashion-week": "Fashion week",
};

// Which tags each pillar offers in its filter row.
export const PILLAR_TAGS: Record<Pillar, CategoryTag[]> = {
  "k-pop": ["airport", "red-carpet", "comeback", "event", "pictorial"],
  "k-drama": ["stills", "casting", "press", "review", "ost", "calendar"],
  "k-movie": ["festival", "director", "review", "crossover"],
  "fashion-beauty": ["pictorial", "campaign", "beauty", "fashion-week"],
};

export const ALL_TAGS = Object.keys(TAG_LABELS) as CategoryTag[];

// Sort order for the photo archive (/photos): newest, oldest, or densest set.
export type GallerySort = "latest" | "oldest" | "photos";

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------
// How a piece of media reaches us. This encodes the "defensible aggregation"
// model from the plan: prefer embeds (photo stays on source) and licensed
// imagery; never silently rehost. Every item carries a credit.
export type SourceKind =
  | "press" // Korean photo desk (OSEN, Newsen, Star News...)
  | "wire" // wire service (Yonhap, News1, AP, Reuters)
  | "official" // agency / label / studio press kit
  | "licensed" // paid stock (Getty incl. imazins, etc.)
  | "embed" // official social embed (IG / X / TikTok / YouTube)
  | "magazine"; // publisher pictorial

export interface Source {
  name: string; // outlet / photographer / platform
  url: string; // link back to the original
  kind: SourceKind;
}

export type MediaKind = "placeholder" | "image" | "embed";
export type EmbedPlatform = "instagram" | "x" | "tiktok" | "youtube";

// Orientation drives the vertical-leaning masonry. Portrait dominates the grid;
// landscape breaks out wide; nothing is force-cropped. For real images this is
// derived from width/height at ingest; placeholders set it explicitly.
export type Orientation = "portrait" | "landscape" | "square";

export interface MediaItem {
  id: string;
  kind: MediaKind;
  alt: string;
  credit: Source; // attribution is required — no exceptions
  src?: string; // when kind === "image"
  width?: number;
  height?: number;
  orientation?: Orientation; // explicit; falls back to width/height, then portrait
  embedUrl?: string; // when kind === "embed"
  platform?: EmbedPlatform; // when kind === "embed"
  tone?: number; // 0..3, decorative variety for placeholders
}

// ---------------------------------------------------------------------------
// Clips — standalone short-form social posts (Instagram Reels/posts, YouTube
// Shorts) that render as live, lazy-hydrated embeds in the home rails. Unlike a
// Gallery, a clip has no detail page and no rehosted media: it links out to the
// source platform and the real player only mounts when scrolled into view (see
// LiveEmbed). Every clip is credited (kind: "embed") and dated like a gallery so
// a rail reads newest-first. Real, verified permalinks only — never fabricated.
// ---------------------------------------------------------------------------
export type ClipFormat = "reel" | "short" | "post";

export interface Clip {
  id: string;
  platform: EmbedPlatform; // "instagram" | "youtube" (x / tiktok reserved)
  format: ClipFormat; // vertical reel, YouTube Short, or feed post
  embedUrl: string; // canonical, verified post / Reel / Short URL
  pillar: Pillar;
  artistSlugs: string[];
  date: string; // ISO; sorts newest-first like galleries
  caption: string; // neutral, house-style (may carry *work titles*)
  credit: Source; // the real account / outlet, kind: "embed"
  orientation?: Orientation; // defaults to portrait (vertical) for reel/short
}

// ---------------------------------------------------------------------------
// People — generalized beyond K-pop idols to actors, directors and models.
// Cross-pillar people (an idol who acts) carry multiple pillars/disciplines.
// ---------------------------------------------------------------------------
export type Discipline = "idol" | "actor" | "director" | "model";

// A verified official account. Used to credit/link out (never rehost) and to top
// up a sparse grid with official-channel tiles.
export interface SocialLink {
  platform: EmbedPlatform;
  url: string; // the verified official account URL
  handle: string; // e.g. "@newjeans_official"
}

export interface Artist {
  slug: string;
  name: string;
  koreanName?: string;
  type: "group" | "soloist" | "individual"; // "individual" = actor/director/model
  disciplines?: Discipline[]; // e.g. ["idol","actor"] for a cross-pillar idol
  pillars?: Pillar[]; // pillar membership; defaults to ["k-pop"] when absent
  agency?: string; // agency / management / studio
  debutYear?: number;
  knownFor?: string[]; // neutral, factual descriptors (reserved for CMS)
  bio: string;
  social?: SocialLink[]; // verified official accounts (used to top up sparse grids)
}

// ---------------------------------------------------------------------------
// Galleries — a gallery has one home pillar + one tag, plus optional extra tags
// used for cross-pillar surfacing (the Fashion/Beauty lens).
// ---------------------------------------------------------------------------
export interface Gallery {
  slug: string;
  title: string;
  pillar: Pillar;
  category: CategoryTag; // the primary tag within the pillar
  tags?: CategoryTag[]; // extra tags for lens surfacing
  artistSlugs: string[];
  event?: string;
  date: string; // ISO date
  source: Source; // primary source for the set
  cover: MediaItem;
  media: MediaItem[];
  excerpt: string;
}

export type ArticleStatus = "analysis" | "confirmed" | "unverified";

export interface Article {
  slug: string;
  title: string;
  dek: string; // standfirst / summary
  status: ArticleStatus;
  pillar?: Pillar; // optional — site-wide standards pieces have none
  author: string;
  date: string; // ISO date
  body: string[]; // paragraphs
  source?: Source;
  related?: {
    artistSlugs?: string[];
    gallerySlugs?: string[];
  };
}

// ---------------------------------------------------------------------------
// Rankings — scannable K-Culture chart tables (idol brand reputation, drama
// viewership) interleaved between photo bands to break up the endless feed.
// Like every gallery, a table carries a Source; until a real feed is wired the
// figures are illustrative samples (sample: true), flagged in the UI — the same
// honesty model as the placeholder photos.
// ---------------------------------------------------------------------------
export interface RankingRow {
  rank: number;
  name: string; // person / group, or a programme / film title
  detail?: string; // agency, broadcast network, lead actor, etc.
  value: string; // pre-formatted metric, e.g. "8,742,153" or "11.4%"
  change?: number; // rank delta vs the previous period (+ up, − down, 0 flat)
  isNew?: boolean; // new entry this period (no prior rank)
  artistSlug?: string; // links the row to /artists/{slug} when we cover them
}

export interface Ranking {
  slug: string;
  title: string;
  pillar: Pillar;
  metricLabel: string; // value-column header, e.g. "Brand index" / "Rating"
  period: string; // human label, e.g. "June 2026"
  asOf: string; // ISO date
  source: Source;
  sample?: boolean; // figures are illustrative placeholders, not yet sourced
  blurb?: string; // one-line description under the title
  rows: RankingRow[];
}

// ---------------------------------------------------------------------------
// Events — a forward-looking D-Day schedule of officially-announced concerts and
// fan meetings. The audience is international, so each event carries a coarse
// region (the filter axis) and the page surfaces outside-Korea dates first.
// Unlike the sample rankings, these dates are real and every event is credited
// via a Source. Named StarEvent to avoid colliding with the DOM `Event` global.
// ---------------------------------------------------------------------------
export type EventType = "concert" | "fan-meeting";

export type EventRegion =
  | "north-america"
  | "europe"
  | "asia"
  | "latin-america"
  | "oceania"
  | "korea";

// Singular labels (used in per-event badges); the filter pluralizes with "s".
export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  concert: "Concert",
  "fan-meeting": "Fan meeting",
};

export const EVENT_TYPE_ORDER: EventType[] = ["concert", "fan-meeting"];

export const REGION_LABELS: Record<EventRegion, string> = {
  "north-america": "North America",
  europe: "Europe",
  asia: "Asia",
  "latin-america": "Latin America",
  oceania: "Oceania",
  korea: "Korea",
};

// Region filter order. The page leads with an "International" pseudo-view (every
// region except Korea); these are the concrete regions a visitor can narrow to,
// Korea last — the international audience comes first.
export const REGION_ORDER: EventRegion[] = [
  "north-america",
  "europe",
  "asia",
  "latin-america",
  "oceania",
  "korea",
];

export type EventStatus = "on-sale" | "sold-out" | "announced" | "postponed";

export interface StarEvent {
  slug: string;
  headliner: string; // display name (group / soloist); always shown
  artistSlugs?: string[]; // links to /artists/{slug} when we cover the act
  type: EventType;
  tour?: string; // tour / fan-meet title (omitted when unconfirmed)
  date: string; // venue-LOCAL calendar date, date-only ISO ("2026-08-15")
  endDate?: string; // last date of a multi-night run, date-only ISO
  venue?: string;
  city: string;
  country: string;
  region: EventRegion; // drives the region filter
  status?: EventStatus;
  ticketUrl?: string; // official ticketing / tour link
  source: Source; // attribution — every event links back to its source
  note?: string; // optional one-line neutral context
}

// ---------------------------------------------------------------------------
// Predictions — the "Fan Forecast". A curated, vote-only fan-sentiment meter on
// professional K-culture outcomes: awards, charts, comebacks, box office, tours.
// Framed honestly as what fans believe & hope, NOT a neutral oracle. Two hard
// rules: (1) professional outcomes only — never private lives, relationships,
// health or misfortune; (2) every question resolves against an objective, public,
// dated source. Until real voting is wired, tallies are illustrative samples
// (sample: true), flagged in the UI — the same honesty model as the rankings.
// ---------------------------------------------------------------------------
export type PredictionCategory =
  | "award"
  | "chart"
  | "comeback"
  | "box-office"
  | "tour"
  | "debut"
  | "campaign";

export const PREDICTION_CATEGORY_LABELS: Record<PredictionCategory, string> = {
  award: "Awards",
  chart: "Charts",
  comeback: "Comeback",
  "box-office": "Box office",
  tour: "Tour",
  debut: "Debut",
  campaign: "Campaign",
};

// open → closed (voting cutoff) → resolved. `status` is the stored value; the
// open→closed transition is time-derived from closesAt (see effectiveStatus in
// data.ts), so no scheduler is needed to close voting.
export type PredictionStatus = "open" | "closed" | "resolved";

export interface PredictionOption {
  id: string; // stable within its prediction; the vote/resolution key
  label: string; // "Yes" / "No", or a nominee name
  artistSlug?: string; // links the option to /artists/{slug} where we cover them
}

export interface Resolution {
  winningOptionId: string;
  resolvedAt: string; // ISO date the outcome became official
  source: Source; // the objective, public source proving it
  note?: string; // one-line neutral context
}

export interface Prediction {
  slug: string;
  pillar: Pillar; // reuses the pillar axis → enables per-pillar surfacing/leaderboards
  category: PredictionCategory;
  question: string; // "Will aespa win a Daesang at the 2026 MAMA Awards?"
  framing: string; // hype/sentiment standfirst — "what fans believe & hope"
  opensAt: string; // ISO datetime
  closesAt: string; // ISO datetime — voting cutoff; drives the D-Day countdown
  status: PredictionStatus; // stored status; effectiveStatus() derives close-by-time
  options: PredictionOption[];
  resolutionSourceLabel: string; // human label shown while open ("Resolves: official MAMA winners list")
  resolutionSource: Source; // the dated, objective source that will settle it
  resolution?: Resolution; // present iff resolved
  tallyVisibleThreshold: number; // hide exact counts below this many votes (cold-start)
  asOf: string; // ISO — honesty "as of" date, mirrors Ranking.asOf
}

// Read-model returned by the data layer (never raw vote rows). Derived from live
// vote counts in Supabase (the `prediction_tallies` view).
export interface PredictionTallyOption {
  optionId: string;
  votes: number;
  pct: number; // 0..100, rounded; 0 when there are no votes
}

export interface PredictionTally {
  predictionSlug: string;
  totalVotes: number;
  perOption: PredictionTallyOption[];
  revealed: boolean; // false while totalVotes < tallyVisibleThreshold
  asOf: string;
}
