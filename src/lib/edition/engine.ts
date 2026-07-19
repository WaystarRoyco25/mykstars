import type { EditionPlan } from "../domain/editions";
import { isPromotedArtist } from "../policy/artists";
import { assignBands, makeSpotlight } from "./band-assignment";
import {
  allocateCore,
  contentCoverage,
  inventoryMinimums,
  secondaryOptions,
  selectCandidates,
} from "./candidate-selection";
import { makeChunkSpecs } from "./chunk-construction";
import { scheduleChunks } from "./chunk-scheduling";
import {
  EditionConstraintError,
  MAX_EDITION_ITEMS,
  MIN_EDITION_ITEMS,
  assertNoViolations,
} from "./constraints";
import { attachTies } from "./deterministic";
import {
  byFormat,
  type ChunkSpec,
  type FormatCounts,
} from "./engine-internal";
import {
  EDITORIAL_TARGET_ITEMS,
  activeRosterSnapshot,
  assertUniqueInventory,
  buildInventoryFacts,
  isInventoryFactEligible,
  parseEditionDate,
  type EditionInventoryInput,
} from "./inventory";
import { validateEditionSemantics } from "./semantic";

export interface EditionEngineInput extends EditionInventoryInput {
  publishedAt: string;
  trailingEditions: readonly EditionPlan[];
}

export function buildEdition(input: EditionEngineInput, editionId: string): EditionPlan {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(editionId)) {
    throw new EditionConstraintError("edition-id", `"${editionId}" is not YYYY-MM`);
  }
  const publishedMs = parseEditionDate(input.publishedAt, "publishedAt");
  if (input.publishedAt.slice(0, 7) !== editionId) {
    throw new EditionConstraintError("published-month", `publishedAt ${input.publishedAt} does not fall in ${editionId}`);
  }

  const activeArtists = input.artists.filter(isPromotedArtist);
  const activeSlugs = activeRosterSnapshot(input.artists);
  const active = new Set(activeSlugs);
  if (active.size !== activeSlugs.length) throw new EditionConstraintError("active-roster", "active profile slugs are not unique");

  const inventory = buildInventoryFacts(input);
  assertUniqueInventory(inventory);
  const all = attachTies(inventory.map((fact) => ({
    item: fact.ref,
    key: fact.key,
    format: fact.format,
    artistSlugs: fact.artistSlugs,
    ...(fact.pillar ? { pillar: fact.pillar } : {}),
    dateMs: fact.dateMs,
    ...(fact.format === "clip" ? { clipGenre: fact.clipGenre } : {}),
  })), editionId);
  const candidateByKey = new Map(all.map((candidate) => [candidate.key, candidate]));
  const artistBySlug = new Map(input.artists.map((artist) => [artist.slug, artist]));
  const eligibleKeys = new Set(inventory
    .filter((fact) => isInventoryFactEligible(fact, {
      editionId,
      publishedAt: input.publishedAt,
      publishedMs,
      artistBySlug,
    }))
    .map((fact) => fact.key));
  const eligible = all.filter((candidate) => eligibleKeys.has(candidate.key));
  const groups = byFormat(eligible);
  inventoryMinimums(groups);

  const trailing = [...input.trailingEditions]
    .filter((edition) => edition.id < editionId)
    .sort((a, b) => a.id.localeCompare(b.id))
    .slice(-2);
  const trailingCoverage = trailing.map((edition) => contentCoverage(edition, candidateByKey));
  const unseen = new Set(activeSlugs.filter((slug) => trailingCoverage.every((coverage) => !coverage.has(slug))));
  const required = trailingCoverage.length < 2 ? new Set<string>() : unseen;
  for (const slug of required) {
    if (!eligible.some((candidate) => candidate.artistSlugs.includes(slug))) {
      throw new EditionConstraintError("quarterly-coverage", `${slug} missed the prior two editions and has no eligible item in ${editionId}`);
    }
  }

  // Seventy-five is the center of the approved 60 to 90 range and keeps the
  // monthly artifact substantial without turning surplus inventory into a
  // combinatorial mandate. Short months descend toward the 60-item floor.
  const maxTotal = Math.min(EDITORIAL_TARGET_ITEMS, MAX_EDITION_ITEMS, eligible.length);
  let lastFailure = "no size and mix allocation satisfied every constraint";
  for (let total = maxTotal; total >= MIN_EDITION_ITEMS; total--) {
    for (const secondary of secondaryOptions(total, groups)) {
      const secondaryCount = Object.values(secondary).reduce((sum, count) => sum + count, 0);
      for (const core of allocateCore(total, secondaryCount, groups)) {
        const counts: FormatCounts = { ...core, ...secondary };
        let cachedShape = "";
        let cachedScheduleTails: ChunkSpec[][] | undefined;
        selectionAttempts:
        for (let selectionAttempt = 0; selectionAttempt < 8; selectionAttempt++) {
          const selected = selectCandidates(groups, counts, active, unseen, required, total, editionId, selectionAttempt);
          if (!selected) {
            lastFailure = `selection could not fill ${total} items within the celebrity cap and quarterly priorities`;
            continue;
          }
          try {
            const { hero, rest } = makeChunkSpecs(selected);
            const shape = `${hero.format}|${rest.map((spec) => spec.signature).sort().join(",")}`;
            const schedules = cachedScheduleTails && cachedShape === shape
              ? cachedScheduleTails.map((tail) => [hero, ...tail])
              : scheduleChunks(hero, rest, editionId);
            if (!cachedScheduleTails || cachedShape !== shape) {
              cachedShape = shape;
              cachedScheduleTails = schedules.map((schedule) => schedule.slice(1));
            }
            if (schedules.length === 0) {
              lastFailure = `no band order for ${total} items satisfies four formats in every rolling 12`;
              break selectionAttempts;
            }
            for (const schedule of schedules) {
              const assigned = assignBands(schedule, selected, editionId);
              if (!assigned) {
                lastFailure = "item adjacency or the band pillar streak made the candidate band order unsatisfiable";
                continue;
              }
              const bands = assigned.map((entry) => entry.band);
              const spotlightIndex = Math.max(1, Math.floor(bands.length / 2));
              bands.splice(spotlightIndex, 0, { kind: "spotlight-strip" });
              const edition: EditionPlan = {
                id: editionId,
                publishedAt: input.publishedAt,
                bands,
                spotlight: makeSpotlight(activeArtists, unseen, editionId),
              };
              assertNoViolations(validateEditionSemantics({
                edition,
                inventory,
                inventorySource: input,
                activeArtistSlugs: activeSlugs,
                expectedId: editionId,
              }).violations);
              return edition;
            }
          } catch (error) {
            lastFailure = error instanceof Error ? error.message : String(error);
          }
        }
      }
    }
  }
  throw new EditionConstraintError(
    "assembly",
    `${lastFailure}. Eligible inventory: ${Object.entries(groups).map(([format, items]) => `${items.length} ${format}`).join(", ")}`,
  );
}
