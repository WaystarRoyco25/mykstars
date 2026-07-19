"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { effectiveStatus, getPrediction } from "@/lib/data/forecasts";
import {
  executeCastVote,
  type CastVoteDependencies,
  type VoteResult,
} from "@/lib/forecast/cast-vote";
import { getVoteRepository } from "@/lib/forecast/vote-repository";
import { getOrCreateVoterId as readOrCreateVoterId } from "@/lib/forecast/voter-cookie";

// The voter cookie is httpOnly so client JS
// can't read or forge it. This is soft dedup — one pick per question, not
// authentication; a determined user can clear cookies and vote again.

export type { VoteResult } from "@/lib/forecast/cast-vote";

const dependencies: CastVoteDependencies = {
  getPrediction,
  effectiveStatus,
  nowIso: () => new Date().toISOString(),
  getVoteRepository,
  async getOrCreateVoterId() {
    const cookieStore = await cookies();
    return readOrCreateVoterId(cookieStore);
  },
  revalidatePath,
};

export async function castVote(slug: string, optionId: string): Promise<VoteResult> {
  // Server Actions are reachable by direct POST, so never trust the inputs:
  // validate the slug/option against the curated set and confirm voting is open.
  return executeCastVote(slug, optionId, dependencies);
}
