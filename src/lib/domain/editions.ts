import type { Pillar } from "./taxonomy";

export type ContentRef =
  | { format: "pulse"; slug: string }
  | { format: "gallery"; slug: string }
  | { format: "clip"; id: string }
  | { format: "event"; slug: string }
  | { format: "forecast"; slug: string }
  | { format: "ranking"; slug: string }
  | { format: "article"; slug: string };

export type FeedItem = ContentRef | { format: "spotlight"; artistSlug: string };

export type ClipRailPresentation =
  | "music"
  | "variety"
  | "mixed"
  | "fallback-music"
  | "fallback-variety";

export type EditionClipRailPresentation = Exclude<
  ClipRailPresentation,
  "fallback-music" | "fallback-variety"
>;

export type EditionBand =
  | { kind: "hero"; gallerySlug: string; clipId?: never }
  | { kind: "hero"; clipId: string; gallerySlug?: never }
  | { kind: "event-rail"; eventSlugs: string[] }
  | { kind: "gallery-band"; pillar: Pillar; gallerySlugs: string[] }
  | {
      kind: "clip-rail";
      presentation: EditionClipRailPresentation;
      clipIds: string[];
    }
  | { kind: "ranking"; slug: string }
  | { kind: "analysis"; pillar?: Pillar; articleSlugs: string[] }
  | { kind: "pulse-band"; pulseSlugs: string[] }
  | { kind: "forecast-rail"; predictionSlugs: string[] }
  | { kind: "spotlight-strip" };

export interface SpotlightSchedule {
  anchors: string[];
  weeks: string[][];
}

export interface EditionProvenance {
  activeArtistSlugs: string[];
  inventoryHash: string;
}

export interface EditionPlan {
  id: string;
  publishedAt: string;
  bands: EditionBand[];
  spotlight: SpotlightSchedule;
}

export interface FeedEdition extends EditionPlan {
  provenance: EditionProvenance;
}
