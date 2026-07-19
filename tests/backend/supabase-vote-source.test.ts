import assert from "node:assert/strict";
import test from "node:test";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  SupabaseVoteDataSource,
  TALLIES_VIEW,
  VOTES_TABLE,
} from "../../src/lib/forecast/supabase-vote-source";
import type { MyKStarsDatabase } from "../../src/lib/supabase-types";

type RecordedCall = readonly [operation: string, ...args: unknown[]];

function fakeClient(results: {
  tallies?: { data: unknown[] | null; error: unknown };
  selection?: { data: { option_id: string } | null; error: unknown };
  upsert?: { error: unknown };
}) {
  const calls: RecordedCall[] = [];
  const client = {
    from(relation: string) {
      calls.push(["from", relation]);
      if (relation === TALLIES_VIEW) {
        return {
          select(columns: string) {
            calls.push(["select", columns]);
            return this;
          },
          async in(column: string, values: string[]) {
            calls.push(["in", column, values]);
            return results.tallies ?? { data: [], error: null };
          },
        };
      }
      return {
        select(columns: string) {
          calls.push(["select", columns]);
          return this;
        },
        eq(column: string, value: string) {
          calls.push(["eq", column, value]);
          return this;
        },
        async maybeSingle() {
          calls.push(["maybeSingle"]);
          return results.selection ?? { data: null, error: null };
        },
        async upsert(
          value: unknown,
          options: { onConflict: string },
        ) {
          calls.push(["upsert", value, options]);
          return results.upsert ?? { error: null };
        },
      };
    },
  };
  return {
    calls,
    client: client as unknown as SupabaseClient<MyKStarsDatabase>,
  };
}

test("Supabase tally reads preserve the view contract and numeric mapping", async () => {
  const fixture = fakeClient({
    tallies: {
      data: [
        { prediction_slug: "forecast", option_id: "yes", votes: "7" },
      ],
      error: null,
    },
  });
  const source = new SupabaseVoteDataSource(fixture.client);

  assert.deepEqual(await source.readTallies(["forecast"]), [
    { predictionSlug: "forecast", optionId: "yes", votes: 7 },
  ]);
  assert.deepEqual(fixture.calls, [
    ["from", "prediction_tallies"],
    ["select", "prediction_slug, option_id, votes"],
    ["in", "prediction_slug", ["forecast"]],
  ]);
});

test("Supabase voter reads preserve both identity predicates", async () => {
  const fixture = fakeClient({
    selection: { data: { option_id: "no" }, error: null },
  });
  const source = new SupabaseVoteDataSource(fixture.client);

  assert.equal(await source.readVoterSelection("forecast", "voter"), "no");
  assert.deepEqual(fixture.calls, [
    ["from", VOTES_TABLE],
    ["select", "option_id"],
    ["eq", "prediction_slug", "forecast"],
    ["eq", "voter_id", "voter"],
    ["maybeSingle"],
  ]);
});

test("Supabase writes preserve the stored columns and conflict target", async () => {
  const fixture = fakeClient({});
  const source = new SupabaseVoteDataSource(fixture.client);

  await source.upsertVote({
    predictionSlug: "forecast",
    optionId: "yes",
    voterId: "voter",
  });
  assert.deepEqual(fixture.calls, [
    ["from", VOTES_TABLE],
    [
      "upsert",
      {
        prediction_slug: "forecast",
        option_id: "yes",
        voter_id: "voter",
      },
      { onConflict: "prediction_slug,voter_id" },
    ],
  ]);
});

test("Supabase adapter errors propagate to repository failure semantics", async () => {
  const failure = new Error("storage failed");
  const readFixture = fakeClient({
    tallies: { data: null, error: failure },
  });
  await assert.rejects(
    () => new SupabaseVoteDataSource(readFixture.client).readTallies(["forecast"]),
    failure,
  );

  const writeFixture = fakeClient({ upsert: { error: failure } });
  await assert.rejects(
    () =>
      new SupabaseVoteDataSource(writeFixture.client).upsertVote({
        predictionSlug: "forecast",
        optionId: "yes",
        voterId: "voter",
      }),
    failure,
  );
});
