import assert from "node:assert/strict";
import test from "node:test";
import { checkArticles } from "../../src/lib/checks/articles";
import { checkFreshness } from "../../src/lib/checks/freshness";
import { checkMedia } from "../../src/lib/checks/media";
import {
  checkProfiles,
  type AuthoredArtistForCheck,
} from "../../src/lib/checks/profiles";
import type {
  Article,
  Artist,
  Clip,
  MediaAsset,
  MediaItem,
  Prediction,
  Ranking,
} from "../../src/lib/types";

const source = { name: "Source", url: "https://example.com/source", kind: "official" } as const;

function article(overrides: Partial<Article> = {}): Article {
  return {
    slug: "analysis-one",
    title: "A clear claim",
    dek: "Dek",
    status: "analysis",
    author: "MyKStars",
    date: "2026-07-16T00:00:00Z",
    body: ["Body"],
    related: {},
    ...overrides,
  };
}

test("article checker consumes typed records and catches semantic failures", () => {
  const valid = checkArticles({
    articles: [article()],
    artists: [{ slug: "artist" }],
    galleries: [{ slug: "gallery" }],
    nowIso: "2026-07-17T00:00:00Z",
  });
  assert.deepEqual(valid.issues, []);
  assert.equal(valid.recentAnalysisCount, 1);

  const invalid = checkArticles({
    articles: [
      article({
        title: "A question?",
        author: "Invented Reporter",
        date: "2026-07-20T00:00:00Z",
        related: { artistSlugs: ["missing"], gallerySlugs: ["also-missing"] },
      }),
      article(),
    ],
    artists: [],
    galleries: [],
    nowIso: "2026-07-17T00:00:00Z",
  });
  assert.deepEqual(
    new Set(invalid.issues.map((value) => value.kind)),
    new Set([
      "off-policy byline",
      "future-dated article",
      "question-mark title",
      "dangling related slug",
      "duplicate slug",
    ]),
  );
});

/** Runs a synthetic run through the checker and returns only the rule-15 details. */
function recycledPhrasing(bodies: string[][]): string[] {
  return checkArticles({
    articles: bodies.map((body, index) => article({ slug: `piece-${index}`, body })),
    artists: [],
    galleries: [],
    nowIso: "2026-07-17T00:00:00Z",
  })
    .issues.filter((value) => value.kind === "recycled phrasing")
    .map((value) => value.detail);
}

test("article checker fails a run that converges on one phrase", () => {
  // The real July 2026 failure: the verb varies, the noun phrase does not. A check keyed on
  // whole sentences would have called this three different paragraphs.
  const formulaic = recycledPhrasing([
    ["The strongest counterargument is simple."],
    ["The strongest counterargument concerns power."],
    ["The strongest counterargument sits in recognition timing."],
  ]);
  assert.equal(formulaic.length, 1);
  assert.match(formulaic[0], /"the strongest counterargument" does the same job in 3 articles/);
  assert.match(formulaic[0], /piece-0, piece-1, piece-2/);
  assert.match(formulaic[0], /rule 15/);

  // A formula opening on a content word still fires: a capital at a sentence start is not
  // a name, so the proper-noun guard must not go blind there.
  assert.equal(
    recycledPhrasing([
      ["Consider the objection here. It fails."],
      ["Consider the objection here. It fails too."],
      ["Consider the objection here. It fails again."],
    ]).length,
    1,
  );
});

test("article checker leaves mandated and unavoidable repetition alone", () => {
  // Playbook rule 4 forces named, dated attribution. Enforcing rule 15 against rule 4 would
  // make the two rules unsatisfiable together.
  assert.deepEqual(
    recycledPhrasing([
      ["*The Korea Times* reported on July 15, 2026, that the single arrived."],
      ["KOFIC reported on July 13, 2026, that the film reached the top."],
      ["*Billboard Japan* reported on July 6, 2026, that the EP opened high."],
    ]),
    [],
  );

  // Three closers sharing a quantifier share arithmetic, not a voice.
  assert.deepEqual(
    recycledPhrasing([
      ["It holds if at least two co-productions reach production."],
      ["It holds if at least two of the five films come from rivals."],
      ["It holds if at least two of three marks are met."],
    ]),
    [],
  );

  // Chart vocabulary a writer cannot paraphrase (DOMAIN_PHRASES).
  assert.deepEqual(
    recycledPhrasing([
      ["The EP took 44,000 album-equivalent units from on-demand streams."],
      ["The record took 228,000 album-equivalent units from on-demand streams."],
      ["The single took 12,000 album-equivalent units from on-demand streams."],
    ]),
    [],
  );

  // A mid-sentence capital is a name, a title or a ticker. The subject repeating is not a tic.
  assert.deepEqual(
    recycledPhrasing([
      ["Momentum built early on the Billboard 200 before fading."],
      ["Nothing else mattered except the Billboard 200 that quarter."],
      ["Retailers reprinted stock after the Billboard 200 climbed."],
    ]),
    [],
  );

  // Two pieces sharing a trigram is ordinary English; three is a formula.
  assert.deepEqual(
    recycledPhrasing([
      ["The strongest counterargument is simple."],
      ["The strongest counterargument concerns power."],
    ]),
    [],
  );

  // One article repeating itself is that article's problem. Rule 15 is about the run.
  assert.deepEqual(
    recycledPhrasing([
      [
        "The strongest counterargument is simple.",
        "The strongest counterargument concerns power.",
        "The strongest counterargument sits in timing.",
      ],
    ]),
    [],
  );
});

function clip(overrides: Partial<Clip> = {}): Clip {
  return {
    id: "clip-one",
    platform: "youtube",
    genre: "music",
    embedUrl: "https://www.youtube.com/watch?v=example",
    pillar: "k-pop",
    artistSlugs: ["artist"],
    date: "2026-01-18T00:00:00Z",
    caption: "Caption",
    credit: source,
    ...overrides,
  };
}

function embedded(date?: string): MediaItem {
  return {
    id: "embed-one",
    kind: "embed",
    platform: "youtube",
    embedUrl: "https://www.youtube.com/watch?v=example",
    alt: "Alt",
    credit: source,
    ...(date ? { date } : {}),
  };
}

test("freshness checker preserves exact clip and archival embed boundaries", () => {
  const nowIso = "2026-07-17T00:00:00Z";
  const atCutoff = checkFreshness({
    clips: [clip()],
    embeddedMedia: [{ file: "fixture.ts", owner: "fixture", media: embedded("2020-01-01") }],
    nowIso,
  });
  assert.deepEqual(atCutoff.issues, []);

  const outsideCutoff = checkFreshness({
    clips: [clip({ date: "2026-01-17T23:59:59.999Z" })],
    embeddedMedia: [{ file: "fixture.ts", owner: "fixture", media: embedded() }],
    nowIso,
  });
  assert.deepEqual(
    outsideCutoff.issues.map((value) => value.kind),
    ["stale clip", "missing date on embed"],
  );

  const evergreen = checkFreshness({
    clips: [clip({ date: "2020-01-01", evergreenUntil: "2026-07-17T00:00:00Z" })],
    embeddedMedia: [],
    nowIso,
  });
  assert.deepEqual(evergreen.issues, []);

  const future = checkFreshness({
    clips: [clip({ date: "2026-07-17T00:00:00.001Z" })],
    embeddedMedia: [],
    nowIso,
  });
  assert.deepEqual(future.issues.map((value) => value.kind), ["future-dated clip"]);
});

function artist(overrides: Partial<Artist> = {}): Artist {
  return {
    slug: "artist",
    name: "Artist",
    type: "individual",
    bio: "Bio",
    careerStage: "rising",
    coverageLevel: "active",
    publicationState: "draft",
    lastVerified: "2026-07-17",
    ...overrides,
  };
}

function predictionWithArtist(artistSlug: string): Prediction {
  return {
    slug: "prediction",
    pillar: "k-pop",
    category: "award",
    question: "Question",
    framing: "Framing",
    opensAt: "2026-01-01",
    closesAt: "2027-01-01",
    status: "open",
    options: [{ id: "yes", label: "Yes", artistSlug }],
    resolutionSourceLabel: "Source",
    resolutionSource: source,
    tallyVisibleThreshold: 1,
    asOf: "2026-07-17",
  };
}

function rankingWithArtist(artistSlug: string): Ranking {
  return {
    slug: "ranking",
    title: "Ranking",
    pillar: "k-pop",
    metricLabel: "Metric",
    period: "Period",
    asOf: "2026-07-17",
    source,
    rows: [{ rank: 1, name: "Artist", value: "1", artistSlug }],
  };
}

test("profile checker enforces heroes, relationships, verification, and preview isolation", () => {
  const preview = artist({
    slug: "preview-act",
    careerStage: "preview",
    publicationState: "published",
    members: ["missing-member"],
    lastVerified: "2025-01-01",
  });
  const result = checkProfiles({
    artists: [preview],
    authoredArtists: [preview as AuthoredArtistForCheck],
    mediaAssets: [],
    predictions: [predictionWithArtist(preview.slug)],
    rankings: [rankingWithArtist(preview.slug)],
    nowIso: "2026-07-17T00:00:00Z",
  });
  assert.deepEqual(
    new Set(result.issues.map((value) => value.kind)),
    new Set([
      "stale verification",
      "missing hero",
      "dangling member",
      "preview profile as forecast subject",
      "preview profile as ranking link",
    ]),
  );
});

function asset(overrides: Partial<MediaAsset> = {}): MediaAsset {
  return {
    id: "artist-2026-photo",
    credit: source,
    rightsBasis: "cc-by",
    acquisitionDate: "2026-07-16",
    reviewDate: "2027-07-16",
    width: 1200,
    height: 1800,
    checksum: "a".repeat(64),
    storagePath: "profiles/artist/2026/artist-2026-photo.jpg",
    ...overrides,
  };
}

test("media checker accepts the source URL default and a real override", () => {
  const image = {
    kind: "image",
    assetId: "artist-2026-photo",
    alt: "Artist portrait",
  } as const;
  const omitted = checkMedia({
    assets: [asset()],
    imageUses: [{ file: "fixture.ts", owner: "artist hero", image }],
    nowIso: "2026-07-17T00:00:00Z",
  });
  assert.deepEqual(omitted.issues, []);

  const override = checkMedia({
    assets: [asset({ sourceUrl: "https://example.com/acquisition" })],
    imageUses: [{ file: "fixture.ts", owner: "artist hero", image }],
    nowIso: "2026-07-17T00:00:00Z",
  });
  assert.deepEqual(override.issues, []);
});

test("media checker catches dangling, unused, invalid, and redundant records", () => {
  const invalid = checkMedia({
    assets: [
      asset({ sourceUrl: source.url, checksum: "bad" }),
      asset({
        id: "unused-asset",
        storagePath: "profiles/artist/2026/unused-asset.jpg",
      }),
    ],
    imageUses: [
      {
        file: "fixture.ts",
        owner: "missing image",
        image: { kind: "image", assetId: "missing", alt: "" },
      },
    ],
    nowIso: "2026-07-17T00:00:00Z",
  });
  assert.deepEqual(
    new Set(invalid.issues.map((value) => value.kind)),
    new Set([
      "invalid checksum",
      "redundant source URL",
      "dangling media asset",
      "missing image alt",
      "unused media asset",
    ]),
  );
});
