#!/usr/bin/env node
// Fails if the home page would render the same photo or the same YouTube video
// twice. It resolves the home page exactly as src/app/page.tsx does (the current
// edition, or the fallback plan when no edition matches NOW) and hands the bands
// to the pure checker.
//
// Unlike the other six content checks, the resolvers import "server-only", so
// this script runs under the react-server export condition (see its package.json
// command, the same prefix test:backend uses). Vote tallies never touch photo or
// video identity, so they are stubbed to zero to keep the check hermetic (no
// Supabase round-trip), mirroring tests/backend/home-model.test.ts.

import { NOW } from "../src/content/now";
import { checkHomeDuplicates } from "../src/lib/checks/home-duplicates";
import { formatIssue } from "../src/lib/checks/result";
import { getCurrentEdition } from "../src/lib/data/editions";
import { resolveEdition, resolveFallbackHome } from "../src/lib/home-model";
import type { Prediction, PredictionTally } from "../src/lib/types";

async function zeroTallies(predictions: Prediction[]): Promise<PredictionTally[]> {
  return predictions.map((prediction) => ({
    predictionSlug: prediction.slug,
    totalVotes: 0,
    perOption: prediction.options.map((option) => ({
      optionId: option.id,
      votes: 0,
      pct: 0,
    })),
    revealed: false,
    asOf: prediction.asOf,
  }));
}

// tsx compiles this script to CommonJS, which rejects top-level await, so the
// async resolution lives in main().
async function main() {
  const edition = await getCurrentEdition();
  const bands = edition
    ? await resolveEdition(edition, NOW, { loadTallies: zeroTallies })
    : await resolveFallbackHome(NOW, { loadTallies: zeroTallies });

  const source = edition ? `edition ${edition.id}` : "fallback plan";
  const { issues, mediaCount } = checkHomeDuplicates(bands);

  if (issues.length > 0) {
    for (const value of issues) console.error(formatIssue(value));
    console.error(
      `\n✖ Found ${issues.length} home-page duplicate${issues.length === 1 ? "" : "s"} ` +
        `(${source}): a photo or video renders more than once.`,
    );
    process.exitCode = 1;
  } else {
    console.log(
      `✓ Home page carries no duplicate photo or video ` +
        `(${source}, ${mediaCount} media slots across ${bands.length} bands).`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
