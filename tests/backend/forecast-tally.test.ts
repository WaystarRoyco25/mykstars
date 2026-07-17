import assert from "node:assert/strict";
import test from "node:test";

import { predictions } from "../../src/content/predictions";
import { buildPredictionTally } from "../../src/lib/forecast/tally";

test("forecast tally composition preserves option order, percentages, and reveal policy", () => {
  const prediction = predictions[0];
  const tally = buildPredictionTally(
    prediction,
    new Map([
      [prediction.options[0].id, 2],
      [prediction.options[1].id, 1],
    ]),
  );
  assert.deepEqual(tally, {
    predictionSlug: prediction.slug,
    totalVotes: 3,
    perOption: [
      { optionId: prediction.options[0].id, votes: 2, pct: 67 },
      { optionId: prediction.options[1].id, votes: 1, pct: 33 },
    ],
    revealed: 3 >= prediction.tallyVisibleThreshold,
    asOf: prediction.asOf,
  });
});

test("missing tally rows remain zero in the authored option order", () => {
  const prediction = predictions[0];
  const tally = buildPredictionTally(prediction, new Map());
  assert.equal(tally.totalVotes, 0);
  assert.deepEqual(
    tally.perOption,
    prediction.options.map((option) => ({ optionId: option.id, votes: 0, pct: 0 })),
  );
});
