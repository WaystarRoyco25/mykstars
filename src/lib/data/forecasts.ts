import "server-only";

import { cache } from "react";

import { contentRepository } from "../content-repository";
import {
  effectivePredictionStatus,
  promotesOnlyUnpromotedOptions,
} from "../editorial-policy";
import { getVoteRepository } from "../forecast/vote-repository";
import { buildPredictionTally } from "../forecast/tally";
import type {
  Pillar,
  Prediction,
  PredictionStatus,
  PredictionTally,
} from "../types";

const repository = contentRepository;

export function effectiveStatus(
  prediction: Prediction,
  nowIso: string = new Date().toISOString(),
): PredictionStatus {
  return effectivePredictionStatus(prediction, nowIso);
}

const PREDICTION_STATUS_ORDER: Record<PredictionStatus, number> = {
  open: 0,
  closed: 1,
  resolved: 2,
};

export async function getPredictions(opts?: {
  pillar?: Pillar;
}): Promise<Prediction[]> {
  const operationNow = new Date().toISOString();
  return orderedPredictions(opts, operationNow);
}

function orderedPredictions(
  opts: { pillar?: Pillar } | undefined,
  operationNow: string,
): Prediction[] {
  let list = [...repository.predictions];
  if (opts?.pillar) {
    list = list.filter((prediction) => prediction.pillar === opts.pillar);
  }
  return list.sort((a, b) => {
    const statusA = PREDICTION_STATUS_ORDER[effectiveStatus(a, operationNow)];
    const statusB = PREDICTION_STATUS_ORDER[effectiveStatus(b, operationNow)];
    if (statusA !== statusB) return statusA - statusB;
    if (statusA === PREDICTION_STATUS_ORDER.resolved) {
      return (
        Date.parse(b.resolution?.resolvedAt ?? b.closesAt) -
        Date.parse(a.resolution?.resolvedAt ?? a.closesAt)
      );
    }
    return Date.parse(a.closesAt) - Date.parse(b.closesAt);
  });
}

export async function getOpenPredictions(opts?: {
  pillar?: Pillar;
}): Promise<Prediction[]> {
  const operationNow = new Date().toISOString();
  const ordered = orderedPredictions(opts, operationNow);
  return ordered.filter(
    (prediction) =>
      effectiveStatus(prediction, operationNow) === "open" &&
      !promotesOnlyUnpromotedOptions(prediction, repository.artistBySlug),
  );
}

const readPrediction = cache(async (slug: string): Promise<Prediction | undefined> =>
  repository.predictionBySlug.get(slug),
);

export async function getPrediction(slug: string): Promise<Prediction | undefined> {
  return readPrediction(slug);
}

export async function getPredictionTallies(
  predictionList: Prediction[],
): Promise<PredictionTally[]> {
  const slugs = [...new Set(predictionList.map((prediction) => prediction.slug))];
  const rows = await getVoteRepository().readTallies(slugs);
  const counts = new Map<string, Map<string, number>>();
  for (const row of rows) {
    const byOption = counts.get(row.predictionSlug) ?? new Map<string, number>();
    byOption.set(row.optionId, row.votes);
    counts.set(row.predictionSlug, byOption);
  }
  return predictionList.map((prediction) =>
    buildPredictionTally(prediction, counts.get(prediction.slug) ?? new Map()),
  );
}

export async function getPredictionTally(
  slug: string,
): Promise<PredictionTally | undefined> {
  const prediction = repository.predictionBySlug.get(slug);
  if (!prediction) return undefined;
  const [tally] = await getPredictionTallies([prediction]);
  return tally;
}

export async function getVotedOptionId(
  slug: string,
  voterId: string | undefined,
): Promise<string | null> {
  return getVoteRepository().readVoterSelection(slug, voterId);
}
