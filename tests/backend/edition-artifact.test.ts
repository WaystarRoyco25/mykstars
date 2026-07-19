import assert from "node:assert/strict";
import test from "node:test";

import { edition202607 } from "../../src/content/editions/2026-07";
import {
  asEditionArtifact,
  staleEditionFacts,
} from "../../src/lib/edition/artifact";

test("edition artifact parsing preserves the committed generated shape", () => {
  assert.equal(asEditionArtifact(edition202607), edition202607);
  assert.equal(
    asEditionArtifact({
      ...edition202607,
      bands: [{ kind: "analysis", articleSlugs: "not-an-array" }],
    }),
    undefined,
  );
  assert.equal(
    asEditionArtifact({
      ...edition202607,
      provenance: { activeArtistSlugs: [], inventoryHash: 123 },
    }),
    undefined,
  );
});

test("stale edition detection keeps month, date, and event exemptions", () => {
  const edition = {
    ...edition202607,
    id: "2026-07",
    publishedAt: "2026-07-10T00:00:00Z",
  };
  const facts = [
    { key: "old", format: "pulse", date: "2026-07-09", dateMs: Date.parse("2026-07-09") },
    { key: "newer", format: "clip", date: "2026-07-12", dateMs: Date.parse("2026-07-12") },
    { key: "newest", format: "article", date: "2026-07-13", dateMs: Date.parse("2026-07-13") },
    { key: "event", format: "event", date: "2026-07-14", dateMs: Date.parse("2026-07-14") },
    { key: "next-month", format: "pulse", date: "2026-08-01", dateMs: Date.parse("2026-08-01") },
  ];

  assert.deepEqual(
    staleEditionFacts(edition, facts).map((fact) => fact.key),
    ["newest", "newer"],
  );
});
