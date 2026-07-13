#!/usr/bin/env node
// Analysis-article guard (see docs/analysis-playbook.md): every article in
// src/content/articles.ts carries the byline "MyKStars" exactly (never an
// invented reporter), a date that parses and sits on or before the site clock
// NOW, a title that is not a question-mark headline (the Betteridge ban), a
// unique slug, and `related` slugs that resolve to a real artist or gallery
// (the article page silently drops unresolved slugs, so nothing else catches a
// typo there). It also warns, without failing, when fewer than 4 analysis
// pieces are dated within 45 days of NOW — under the edition model analysis is
// one format in the monthly mix (Pulse carries volume), so the per-run floor
// sits at 4, not the pre-edition 10.
//
// Like check-style.mjs and check-freshness.mjs, this is a hand-rolled scanner,
// not an AST parser: it anchors on the exported arrays in their content files,
// walks the top-level object literals in code context, and reads their fields.
// Anything it cannot parse is a loud failure, never a silent skip.
//
// Usage:  node scripts/check-articles.mjs   (no arguments; fixed content layout)

import { readFileSync } from "node:fs";
import { contextMap, lineAt, lineStarts } from "./source-scanner.mjs";
import { arrayRange, keyString, keyStringList, topLevelObjects } from "./content-lexer.mjs";
import { loadNow } from "./content-files.mjs";

const BYLINE = "MyKStars"; // docs/analysis-playbook.md rule 12: exactly this
const DAY_MS = 86_400_000;
const RUN_WINDOW_DAYS = 45; // proxy for "the latest publishing run"
const RUN_FLOOR = 4; // per-edition analysis floor (docs/analysis-playbook.md rule 13)

const PROFILES_FILE = "src/content/profiles.ts";
const GALLERIES_FILE = "src/content/galleries.ts";
const ARTICLES_FILE = "src/content/articles.ts";

// Load a content file and locate its exported array.
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

// --- NOW ---
const { ms: nowMs } = loadNow();

// --- slug allow-sets (from their own content files) ---
function slugSet(file, name) {
  const loaded = loadArray(file, name);
  if (loaded.malformedAt !== -1) {
    fail(file, loaded.starts, loaded.malformedAt, "malformed literal", `an object in ${name} never closes`);
  }
  const set = new Set();
  for (const o of loaded.objects) {
    const slug = keyString(loaded.src, loaded.map, o.open, o.close, "slug");
    if (slug) set.add(slug.value);
  }
  return set;
}
const artistSlugs = slugSet(PROFILES_FILE, "artists");
const gallerySlugs = slugSet(GALLERIES_FILE, "galleries");

// --- articles ---
const { file, src, map, starts, objects, malformedAt } = loadArray(ARTICLES_FILE, "articles");
if (malformedAt !== -1) fail(file, starts, malformedAt, "malformed article literal", "an article object never closes");

const seenSlugs = new Set();
let articleCount = 0;
let analysisCount = 0;
let recentAnalysis = 0;

for (const o of objects) {
  articleCount++;
  const slugField = keyString(src, map, o.open, o.close, "slug");
  const slug = slugField ? slugField.value : `article #${articleCount}`;
  if (!slugField) fail(file, starts, o.open, "malformed article literal", "missing slug");
  else if (seenSlugs.has(slug)) fail(file, starts, slugField.idx, "duplicate slug", `"${slug}" appears more than once (route collision)`);
  else seenSlugs.add(slug);

  const author = keyString(src, map, o.open, o.close, "author");
  if (!author) {
    fail(file, starts, o.open, "malformed article literal", `${slug}: missing author (byline)`);
  } else if (author.value !== BYLINE) {
    fail(
      file,
      starts,
      author.idx,
      "off-policy byline",
      `${slug}: "${author.value}" (the byline is always exactly "${BYLINE}"; docs/analysis-playbook.md rule 12)`,
    );
  }

  const status = keyString(src, map, o.open, o.close, "status");
  if (status && status.value === "analysis") analysisCount++;

  const date = keyString(src, map, o.open, o.close, "date");
  if (!date) {
    fail(file, starts, o.open, "missing article date", `${slug}: every article carries its real publish date`);
  } else {
    const dateMs = Date.parse(date.value);
    if (Number.isNaN(dateMs)) {
      fail(file, starts, date.idx, "unparseable date", `${slug}: "${date.value}"`);
    } else if (dateMs - nowMs > DAY_MS) {
      fail(file, starts, date.idx, "future-dated article", `${slug} is dated ${date.value}, after NOW — articles publish on or before the site clock`);
    } else if (status && status.value === "analysis" && nowMs - dateMs <= RUN_WINDOW_DAYS * DAY_MS) {
      recentAnalysis++;
    }
  }

  const title = keyString(src, map, o.open, o.close, "title");
  if (title && /\?\s*$/.test(title.value)) {
    fail(file, starts, title.idx, "question-mark title", `${slug}: "${title.value}" (the Betteridge ban; docs/analysis-playbook.md rule 11)`);
  }

  const relArtists = keyStringList(src, map, o.open, o.close, "artistSlugs");
  if (relArtists === null) fail(file, starts, o.open, "malformed article literal", `${slug}: artistSlugs never closes`);
  else for (const s of relArtists) {
    if (!artistSlugs.has(s)) fail(file, starts, o.open, "dangling related slug", `${slug}: artistSlugs "${s}" matches no artist (the article page drops it silently)`);
  }
  const relGalleries = keyStringList(src, map, o.open, o.close, "gallerySlugs");
  if (relGalleries === null) fail(file, starts, o.open, "malformed article literal", `${slug}: gallerySlugs never closes`);
  else for (const s of relGalleries) {
    if (!gallerySlugs.has(s)) fail(file, starts, o.open, "dangling related slug", `${slug}: gallerySlugs "${s}" matches no gallery (the article page drops it silently)`);
  }
}

if (recentAnalysis < RUN_FLOOR) {
  console.warn(
    `⚠ latest run looks light: ${recentAnalysis} analysis piece${recentAnalysis === 1 ? "" : "s"} dated within ` +
      `${RUN_WINDOW_DAYS} days of NOW (the per-edition floor is ${RUN_FLOOR}; docs/analysis-playbook.md rule 13).`,
  );
}

if (failures.length > 0) {
  for (const f of failures) console.error(`${f.file}:${f.line}  ${f.kind}  ${f.detail}`);
  console.error(
    `\n✖ Found ${failures.length} article issue${failures.length > 1 ? "s" : ""}. Analysis articles carry the ` +
      `"${BYLINE}" byline, real dates on or before NOW, assertive titles, and resolvable ` +
      `related slugs (see docs/analysis-playbook.md).`,
  );
  process.exit(1);
}
console.log(`✓ No article issues (${ARTICLES_FILE}: ${articleCount} articles, ${analysisCount} analysis).`);
