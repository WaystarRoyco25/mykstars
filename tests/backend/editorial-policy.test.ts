import assert from "node:assert/strict";
import test from "node:test";

import {
  ALL_RIGHTS_BASES,
  COMMONS_DISCOVERY_RIGHTS_BASES,
  DAY_MS,
  MAX_CLIP_AGE_DAYS,
  PROFILE_HERO_RIGHTS_BASES,
  STORED_IMAGE_RIGHTS_BASES,
  effectivePredictionStatus,
  hasPromotedSubject,
  isClipFreshAt,
  isGalleryListed,
  isPredictionOpenAt,
  promotesOnlyUnpromotedOptions,
} from "../../src/lib/editorial-policy";
import type { Artist, Clip, Gallery, Prediction } from "../../src/lib/types";

const activeArtist = {
  slug: "active",
  coverageLevel: "active",
  publicationState: "published",
} as Artist;
const catalogArtist = {
  slug: "catalog",
  coverageLevel: "catalog",
  publicationState: "published",
} as Artist;
const artistIndex = new Map([
  [activeArtist.slug, activeArtist],
  [catalogArtist.slug, catalogArtist],
]);

const prediction = {
  slug: "forecast",
  opensAt: "2026-07-01T00:00:00Z",
  closesAt: "2026-07-17T00:00:00Z",
  status: "open",
  options: [{ id: "yes", label: "Yes" }],
} as Prediction;

test("unknown artist slugs remain promotable", () => {
  assert.equal(hasPromotedSubject(["catalog"], artistIndex), false);
  assert.equal(hasPromotedSubject(["unknown"], artistIndex), true);
  assert.equal(hasPromotedSubject([], artistIndex), true);
});

test("archived gallery detail records remain distinct from gallery listings", () => {
  assert.equal(isGalleryListed({ publicationState: "archived" } as Gallery), false);
  assert.equal(isGalleryListed({} as Gallery), true);
});

test("clip freshness includes the exact cutoff and rejects a future clip", () => {
  const now = Date.parse("2026-07-17T00:00:00Z");
  const exact = {
    date: new Date(now - MAX_CLIP_AGE_DAYS * DAY_MS).toISOString(),
  } as Clip;
  const stale = { date: new Date(Date.parse(exact.date) - 1).toISOString() } as Clip;
  const future = { date: new Date(now + 1).toISOString() } as Clip;
  assert.equal(isClipFreshAt(exact, now), true);
  assert.equal(isClipFreshAt(stale, now), false);
  assert.equal(isClipFreshAt(future, now), false);
});

test("a current evergreen review date keeps an old clip eligible", () => {
  const now = Date.parse("2026-07-17T00:00:00Z");
  const clip = {
    date: "2020-01-01T00:00:00Z",
    evergreenUntil: new Date(now).toISOString(),
  } as Clip;
  assert.equal(isClipFreshAt(clip, now), true);
});

test("forecast state precedence honors resolved and stored closed values", () => {
  assert.equal(
    effectivePredictionStatus(
      { ...prediction, status: "closed", closesAt: "2099-01-01T00:00:00Z" },
      "2026-07-17T00:00:00Z",
    ),
    "closed",
  );
  assert.equal(
    effectivePredictionStatus(
      { ...prediction, status: "closed", resolution: {} as Prediction["resolution"] },
      "2026-07-17T00:00:00Z",
    ),
    "resolved",
  );
  assert.equal(
    effectivePredictionStatus(prediction, prediction.closesAt),
    "closed",
  );
  assert.equal(isPredictionOpenAt(prediction, "2026-07-16T23:59:59Z"), true);
});

test("only known unpromoted forecast subjects trigger the promotion safety net", () => {
  assert.equal(
    promotesOnlyUnpromotedOptions(
      { ...prediction, options: [{ id: "one", label: "One", artistSlug: "catalog" }] },
      artistIndex,
    ),
    true,
  );
  assert.equal(
    promotesOnlyUnpromotedOptions(
      { ...prediction, options: [{ id: "one", label: "One", artistSlug: "unknown" }] },
      artistIndex,
    ),
    false,
  );
});

test("rights subsets remain intentionally distinct", () => {
  assert.deepEqual(STORED_IMAGE_RIGHTS_BASES, [
    "cc-by",
    "cc-by-sa",
    "public-domain",
    "agency-press-kit",
  ]);
  assert.equal(PROFILE_HERO_RIGHTS_BASES.includes("official-embed"), true);
  assert.equal(COMMONS_DISCOVERY_RIGHTS_BASES.includes("agency-press-kit" as never), false);
  assert.equal(ALL_RIGHTS_BASES.includes("owner-supplied"), true);
});
