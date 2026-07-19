import type {
  EditionBand,
  EditionPlan,
  SpotlightSchedule,
} from "../domain/editions";
import type { FeedEditionWithProvenance } from "./provenance";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isSpotlight(value: unknown): value is SpotlightSchedule {
  return (
    isRecord(value) &&
    isStringArray(value.anchors) &&
    Array.isArray(value.weeks) &&
    value.weeks.every(isStringArray)
  );
}

function isBand(value: unknown): value is EditionBand {
  if (!isRecord(value) || typeof value.kind !== "string") return false;
  switch (value.kind) {
    case "hero":
      return (
        (value.gallerySlug === undefined || typeof value.gallerySlug === "string") &&
        (value.clipId === undefined || typeof value.clipId === "string")
      );
    case "event-rail":
      return isStringArray(value.eventSlugs);
    case "gallery-band":
      return typeof value.pillar === "string" && isStringArray(value.gallerySlugs);
    case "clip-rail":
      return (
        typeof value.presentation === "string" && isStringArray(value.clipIds)
      );
    case "ranking":
      return typeof value.slug === "string";
    case "analysis":
      return (
        (value.pillar === undefined || typeof value.pillar === "string") &&
        isStringArray(value.articleSlugs)
      );
    case "pulse-band":
      return isStringArray(value.pulseSlugs);
    case "forecast-rail":
      return isStringArray(value.predictionSlugs);
    case "spotlight-strip":
      return true;
    default:
      return false;
  }
}

export function asEditionArtifact(
  value: unknown,
): FeedEditionWithProvenance | undefined {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.publishedAt !== "string" ||
    !Array.isArray(value.bands) ||
    !value.bands.every(isBand) ||
    !isSpotlight(value.spotlight)
  ) {
    return undefined;
  }
  if (
    value.provenance !== undefined &&
    (!isRecord(value.provenance) ||
      !isStringArray(value.provenance.activeArtistSlugs) ||
      typeof value.provenance.inventoryHash !== "string")
  ) {
    return undefined;
  }
  return value as unknown as FeedEditionWithProvenance;
}

export interface DatedEditionFact {
  key: string;
  format: string;
  date: string;
  dateMs: number;
}

export function staleEditionFacts<T extends DatedEditionFact>(
  edition: EditionPlan,
  inventory: readonly T[],
): T[] {
  const publishedMs = Date.parse(edition.publishedAt);
  if (Number.isNaN(publishedMs)) return [];
  return inventory
    .filter(
      (fact) =>
        fact.format !== "event" &&
        fact.date.slice(0, 7) === edition.id &&
        fact.dateMs > publishedMs,
    )
    .toSorted((left, right) => right.dateMs - left.dateMs);
}
