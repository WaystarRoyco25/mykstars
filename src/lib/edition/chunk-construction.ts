import type { EditionBand } from "../domain/editions";
import type { Pillar } from "../domain/taxonomy";
import { EditionConstraintError, type ContentFeedFormat } from "./constraints";
import { byFormat, type Candidate, type ChunkSpec } from "./engine-internal";
import { EVENT_RAIL_SIZE } from "./inventory";

export function canPartition(
  total: number,
  minimum: number,
  maximum: number,
): boolean {
  if (total === 0) return true;
  for (let parts = 1; parts <= total; parts++) {
    if (parts * minimum <= total && parts * maximum >= total) return true;
  }
  return false;
}

function partitionSizes(total: number, minimum: number, maximum: number): number[] {
  if (total === 0) return [];
  let parts = Math.ceil(total / maximum);
  while (parts > 0 && parts * minimum > total) parts--;
  if (parts * minimum > total || parts * maximum < total) {
    throw new EditionConstraintError("band-chunking", `cannot partition ${total} items into chunks of ${minimum} to ${maximum}`);
  }
  const sizes = Array.from({ length: parts }, () => minimum);
  let left = total - parts * minimum;
  for (let index = 0; left > 0; index = (index + 1) % sizes.length) {
    if (sizes[index] < maximum) {
      sizes[index]++;
      left--;
    }
  }
  return sizes.sort((a, b) => b - a);
}

function flexiblePartitionSizes(
  total: number,
  minimum: number,
  maximum: number,
): number[] {
  if (total === 0) return [];
  let parts = Math.floor(total / minimum);
  while (parts > 0 && parts * maximum < total) parts--;
  if (parts === 0 || parts * minimum > total) {
    throw new EditionConstraintError("band-chunking", `cannot flexibly partition ${total} items into chunks of ${minimum} to ${maximum}`);
  }
  const sizes = Array.from({ length: parts }, () => minimum);
  let left = total - parts * minimum;
  for (let index = 0; left > 0; index = (index + 1) % sizes.length) {
    if (sizes[index] < maximum) {
      sizes[index]++;
      left--;
    }
  }
  return sizes.sort((a, b) => b - a);
}

function makeSpec(
  format: ContentFeedFormat,
  kind: EditionBand["kind"],
  size: number,
  fixedPillar?: Pillar,
  fixedKey?: string,
): ChunkSpec {
  const signature = [kind, format, size, fixedPillar ?? "mixed", fixedKey ?? "open"].join("|");
  return { signature, format, kind, size, ...(fixedPillar ? { fixedPillar } : {}), ...(fixedKey ? { fixedKey } : {}) };
}

export function makeChunkSpecs(
  selected: readonly Candidate[],
): { hero: ChunkSpec; rest: ChunkSpec[] } {
  const groups = byFormat(selected);
  const heroPool = groups.gallery.length > 0 ? groups.gallery : groups.clip;
  const heroCandidate = [...heroPool].sort((a, b) => b.dateMs - a.dateMs || a.tie - b.tie)[0];
  if (!heroCandidate) throw new EditionConstraintError("hero", "no selected gallery or clip can anchor the edition");
  const restCandidates = selected.filter((candidate) => candidate.key !== heroCandidate.key);
  const restGroups = byFormat(restCandidates);
  const rest: ChunkSpec[] = [];

  for (const size of flexiblePartitionSizes(restGroups.pulse.length, 4, 6)) rest.push(makeSpec("pulse", "pulse-band", size));
  for (const size of flexiblePartitionSizes(restGroups.clip.length, 2, 4)) rest.push(makeSpec("clip", "clip-rail", size));
  for (const pillar of ["k-pop", "k-drama", "fashion-beauty", "k-movie"] as const) {
    const count = restGroups.gallery.filter((candidate) => candidate.pillar === pillar).length;
    for (const size of partitionSizes(count, 1, 4)) rest.push(makeSpec("gallery", "gallery-band", size, pillar));
  }
  if (restGroups.event.length !== EVENT_RAIL_SIZE) throw new EditionConstraintError("event-rail", `expected ${EVENT_RAIL_SIZE} selected events`);
  rest.push(makeSpec("event", "event-rail", EVENT_RAIL_SIZE));
  for (let index = 0; index < restGroups.forecast.length; index += 3) rest.push(makeSpec("forecast", "forecast-rail", 3));
  for (let index = 0; index < restGroups.ranking.length; index++) rest.push(makeSpec("ranking", "ranking", 1));
  for (let index = 0; index < restGroups.article.length; index++) rest.push(makeSpec("article", "analysis", 1));
  return { hero: makeSpec(heroCandidate.format, "hero", 1, undefined, heroCandidate.key), rest };
}
