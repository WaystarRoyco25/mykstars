import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import test from "node:test";

import { mediaAssets } from "@/content/media-assets";
import { artists } from "@/content/profiles";
import { pulses } from "@/content/pulses";
import {
  SUPABASE_PUBLIC_MEDIA_BASE_URL,
  createMediaAssetIndex,
  mediaAssetIndex,
  orientationFromDimensions,
  resolveImageRef,
} from "@/lib/media-assets";
import type { MediaAsset } from "@/lib/types";

const GOLDEN_IMAGE_COUNT = 56;
const GOLDEN_IMAGE_HASH =
  "b38ef0a81ee2e1f3e98d2105eca825b9c04a0c28e37aab641fe335b71db94dff";

function currentResolvedImages() {
  return [
    ...artists.flatMap((artist) =>
      artist.hero?.kind === "image"
        ? [[`artist:${artist.slug}`, artist.hero] as const]
        : [],
    ),
    ...pulses.flatMap((pulse) =>
      pulse.media?.kind === "image"
        ? [[`pulse:${pulse.slug}`, pulse.media] as const]
        : [],
    ),
  ];
}

function fixtureAsset(overrides: Partial<MediaAsset> = {}): MediaAsset {
  return {
    id: "fixture-photo",
    credit: {
      name: "Fixture photographer",
      url: "https://example.com/credit",
      kind: "licensed",
    },
    rightsBasis: "cc-by",
    acquisitionDate: "2026-07-01",
    reviewDate: "2027-07-01",
    width: 1200,
    height: 800,
    checksum: "a".repeat(64),
    storagePath: "profiles/fixture/2026/fixture-photo.jpg",
    ...overrides,
  };
}

test("all 56 authored references resolve to the exact pre-refactor runtime values", () => {
  const images = currentResolvedImages();
  const hash = createHash("sha256")
    .update(JSON.stringify(images))
    .digest("hex");

  assert.equal(images.length, GOLDEN_IMAGE_COUNT);
  assert.equal(hash, GOLDEN_IMAGE_HASH);
});

test("the canonical asset index is unique, immutable, and defaults sourceUrl", () => {
  assert.equal(mediaAssetIndex.size, 107);
  assert.equal(mediaAssetIndex.size, mediaAssets.length);
  assert.equal("set" in mediaAssetIndex, false);

  for (const asset of mediaAssetIndex.values()) {
    assert.equal(asset.sourceUrl, asset.credit.url);
    assert.equal(Object.isFrozen(asset), true);
    assert.equal(Object.isFrozen(asset.credit), true);
  }

  assert.throws(
    () => createMediaAssetIndex([fixtureAsset(), fixtureAsset()]),
    /Duplicate media asset id: fixture-photo/,
  );
});

test("sourceUrl overrides stay explicit and do not affect public image URLs", () => {
  const index = createMediaAssetIndex([
    fixtureAsset({ sourceUrl: "https://example.com/license" }),
  ]);
  const asset = index.require("fixture-photo");
  const image = resolveImageRef(
    {
      kind: "image",
      assetId: "fixture-photo",
      alt: "Fixture alt text",
    },
    index,
  );

  assert.equal(asset.sourceUrl, "https://example.com/license");
  assert.deepEqual(image, {
    id: "fixture-photo",
    kind: "image",
    alt: "Fixture alt text",
    credit: fixtureAsset().credit,
    src: `${SUPABASE_PUBLIC_MEDIA_BASE_URL}/profiles/fixture/2026/fixture-photo.jpg`,
    width: 1200,
    height: 800,
    orientation: "landscape",
    assetId: "fixture-photo",
  });
});

test("contextual ids and crop orientations override only their derived fields", () => {
  const index = createMediaAssetIndex([fixtureAsset()]);
  const image = resolveImageRef(
    {
      kind: "image",
      assetId: "fixture-photo",
      alt: "Contextual alt text",
      id: "fixture-photo-hero",
      crop: { orientation: "portrait" },
    },
    index,
  );

  assert.equal(image.id, "fixture-photo-hero");
  assert.equal(image.alt, "Contextual alt text");
  assert.equal(image.orientation, "portrait");
  assert.equal(image.width, 1200);
  assert.equal(image.height, 800);
});

test("orientation derivation preserves the existing 15 percent square tolerance", () => {
  assert.equal(orientationFromDimensions(1_150, 1_000), "square");
  assert.equal(orientationFromDimensions(1_151, 1_000), "landscape");
  assert.equal(orientationFromDimensions(1_000, 1_150), "square");
  assert.equal(orientationFromDimensions(1_000, 1_151), "portrait");
});

test("missing asset references fail at the resolver boundary", () => {
  const index = createMediaAssetIndex([]);
  assert.throws(
    () =>
      resolveImageRef(
        { kind: "image", assetId: "missing", alt: "Missing" },
        index,
      ),
    /Unknown media asset id: missing/,
  );
});
