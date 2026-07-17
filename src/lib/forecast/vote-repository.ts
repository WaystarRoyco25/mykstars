import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import type {
  MyKStarsDatabase,
  PredictionTallyRow,
} from "@/lib/supabase-types";
import {
  VoteRepository,
  type VoteDataSource,
  type VoteTallyRow,
  type VoteUpsert,
} from "./vote-repository-core";

const VOTES_TABLE = "votes" as const;
const TALLIES_VIEW = "prediction_tallies" as const;

class SupabaseVoteDataSource implements VoteDataSource {
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

  async readVoterSelection(slug: string, voterId: string): Promise<string | null> {
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

const unavailableRepository = new VoteRepository(null);
let cachedClient: SupabaseClient<MyKStarsDatabase> | null = null;
let cachedRepository: VoteRepository | null = null;

export function getVoteRepository(): VoteRepository {
  const client = getSupabase();
  if (!client) return unavailableRepository;
  if (!cachedRepository || cachedClient !== client) {
    cachedClient = client;
    cachedRepository = new VoteRepository(new SupabaseVoteDataSource(client));
  }
  return cachedRepository;
}

export type {
  VoteDataSource,
  VoteTallyRow,
  VoteUpsert,
  VoteWriteResult,
} from "./vote-repository-core";
