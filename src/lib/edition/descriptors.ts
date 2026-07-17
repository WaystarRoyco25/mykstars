import type {
  ClipRailPresentation,
  ContentRef,
  EditionBand,
  EditionClipRailPresentation,
  Pillar,
} from "../types";

export type ContentFormat = ContentRef["format"];

export interface EditionBandDescriptor {
  kind: EditionBand["kind"];
  format: ContentFormat | "hero" | "spotlight";
  refs: readonly ContentRef[];
  pillar?: Pillar;
  minimum: number;
  maximum: number;
}

export const CLIP_RAIL_PRESENTATIONS: Readonly<
  Record<ClipRailPresentation, Readonly<{ title: string; description: string }>>
> = Object.freeze({
  music: Object.freeze({
    title: "In motion",
    description: "Official music videos and performances.",
  }),
  variety: Object.freeze({
    title: "On air",
    description: "Talk, comedy and variety appearances on official channels.",
  }),
  mixed: Object.freeze({
    title: "Now playing",
    description: "Current official videos from across MyKStars.",
  }),
  "fallback-music": Object.freeze({
    title: "In motion",
    description: "The music videos of the moment, straight from the official channels.",
  }),
  "fallback-variety": Object.freeze({
    title: "On air",
    description: "The roster on the talk and variety circuit, in Korea and abroad.",
  }),
});

export function contentRefKey(ref: ContentRef): string {
  return ref.format === "clip" ? `clip:${ref.id}` : `${ref.format}:${ref.slug}`;
}

export function describeBand(band: EditionBand): EditionBandDescriptor {
  switch (band.kind) {
    case "hero": {
      const refs: ContentRef[] = [];
      if (band.gallerySlug) refs.push({ format: "gallery", slug: band.gallerySlug });
      if (band.clipId) refs.push({ format: "clip", id: band.clipId });
      return { kind: band.kind, format: "hero", refs, minimum: 1, maximum: 1 };
    }
    case "event-rail":
      return {
        kind: band.kind,
        format: "event",
        refs: band.eventSlugs.map((slug) => ({ format: "event" as const, slug })),
        minimum: 8,
        maximum: 8,
      };
    case "gallery-band":
      return {
        kind: band.kind,
        format: "gallery",
        refs: band.gallerySlugs.map((slug) => ({ format: "gallery" as const, slug })),
        pillar: band.pillar,
        minimum: 1,
        maximum: 4,
      };
    case "clip-rail":
      return {
        kind: band.kind,
        format: "clip",
        refs: band.clipIds.map((id) => ({ format: "clip" as const, id })),
        minimum: 1,
        maximum: 14,
      };
    case "ranking":
      return {
        kind: band.kind,
        format: "ranking",
        refs: [{ format: "ranking", slug: band.slug }],
        minimum: 1,
        maximum: 1,
      };
    case "analysis":
      return {
        kind: band.kind,
        format: "article",
        refs: band.articleSlugs.map((slug) => ({ format: "article" as const, slug })),
        ...(band.pillar ? { pillar: band.pillar } : {}),
        minimum: 1,
        maximum: Number.POSITIVE_INFINITY,
      };
    case "pulse-band":
      return {
        kind: band.kind,
        format: "pulse",
        refs: band.pulseSlugs.map((slug) => ({ format: "pulse" as const, slug })),
        minimum: 4,
        maximum: 6,
      };
    case "forecast-rail":
      return {
        kind: band.kind,
        format: "forecast",
        refs: band.predictionSlugs.map((slug) => ({ format: "forecast" as const, slug })),
        minimum: 3,
        maximum: 3,
      };
    case "spotlight-strip":
      return {
        kind: band.kind,
        format: "spotlight",
        refs: [],
        minimum: 0,
        maximum: 0,
      };
  }
}

export function clipRailPresentation(
  genres: readonly ("music" | "variety" | undefined)[],
): EditionClipRailPresentation {
  const values = new Set(genres);
  if (values.size === 1 && values.has("music")) return "music";
  if (values.size === 1 && values.has("variety")) return "variety";
  return "mixed";
}

export type { ContentRef } from "../types";
