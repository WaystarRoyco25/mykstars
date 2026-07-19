import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import type { MyKStarsDatabase } from "@/lib/supabase-types";
import { VoteRepository } from "./vote-repository-core";
import { SupabaseVoteDataSource } from "./supabase-vote-source";

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
