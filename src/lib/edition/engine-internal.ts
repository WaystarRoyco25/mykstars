import type { EditionBand, FeedItem } from "../domain/editions";
import type { ClipGenre } from "../domain/stories";
import type { Pillar } from "../domain/taxonomy";
import type { ContentFeedFormat } from "./constraints";

export interface Candidate {
  item: FeedItem;
  key: string;
  format: ContentFeedFormat;
  artistSlugs: string[];
  pillar?: Pillar;
  dateMs: number;
  tie: number;
  clipGenre?: ClipGenre;
}

export type CandidateDraft = Omit<Candidate, "tie">;

export interface ChunkSpec {
  signature: string;
  format: ContentFeedFormat;
  kind: EditionBand["kind"];
  size: number;
  fixedPillar?: Pillar;
  fixedKey?: string;
}

export interface AssignedBand {
  spec: ChunkSpec;
  candidates: Candidate[];
  pillar?: Pillar;
  band: EditionBand;
}

export type FormatCounts = Record<ContentFeedFormat, number>;

export function byFormat(
  candidates: readonly Candidate[],
): Record<ContentFeedFormat, Candidate[]> {
  const groups: Record<ContentFeedFormat, Candidate[]> = {
    pulse: [], gallery: [], clip: [], event: [], forecast: [], ranking: [], article: [],
  };
  for (const candidate of candidates) groups[candidate.format].push(candidate);
  return groups;
}
