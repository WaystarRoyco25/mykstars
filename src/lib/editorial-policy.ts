import type {
  Artist,
  Clip,
  Gallery,
  Pillar,
  Prediction,
  RightsBasis,
} from "./types";

export const DAY_MS = 86_400_000;

export const DEFAULT_ARTIST_PILLAR: Pillar = "k-pop";
export const FASHION_LENS_TAGS = Object.freeze([
  "pictorial",
  "campaign",
  "beauty",
  "fashion-week",
  "airport",
] as const);

export const MAX_CLIP_AGE_DAYS = 180;
export const ARTICLE_WINDOW_DAYS = 45;
export const RANKING_WINDOW_DAYS = 62;

export const ALL_RIGHTS_BASES = Object.freeze([
  "cc-by",
  "cc-by-sa",
  "public-domain",
  "agency-press-kit",
  "official-embed",
  "licensed",
  "owner-supplied",
] as const satisfies readonly RightsBasis[]);

export const STORED_IMAGE_RIGHTS_BASES = Object.freeze([
  "cc-by",
  "cc-by-sa",
  "public-domain",
  "agency-press-kit",
] as const satisfies readonly RightsBasis[]);

export const PROFILE_HERO_RIGHTS_BASES = Object.freeze([
  ...STORED_IMAGE_RIGHTS_BASES,
  "official-embed",
] as const satisfies readonly RightsBasis[]);

export const COMMONS_DISCOVERY_RIGHTS_BASES = Object.freeze([
  "cc-by",
  "cc-by-sa",
  "public-domain",
] as const satisfies readonly RightsBasis[]);

export const PROFILE_VERIFICATION_MAX_DAYS = Object.freeze({
  active: 60,
  preview: 120,
  catalog: 190,
});

export function artistPillars(artist: Artist): readonly Pillar[] {
  return artist.pillars ?? [DEFAULT_ARTIST_PILLAR];
}

export function isPromotedArtist(artist: Artist): boolean {
  return artist.coverageLevel === "active" && artist.publicationState === "published";
}

/**
 * Unknown artist slugs intentionally count as promoted. External charts, events,
 * and clips may name people outside the curated roster and must remain visible.
 */
export function hasPromotedSubject(
  artistSlugs: readonly string[],
  artistsBySlug: ReadonlyMap<string, Artist>,
): boolean {
  return (
    artistSlugs.length === 0 ||
    artistSlugs.some((slug) => {
      const artist = artistsBySlug.get(slug);
      return artist === undefined || isPromotedArtist(artist);
    })
  );
}

export function isGalleryListed(gallery: Gallery): boolean {
  return (gallery.publicationState ?? "published") !== "archived";
}

export function isEditionGalleryEligible(gallery: Gallery): boolean {
  return (
    isGalleryListed(gallery) &&
    gallery.cover.kind !== "placeholder" &&
    gallery.media.length > 0 &&
    gallery.media.every((media) => media.kind !== "placeholder") &&
    (gallery.cover.kind === "image" ||
      gallery.media.some((media) => media.kind === "image"))
  );
}

export function isFashionLensGallery(gallery: Gallery): boolean {
  return (
    gallery.pillar === "fashion-beauty" ||
    FASHION_LENS_TAGS.some((tag) => gallery.category === tag) ||
    gallery.tags?.some((tag) => FASHION_LENS_TAGS.some((lensTag) => lensTag === tag)) === true
  );
}

export function isClipFreshAt(clip: Clip, nowMs: number): boolean {
  const clipMs = Date.parse(clip.date);
  if (Number.isNaN(clipMs) || clipMs > nowMs) return false;

  if (clip.evergreenUntil) {
    const evergreenMs = Date.parse(clip.evergreenUntil);
    if (!Number.isNaN(evergreenMs) && evergreenMs >= nowMs) return true;
  }

  return nowMs - clipMs <= MAX_CLIP_AGE_DAYS * DAY_MS;
}

/**
 * Forecast state precedence is explicit and shared by rendering, voting, and
 * edition selection: resolved, stored closed, then the real-clock deadline.
 */
export function effectivePredictionStatus(
  prediction: Prediction,
  nowIso: string,
): Prediction["status"] {
  if (prediction.status === "resolved" || prediction.resolution) return "resolved";
  if (prediction.status === "closed") return "closed";

  const closesMs = Date.parse(prediction.closesAt);
  const nowMs = Date.parse(nowIso);
  return !Number.isNaN(closesMs) && !Number.isNaN(nowMs) && closesMs <= nowMs
    ? "closed"
    : "open";
}

export function isPredictionOpenAt(prediction: Prediction, nowIso: string): boolean {
  const opensMs = Date.parse(prediction.opensAt);
  const nowMs = Date.parse(nowIso);
  return (
    !Number.isNaN(opensMs) &&
    !Number.isNaN(nowMs) &&
    opensMs <= nowMs &&
    effectivePredictionStatus(prediction, nowIso) === "open"
  );
}

export function promotesOnlyUnpromotedOptions(
  prediction: Prediction,
  artistsBySlug: ReadonlyMap<string, Artist>,
): boolean {
  const tagged = prediction.options
    .map((option) => option.artistSlug)
    .filter((slug): slug is string => typeof slug === "string");
  return (
    tagged.length > 0 &&
    tagged.every((slug) => {
      const artist = artistsBySlug.get(slug);
      return artist !== undefined && !isPromotedArtist(artist);
    })
  );
}

export function isRightsBasisIn(
  basis: RightsBasis,
  allowed: readonly RightsBasis[],
): boolean {
  return allowed.includes(basis);
}
