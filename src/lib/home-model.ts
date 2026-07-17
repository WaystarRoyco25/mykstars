import "server-only";

import {
  clipFillMedia,
  getArticles,
  getEvents,
  getGalleriesForPillar,
  getHomeHero,
  getMusicClips,
  getOpenPredictions,
  getPredictionTallies,
  getPulseBandFill,
  getRanking,
  getRankings,
  getVarietyClips,
  hasFeaturedArtist,
  pillarFillEmbeds,
} from "./data";
import { resolveSpotlightForDate } from "./data/editions";
import { contentRepository } from "./content-repository";
import type { HomeHero } from "./data/catalog";
import { PILLAR_ORDER } from "./types";
import type {
  Article,
  Artist,
  Clip,
  ClipRailPresentation,
  FeedEdition,
  Gallery,
  MediaItem,
  Pillar,
  Prediction,
  PredictionTally,
  Pulse,
  Ranking,
  StarEvent,
} from "./types";

const BAND_COUNT: Record<Pillar, number> = {
  "k-pop": 12,
  "k-drama": 10,
  "fashion-beauty": 8,
  "k-movie": 6,
};
const INTERLUDE_CAP = 3;
const PULSE_BAND_FILL_CAP = 3;

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

const defaultDependencies: HomeResolutionDependencies = {
  loadTallies: getPredictionTallies,
};

function required<T>(
  index: ReadonlyMap<string, T>,
  key: string,
  label: string,
  editionId: string,
): T {
  const item = index.get(key);
  if (!item) {
    throw new Error(`Edition ${editionId} references missing ${label} "${key}".`);
  }
  return item;
}

/** Resolve only the content explicitly referenced by a committed edition. */
export async function resolveEdition(
  edition: FeedEdition,
  dateIso: string,
  dependencies: HomeResolutionDependencies = defaultDependencies,
): Promise<ResolvedHomeBand[]> {
  const repository = contentRepository;
  const forecastSlugs = [
    ...new Set(
      edition.bands.flatMap((band) =>
        band.kind === "forecast-rail" ? band.predictionSlugs : [],
      ),
    ),
  ];
  const editionPredictions = forecastSlugs.map((slug) =>
    required(repository.predictionBySlug, slug, "forecast", edition.id),
  );
  const tallies = await dependencies.loadTallies(editionPredictions);
  const talliesBySlug = new Map(
    tallies.map((tally) => [tally.predictionSlug, tally]),
  );
  for (const prediction of editionPredictions) {
    required(talliesBySlug, prediction.slug, "forecast tally", edition.id);
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
          required(repository.pulseBySlug, slug, "pulse", edition.id),
        )
      : [],
  );
  const pulseArtistSlugs = [
    ...new Set(referencedPulses.flatMap((pulse) => pulse.artistSlugs)),
  ];
  const artistsBySlug = new Map(
    repository
      .artistsForSlugs(pulseArtistSlugs)
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
          const gallery = required(
            repository.galleryBySlug,
            band.gallerySlug,
            "gallery",
            edition.id,
          );
          if (!repository.listedGalleriesNewest.includes(gallery)) {
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
            clip: required(repository.clipById, band.clipId!, "clip", edition.id),
          },
        };
      }
      case "event-rail":
        return {
          kind: "event-rail",
          events: repository.requireMany(
            repository.eventBySlug,
            band.eventSlugs,
            "event",
            `Edition ${edition.id}`,
          ),
        };
      case "gallery-band": {
        const galleries = repository.requireMany(
          repository.galleryBySlug,
          band.gallerySlugs,
          "gallery",
          `Edition ${edition.id}`,
        );
        for (const gallery of galleries) {
          if (!repository.listedGalleriesNewest.includes(gallery)) {
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
          clips: repository.requireMany(
            repository.clipById,
            band.clipIds,
            "clip",
            `Edition ${edition.id}`,
          ),
        };
      case "ranking":
        return {
          kind: "ranking",
          ranking: required(rankingsBySlug, band.slug, "ranking", edition.id),
        };
      case "analysis":
        return {
          kind: "analysis",
          ...(band.pillar ? { pillar: band.pillar } : {}),
          articles: repository.requireMany(
            repository.articleBySlug,
            band.articleSlugs,
            "article",
            `Edition ${edition.id}`,
          ),
        };
      case "pulse-band": {
        const pulses = repository.requireMany(
          repository.pulseBySlug,
          band.pulseSlugs,
          "pulse",
          `Edition ${edition.id}`,
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
          predictions: repository.requireMany(
            repository.predictionBySlug,
            band.predictionSlugs,
            "forecast",
            `Edition ${edition.id}`,
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

function planHomeArticles(
  articles: Article[],
  renderedPillars: ReadonlySet<Pillar>,
): { interludes: Map<Pillar, Article[]>; closer: Article[] } {
  const interludes = new Map<Pillar, Article[]>();
  const closer: Article[] = [];
  for (const article of articles) {
    if (article.pillar && renderedPillars.has(article.pillar)) {
      const list = interludes.get(article.pillar) ?? [];
      if (list.length < INTERLUDE_CAP) {
        list.push(article);
        interludes.set(article.pillar, list);
        continue;
      }
    }
    closer.push(article);
  }
  return { interludes, closer };
}

export async function resolveFallbackHome(
  nowIso: string,
  dependencies: HomeResolutionDependencies = defaultDependencies,
): Promise<ResolvedHomeBand[]> {
  const forecastsPromise = getOpenPredictions();
  const forecastTalliesPromise = forecastsPromise.then((forecasts) =>
    dependencies.loadTallies(forecasts.slice(0, 6)),
  );
  const [
    hero,
    pillarGalleries,
    articles,
    rankings,
    forecasts,
    forecastTallies,
    events,
    musicClips,
    varietyClips,
  ] = await Promise.all([
    getHomeHero(),
    Promise.all(
      PILLAR_ORDER.map(async (pillar) => ({
        pillar,
        galleries: await getGalleriesForPillar(pillar),
      })),
    ),
    getArticles(),
    getRankings(),
    forecastsPromise,
    forecastTalliesPromise,
    getEvents({ upcomingFrom: nowIso }),
    getMusicClips(14),
    getVarietyClips(14),
  ]);

  const featuredSlug = hero?.kind === "gallery" ? hero.gallery.slug : null;
  const bands = pillarGalleries.map(({ pillar, galleries: candidates }) => {
    const galleries = candidates
      .filter(
        (gallery) => gallery.slug !== featuredSlug && hasFeaturedArtist(gallery),
      )
      .slice(0, BAND_COUNT[pillar]);
    const fillEmbeds =
      galleries.length > 0
        ? pillarFillEmbeds(galleries, BAND_COUNT[pillar] - galleries.length)
        : clipFillMedia(BAND_COUNT[pillar], pillar);
    return { pillar, galleries, fillEmbeds };
  });
  const renderedBands = bands.filter(
    (band) => band.galleries.length + band.fillEmbeds.length > 0,
  );
  const rankingByPillar = new Map(
    rankings.map((ranking) => [ranking.pillar, ranking]),
  );
  const tallyBySlug = new Map(
    forecastTallies.map((tally) => [tally.predictionSlug, tally]),
  );
  const leadForecasts = forecasts.slice(0, 3);
  const nextForecasts = forecasts.slice(3, 6);
  const { interludes, closer } = planHomeArticles(
    articles,
    new Set(renderedBands.map((band) => band.pillar)),
  );

  const output: ResolvedHomeBand[] = [];
  if (hero) output.push({ kind: "hero", hero });
  const upcomingEvents = events.slice(0, 8);
  if (upcomingEvents.length > 0) {
    output.push({ kind: "event-rail", events: upcomingEvents });
  }

  for (const band of renderedBands) {
    output.push({ kind: "gallery-band", ...band });
    const ranking = rankingByPillar.get(band.pillar);
    if (ranking) output.push({ kind: "ranking", ranking });

    if (band.pillar !== "k-drama") {
      const interlude = interludes.get(band.pillar) ?? [];
      if (interlude.length > 0) {
        output.push({ kind: "analysis", pillar: band.pillar, articles: interlude });
      }
    }
    if (band.pillar === "k-pop") {
      if (musicClips.length > 0) {
        output.push({
          kind: "clip-rail",
          presentation: "fallback-music",
          clips: musicClips,
        });
      }
      if (leadForecasts.length > 0) {
        output.push({
          kind: "forecast-rail",
          predictions: leadForecasts,
          tallies: tallyBySlug,
        });
      }
    }
    if (band.pillar === "k-drama") {
      if (varietyClips.length > 0) {
        output.push({
          kind: "clip-rail",
          presentation: "fallback-variety",
          clips: varietyClips,
        });
      }
      const interlude = interludes.get(band.pillar) ?? [];
      if (interlude.length > 0) {
        output.push({ kind: "analysis", pillar: band.pillar, articles: interlude });
      }
      if (nextForecasts.length > 0) {
        output.push({
          kind: "forecast-rail",
          predictions: nextForecasts,
          tallies: tallyBySlug,
        });
      }
    }
  }

  if (closer.length > 0) {
    output.push({ kind: "analysis", articles: closer.slice(0, 8) });
  }
  return output;
}
