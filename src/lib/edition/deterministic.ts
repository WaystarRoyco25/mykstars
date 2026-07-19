import type { Candidate, CandidateDraft } from "./engine-internal";

export function hash32(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

export function attachTies(
  drafts: CandidateDraft[],
  editionId: string,
): Candidate[] {
  const random = mulberry32(hash32(editionId));
  const ties = new Map<string, number>();
  for (const key of drafts.map((draft) => draft.key).sort()) ties.set(key, random());
  return drafts.map((draft) => ({ ...draft, tie: ties.get(draft.key) ?? 0 }));
}
