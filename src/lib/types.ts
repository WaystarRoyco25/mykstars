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
const PILLAR_SLUGS: Record<Pillar, string> = {
  "k-pop": "k-pop",
  "k-drama": "k-drama",
  "k-movie": "k-movie",
  "fashion-beauty": "fashion",
};

export function pillarSlug(p: Pillar): string {
  return PILLAR_SLUGS[p];
}

export function pillarFromSlug(slug: string): Pillar | undefined {
  return PILLAR_ORDER.find((pillar) => PILLAR_SLUGS[pillar] === slug);
}

// ---------------------------------------------------------------------------
// Tags — the secondary axis (occasion / topic within a pillar).
// One flat union keeps the data layer simple; tags classify galleries (kicker
// labels, the Fashion & Beauty lens) rather than driving navigation. A few tags
// (pictorial, review) are intentionally shared.
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
  | "embed" // official social embed (YouTube / TikTok)
  | "magazine"; // publisher pictorial

export interface Source {
  name: string; // outlet / photographer / platform
  url: string; // link back to the original
  kind: SourceKind;
}

export type MediaKind = "placeholder" | "image" | "embed";
// Platforms the site renders as live embeds. YouTube plays in place (TikTok is
// reserved, same machinery). Instagram returned in July 2026 as a click-to-reveal
// photo embed: the facade scrolls, and the real post mounts from instagram.com
// only on tap (the server test, never rehosted). X stays retired, its
// official-account record living on as SocialLink data only.
export type EmbedPlatform = "tiktok" | "youtube" | "instagram";

export const EMBED_PLATFORM_LABELS: Record<EmbedPlatform, string> = {
  tiktok: "TikTok",
  youtube: "YouTube",
  instagram: "Instagram",
};

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
  // The post's TRUE publish date (ISO). Required when kind === "embed" — enforced
  // by npm run check:fresh (script-level, like check:style), not the type system.
  date?: string;
  // Links a kind:"image" item to its MediaAsset rights record (src/content/
  // media-assets.ts). check:media enforces that every image resolves one.
  assetId?: string;
}

// ---------------------------------------------------------------------------
// Clips — standalone official YouTube videos that render as live, click-to-play
// embeds in the home rails. Unlike a Gallery, a clip has no detail page and no
// rehosted media: it links out to the source platform and the real player only
// mounts on click (see LiveEmbed). Every clip is credited (kind: "embed") and
// dated like a gallery so a rail reads newest-first. Real, verified permalinks
// only — never fabricated.
// ---------------------------------------------------------------------------
// Editorial genre, one home rail each: "music" (official MVs and performance
// videos, the In motion rail) vs "variety" (comedy / variety / talk-show
// appearances on official program channels, the On air rail).
export type ClipGenre = "music" | "variety";

export interface Clip {
  id: string;
  platform: EmbedPlatform; // "youtube" (tiktok reserved)
  genre: ClipGenre; // which home rail the clip belongs to
  embedUrl: string; // canonical, verified post / Reel / Short URL
  pillar: Pillar;
  artistSlugs: string[];
  date: string; // ISO; sorts newest-first like galleries
  caption: string; // neutral, house-style (may carry *work titles*)
  credit: Source; // the real account / outlet, kind: "embed"
  orientation?: Orientation; // defaults to portrait (vertical) for reel/short
  // ISO date. While >= NOW the clip is exempt from the 180-day freshness gate
  // (npm run check:fresh) — a dated, reviewable exemption for durably-relevant era
  // anchors, never a way to keep genuinely stale content. Expiry forces a re-review.
  evergreenUntil?: string;
}

// ---------------------------------------------------------------------------
// People — generalized beyond K-pop idols to actors, directors and models.
// Cross-pillar people (an idol who acts) carry multiple pillars/disciplines.
// ---------------------------------------------------------------------------
export type Discipline = "idol" | "actor" | "director" | "model";

// Career stage — the site's shared editorial vocabulary for where a person or
// group sits in their arc. "preview" is pre-debut and guardrailed (agency-announced
// lineups only, activity-only coverage — docs/roster-playbook.md).
export type CareerStage = "preview" | "rookie" | "rising" | "established" | "icon";

// Coverage commitment. "active" profiles are monitored every edition and sit on
// promotion surfaces; "catalog" profiles keep their hub, galleries and analysis
// links but leave every surface that actively promotes the roster — the old
// bench semantics, see isPromoted() in data.ts. Catalog profiles are reverified
// every six months and can return to active when activity resumes.
export type CoverageLevel = "active" | "catalog";

// Publication lifecycle. "draft" never renders anywhere (no route, no listing);
// "published" is live; "archived" keeps the URL reachable (with a noindex notice
// where applicable) while leaving listings, sitemaps and promotion surfaces.
export type PublicationState = "draft" | "published" | "archived";

export const CAREER_STAGE_LABELS: Record<CareerStage, string> = {
  preview: "Pre-debut",
  rookie: "Rookie",
  rising: "Rising",
  established: "Established",
  icon: "Icon",
};

export const CAREER_STAGE_ORDER: CareerStage[] = [
  "rookie",
  "rising",
  "established",
  "icon",
  "preview",
];

export const COVERAGE_LEVEL_LABELS: Record<CoverageLevel, string> = {
  active: "Active coverage",
  catalog: "Catalog",
};

// An official non-social link shown on a profile (official site, agency profile
// page). Platform accounts stay in SocialLink.
export interface OfficialLink {
  label: string;
  url: string;
}

// A verified official account. Wider than EmbedPlatform on purpose: X stays a
// retired embed platform, its handle kept here as a verification record that
// never renders. Instagram, YouTube and TikTok are EmbedPlatforms; note the
// account link-out tiles (see artistEmbeds) still cover only YouTube/TikTok,
// while Instagram surfaces as curated post embeds in galleries, Pulse and
// profiles rather than as a bare account tile.
export type SocialPlatform = "instagram" | "x" | "tiktok" | "youtube";

export interface SocialLink {
  platform: SocialPlatform;
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
  social?: SocialLink[]; // verified official accounts (embeddable ones top up sparse grids)
  careerStage: CareerStage;
  coverageLevel: CoverageLevel;
  publicationState: PublicationState;
  // ISO date of the last full verification pass for this profile (web-verify per
  // docs/roster-playbook.md). check:profiles enforces the cadence per coverage level.
  lastVerified: string;
  currentActivity?: string; // one house-style sentence on what they are doing now
  memberOf?: string; // slug of the group profile this member belongs to (reciprocal with members)
  members?: string[]; // member profile slugs — only people who have profiles of their own
  officialLinks?: OfficialLink[];
  aliases?: string[]; // native / alternate names for source matching — internal, never rendered
  // Permitted hero for the profile page: kind "image" backed by a MediaAsset
  // (assetId) under an allowed rights basis, or an official embed (the
  // embed-as-hero basis). Required for newly published profiles — the original
  // roster is allowlisted in scripts/check-profiles.mjs.
  hero?: MediaItem;
}

// The plan-level name for a person/group record. Same shape as Artist — the
// alias exists so new code and docs can speak the StarProfile vocabulary without
// renaming the type across every consumer.
export type StarProfile = Artist;

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
  // Absent = "published". An archived gallery keeps its /photos/{slug} route
  // (rendered with a noindex archival notice) but leaves every listing, grid,
  // and the sitemap — see the publication filters in data.ts.
  publicationState?: "published" | "archived";
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

// ---------------------------------------------------------------------------
// Media rights — the registry behind every permitted (non-embed) image on the
// site. No paid photography, no arbitrary internet-image downloads: an image
// publishes only under one of these bases, recorded per asset.
// ---------------------------------------------------------------------------
export type RightsBasis =
  | "cc-by" // Creative Commons Attribution (Wikimedia Commons etc.)
  | "cc-by-sa" // Creative Commons Attribution-ShareAlike
  | "public-domain"
  | "agency-press-kit" // released for editorial press use by the agency/broadcaster
  | "official-embed" // the hero is an official embed, nothing downloaded or stored
  | "licensed" // individually licensed imagery (reserved)
  | "owner-supplied"; // imagery MyKStars owns outright (reserved)

export interface MediaAsset {
  id: string;
  credit: Source;
  rightsBasis: RightsBasis;
  sourceUrl: string; // where the asset was obtained (license page, press kit URL)
  acquisitionDate: string; // ISO date the asset was acquired and verified
  reviewDate: string; // ISO date the rights record must be re-reviewed by (check:media)
  width: number;
  height: number;
  checksum: string; // sha256 of the stored file
  storagePath: string; // bucket-relative Supabase Storage path
}

// ---------------------------------------------------------------------------
// Pulse — a one-to-three-sentence, dated, sourced celebrity update with a
// permanent shareable URL (/pulse/{slug}). The lightest feed format: real fact,
// real source, no padding.
// ---------------------------------------------------------------------------
export interface Pulse {
  slug: string; // permanent, e.g. "2026-08-aespa-dome-encore"
  heading: string; // short house-style headline (drives metadata/OG)
  artistSlugs: string[];
  pillar: Pillar;
  date: string; // TRUE date of the underlying fact (ISO)
  body: string; // 1-3 sentences, house style
  source: Source;
  media?: MediaItem; // optional permitted image (assetId) or official embed
}

// ---------------------------------------------------------------------------
// Editions — the monthly publishing unit. An edition is a committed, human-
// approved artifact: scripts/generate-edition.ts writes the ordered band list,
// check:edition re-verifies every constraint in CI, and the home page renders
// the bands through its existing components. FeedItem is the accounting unit
// (diversity caps, coverage floors); EditionBand is the render unit. Both
// REFERENCE content by slug/id — nothing is duplicated.
// ---------------------------------------------------------------------------
export type FeedItem =
  | { format: "pulse"; slug: string }
  | { format: "gallery"; slug: string }
  | { format: "clip"; id: string }
  | { format: "event"; slug: string }
  | { format: "forecast"; slug: string }
  | { format: "ranking"; slug: string }
  | { format: "article"; slug: string }
  | { format: "spotlight"; artistSlug: string };

export type EditionBand =
  | { kind: "hero"; gallerySlug?: string; clipId?: string }
  | { kind: "event-rail"; eventSlugs: string[] }
  | { kind: "gallery-band"; pillar: Pillar; gallerySlugs: string[] }
  | { kind: "clip-rail"; title: string; description: string; clipIds: string[] }
  | { kind: "ranking"; slug: string }
  | { kind: "analysis"; pillar?: Pillar; articleSlugs: string[] }
  | { kind: "pulse-band"; pulseSlugs: string[] }
  | { kind: "forecast-rail"; predictionSlugs: string[] }
  | { kind: "spotlight-strip" };

// The month's Spotlight placements. Anchors hold a slot for the full month;
// each of the four preapproved weekly cohorts rotates in for one week. Invariant
// (check:edition): anchors and cohorts together cover every active profile
// exactly once — Spotlight is a rotation guarantee, not a favorite list.
export interface SpotlightSchedule {
  anchors: string[]; // artist slugs, full-month slots (12 at full scale)
  weeks: string[][]; // 4 weekly cohorts of artist slugs
}

export interface FeedEdition {
  id: string; // "2026-08" — one edition per month
  publishedAt: string; // ISO datetime the edition went live
  bands: EditionBand[]; // the committed, approved order the home page renders
  spotlight: SpotlightSchedule;
}
