"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { effectiveStatus, getPrediction } from "@/lib/data";
import { getVoteRepository } from "@/lib/forecast/vote-repository";
import { getOrCreateVoterId } from "@/lib/forecast/voter-cookie";

// The voter cookie is httpOnly so client JS
// can't read or forge it. This is soft dedup — one pick per question, not
// authentication; a determined user can clear cookies and vote again.

export type VoteResult = { ok: true; optionId: string } | { ok: false; error: string };

export async function castVote(slug: string, optionId: string): Promise<VoteResult> {
  // Server Actions are reachable by direct POST, so never trust the inputs:
  // validate the slug/option against the curated set and confirm voting is open.
  const prediction = await getPrediction(slug);
  if (!prediction) return { ok: false, error: "Unknown question." };
  if (!prediction.options.some((o) => o.id === optionId)) {
    return { ok: false, error: "That option doesn't exist." };
  }
  // The integrity gate: check the REAL clock (not the frozen display NOW) so a
  // vote is never accepted past closesAt, regardless of what a cached page shows.
  if (effectiveStatus(prediction, new Date().toISOString()) !== "open") {
    return { ok: false, error: "Voting has closed on this question." };
  }

  const votes = getVoteRepository();
  if (!votes.available) return { ok: false, error: "Voting isn't available right now." };

  const cookieStore = await cookies();
  const voterId = getOrCreateVoterId(cookieStore);

  // One row per (voter, question); re-voting updates the pick (unique constraint
  // on prediction_slug + voter_id, set up in the Supabase schema).
  const result = await votes.upsertVote({
    predictionSlug: slug,
    optionId,
    voterId,
  });
  if (!result.ok) {
    return { ok: false, error: "Couldn't record your vote. Please try again." };
  }

  // Refresh the live tallies everywhere this question surfaces.
  revalidatePath(`/predictions/${slug}`);
  revalidatePath("/predictions");
  revalidatePath("/");
  return { ok: true, optionId };
}
