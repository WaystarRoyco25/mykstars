import type { EditionBand, EditionPlan, Pillar } from "../types";
import {
  bandFormat,
  validateBandFacts,
  validateItemFacts,
  validateSpotlight,
  type ConstraintViolation,
  type EditionBandFacts,
  type EditionItemFacts,
} from "./constraints";
import { clipRailPresentation, contentRefKey, describeBand } from "./descriptors";
import {
  isInventoryFactEligible,
  parseEditionDate,
  type EditionInventoryFact,
  type EditionInventoryInput,
} from "./inventory";

export interface EditionSemanticInput {
  edition: EditionPlan;
  inventory: readonly EditionInventoryFact[];
  inventorySource: EditionInventoryInput;
  activeArtistSlugs: readonly string[];
  expectedId?: string;
}

export interface EditionSemanticResult {
  violations: ConstraintViolation[];
  coverage: ReadonlySet<string>;
  itemKeys: readonly string[];
}

function violation(constraint: string, detail: string): ConstraintViolation {
  return { constraint, detail };
}

function commonPillar(facts: readonly EditionInventoryFact[]): Pillar | undefined {
  if (facts.length === 0 || facts.some((fact) => !fact.pillar)) return undefined;
  const pillars = new Set(facts.map((fact) => fact.pillar));
  return pillars.size === 1 ? facts[0].pillar : undefined;
}

function validateBandCardinality(band: EditionBand, index: number): ConstraintViolation[] {
  const descriptor = describeBand(band);
  if (descriptor.refs.length >= descriptor.minimum && descriptor.refs.length <= descriptor.maximum) return [];
  const range = descriptor.minimum === descriptor.maximum
    ? `exactly ${descriptor.minimum}`
    : `${descriptor.minimum} to ${Number.isFinite(descriptor.maximum) ? descriptor.maximum : "any"}`;
  return [violation(
    `${band.kind}-cardinality`,
    `band ${index + 1} contains ${descriptor.refs.length} references, expected ${range}`,
  )];
}

function validateClipPresentation(
  band: Extract<EditionBand, { kind: "clip-rail" }>,
  facts: readonly EditionInventoryFact[],
  index: number,
): ConstraintViolation[] {
  const expectedPresentation = clipRailPresentation(
    facts.map((fact) => fact.format === "clip" ? fact.clipGenre : undefined),
  );
  if (band.presentation === expectedPresentation) return [];
  return [violation(
    "clip-rail-presentation",
    `band ${index + 1} uses ${band.presentation}, expected ${expectedPresentation}`,
  )];
}

export function validateEditionSemantics(input: EditionSemanticInput): EditionSemanticResult {
  const { edition } = input;
  const violations: ConstraintViolation[] = [];
  const itemFacts: EditionItemFacts[] = [];
  const bandFacts: EditionBandFacts[] = [];
  const coverage = new Set<string>();
  const itemKeys: string[] = [];

  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(edition.id)) {
    violations.push(violation("edition-id", `${edition.id} is not YYYY-MM`));
  }
  if (input.expectedId && edition.id !== input.expectedId) {
    violations.push(violation("edition-id", `${edition.id} does not match ${input.expectedId}`));
  }

  let publishedMs = Number.NaN;
  try {
    publishedMs = parseEditionDate(edition.publishedAt, "publishedAt");
  } catch (error) {
    violations.push(violation("published-at", error instanceof Error ? error.message : String(error)));
  }
  if (edition.publishedAt.slice(0, 7) !== edition.id) {
    violations.push(violation("published-month", `${edition.publishedAt} does not fall in ${edition.id}`));
  }

  const inventoryByKey = new Map<string, EditionInventoryFact>();
  for (const fact of input.inventory) {
    if (inventoryByKey.has(fact.key)) {
      violations.push(violation("unique-inventory", `${fact.key} appears more than once`));
    } else {
      inventoryByKey.set(fact.key, fact);
    }
  }
  const artistBySlug = new Map(input.inventorySource.artists.map((artist) => [artist.slug, artist]));
  let spotlightBands = 0;

  for (const [index, band] of edition.bands.entries()) {
    const descriptor = describeBand(band);
    violations.push(...validateBandCardinality(band, index));
    if (band.kind === "spotlight-strip") spotlightBands++;

    const resolved: EditionInventoryFact[] = [];
    for (const ref of descriptor.refs) {
      const key = contentRefKey(ref);
      itemKeys.push(key);
      const fact = inventoryByKey.get(key);
      if (!fact) {
        violations.push(violation("dangling-reference", `${key} matches no content item`));
        continue;
      }
      resolved.push(fact);
      if (!Number.isNaN(publishedMs) && !isInventoryFactEligible(fact, {
        editionId: edition.id,
        publishedAt: edition.publishedAt,
        publishedMs,
        artistBySlug,
      })) {
        violations.push(violation("ineligible-reference", `${key} is not eligible at ${edition.publishedAt}`));
      }
      for (const slug of fact.artistSlugs) coverage.add(slug);
      itemFacts.push({
        item: fact.ref,
        format: fact.format,
        artistSlugs: fact.artistSlugs,
        ...(fact.pillar ? { pillar: fact.pillar } : {}),
      });
    }

    if (descriptor.pillar && resolved.some((fact) => fact.pillar && fact.pillar !== descriptor.pillar)) {
      violations.push(violation(
        "band-pillar",
        `band ${index + 1} declares ${descriptor.pillar} but contains another pillar`,
      ));
    }
    if (band.kind === "clip-rail" && resolved.length === descriptor.refs.length) {
      violations.push(...validateClipPresentation(band, resolved, index));
    }
    const scopedPillar = descriptor.pillar ?? (band.kind === "ranking" ? commonPillar(resolved) : undefined);
    bandFacts.push({
      format: bandFormat(band),
      ...(scopedPillar ? { pillar: scopedPillar } : {}),
    });
  }

  if (spotlightBands !== 1) {
    violations.push(violation("spotlight-band-count", `${spotlightBands} spotlight-strip bands, expected exactly 1`));
  }

  violations.push(
    ...validateItemFacts(itemFacts),
    ...validateBandFacts(bandFacts),
    ...validateSpotlight(edition.spotlight, input.activeArtistSlugs),
  );

  return { violations, coverage, itemKeys };
}

export interface EditionHistoryEntry {
  id: string;
  activeArtistSlugs: readonly string[];
  coverage: ReadonlySet<string>;
}

export interface EditionHistoryResult {
  violations: ConstraintViolation[];
  warnings: ConstraintViolation[];
}

export function validateEditionHistory(entries: readonly EditionHistoryEntry[]): EditionHistoryResult {
  const ordered = [...entries].sort((left, right) => left.id.localeCompare(right.id));
  const violations: ConstraintViolation[] = [];
  const warnings: ConstraintViolation[] = [];

  for (let index = 1; index < ordered.length; index++) {
    const current = ordered[index];
    const trailingTwo = ordered.slice(Math.max(0, index - 1), index + 1);
    for (const slug of current.activeArtistSlugs) {
      if (trailingTwo.every((entry) => !entry.coverage.has(slug))) {
        warnings.push(violation(
          "quarterly-coverage-warning",
          `${slug} has missed two consecutive editions ending ${current.id}`,
        ));
      }
    }
    if (index < 2) continue;
    const trailingThree = ordered.slice(index - 2, index + 1);
    for (const slug of current.activeArtistSlugs) {
      if (trailingThree.every((entry) => !entry.coverage.has(slug))) {
        violations.push(violation(
          "quarterly-coverage-failure",
          `${slug} has missed three consecutive editions ending ${current.id}`,
        ));
      }
    }
  }

  return { violations, warnings };
}
