"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { predictions } from "@/lib/seed";
import { effectiveStatus, VOTER_COOKIE } from "@/lib/data";
import { getSupabase } from "@/lib/supabase";

// The voter cookie (VOTER_COOKIE, from the data layer) is httpOnly so client JS
// can't read or forge it. This is soft dedup — one pick per question, not
// authentication; a determined user can clear cookies and vote again.
const ONE_YEAR = 60 * 60 * 24 * 365;

export type VoteResult = { ok: true; optionId: string } | { ok: false; error: string };

export async function castVote(slug: string, optionId: string): Promise<VoteResult> {
  // Server Actions are reachable by direct POST, so never trust the inputs:
  // validate the slug/option against the curated set and confirm voting is open.
  const prediction = predictions.find((p) => p.slug === slug);
  if (!prediction) return { ok: false, error: "Unknown question." };
  if (!prediction.options.some((o) => o.id === optionId)) {
    return { ok: false, error: "That option doesn't exist." };
  }
  // The integrity gate: check the REAL clock (not the frozen display NOW) so a
  // vote is never accepted past closesAt, regardless of what a cached page shows.
  if (effectiveStatus(prediction, new Date().toISOString()) !== "open") {
    return { ok: false, error: "Voting has closed on this question." };
  }

  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: "Voting isn't available right now." };

  const cookieStore = await cookies();
  let voterId = cookieStore.get(VOTER_COOKIE)?.value;
  if (!voterId) {
    voterId = crypto.randomUUID();
    cookieStore.set(VOTER_COOKIE, voterId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: ONE_YEAR,
      path: "/",
    });
  }

  // One row per (voter, question); re-voting updates the pick (unique constraint
  // on prediction_slug + voter_id, set up in the Supabase schema).
  const { error } = await supabase
    .from("votes")
    .upsert(
      { prediction_slug: slug, option_id: optionId, voter_id: voterId },
      { onConflict: "prediction_slug,voter_id" },
    );
  if (error) return { ok: false, error: "Couldn't record your vote — please try again." };

  // Refresh the live tallies everywhere this question surfaces.
  revalidatePath(`/predictions/${slug}`);
  revalidatePath("/predictions");
  revalidatePath("/");
  return { ok: true, optionId };
}
