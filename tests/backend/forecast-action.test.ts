import assert from "node:assert/strict";
import test from "node:test";

import { castVote } from "../../src/app/predictions/actions";
import { predictions } from "../../src/content/predictions";
import { effectivePredictionStatus } from "../../src/lib/editorial-policy";
import {
  executeCastVote,
  type CastVoteDependencies,
} from "../../src/lib/forecast/cast-vote";
import type {
  VoteUpsert,
  VoteWriteResult,
} from "../../src/lib/forecast/vote-repository-core";

function fakeDependencies({
  found = true,
  status = "open",
  available = true,
  writeResult = { ok: true },
}: {
  found?: boolean;
  status?: "open" | "closed" | "resolved";
  available?: boolean;
  writeResult?: VoteWriteResult;
} = {}) {
  const prediction = predictions[0];
  const events: string[] = [];
  const writes: VoteUpsert[] = [];
  const dependencies: CastVoteDependencies = {
    async getPrediction() {
      events.push("prediction");
      return found ? prediction : undefined;
    },
    effectiveStatus() {
      events.push("status");
      return status;
    },
    nowIso() {
      events.push("clock");
      return "2026-07-19T00:00:00Z";
    },
    getVoteRepository() {
      events.push("repository");
      return {
        available,
        async upsertVote(vote) {
          events.push("upsert");
          writes.push(vote);
          return writeResult;
        },
      };
    },
    async getOrCreateVoterId() {
      events.push("cookie");
      return "voter-id";
    },
    revalidatePath(path) {
      events.push(`revalidate:${path}`);
    },
  };
  return { prediction, dependencies, events, writes };
}

test("forecast action preserves public validation order and error messages", async () => {
  const resolved = predictions.find((prediction) => prediction.status === "resolved");
  assert.ok(resolved);

  assert.deepEqual(await castVote("missing-question", "yes"), {
    ok: false,
    error: "Unknown question.",
  });
  assert.deepEqual(await castVote(resolved.slug, "missing-option"), {
    ok: false,
    error: "That option doesn't exist.",
  });
  assert.deepEqual(await castVote(resolved.slug, resolved.options[0].id), {
    ok: false,
    error: "Voting has closed on this question.",
  });
});

test("forecast write eligibility retains the existing close-only time gate", () => {
  const prediction = {
    ...predictions[0],
    opensAt: "2098-01-01T00:00:00Z",
    closesAt: "2099-01-01T00:00:00Z",
    status: "open" as const,
  };
  assert.equal(
    effectivePredictionStatus(prediction, "2026-07-19T00:00:00Z"),
    "open",
  );
});

test("vote orchestration validates before clock, repository, and cookie access", async () => {
  const missing = fakeDependencies({ found: false });
  assert.deepEqual(await executeCastVote("missing", "yes", missing.dependencies), {
    ok: false,
    error: "Unknown question.",
  });
  assert.deepEqual(missing.events, ["prediction"]);

  const invalidOption = fakeDependencies();
  assert.deepEqual(
    await executeCastVote(
      invalidOption.prediction.slug,
      "missing",
      invalidOption.dependencies,
    ),
    { ok: false, error: "That option doesn't exist." },
  );
  assert.deepEqual(invalidOption.events, ["prediction"]);

  const closed = fakeDependencies({ status: "closed" });
  assert.deepEqual(
    await executeCastVote(
      closed.prediction.slug,
      closed.prediction.options[0].id,
      closed.dependencies,
    ),
    { ok: false, error: "Voting has closed on this question." },
  );
  assert.deepEqual(closed.events, ["prediction", "clock", "status"]);
});

test("an unavailable vote store is reported before a voter cookie is created", async () => {
  const fixture = fakeDependencies({ available: false });
  assert.deepEqual(
    await executeCastVote(
      fixture.prediction.slug,
      fixture.prediction.options[0].id,
      fixture.dependencies,
    ),
    { ok: false, error: "Voting isn't available right now." },
  );
  assert.deepEqual(fixture.events, [
    "prediction",
    "clock",
    "status",
    "repository",
  ]);
});

test("a storage failure keeps the generic error and skips revalidation", async () => {
  const fixture = fakeDependencies({
    writeResult: { ok: false, reason: "storage-error" },
  });
  assert.deepEqual(
    await executeCastVote(
      fixture.prediction.slug,
      fixture.prediction.options[0].id,
      fixture.dependencies,
    ),
    { ok: false, error: "Couldn't record your vote. Please try again." },
  );
  assert.deepEqual(fixture.events, [
    "prediction",
    "clock",
    "status",
    "repository",
    "cookie",
    "upsert",
  ]);
});

test("a successful vote preserves payload and revalidation order", async () => {
  const fixture = fakeDependencies();
  const optionId = fixture.prediction.options[0].id;
  assert.deepEqual(
    await executeCastVote(
      fixture.prediction.slug,
      optionId,
      fixture.dependencies,
    ),
    { ok: true, optionId },
  );
  assert.deepEqual(fixture.writes, [
    {
      predictionSlug: fixture.prediction.slug,
      optionId,
      voterId: "voter-id",
    },
  ]);
  assert.deepEqual(fixture.events, [
    "prediction",
    "clock",
    "status",
    "repository",
    "cookie",
    "upsert",
    `revalidate:/predictions/${fixture.prediction.slug}`,
    "revalidate:/predictions",
    "revalidate:/",
  ]);
});
