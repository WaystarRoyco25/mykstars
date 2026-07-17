import assert from "node:assert/strict";
import test from "node:test";

import { submitTakedown } from "../../src/app/legal/dmca/actions";

function validRequest(): FormData {
  const formData = new FormData();
  formData.set("name", "Rights Owner");
  formData.set("email", "owner@example.com");
  formData.set("rightsHolder", "Example Studio");
  formData.set("url", "https://mykstars.com/photos/example");
  formData.set("details", "I own the pictured work.");
  formData.set("goodFaith", "on");
  return formData;
}

test("takedown intake requires the good-faith attestation on the server", async () => {
  const formData = validRequest();
  formData.delete("goodFaith");
  assert.deepEqual(await submitTakedown(formData), { ok: false });
});

test("takedown intake rejects malformed email and URL values", async () => {
  const invalidEmail = validRequest();
  invalidEmail.set("email", "invalid");
  assert.deepEqual(await submitTakedown(invalidEmail), { ok: false });

  const invalidUrl = validRequest();
  invalidUrl.set("url", "javascript:alert(1)");
  assert.deepEqual(await submitTakedown(invalidUrl), { ok: false });
});

test("valid takedown intake retains the existing receipt log", async (t) => {
  const calls: unknown[][] = [];
  t.mock.method(console, "info", (...args: unknown[]) => {
    calls.push(args);
  });

  assert.deepEqual(await submitTakedown(validRequest()), { ok: true });
  assert.deepEqual(calls, [
    [
      "[takedown] received",
      {
        rightsHolder: "Example Studio",
        url: "https://mykstars.com/photos/example",
      },
    ],
  ]);
});
