#!/usr/bin/env node
// Profile guard (see docs/roster-playbook.md): every profile in
// src/content/profiles.ts carries a unique slug; valid careerStage /
// coverageLevel / publicationState values; a lastVerified date that parses,
// sits on or before the site clock NOW, and is within the verification cadence
// for its coverage (a stale lastVerified is the sign a refresh skipped its
// web-verification pass); reciprocal memberOf/members links; and, for published
// profiles outside the legacy allowlist, a permitted hero under an allowed
// rights basis. Preview (pre-debut) profiles are capped, and never appear as
// Fan Forecast subjects or ranking-row links — activity-only coverage.
//
// Hand-rolled scanner in the house pattern (see check-articles.mjs): anchors on
// the exported arrays, walks object literals in code context, loud failures.
//
// Usage:  node scripts/check-profiles.mjs   (no arguments; fixed content layout)

import { existsSync, readFileSync } from "node:fs";
import { CODE, contextMap, lineAt, lineStarts } from "./source-scanner.mjs";
import { arrayRange, keyObject, keyString, keyStringList, topLevelObjects } from "./content-lexer.mjs";
import { loadNow } from "./content-files.mjs";

const PROFILES_FILE = "src/content/profiles.ts";
const PREDICTIONS_FILE = "src/content/predictions.ts";
const RANKINGS_FILE = "src/content/rankings.ts";
const MEDIA_ASSETS_FILE = "src/content/media-assets.ts"; // absent until permitted media lands

const CAREER_STAGES = new Set(["preview", "rookie", "rising", "established", "icon"]);
const COVERAGE_LEVELS = new Set(["active", "catalog"]);
const PUBLICATION_STATES = new Set(["draft", "published", "archived"]);

// Hero rights bases a profile may publish under (owner decision, 2026-07-13):
// openly licensed photography, agency press kits, or the official-embed fallback.
const ALLOWED_HERO_BASES = new Set([
  "cc-by",
  "cc-by-sa",
  "public-domain",
  "agency-press-kit",
  "official-embed",
]);

// Verification cadence in days, grace included: active profiles are re-verified
// with every monthly edition (one skipped month tolerated), preview profiles
// every 120 days (docs/roster-playbook.md pre-debut guardrail), catalog
// profiles every six months.
const VERIFY_MAX_DAYS = { active: 60, preview: 120, catalog: 190 };
const PREVIEW_CAP = 10;
const DAY_MS = 86_400_000;

// The original roster predates the permitted-hero requirement; these publish
// without one until permitted media lands. New profiles get no such pass.
const LEGACY_PROFILES = new Set([
  "newjeans", "blackpink", "iu", "stray-kids", "aespa", "cha-eunwoo", "twice",
  "lee-min-ho", "park-eun-bin", "kim-tae-ri", "park-chan-wook", "bong-joon-ho",
  "jung-hoyeon", "bts", "seventeen", "ive", "cortis", "hearts2hearts",
  "babymonster", "le-sserafim", "byeon-woo-seok",
]);

function loadArray(file, name) {
  const src = readFileSync(file, "utf8");
  const map = contextMap(src);
  const starts = lineStarts(src);
  const range = arrayRange(file, src, map, name);
  const { objects, malformedAt } = topLevelObjects(src, map, range.from, range.to);
  return { file, src, map, starts, objects, malformedAt };
}

const failures = [];
const fail = (file, starts, idx, kind, detail) =>
  failures.push({ file, line: lineAt(starts, idx), kind, detail });

const { ms: nowMs } = loadNow();

// --- media-asset rights registry (id -> rightsBasis), empty until it exists ---
const assetBases = new Map();
if (existsSync(MEDIA_ASSETS_FILE)) {
  const loaded = loadArray(MEDIA_ASSETS_FILE, "mediaAssets");
  if (loaded.malformedAt !== -1) {
    fail(loaded.file, loaded.starts, loaded.malformedAt, "malformed literal", "a media asset never closes");
  }
  for (const o of loaded.objects) {
    const id = keyString(loaded.src, loaded.map, o.open, o.close, "id");
    const basis = keyString(loaded.src, loaded.map, o.open, o.close, "rightsBasis");
    if (id && basis) assetBases.set(id.value, basis.value);
  }
}

// --- profiles ---
const { file, src, map, starts, objects, malformedAt } = loadArray(PROFILES_FILE, "artists");
if (malformedAt !== -1) fail(file, starts, malformedAt, "malformed profile literal", "a profile object never closes");

const seen = new Set();
const stageBySlug = new Map();
const membersBySlug = new Map();
const memberOfBySlug = new Map();
const stageCounts = new Map();
const coverageCounts = new Map();
let draftCount = 0;
let previewCount = 0;

for (const o of objects) {
  const slugField = keyString(src, map, o.open, o.close, "slug");
  const slug = slugField ? slugField.value : `profile at line ${lineAt(starts, o.open)}`;
  if (!slugField) {
    fail(file, starts, o.open, "malformed profile literal", "missing slug");
    continue;
  }
  if (seen.has(slug)) fail(file, starts, slugField.idx, "duplicate slug", `"${slug}" appears more than once (route collision)`);
  seen.add(slug);

  const stage = keyString(src, map, o.open, o.close, "careerStage");
  if (!stage) fail(file, starts, o.open, "missing careerStage", `${slug}: every profile carries a career stage`);
  else if (!CAREER_STAGES.has(stage.value)) fail(file, starts, stage.idx, "invalid careerStage", `${slug}: "${stage.value}"`);
  else {
    stageBySlug.set(slug, stage.value);
    stageCounts.set(stage.value, (stageCounts.get(stage.value) ?? 0) + 1);
    if (stage.value === "preview") previewCount++;
  }

  const coverage = keyString(src, map, o.open, o.close, "coverageLevel");
  if (!coverage) fail(file, starts, o.open, "missing coverageLevel", `${slug}: every profile carries a coverage level`);
  else if (!COVERAGE_LEVELS.has(coverage.value)) fail(file, starts, coverage.idx, "invalid coverageLevel", `${slug}: "${coverage.value}"`);
  else coverageCounts.set(coverage.value, (coverageCounts.get(coverage.value) ?? 0) + 1);

  const pub = keyString(src, map, o.open, o.close, "publicationState");
  if (!pub) fail(file, starts, o.open, "missing publicationState", `${slug}: every profile carries a publication state`);
  else if (!PUBLICATION_STATES.has(pub.value)) fail(file, starts, pub.idx, "invalid publicationState", `${slug}: "${pub.value}"`);
  else if (pub.value === "draft") draftCount++;

  const verified = keyString(src, map, o.open, o.close, "lastVerified");
  if (!verified) {
    fail(file, starts, o.open, "missing lastVerified", `${slug}: every profile carries its last verification date`);
  } else {
    const ms = Date.parse(verified.value);
    if (Number.isNaN(ms)) {
      fail(file, starts, verified.idx, "unparseable date", `${slug}: lastVerified "${verified.value}"`);
    } else if (ms - nowMs > DAY_MS) {
      fail(file, starts, verified.idx, "future-dated verification", `${slug}: lastVerified ${verified.value} sits after NOW`);
    } else if (stage && coverage) {
      const limit = stage.value === "preview" ? VERIFY_MAX_DAYS.preview : VERIFY_MAX_DAYS[coverage.value];
      const age = (nowMs - ms) / DAY_MS;
      if (limit && age > limit) {
        fail(
          file,
          starts,
          verified.idx,
          "stale verification",
          `${slug}: last verified ${Math.floor(age)} days ago (max ${limit} for ${stage.value === "preview" ? "preview" : coverage.value} profiles) — re-verify per docs/roster-playbook.md`,
        );
      }
    }
  }

  const memberOf = keyString(src, map, o.open, o.close, "memberOf");
  if (memberOf) memberOfBySlug.set(slug, { value: memberOf.value, idx: memberOf.idx });
  const members = keyStringList(src, map, o.open, o.close, "members");
  if (members === null) fail(file, starts, o.open, "malformed profile literal", `${slug}: members never closes`);
  else if (members.length > 0) membersBySlug.set(slug, { values: members, idx: o.open });

  // Hero requirement + rights basis (published profiles outside the allowlist).
  const hero = keyObject(src, map, o.open, o.close, "hero");
  if (hero === null) {
    fail(file, starts, o.open, "malformed profile literal", `${slug}: hero never closes`);
  } else if (pub && pub.value === "published" && !LEGACY_PROFILES.has(slug) && hero === undefined) {
    fail(
      file,
      starts,
      o.open,
      "missing hero",
      `${slug}: a newly published profile needs a permitted hero (or stays draft) — docs/roster-playbook.md`,
    );
  } else if (hero) {
    const kind = keyString(src, map, hero.open, hero.close, "kind");
    if (!kind) {
      fail(file, starts, hero.open, "malformed hero", `${slug}: hero has no kind`);
    } else if (kind.value === "placeholder") {
      fail(file, starts, kind.idx, "placeholder hero", `${slug}: a placeholder is never a permitted hero`);
    } else if (kind.value === "image") {
      const assetId = keyString(src, map, hero.open, hero.close, "assetId");
      if (!assetId) {
        fail(file, starts, hero.open, "unregistered hero image", `${slug}: an image hero needs an assetId in ${MEDIA_ASSETS_FILE}`);
      } else if (!assetBases.has(assetId.value)) {
        fail(file, starts, assetId.idx, "unregistered hero image", `${slug}: assetId "${assetId.value}" matches no media asset`);
      } else if (!ALLOWED_HERO_BASES.has(assetBases.get(assetId.value))) {
        fail(
          file,
          starts,
          assetId.idx,
          "disallowed hero basis",
          `${slug}: asset "${assetId.value}" has rightsBasis "${assetBases.get(assetId.value)}" (allowed: ${[...ALLOWED_HERO_BASES].join(", ")})`,
        );
      }
    }
    // kind "embed" is the official-embed basis — allowed by definition.
  }
}

// --- reciprocal relationships ---
for (const [slug, m] of memberOfBySlug) {
  if (!seen.has(m.value)) {
    fail(file, starts, m.idx, "dangling memberOf", `${slug}: memberOf "${m.value}" matches no profile`);
  } else if (!(membersBySlug.get(m.value)?.values ?? []).includes(slug)) {
    fail(file, starts, m.idx, "one-way relationship", `${slug}: memberOf "${m.value}", but that profile's members list does not name ${slug} back`);
  }
}
for (const [slug, m] of membersBySlug) {
  for (const member of m.values) {
    if (!seen.has(member)) {
      fail(file, starts, m.idx, "dangling member", `${slug}: members entry "${member}" matches no profile`);
    } else if (memberOfBySlug.get(member)?.value !== slug) {
      fail(file, starts, m.idx, "one-way relationship", `${slug}: lists member "${member}", but that profile's memberOf does not point back`);
    }
  }
}

// --- preview guardrails ---
if (previewCount > PREVIEW_CAP) {
  fail(file, starts, 0, "preview cap exceeded", `${previewCount} preview profiles (cap ${PREVIEW_CAP})`);
}

// Preview profiles never appear as forecast subjects or ranking-row links
// (activity-only coverage — the pre-debut guardrail).
function scanArtistSlugRefs(refFile, kind) {
  if (!existsSync(refFile)) return;
  const refSrc = readFileSync(refFile, "utf8");
  const refMap = contextMap(refSrc);
  const refStarts = lineStarts(refSrc);
  const re = /\bartistSlug\s*:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(refSrc)) !== null) {
    if (refMap[m.index] !== CODE) continue;
    if (stageBySlug.get(m[1]) === "preview") {
      fail(refFile, refStarts, m.index, kind, `"${m[1]}" is a preview (pre-debut) profile — activity-only coverage, docs/roster-playbook.md`);
    }
  }
}
scanArtistSlugRefs(PREDICTIONS_FILE, "preview profile as forecast subject");
scanArtistSlugRefs(RANKINGS_FILE, "preview profile as ranking link");

if (failures.length > 0) {
  for (const f of failures) console.error(`${f.file}:${f.line}  ${f.kind}  ${f.detail}`);
  console.error(
    `\n✖ Found ${failures.length} profile issue${failures.length > 1 ? "s" : ""}. ` +
      `Profiles carry valid stage/coverage/publication values, fresh verification ` +
      `dates, reciprocal relationships, and permitted heroes (see docs/roster-playbook.md).`,
  );
  process.exit(1);
}

const stageSummary = [...stageCounts.entries()].map(([k, v]) => `${v} ${k}`).join(", ");
const coverageSummary = [...coverageCounts.entries()].map(([k, v]) => `${v} ${k}`).join(", ");
console.log(
  `✓ Profiles OK (${PROFILES_FILE}: ${seen.size} profiles — ${stageSummary}; ${coverageSummary}; ${draftCount} draft).`,
);
