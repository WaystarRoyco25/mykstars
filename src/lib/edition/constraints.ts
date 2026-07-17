import type { EditionBand, EditionPlan, FeedItem, Pillar, SpotlightSchedule } from "../types";
import { contentRefKey, describeBand } from "./descriptors";

export const MIN_EDITION_ITEMS = 60;
export const MAX_EDITION_ITEMS = 90;
export const CELEBRITY_CAP_RATIO = 0.08;
export const ROLLING_WINDOW_SIZE = 12;
export const MIN_FORMATS_PER_WINDOW = 4;
export const MAX_SAME_BANDS_IN_A_ROW = 2;

export type ContentFeedFormat = Exclude<FeedItem["format"], "spotlight">;

export interface EditionItemFacts {
  item: FeedItem;
  format: ContentFeedFormat;
  artistSlugs: readonly string[];
  pillar?: Pillar;
}

export interface EditionBandFacts {
  format: string;
  pillar?: Pillar;
}

export interface ConstraintViolation {
  constraint: string;
  detail: string;
}

export class EditionConstraintError extends Error {
  readonly constraint: string;

  constructor(constraint: string, detail: string) {
    super(`Edition constraint "${constraint}" is unsatisfied: ${detail}`);
    this.name = "EditionConstraintError";
    this.constraint = constraint;
  }
}

function overlaps(a: readonly string[], b: readonly string[]): boolean {
  const right = new Set(b);
  return a.some((slug) => right.has(slug));
}

export function itemKey(item: FeedItem): string {
  return item.format === "spotlight" ? `spotlight:${item.artistSlug}` : contentRefKey(item);
}

export function flattenBand(band: EditionBand): FeedItem[] {
  return [...describeBand(band).refs];
}

export function flattenEdition(edition: EditionPlan): FeedItem[] {
  return edition.bands.flatMap(flattenBand);
}

export function bandFormat(band: EditionBand): string {
  return describeBand(band).format;
}

export function validateItemFacts(items: readonly EditionItemFacts[]): ConstraintViolation[] {
  const violations: ConstraintViolation[] = [];
  const total = items.length;

  if (total < MIN_EDITION_ITEMS || total > MAX_EDITION_ITEMS) {
    violations.push({
      constraint: "edition-size",
      detail: `${total} flattened items, expected ${MIN_EDITION_ITEMS} to ${MAX_EDITION_ITEMS}`,
    });
  }

  const seen = new Set<string>();
  for (const facts of items) {
    const key = itemKey(facts.item);
    if (seen.has(key)) {
      violations.push({ constraint: "unique-items", detail: `${key} appears more than once` });
    }
    seen.add(key);
  }

  for (let index = 1; index < items.length; index++) {
    if (overlaps(items[index - 1].artistSlugs, items[index].artistSlugs)) {
      violations.push({
        constraint: "celebrity-adjacency",
        detail: `${itemKey(items[index - 1].item)} and ${itemKey(items[index].item)} share a centered celebrity`,
      });
    }
  }

  const cap = Math.floor(total * CELEBRITY_CAP_RATIO);
  const appearances = new Map<string, number>();
  for (const facts of items) {
    for (const slug of new Set(facts.artistSlugs)) {
      appearances.set(slug, (appearances.get(slug) ?? 0) + 1);
    }
  }
  for (const [slug, count] of appearances) {
    if (count > cap) {
      violations.push({
        constraint: "celebrity-cap",
        detail: `${slug} appears in ${count} items, above the ${cap}-item cap for an edition of ${total}`,
      });
    }
  }

  for (let from = 0; from + ROLLING_WINDOW_SIZE <= items.length; from++) {
    const window = items.slice(from, from + ROLLING_WINDOW_SIZE);
    const formats = new Set(window.map((facts) => facts.format));
    if (formats.size < MIN_FORMATS_PER_WINDOW) {
      violations.push({
        constraint: "rolling-format-diversity",
        detail: `items ${from + 1} to ${from + ROLLING_WINDOW_SIZE} contain ${formats.size} formats (${[...formats].join(", ")})`,
      });
    }
  }

  return violations;
}

export function validateBandFacts(bands: readonly EditionBandFacts[]): ConstraintViolation[] {
  const violations: ConstraintViolation[] = [];
  for (let index = MAX_SAME_BANDS_IN_A_ROW; index < bands.length; index++) {
    const run = bands.slice(index - MAX_SAME_BANDS_IN_A_ROW, index + 1);
    if (run.every((band) => band.format === run[0].format)) {
      violations.push({
        constraint: "band-format-streak",
        detail: `bands ${index - 1} to ${index + 1} all use ${run[0].format}`,
      });
    }
    const pillar = run[0].pillar;
    if (pillar && run.every((band) => band.pillar === pillar)) {
      violations.push({
        constraint: "band-pillar-streak",
        detail: `bands ${index - 1} to ${index + 1} all use ${pillar}`,
      });
    }
  }
  return violations;
}

export function validateSpotlight(
  spotlight: SpotlightSchedule,
  activeArtistSlugs: readonly string[],
): ConstraintViolation[] {
  const violations: ConstraintViolation[] = [];
  const active = new Set(activeArtistSlugs);
  const expectedAnchors = Math.min(12, active.size);

  if (spotlight.anchors.length !== expectedAnchors) {
    violations.push({
      constraint: "spotlight-anchor-count",
      detail: `${spotlight.anchors.length} anchors, expected ${expectedAnchors}`,
    });
  }
  if (spotlight.weeks.length !== 4) {
    violations.push({
      constraint: "spotlight-week-count",
      detail: `${spotlight.weeks.length} cohorts, expected exactly 4`,
    });
  }

  const placements = [...spotlight.anchors, ...spotlight.weeks.flat()];
  const seen = new Set<string>();
  for (const slug of placements) {
    if (seen.has(slug)) {
      violations.push({ constraint: "spotlight-unique-cover", detail: `${slug} appears more than once` });
    }
    if (!active.has(slug)) {
      violations.push({ constraint: "spotlight-active-only", detail: `${slug} is not an active published profile` });
    }
    seen.add(slug);
  }
  for (const slug of active) {
    if (!seen.has(slug)) {
      violations.push({ constraint: "spotlight-cover-all", detail: `${slug} has no monthly Spotlight placement` });
    }
  }

  return violations;
}

export function assertNoViolations(violations: readonly ConstraintViolation[]): void {
  if (violations.length === 0) return;
  const first = violations[0];
  const suffix = violations.length > 1 ? ` (${violations.length - 1} additional issue${violations.length === 2 ? "" : "s"})` : "";
  throw new EditionConstraintError(first.constraint, `${first.detail}${suffix}`);
}
