import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  MyKStarsDatabase,
  PredictionTallyRow,
} from "../supabase-types";
import type {
  VoteDataSource,
  VoteTallyRow,
  VoteUpsert,
} from "./vote-repository-core";

export const VOTES_TABLE = "votes" as const;
export const TALLIES_VIEW = "prediction_tallies" as const;

export class SupabaseVoteDataSource implements VoteDataSource {
  constructor(private readonly client: SupabaseClient<MyKStarsDatabase>) {}

  async readTallies(slugs: readonly string[]): Promise<VoteTallyRow[]> {
    const { data, error } = await this.client
      .from(TALLIES_VIEW)
      .select("prediction_slug, option_id, votes")
      .in("prediction_slug", [...slugs]);
    if (error) throw error;
    return (data ?? []).map((row: PredictionTallyRow) => ({
      predictionSlug: row.prediction_slug,
      optionId: row.option_id,
      votes: Number(row.votes),
    }));
  }

  async readVoterSelection(
    slug: string,
    voterId: string,
  ): Promise<string | null> {
    const { data, error } = await this.client
      .from(VOTES_TABLE)
      .select("option_id")
      .eq("prediction_slug", slug)
      .eq("voter_id", voterId)
      .maybeSingle();
    if (error) throw error;
    return data?.option_id ?? null;
  }

  async upsertVote(vote: VoteUpsert): Promise<void> {
    const { error } = await this.client.from(VOTES_TABLE).upsert(
      {
        prediction_slug: vote.predictionSlug,
        option_id: vote.optionId,
        voter_id: vote.voterId,
      },
      { onConflict: "prediction_slug,voter_id" },
    );
    if (error) throw error;
  }
}
