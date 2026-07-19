import type { Prediction, PredictionStatus } from "../domain/forecasts";
import type {
  VoteUpsert,
  VoteWriteResult,
} from "./vote-repository-core";

export type VoteResult =
  | { ok: true; optionId: string }
  | { ok: false; error: string };

export interface VoteWriter {
  readonly available: boolean;
  upsertVote(vote: VoteUpsert): Promise<VoteWriteResult>;
}

export interface CastVoteDependencies {
  getPrediction(slug: string): Promise<Prediction | undefined>;
  effectiveStatus(prediction: Prediction, nowIso: string): PredictionStatus;
  nowIso(): string;
  getVoteRepository(): VoteWriter;
  getOrCreateVoterId(): Promise<string>;
  revalidatePath(path: string): void;
}

export async function executeCastVote(
  slug: string,
  optionId: string,
  dependencies: CastVoteDependencies,
): Promise<VoteResult> {
  const prediction = await dependencies.getPrediction(slug);
  if (!prediction) return { ok: false, error: "Unknown question." };
  if (!prediction.options.some((option) => option.id === optionId)) {
    return { ok: false, error: "That option doesn't exist." };
  }
  // Preserve the live write cutoff: this uses the real operation clock and the
  // existing close-only status rule, not the frozen editorial NOW.
  if (dependencies.effectiveStatus(prediction, dependencies.nowIso()) !== "open") {
    return { ok: false, error: "Voting has closed on this question." };
  }

  const votes = dependencies.getVoteRepository();
  if (!votes.available) {
    return { ok: false, error: "Voting isn't available right now." };
  }

  const voterId = await dependencies.getOrCreateVoterId();
  // The store updates the existing row for this prediction/voter pair.
  const result = await votes.upsertVote({
    predictionSlug: slug,
    optionId,
    voterId,
  });
  if (!result.ok) {
    return { ok: false, error: "Couldn't record your vote. Please try again." };
  }

  // Refresh every surface that renders this live tally.
  dependencies.revalidatePath(`/predictions/${slug}`);
  dependencies.revalidatePath("/predictions");
  dependencies.revalidatePath("/");
  return { ok: true, optionId };
}
