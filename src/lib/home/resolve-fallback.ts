import "server-only";

import { getArticles } from "../data/articles";
import { getMusicClips, getVarietyClips } from "../data/clips";
import { getEvents } from "../data/events";
import {
  getOpenPredictions,
  getPredictionTallies,
} from "../data/forecasts";
import { getGalleriesForPillar, hasFeaturedArtist } from "../data/galleries";
import {
  clipFillMedia,
  getHomeHero,
  pillarFillEmbeds,
} from "../data/home-fill";
import { getRankings } from "../data/rankings";
import type { Article } from "../domain/stories";
import { PILLAR_ORDER, type Pillar } from "../domain/taxonomy";
import type {
  HomeResolutionDependencies,
  ResolvedHomeBand,
} from "./contract";

const BAND_COUNT: Record<Pillar, number> = {
  "k-pop": 12,
  "k-drama": 10,
  "fashion-beauty": 8,
  "k-movie": 6,
};
const INTERLUDE_CAP = 3;

const defaultDependencies: HomeResolutionDependencies = {
  loadTallies: getPredictionTallies,
};

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
