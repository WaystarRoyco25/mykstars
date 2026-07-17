#!/usr/bin/env node

import { existsSync, readdirSync } from "node:fs";
import { basename, join, relative } from "node:path";

import { articles } from "../src/content/articles";
import { clips } from "../src/content/clips";
import { events } from "../src/content/events";
import { galleries } from "../src/content/galleries";
import { predictions } from "../src/content/predictions";
import { artists } from "../src/content/profiles";
import { pulses } from "../src/content/pulses/index";
import { rankings } from "../src/content/rankings";
import { buildInventoryFacts, type EditionInventoryInput } from "../src/lib/edition/inventory";
import {
  computeSelectionInventoryHash,
  editionActiveRoster,
  type FeedEditionWithProvenance,
} from "../src/lib/edition/provenance";
import { validateEditionHistory, validateEditionSemantics } from "../src/lib/edition/semantic";
import type { EditionBand, EditionPlan, SpotlightSchedule } from "../src/lib/types";
import { inspectGeneratedEditionSource } from "./generated-edition-source";

const EDITIONS_DIR = join(process.cwd(), "src", "content", "editions");

interface CheckMessage {
  file: string;
  kind: string;
  detail: string;
}

const failures: CheckMessage[] = [];
const warnings: CheckMessage[] = [];
const fail = (file: string, kind: string, detail: string) => failures.push({ file, kind, detail });
const warn = (file: string, kind: string, detail: string) => warnings.push({ file, kind, detail });

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isSpotlight(value: unknown): value is SpotlightSchedule {
  return isRecord(value) &&
    isStringArray(value.anchors) &&
    Array.isArray(value.weeks) &&
    value.weeks.every(isStringArray);
}

function isBand(value: unknown): value is EditionBand {
  if (!isRecord(value) || typeof value.kind !== "string") return false;
  switch (value.kind) {
    case "hero":
      return (value.gallerySlug === undefined || typeof value.gallerySlug === "string") &&
        (value.clipId === undefined || typeof value.clipId === "string");
    case "event-rail":
      return isStringArray(value.eventSlugs);
    case "gallery-band":
      return typeof value.pillar === "string" && isStringArray(value.gallerySlugs);
    case "clip-rail":
      return typeof value.presentation === "string" &&
        isStringArray(value.clipIds);
    case "ranking":
      return typeof value.slug === "string";
    case "analysis":
      return (value.pillar === undefined || typeof value.pillar === "string") && isStringArray(value.articleSlugs);
    case "pulse-band":
      return isStringArray(value.pulseSlugs);
    case "forecast-rail":
      return isStringArray(value.predictionSlugs);
    case "spotlight-strip":
      return true;
    default:
      return false;
  }
}

function asEdition(value: unknown): FeedEditionWithProvenance | undefined {
  if (!isRecord(value) ||
      typeof value.id !== "string" ||
      typeof value.publishedAt !== "string" ||
      !Array.isArray(value.bands) ||
      !value.bands.every(isBand) ||
      !isSpotlight(value.spotlight)) {
    return undefined;
  }
  if (value.provenance !== undefined) {
    if (!isRecord(value.provenance) ||
        !isStringArray(value.provenance.activeArtistSlugs) ||
        typeof value.provenance.inventoryHash !== "string") {
      return undefined;
    }
  }
  return value as unknown as FeedEditionWithProvenance;
}

function warnIfStale(file: string, edition: EditionPlan, inventory: ReturnType<typeof buildInventoryFacts>): void {
  const publishedMs = Date.parse(edition.publishedAt);
  if (Number.isNaN(publishedMs)) return;
  const missed = inventory
    .filter((fact) => fact.format !== "event" && fact.date.slice(0, 7) === edition.id && fact.dateMs > publishedMs)
    .sort((left, right) => right.dateMs - left.dateMs);
  if (missed.length === 0) return;
  warn(
    file,
    "stale edition",
    `${missed.length} item${missed.length === 1 ? "" : "s"} dated after publishedAt ${edition.publishedAt} cannot appear in ${edition.id} ` +
      `(newest: ${missed[0].key}, ${missed[0].date}). Regenerate with npm run gen:edition.`,
  );
}

const inventorySource: EditionInventoryInput = {
  artists,
  pulses,
  clips,
  galleries,
  predictions,
  events,
  rankings,
  articles,
};

let inventory: ReturnType<typeof buildInventoryFacts> = [];
try {
  inventory = buildInventoryFacts(inventorySource);
} catch (error) {
  fail("src/content", "invalid inventory", error instanceof Error ? error.message : String(error));
}

const editionFiles = existsSync(EDITIONS_DIR)
  ? readdirSync(EDITIONS_DIR)
      .filter((name) => /^\d{4}-(0[1-9]|1[0-2])\.ts$/.test(name))
      .sort((left, right) => left.localeCompare(right))
      .map((name) => join(EDITIONS_DIR, name))
  : [];

interface ParsedEdition {
  file: string;
  edition: FeedEditionWithProvenance;
  headerHash: string;
}

const parsed: ParsedEdition[] = [];
for (const absoluteFile of editionFiles) {
  const file = relative(process.cwd(), absoluteFile);
  const inspection = inspectGeneratedEditionSource(absoluteFile);
  for (const error of inspection.errors) fail(file, "generated artifact", error);
  if (!inspection.artifact) continue;
  const edition = asEdition(inspection.artifact.edition);
  if (!edition) {
    fail(file, "malformed edition", "generated object does not satisfy the edition band and Spotlight shape");
    continue;
  }
  parsed.push({ file, edition, headerHash: inspection.artifact.inventoryHash });
}

const history: Array<{
  id: string;
  activeArtistSlugs: readonly string[];
  coverage: ReadonlySet<string>;
}> = [];
const priorEditions: EditionPlan[] = [];
const seenIds = new Set<string>();

for (const entry of parsed) {
  const { edition, file, headerHash } = entry;
  const expectedId = basename(file, ".ts");
  if (seenIds.has(edition.id)) fail(file, "duplicate edition id", `${edition.id} appears more than once`);
  seenIds.add(edition.id);

  const activeArtistSlugs = editionActiveRoster(edition);
  const semantic = validateEditionSemantics({
    edition,
    inventory,
    inventorySource,
    activeArtistSlugs,
    expectedId,
  });
  for (const issue of semantic.violations) fail(file, issue.constraint, issue.detail);
  warnIfStale(file, edition, inventory);

  const expectedHash = computeSelectionInventoryHash({
    ...inventorySource,
    editionId: edition.id,
    publishedAt: edition.publishedAt,
    trailingEditions: priorEditions,
  });
  if (headerHash !== expectedHash) {
    fail(file, "inventory hash mismatch", `header has ${headerHash}; selection-relevant inventory is ${expectedHash}`);
  }
  if (!edition.provenance) {
    fail(file, "missing edition provenance", "store the edition-time active roster and selection-relevant inventory hash");
  } else {
    if (edition.provenance.inventoryHash !== expectedHash) {
      fail(file, "provenance hash mismatch", `stored provenance has ${edition.provenance.inventoryHash}; expected ${expectedHash}`);
    }
    if (new Set(edition.provenance.activeArtistSlugs).size !== edition.provenance.activeArtistSlugs.length) {
      fail(file, "duplicate roster snapshot", "edition provenance activeArtistSlugs contains duplicates");
    }
  }

  history.push({ id: edition.id, activeArtistSlugs, coverage: semantic.coverage });
  priorEditions.push(edition);
}

const historyResult = validateEditionHistory(history);
for (const issue of historyResult.warnings) warn(EDITIONS_DIR, issue.constraint, issue.detail);
for (const issue of historyResult.violations) fail(EDITIONS_DIR, issue.constraint, issue.detail);

for (const message of warnings) {
  console.warn(`⚠ ${message.file}  ${message.kind}  ${message.detail}`);
}
if (failures.length > 0) {
  for (const message of failures) console.error(`${message.file}:1  ${message.kind}  ${message.detail}`);
  console.error(`\n✖ Found ${failures.length} edition issue${failures.length === 1 ? "" : "s"}. Regenerate after fixing the named inventory or constraint.`);
  process.exitCode = 1;
} else if (editionFiles.length === 0) {
  console.log("✓ Edition machinery OK (no committed monthly editions; the permanent home fallback remains active).");
} else {
  console.log(`✓ Editions OK (${editionFiles.length} committed edition${editionFiles.length === 1 ? "" : "s"}).`);
}
