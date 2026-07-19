import "server-only";

import { resolveSpotlightForDate } from "../data/editions";
import { getPredictionTallies } from "../data/forecasts";
import { getPulseBandFill } from "../data/home-fill";
import { getRanking } from "../data/rankings";
import type { FeedEdition } from "../domain/editions";
import type { Ranking } from "../domain/stories";
import { articleStore } from "../stores/articles";
import { artistStore } from "../stores/artists";
import { clipStore } from "../stores/clips";
import { eventStore } from "../stores/events";
import { forecastStore } from "../stores/forecasts";
import { galleryStore } from "../stores/galleries";
import { requireMany, requireValue } from "../stores/immutable";
import { pulseStore } from "../stores/pulses";
import type {
  HomeResolutionDependencies,
  ResolvedHomeBand,
} from "./contract";

const PULSE_BAND_FILL_CAP = 3;

const defaultDependencies: HomeResolutionDependencies = {
  loadTallies: getPredictionTallies,
};

/** Resolve only the content explicitly referenced by a committed edition. */
export async function resolveEdition(
  edition: FeedEdition,
  dateIso: string,
  dependencies: HomeResolutionDependencies = defaultDependencies,
): Promise<ResolvedHomeBand[]> {
  const editionOwner = `Edition ${edition.id}`;
  const forecastSlugs = [
    ...new Set(
      edition.bands.flatMap((band) =>
        band.kind === "forecast-rail" ? band.predictionSlugs : [],
      ),
    ),
  ];
  const editionPredictions = forecastSlugs.map((slug) =>
    requireValue(forecastStore.bySlug, slug, "forecast", editionOwner),
  );
  const tallies = await dependencies.loadTallies(editionPredictions);
  const talliesBySlug = new Map(
    tallies.map((tally) => [tally.predictionSlug, tally]),
  );
  for (const prediction of editionPredictions) {
    requireValue(talliesBySlug, prediction.slug, "forecast tally", editionOwner);
  }

  const rankingSlugs = [
    ...new Set(
      edition.bands.flatMap((band) => (band.kind === "ranking" ? [band.slug] : [])),
    ),
  ];
  const resolvedRankings = (
    await Promise.all(rankingSlugs.map((slug) => getRanking(slug)))
  ).filter((ranking): ranking is Ranking => ranking !== undefined);
  const rankingsBySlug = new Map(
    resolvedRankings.map((ranking) => [ranking.slug, ranking]),
  );

  const referencedPulses = edition.bands.flatMap((band) =>
    band.kind === "pulse-band"
      ? band.pulseSlugs.map((slug) =>
          requireValue(pulseStore.bySlug, slug, "pulse", editionOwner),
        )
      : [],
  );
  const pulseArtistSlugs = [
    ...new Set(referencedPulses.flatMap((pulse) => pulse.artistSlugs)),
  ];
  const artistsBySlug = new Map(
    artistStore
      .forSlugs(pulseArtistSlugs)
      .filter((artist) => artist.publicationState !== "draft")
      .map((artist) => [artist.slug, artist]),
  );

  const railClipIds = new Set<string>();
  for (const band of edition.bands) {
    if (band.kind === "clip-rail") {
      for (const id of band.clipIds) railClipIds.add(id);
    }
    if (band.kind === "hero" && band.clipId) railClipIds.add(band.clipId);
  }
  const usedFillIds = new Set(railClipIds);

  return edition.bands.map((band): ResolvedHomeBand => {
    switch (band.kind) {
      case "hero": {
        if (Boolean(band.gallerySlug) === Boolean(band.clipId)) {
          throw new Error(`Edition ${edition.id} hero must reference exactly one item.`);
        }
        if (band.gallerySlug) {
          const gallery = requireValue(
            galleryStore.bySlug,
            band.gallerySlug,
            "gallery",
            editionOwner,
          );
          if (!galleryStore.listedNewest.includes(gallery)) {
            throw new Error(
              `Edition ${edition.id} references missing gallery "${band.gallerySlug}".`,
            );
          }
          return { kind: "hero", hero: { kind: "gallery", gallery } };
        }
        return {
          kind: "hero",
          hero: {
            kind: "clip",
            clip: requireValue(clipStore.byId, band.clipId!, "clip", editionOwner),
          },
        };
      }
      case "event-rail":
        return {
          kind: "event-rail",
          events: requireMany(
            eventStore.bySlug,
            band.eventSlugs,
            "event",
            editionOwner,
          ),
        };
      case "gallery-band": {
        const galleries = requireMany(
          galleryStore.bySlug,
          band.gallerySlugs,
          "gallery",
          editionOwner,
        );
        for (const gallery of galleries) {
          if (!galleryStore.listedNewest.includes(gallery)) {
            throw new Error(
              `Edition ${edition.id} references missing gallery "${gallery.slug}".`,
            );
          }
        }
        return {
          kind: "gallery-band",
          pillar: band.pillar,
          galleries,
          fillEmbeds: [],
        };
      }
      case "clip-rail":
        return {
          kind: "clip-rail",
          presentation: band.presentation,
          clips: requireMany(
            clipStore.byId,
            band.clipIds,
            "clip",
            editionOwner,
          ),
        };
      case "ranking":
        return {
          kind: "ranking",
          ranking: requireValue(rankingsBySlug, band.slug, "ranking", editionOwner),
        };
      case "analysis":
        return {
          kind: "analysis",
          ...(band.pillar ? { pillar: band.pillar } : {}),
          articles: requireMany(
            articleStore.bySlug,
            band.articleSlugs,
            "article",
            editionOwner,
          ),
        };
      case "pulse-band": {
        const pulses = requireMany(
          pulseStore.bySlug,
          band.pulseSlugs,
          "pulse",
          editionOwner,
        );
        const bandArtistSlugs = [
          ...new Set(pulses.flatMap((pulse) => pulse.artistSlugs)),
        ];
        const fillEmbeds = getPulseBandFill(
          bandArtistSlugs,
          usedFillIds,
          PULSE_BAND_FILL_CAP,
        );
        for (const item of fillEmbeds) usedFillIds.add(item.id);
        return {
          kind: "pulse-band",
          pulses,
          artistsBySlug,
          fillEmbeds,
        };
      }
      case "forecast-rail":
        return {
          kind: "forecast-rail",
          predictions: requireMany(
            forecastStore.bySlug,
            band.predictionSlugs,
            "forecast",
            editionOwner,
          ),
          tallies: talliesBySlug,
        };
      case "spotlight-strip":
        return {
          kind: "spotlight-strip",
          artists: resolveSpotlightForDate(edition, dateIso),
        };
    }
  });
}
