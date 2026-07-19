import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import { edition202607 } from "../../src/content/editions/2026-07";
import { CLIP_RAIL_PRESENTATIONS } from "../../src/lib/edition/descriptors";
import {
  resolveEdition,
  resolveFallbackHome,
  type ResolvedHomeBand,
} from "../../src/lib/home-model";
import type { Prediction, PredictionTally } from "../../src/lib/types";

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

function snapshot(bands: ResolvedHomeBand[]): unknown[] {
  return bands.map((band) => {
    switch (band.kind) {
      case "hero":
        return [
          band.kind,
          band.hero.kind,
          band.hero.kind === "clip" ? band.hero.clip.id : band.hero.gallery.slug,
        ];
      case "event-rail":
        return [band.kind, ...band.events.map((event) => event.slug)];
      case "gallery-band":
        return [
          band.kind,
          band.pillar,
          ...band.galleries.map((gallery) => gallery.slug),
          "fill",
          ...band.fillEmbeds.map((item) => item.id),
        ];
      case "clip-rail":
        const { title, description } = CLIP_RAIL_PRESENTATIONS[band.presentation];
        return [
          band.kind,
          title,
          description,
          ...band.clips.map((clip) => clip.id),
        ];
      case "ranking":
        return [band.kind, band.ranking.slug];
      case "analysis":
        return [
          band.kind,
          band.pillar ?? null,
          ...band.articles.map((article) => article.slug),
        ];
      case "pulse-band":
        return [
          band.kind,
          ...band.pulses.map((pulse) => pulse.slug),
          "fill",
          ...band.fillEmbeds.map((item) => item.id),
        ];
      case "forecast-rail":
        return [
          band.kind,
          ...band.predictions.map((prediction) => prediction.slug),
        ];
      case "spotlight-strip":
        return [band.kind, ...band.artists.map((artist) => artist.slug)];
    }
  });
}

function digest(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

test("the July edition resolves to the characterized bands, copy, fills, and order", async () => {
  const bands = await resolveEdition(
    edition202607,
    "2026-07-17T00:00:00+09:00",
    { loadTallies: zeroTallies },
  );
  assert.equal(bands.length, 33);
  assert.equal(
    digest(snapshot(bands)),
    "365d00c12b2168cb8163fd4e5bbab74f658fe58921af28a2d8c4daa3d4f38005",
  );
});

test("fallback planning retains its characterized sections, labels, fills, and order", async () => {
  const bands = await resolveFallbackHome(
    "2026-07-17T00:00:00+09:00",
    { loadTallies: zeroTallies },
  );
  assert.equal(bands.length, 17);
  // Recharacterized 2026-07-20 with the gallery revival: the fallback plan now
  // draws on published real-photo galleries and the swapped heroes, so the
  // 2026-07-18 value (7eb4c693...) no longer describes the inventory.
  assert.equal(
    digest(snapshot(bands)),
    "222fab01a43719107db135513a556aaf8e9e2a9e8f911bb59acd189f1ec8f004",
  );
});

test("edition resolution reports dangling references centrally", async () => {
  await assert.rejects(
    () =>
      resolveEdition(
        {
          ...edition202607,
          bands: [{ kind: "analysis", articleSlugs: ["missing"] }],
        },
        "2026-07-17T00:00:00+09:00",
        { loadTallies: zeroTallies },
      ),
    /Edition 2026-07 references missing article "missing"/,
  );
});
