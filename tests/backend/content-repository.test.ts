import assert from "node:assert/strict";
import test from "node:test";

import {
  ContentRepository,
  contentRepository,
  type ContentInventory,
} from "../../src/lib/content-repository";
import type { Artist } from "../../src/lib/types";

test("the catalog snapshot retains selector ordering and relationship hydration", () => {
  assert.deepEqual(
    contentRepository.clipsNewest.slice(0, 4).map((clip) => clip.id),
    [
      "clip-tv-roh-yoon-seo-nam-joo-hyuk-asianfeed",
      "clip-tv-kim-min-ha-jtbc-news",
      "clip-tv-choo-young-woo-pickcon",
      "clip-tv-jung-hoyeon-pinggyego",
    ],
  );
  assert.deepEqual(
    contentRepository.eventsSoonest.slice(0, 4).map((event) => event.slug),
    [
      "jaehyun-mono-bangkok",
      "bts-arirang-london",
      "twice-this-is-for-seoul",
      "exo-exhorizon-tokyo",
    ],
  );

  const timeline = contentRepository.profileTimeline("bts");
  assert.deepEqual(
    timeline.map((entry) => {
      switch (entry.format) {
        case "gallery":
          return `gallery:${entry.gallery.slug}`;
        case "clip":
          return `clip:${entry.clip.id}`;
        case "article":
          return `article:${entry.article.slug}`;
        case "pulse":
          return `pulse:${entry.pulse.slug}`;
        case "event":
          return `event:${entry.event.slug}`;
      }
    }),
    [
      "event:bts-arirang-los-angeles-sep-5-6",
      "event:bts-arirang-los-angeles",
      "event:bts-arirang-paris",
      "pulse:2026-07-bts-british-museum-gallery-trail",
      "pulse:2026-07-bts-london-return",
      "event:bts-arirang-london",
      "article:arirang-numbers-reading",
      "clip:clip-tv-bts-run-bts",
      "clip:clip-yt-bts-swim",
    ],
  );
});

test("batch artist lookup preserves request order and omits missing records", () => {
  assert.equal("set" in contentRepository.artistBySlug, false);
  assert.deepEqual(
    contentRepository.artistsForSlugs(["bts", "missing", "aespa"]).map((item) => item.slug),
    ["bts", "aespa"],
  );
});

test("repository construction fails loudly on duplicate entity keys", () => {
  const artist = { slug: "duplicate", name: "One" } as Artist;
  const empty = {
    now: "2026-07-17",
    artists: [artist, { ...artist, name: "Two" }],
    galleries: [],
    clips: [],
    articles: [],
    pulses: [],
    rankings: [],
    events: [],
    predictions: [],
    editions: [],
  } satisfies ContentInventory;
  assert.throws(() => new ContentRepository(empty), /Duplicate artist key "duplicate"/);
});

test("required batch lookup reports the owner and missing reference", () => {
  assert.throws(
    () =>
      contentRepository.requireMany(
        contentRepository.articleBySlug,
        ["missing"],
        "article",
        "Edition 2026-07",
      ),
    /Edition 2026-07 references missing article "missing"/,
  );
});
