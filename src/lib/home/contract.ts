import type { HomeHero } from "../data/home-fill";
import type { Artist } from "../domain/artists";
import type { ClipRailPresentation } from "../domain/editions";
import type { StarEvent } from "../domain/events";
import type { Prediction, PredictionTally } from "../domain/forecasts";
import type { MediaItem } from "../domain/media";
import type { Article, Clip, Gallery, Pulse, Ranking } from "../domain/stories";
import type { Pillar } from "../domain/taxonomy";

export type ResolvedHomeBand =
  | { kind: "hero"; hero: HomeHero }
  | { kind: "event-rail"; events: StarEvent[] }
  | {
      kind: "gallery-band";
      pillar: Pillar;
      galleries: Gallery[];
      fillEmbeds: MediaItem[];
    }
  | { kind: "clip-rail"; presentation: ClipRailPresentation; clips: Clip[] }
  | { kind: "ranking"; ranking: Ranking }
  | { kind: "analysis"; pillar?: Pillar; articles: Article[] }
  | {
      kind: "pulse-band";
      pulses: Pulse[];
      artistsBySlug: ReadonlyMap<string, Artist>;
      fillEmbeds: MediaItem[];
    }
  | {
      kind: "forecast-rail";
      predictions: Prediction[];
      tallies: ReadonlyMap<string, PredictionTally>;
    }
  | { kind: "spotlight-strip"; artists: Artist[] };

export interface HomeResolutionDependencies {
  loadTallies(predictions: Prediction[]): Promise<PredictionTally[]>;
}
