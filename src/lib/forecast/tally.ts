import type { Prediction, PredictionTally } from "../domain/forecasts";

export function buildPredictionTally(
  prediction: Prediction,
  counts: ReadonlyMap<string, number>,
): PredictionTally {
  const perOption = prediction.options.map((option) => ({
    optionId: option.id,
    votes: counts.get(option.id) ?? 0,
  }));
  const totalVotes = perOption.reduce((sum, option) => sum + option.votes, 0);
  return {
    predictionSlug: prediction.slug,
    totalVotes,
    perOption: perOption.map((option) => ({
      ...option,
      pct: totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0,
    })),
    revealed: totalVotes >= prediction.tallyVisibleThreshold,
    asOf: prediction.asOf,
  };
}
