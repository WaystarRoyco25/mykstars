import assert from "node:assert/strict";
import test from "node:test";

import {
  VOTER_COOKIE,
  VOTER_COOKIE_MAX_AGE_SECONDS,
  getOrCreateVoterId,
} from "../../src/lib/forecast/voter-cookie";

test("an existing anonymous voter id is reused without rewriting the cookie", () => {
  let writes = 0;
  const cookieStore = {
    get: (name: string) => (name === VOTER_COOKIE ? { value: "existing" } : undefined),
    set: () => {
      writes += 1;
    },
  };

  assert.equal(getOrCreateVoterId(cookieStore, () => "new"), "existing");
  assert.equal(writes, 0);
});

test("a new anonymous voter id retains the one-year httpOnly cookie lifecycle", () => {
  const writes: unknown[][] = [];
  const cookieStore = {
    get: () => undefined,
    set: (...args: unknown[]) => {
      writes.push(args);
    },
  };

  assert.equal(getOrCreateVoterId(cookieStore, () => "new-voter"), "new-voter");
  assert.deepEqual(writes, [
    [
      VOTER_COOKIE,
      "new-voter",
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: VOTER_COOKIE_MAX_AGE_SECONDS,
        path: "/",
      },
    ],
  ]);
});
