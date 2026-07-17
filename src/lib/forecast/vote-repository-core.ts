export interface VoteTallyRow {
  predictionSlug: string;
  optionId: string;
  votes: number;
}

export interface VoteUpsert {
  predictionSlug: string;
  optionId: string;
  voterId: string;
}

export interface VoteDataSource {
  readTallies(slugs: readonly string[]): Promise<VoteTallyRow[]>;
  readVoterSelection(slug: string, voterId: string): Promise<string | null>;
  upsertVote(vote: VoteUpsert): Promise<void>;
}

export type VoteWriteResult =
  | { ok: true }
  | { ok: false; reason: "unavailable" | "storage-error" };

// The repository owns failure semantics for live data. Reads intentionally
// degrade to an empty result, while writes report enough detail for the Server
// Action to preserve its existing user-facing messages.
export class VoteRepository {
  constructor(private readonly source: VoteDataSource | null) {}

  get available(): boolean {
    return this.source !== null;
  }

  async readTallies(slugs: readonly string[]): Promise<VoteTallyRow[]> {
    if (!this.source || slugs.length === 0) return [];
    const uniqueSlugs = [...new Set(slugs)];
    try {
      return await this.source.readTallies(uniqueSlugs);
    } catch {
      return [];
    }
  }

  async readVoterSelection(
    slug: string,
    voterId: string | undefined,
  ): Promise<string | null> {
    if (!this.source || !voterId) return null;
    try {
      return await this.source.readVoterSelection(slug, voterId);
    } catch {
      return null;
    }
  }

  async upsertVote(vote: VoteUpsert): Promise<VoteWriteResult> {
    if (!this.source) return { ok: false, reason: "unavailable" };
    try {
      await this.source.upsertVote(vote);
      return { ok: true };
    } catch {
      return { ok: false, reason: "storage-error" };
    }
  }
}
