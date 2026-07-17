import type {
  Article,
  Artist,
  Clip,
  ClipGenre,
  Gallery,
  Pillar,
  Prediction,
  Pulse,
  Ranking,
  StarEvent,
} from "../types";
import {
  ARTICLE_WINDOW_DAYS,
  DAY_MS,
  RANKING_WINDOW_DAYS,
  hasPromotedSubject,
  isClipFreshAt,
  isEditionGalleryEligible,
  isPredictionOpenAt,
  isPromotedArtist,
} from "../editorial-policy";
import { EditionConstraintError } from "./constraints";
import { contentRefKey, type ContentFormat, type ContentRef } from "./descriptors";

export const MIN_PULSES = 18;
export const MIN_CLIPS = 15;
export const EVENT_RAIL_SIZE = 8;
export const MIN_FORECASTS = 6;
export const MIN_ARTICLES = 4;
export const MAX_ARTICLES = 8;
export const MIN_RANKINGS = 1;
export const EDITORIAL_TARGET_ITEMS = 75;

export interface EditionInventoryInput {
  artists: readonly Artist[];
  pulses: readonly Pulse[];
  clips: readonly Clip[];
  galleries: readonly Gallery[];
  predictions: readonly Prediction[];
  events: readonly StarEvent[];
  rankings: readonly Ranking[];
  articles: readonly Article[];
}

interface InventoryFactBase {
  ref: ContentRef;
  key: string;
  artistSlugs: string[];
  pillar?: Pillar;
  date: string;
  dateMs: number;
}

export type EditionInventoryFact =
  | (InventoryFactBase & { format: "pulse"; content: Pulse })
  | (InventoryFactBase & { format: "gallery"; content: Gallery })
  | (InventoryFactBase & {
      format: "clip";
      content: Clip;
      clipGenre: ClipGenre;
    })
  | (InventoryFactBase & { format: "event"; content: StarEvent })
  | (InventoryFactBase & { format: "forecast"; content: Prediction })
  | (InventoryFactBase & { format: "ranking"; content: Ranking })
  | (InventoryFactBase & { format: "article"; content: Article });

export function parseEditionDate(value: string, label: string): number {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    throw new EditionConstraintError("inventory-date", `${label} has an unparseable date: ${value}`);
  }
  return parsed;
}

function unique(values: readonly string[] | undefined): string[] {
  return [...new Set(values ?? [])];
}

export function activeRosterSnapshot(artists: readonly Artist[]): string[] {
  return artists.filter(isPromotedArtist).map((artist) => artist.slug);
}

export function buildInventoryFacts(input: EditionInventoryInput): EditionInventoryFact[] {
  const facts: EditionInventoryFact[] = [];
  for (const pulse of input.pulses) {
    const ref = { format: "pulse" as const, slug: pulse.slug };
    facts.push({
      ref,
      key: contentRefKey(ref),
      format: "pulse",
      content: pulse,
      artistSlugs: unique(pulse.artistSlugs),
      pillar: pulse.pillar,
      date: pulse.date,
      dateMs: parseEditionDate(pulse.date, `pulse ${pulse.slug}`),
    });
  }
  for (const gallery of input.galleries) {
    const ref = { format: "gallery" as const, slug: gallery.slug };
    facts.push({
      ref,
      key: contentRefKey(ref),
      format: "gallery",
      content: gallery,
      artistSlugs: unique(gallery.artistSlugs),
      pillar: gallery.pillar,
      date: gallery.date,
      dateMs: parseEditionDate(gallery.date, `gallery ${gallery.slug}`),
    });
  }
  for (const clip of input.clips) {
    const ref = { format: "clip" as const, id: clip.id };
    facts.push({
      ref,
      key: contentRefKey(ref),
      format: "clip",
      content: clip,
      artistSlugs: unique(clip.artistSlugs),
      pillar: clip.pillar,
      date: clip.date,
      dateMs: parseEditionDate(clip.date, `clip ${clip.id}`),
      clipGenre: clip.genre,
    });
  }
  for (const event of input.events) {
    const ref = { format: "event" as const, slug: event.slug };
    facts.push({
      ref,
      key: contentRefKey(ref),
      format: "event",
      content: event,
      artistSlugs: unique(event.artistSlugs),
      date: event.date,
      dateMs: parseEditionDate(event.date, `event ${event.slug}`),
    });
  }
  for (const prediction of input.predictions) {
    const ref = { format: "forecast" as const, slug: prediction.slug };
    facts.push({
      ref,
      key: contentRefKey(ref),
      format: "forecast",
      content: prediction,
      artistSlugs: unique(prediction.options.flatMap((option) => option.artistSlug ? [option.artistSlug] : [])),
      pillar: prediction.pillar,
      date: prediction.opensAt,
      dateMs: parseEditionDate(prediction.opensAt, `forecast ${prediction.slug}`),
    });
  }
  for (const ranking of input.rankings) {
    const ref = { format: "ranking" as const, slug: ranking.slug };
    facts.push({
      ref,
      key: contentRefKey(ref),
      format: "ranking",
      content: ranking,
      artistSlugs: unique(ranking.rows.flatMap((row) => row.artistSlug ? [row.artistSlug] : [])),
      pillar: ranking.pillar,
      date: ranking.asOf,
      dateMs: parseEditionDate(ranking.asOf, `ranking ${ranking.slug}`),
    });
  }
  for (const article of input.articles) {
    const ref = { format: "article" as const, slug: article.slug };
    facts.push({
      ref,
      key: contentRefKey(ref),
      format: "article",
      content: article,
      artistSlugs: unique(article.related?.artistSlugs),
      ...(article.pillar ? { pillar: article.pillar } : {}),
      date: article.date,
      dateMs: parseEditionDate(article.date, `article ${article.slug}`),
    });
  }
  return facts;
}

export function assertUniqueInventory(facts: readonly EditionInventoryFact[]): void {
  const seen = new Set<string>();
  for (const fact of facts) {
    if (seen.has(fact.key)) {
      throw new EditionConstraintError("unique-inventory", `${fact.key} appears more than once`);
    }
    seen.add(fact.key);
  }
}

export interface EditionEligibilityContext {
  editionId: string;
  publishedAt: string;
  publishedMs: number;
  artistBySlug: ReadonlyMap<string, Artist>;
}

export function isInventoryFactEligible(
  fact: EditionInventoryFact,
  context: EditionEligibilityContext,
): boolean {
  if (fact.format !== "event" && fact.dateMs > context.publishedMs) return false;
  if (!hasPromotedSubject(fact.artistSlugs, context.artistBySlug)) return false;

  switch (fact.format) {
    case "pulse":
      return fact.date.slice(0, 7) === context.editionId;
    case "gallery":
      return isEditionGalleryEligible(fact.content);
    case "clip":
      return isClipFreshAt(fact.content, context.publishedMs);
    case "event":
      return fact.content.status !== "postponed" &&
        (fact.content.endDate ?? fact.content.date) >= context.publishedAt.slice(0, 10);
    case "forecast":
      return isPredictionOpenAt(fact.content, context.publishedAt);
    case "ranking":
      return context.publishedMs - fact.dateMs <= RANKING_WINDOW_DAYS * DAY_MS;
    case "article":
      return fact.content.status === "analysis" &&
        context.publishedMs - fact.dateMs <= ARTICLE_WINDOW_DAYS * DAY_MS;
  }
}

export function eligibleInventoryFacts(
  input: EditionInventoryInput,
  editionId: string,
  publishedAt: string,
): EditionInventoryFact[] {
  const publishedMs = parseEditionDate(publishedAt, "publishedAt");
  const artistBySlug = new Map(input.artists.map((artist) => [artist.slug, artist]));
  return buildInventoryFacts(input).filter((fact) => isInventoryFactEligible(fact, {
    editionId,
    publishedAt,
    publishedMs,
    artistBySlug,
  }));
}

export function factsByFormat(
  facts: readonly EditionInventoryFact[],
): Record<ContentFormat, EditionInventoryFact[]> {
  const groups: Record<ContentFormat, EditionInventoryFact[]> = {
    pulse: [],
    gallery: [],
    clip: [],
    event: [],
    forecast: [],
    ranking: [],
    article: [],
  };
  for (const fact of facts) groups[fact.format].push(fact);
  return groups;
}
