import { createHash } from "node:crypto";

import type { EditionPlan, EditionProvenance } from "../domain/editions";
import { flattenEdition } from "./constraints";
import { contentRefKey } from "./descriptors";
import {
  activeRosterSnapshot,
  assertUniqueInventory,
  buildInventoryFacts,
  isInventoryFactEligible,
  parseEditionDate,
  type EditionInventoryInput,
} from "./inventory";

export type FeedEditionWithProvenance = EditionPlan & {
  provenance?: EditionProvenance;
};

export interface SelectionInventoryHashInput extends EditionInventoryInput {
  editionId: string;
  publishedAt: string;
  trailingEditions: readonly EditionPlan[];
}

export function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, child]) => child !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)]),
    );
  }
  return value;
}

export function selectionRelevantInventoryPayload(input: SelectionInventoryHashInput): unknown {
  const publishedMs = parseEditionDate(input.publishedAt, "publishedAt");
  const artistBySlug = new Map(input.artists.map((artist) => [artist.slug, artist]));
  const inventory = buildInventoryFacts(input);
  assertUniqueInventory(inventory);
  const inventoryByKey = new Map(inventory.map((fact) => [fact.key, fact]));
  const eligible = inventory
    .filter((fact) => isInventoryFactEligible(fact, {
      editionId: input.editionId,
      publishedAt: input.publishedAt,
      publishedMs,
      artistBySlug,
    }))
    .map((fact) => ({
      key: fact.key,
      artistSlugs: [...fact.artistSlugs].sort(),
      ...(fact.pillar ? { pillar: fact.pillar } : {}),
      date: fact.date,
      ...(fact.format === "clip" ? { clipGenre: fact.clipGenre } : {}),
    }))
    .sort((left, right) => left.key.localeCompare(right.key));
  const trailing = [...input.trailingEditions]
    .filter((edition) => edition.id < input.editionId)
    .sort((left, right) => left.id.localeCompare(right.id))
    .slice(-2)
    .map((edition) => ({
      id: edition.id,
      items: flattenEdition(edition).map((ref) => {
        const key = ref.format === "spotlight" ? `spotlight:${ref.artistSlug}` : contentRefKey(ref);
        const fact = inventoryByKey.get(key);
        return {
          key,
          artistSlugs: fact ? [...fact.artistSlugs].sort() : null,
        };
      }).sort((left, right) => left.key.localeCompare(right.key)),
    }));

  return canonicalize({
    editionId: input.editionId,
    publishedAt: input.publishedAt,
    activeArtistSlugs: activeRosterSnapshot(input.artists).sort(),
    eligible,
    trailing,
  });
}

export function computeSelectionInventoryHash(input: SelectionInventoryHashInput): string {
  return createHash("sha256")
    .update(JSON.stringify(selectionRelevantInventoryPayload(input)))
    .digest("hex");
}

export function buildEditionProvenance(input: SelectionInventoryHashInput): EditionProvenance {
  return {
    activeArtistSlugs: activeRosterSnapshot(input.artists),
    inventoryHash: computeSelectionInventoryHash(input),
  };
}

export function editionActiveRoster(edition: FeedEditionWithProvenance): string[] {
  const stored = edition.provenance?.activeArtistSlugs;
  if (stored) return [...stored];
  return [...edition.spotlight.anchors, ...edition.spotlight.weeks.flat()];
}

export function editionInventoryHash(edition: FeedEditionWithProvenance): string | undefined {
  return edition.provenance?.inventoryHash;
}

export type { EditionProvenance } from "../domain/editions";
