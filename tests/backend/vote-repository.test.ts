import assert from "node:assert/strict";
import test from "node:test";

import {
  VoteRepository,
  type VoteDataSource,
  type VoteTallyRow,
  type VoteUpsert,
} from "../../src/lib/forecast/vote-repository-core";

class FakeVoteDataSource implements VoteDataSource {
  tallies: VoteTallyRow[] = [];
  selection: string | null = null;
  upserts: VoteUpsert[] = [];
  failReads = false;
  failWrites = false;

  async readTallies(): Promise<VoteTallyRow[]> {
    if (this.failReads) throw new Error("read failed");
    return this.tallies;
  }

  async readVoterSelection(): Promise<string | null> {
    if (this.failReads) throw new Error("read failed");
    return this.selection;
  }

  async upsertVote(vote: VoteUpsert): Promise<void> {
    if (this.failWrites) throw new Error("write failed");
    this.upserts.push(vote);
  }
}

test("an absent vote store degrades reads and reports unavailable writes", async () => {
  const repository = new VoteRepository(null);
  assert.deepEqual(await repository.readTallies(["forecast"]), []);
  assert.equal(await repository.readVoterSelection("forecast", "voter"), null);
  assert.deepEqual(
    await repository.upsertVote({
      predictionSlug: "forecast",
      optionId: "yes",
      voterId: "voter",
    }),
    { ok: false, reason: "unavailable" },
  );
});

test("vote read errors degrade to the existing empty states", async () => {
  const source = new FakeVoteDataSource();
  source.failReads = true;
  const repository = new VoteRepository(source);
  assert.deepEqual(await repository.readTallies(["forecast"]), []);
  assert.equal(await repository.readVoterSelection("forecast", "voter"), null);
});

test("successful reads and upserts retain typed vote values", async () => {
  const source = new FakeVoteDataSource();
  source.tallies = [{ predictionSlug: "forecast", optionId: "yes", votes: 4 }];
  source.selection = "yes";
  const repository = new VoteRepository(source);

  assert.deepEqual(await repository.readTallies(["forecast", "forecast"]), source.tallies);
  assert.equal(await repository.readVoterSelection("forecast", "voter"), "yes");
  assert.deepEqual(
    await repository.upsertVote({
      predictionSlug: "forecast",
      optionId: "yes",
      voterId: "voter",
    }),
    { ok: true },
  );
  assert.deepEqual(source.upserts, [
    { predictionSlug: "forecast", optionId: "yes", voterId: "voter" },
  ]);
});

test("vote write errors remain distinguishable from an unavailable store", async () => {
  const source = new FakeVoteDataSource();
  source.failWrites = true;
  const repository = new VoteRepository(source);
  assert.deepEqual(
    await repository.upsertVote({
      predictionSlug: "forecast",
      optionId: "yes",
      voterId: "voter",
    }),
    { ok: false, reason: "storage-error" },
  );
});
