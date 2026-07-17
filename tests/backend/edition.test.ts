import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { articles } from "../../src/content/articles";
import { clips } from "../../src/content/clips";
import { editions } from "../../src/content/editions";
import { events } from "../../src/content/events";
import { galleries } from "../../src/content/galleries";
import { predictions } from "../../src/content/predictions";
import { artists } from "../../src/content/profiles";
import { pulses } from "../../src/content/pulses";
import { rankings } from "../../src/content/rankings";
import { CLIP_RAIL_PRESENTATIONS, describeBand } from "../../src/lib/edition/descriptors";
import { buildEdition, type EditionEngineInput } from "../../src/lib/edition/engine";
import { buildInventoryFacts, isInventoryFactEligible } from "../../src/lib/edition/inventory";
import {
  computeSelectionInventoryHash,
  editionActiveRoster,
  type FeedEditionWithProvenance,
} from "../../src/lib/edition/provenance";
import { validateEditionHistory, validateEditionSemantics } from "../../src/lib/edition/semantic";
import type { FeedEdition, Pulse } from "../../src/lib/types";
import { generatedIndexDrift, monthlyModuleIds } from "../../scripts/generated-indexes";
import { inspectGeneratedEditionSource } from "../../scripts/generated-edition-source";

const current = editions.find((edition) => edition.id === "2026-07") as FeedEditionWithProvenance;
const inventorySource = { artists, pulses, clips, galleries, predictions, events, rankings, articles };
const engineInput: EditionEngineInput = {
  ...inventorySource,
  publishedAt: current.publishedAt,
  trailingEditions: editions.filter((edition) => edition.id < current.id),
};

test("the centralized engine reproduces July references, ordering, and presentation copy", () => {
  const generated = buildEdition(engineInput, current.id);
  assert.deepEqual(generated.bands, current.bands);
  assert.deepEqual(generated.spotlight, current.spotlight);
  assert.deepEqual(
    current.bands.filter((band) => band.kind === "clip-rail").map((band) => ({
      presentation: band.presentation,
    })),
    generated.bands.filter((band) => band.kind === "clip-rail").map((band) => ({
      presentation: band.presentation,
    })),
  );
  assert.deepEqual(Object.values(CLIP_RAIL_PRESENTATIONS).map((value) => ({ ...value })), [
    { title: "In motion", description: "Official music videos and performances." },
    { title: "On air", description: "Talk, comedy and variety appearances on official channels." },
    { title: "Now playing", description: "Current official videos from across MyKStars." },
    { title: "In motion", description: "The music videos of the moment, straight from the official channels." },
    { title: "On air", description: "The roster on the talk and variety circuit, in Korea and abroad." },
  ]);
});

test("the shared semantic validator accepts the committed edition", () => {
  const result = validateEditionSemantics({
    edition: current,
    inventory: buildInventoryFacts(inventorySource),
    inventorySource,
    activeArtistSlugs: editionActiveRoster(current),
    expectedId: current.id,
  });
  assert.deepEqual(result.violations, []);
  assert.equal(result.itemKeys.length, 75);
});

test("band descriptors centralize identity and cardinality", () => {
  assert.deepEqual(describeBand({ kind: "hero", clipId: "clip" }).refs, [
    { format: "clip", id: "clip" },
  ]);
  const malformed = describeBand({
    kind: "hero",
    gallerySlug: "gallery",
    clipId: "clip",
  } as unknown as FeedEdition["bands"][number]);
  assert.equal(malformed.refs.length, 2);
  assert.equal(malformed.minimum, 1);
  assert.equal(malformed.maximum, 1);
});

test("edition semantic validation reports a missing reference", () => {
  const malformed = structuredClone(current) as FeedEdition;
  const pulseBand = malformed.bands.find((band) => band.kind === "pulse-band");
  assert.ok(pulseBand && pulseBand.kind === "pulse-band");
  pulseBand.pulseSlugs[0] = "missing-pulse";
  const result = validateEditionSemantics({
    edition: malformed,
    inventory: buildInventoryFacts(inventorySource),
    inventorySource,
    activeArtistSlugs: editionActiveRoster(current),
  });
  assert.ok(result.violations.some((issue) => issue.constraint === "dangling-reference"));
});

test("stored closed forecasts are ineligible before their deadline", () => {
  const source = {
    ...inventorySource,
    predictions: [{ ...predictions[0], status: "closed" as const, closesAt: "2099-01-01T00:00:00Z" }],
  };
  const fact = buildInventoryFacts(source).find((item) => item.format === "forecast");
  assert.ok(fact);
  assert.equal(isInventoryFactEligible(fact, {
    editionId: "2026-07",
    publishedAt: current.publishedAt,
    publishedMs: Date.parse(current.publishedAt),
    artistBySlug: new Map(artists.map((artist) => [artist.slug, artist])),
  }), false);
});

test("the selection hash ignores irrelevant future inventory and changes for eligible inventory", () => {
  const baseline = computeSelectionInventoryHash({
    ...inventorySource,
    editionId: current.id,
    publishedAt: current.publishedAt,
    trailingEditions: [],
  });
  const future = {
    ...pulses[0],
    slug: "2099-01-future-pulse",
    date: "2099-01-01T00:00:00Z",
  } as Pulse;
  assert.equal(computeSelectionInventoryHash({
    ...inventorySource,
    pulses: [...pulses, future],
    editionId: current.id,
    publishedAt: current.publishedAt,
    trailingEditions: [],
  }), baseline);

  const eligible = {
    ...pulses[0],
    slug: "2026-07-extra-eligible-pulse",
    date: "2026-07-01T00:00:00+09:00",
  } as Pulse;
  assert.notEqual(computeSelectionInventoryHash({
    ...inventorySource,
    pulses: [...pulses, eligible],
    editionId: current.id,
    publishedAt: current.publishedAt,
    trailingEditions: [],
  }), baseline);
});

test("historical coverage uses each edition's stored roster snapshot", () => {
  const result = validateEditionHistory([
    { id: "2026-01", activeArtistSlugs: ["historical"], coverage: new Set(["historical"]) },
    { id: "2026-02", activeArtistSlugs: ["historical"], coverage: new Set(["historical"]) },
    { id: "2026-03", activeArtistSlugs: ["new-today"], coverage: new Set(["new-today"]) },
  ]);
  assert.deepEqual(result, { violations: [], warnings: [] });
});

test("monthly barrel discovery is chronological and checked against disk", () => {
  assert.deepEqual(monthlyModuleIds(join(process.cwd(), "src/content/pulses")), ["2026-07", "2026-08"]);
  assert.deepEqual(monthlyModuleIds(join(process.cwd(), "src/content/editions")), ["2026-07"]);
  assert.deepEqual(generatedIndexDrift(), []);
});

test("the generated-source inspector rejects hand-authored expression grammar", (t) => {
  const directory = mkdtempSync(join(tmpdir(), "mykstars-edition-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const file = join(directory, "2026-07.ts");
  writeFileSync(file, [
    "// Generated by MyKStars edition engine v2.0.0.",
    `// Inventory SHA-256: ${"a".repeat(64)}`,
    "// Regenerate with npm run gen:edition. Do not hand-edit this artifact.",
    'import type { FeedEdition } from "../../lib/types";',
    "export const edition202607: FeedEdition = { ...base };",
    "",
  ].join("\n"));
  const inspection = inspectGeneratedEditionSource(file);
  assert.ok(inspection.errors.some((error) => error.includes("generated JSON grammar")));
});
