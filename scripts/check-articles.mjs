#!/usr/bin/env node
// Analysis-article guard (see docs/analysis-playbook.md): every article in the
// `articles` array carries the byline "MyKStars" exactly (never an invented
// reporter), a date that parses and sits on or before the site clock NOW, a
// title that is not a question-mark headline (the Betteridge ban), a unique
// slug, and `related` slugs that resolve to a real artist or gallery (the
// article page silently drops unresolved slugs, so nothing else catches a typo
// there). It also warns, without failing, when fewer than 10 analysis pieces
// are dated within 45 days of NOW — the sign a publishing run came in under
// the playbook floor.
//
// Like check-style.mjs and check-freshness.mjs, this is a hand-rolled scanner,
// not an AST parser: it anchors on `export const articles: Article[] = [`,
// walks the array's top-level object literals in code context, and reads their
// fields. Anything it cannot parse is a loud failure, never a silent skip.
//
// Usage:  node scripts/check-articles.mjs [file ...]   (defaults to src/lib/seed.ts)

import { readFileSync } from "node:fs";
import { CODE, contextMap, lineAt, lineStarts, parseNow } from "./source-scanner.mjs";

const BYLINE = "MyKStars"; // docs/analysis-playbook.md rule 12: exactly this
const DAY_MS = 86_400_000;
const RUN_WINDOW_DAYS = 45; // proxy for "the latest publishing run"
const RUN_FLOOR = 10; // playbook rule 13

// Find `export const <name>: <Type>[] = [` and return the content span of the
// array literal (exclusive of its brackets). A missing anchor is a hard fail.
function arrayRange(file, src, map, name) {
  const re = new RegExp(`export const ${name}\\s*:\\s*\\w+\\[\\]\\s*=\\s*\\[`);
  const m = re.exec(src);
  if (!m) {
    console.error(`${file}: cannot find \`export const ${name}: ...[] = [\` — nothing to check.`);
    process.exit(1);
  }
  const open = m.index + m[0].length - 1;
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (map[i] !== CODE) continue;
    const c = src[i];
    if (c === "[") depth++;
    else if (c === "]") {
      depth--;
      if (depth === 0) return { from: open + 1, to: i };
    }
  }
  console.error(`${file}: the ${name} array literal never closes.`);
  process.exit(1);
}

// Top-level `{ ... }` object literal spans within [from, to), code-context only.
function topLevelObjects(src, map, from, to) {
  const objects = [];
  for (let i = from; i < to; i++) {
    if (map[i] !== CODE || src[i] !== "{") continue;
    let depth = 0;
    let close = -1;
    for (let j = i; j < to; j++) {
      if (map[j] !== CODE) continue;
      if (src[j] === "{") depth++;
      else if (src[j] === "}") {
        depth--;
        if (depth === 0) {
          close = j;
          break;
        }
      }
    }
    if (close === -1) return { objects, malformedAt: i };
    objects.push({ open: i, close });
    i = close;
  }
  return { objects, malformedAt: -1 };
}

// Read the first `key: "..."` string value inside a span, code-context keys only
// (so prose inside body strings can never masquerade as a field).
function keyString(src, map, from, to, key) {
  const re = new RegExp(`\\b${key}\\s*:\\s*"`, "g");
  const slice = src.slice(from, to);
  let m;
  while ((m = re.exec(slice)) !== null) {
    const keyIdx = from + m.index;
    if (map[keyIdx] !== CODE) continue;
    const quote = from + m.index + m[0].length - 1;
    let j = quote + 1;
    let value = "";
    while (j < to) {
      if (src[j] === "\\") {
        value += src[j + 1] ?? "";
        j += 2;
        continue;
      }
      if (src[j] === '"') return { value, idx: keyIdx };
      value += src[j];
      j++;
    }
    return null; // unterminated — let the caller fail loudly
  }
  return null;
}

// Collect the string items of `key: [ "...", ... ]` inside a span, if present.
function keyStringList(src, map, from, to, key) {
  const re = new RegExp(`\\b${key}\\s*:\\s*\\[`, "g");
  const slice = src.slice(from, to);
  let m;
  while ((m = re.exec(slice)) !== null) {
    const keyIdx = from + m.index;
    if (map[keyIdx] !== CODE) continue;
    const open = from + m.index + m[0].length - 1;
    let depth = 0;
    let close = -1;
    for (let i = open; i < to; i++) {
      if (map[i] !== CODE) continue;
      if (src[i] === "[") depth++;
      else if (src[i] === "]") {
        depth--;
        if (depth === 0) {
          close = i;
          break;
        }
      }
    }
    if (close === -1) return null;
    const items = [];
    const listSlice = src.slice(open + 1, close);
    for (const s of listSlice.matchAll(/"((?:[^"\\]|\\.)*)"/g)) items.push(s[1]);
    return items;
  }
  return []; // key absent — nothing to check
}

function scanFile(file) {
  const src = readFileSync(file, "utf8");
  const map = contextMap(src);
  const starts = lineStarts(src);
  const failures = [];
  const warnings = [];
  const fail = (idx, kind, detail) =>
    failures.push({ line: lineAt(starts, idx), kind, detail });

  // --- NOW ---
  const { ms: nowMs } = parseNow(file, src);

  // --- slug allow-sets ---
  const slugSet = (name) => {
    const range = arrayRange(file, src, map, name);
    const { objects, malformedAt } = topLevelObjects(src, map, range.from, range.to);
    if (malformedAt !== -1) fail(malformedAt, "malformed literal", `an object in ${name} never closes`);
    const set = new Set();
    for (const o of objects) {
      const slug = keyString(src, map, o.open, o.close, "slug");
      if (slug) set.add(slug.value);
    }
    return set;
  };
  const artistSlugs = slugSet("artists");
  const gallerySlugs = slugSet("galleries");

  // --- articles ---
  const range = arrayRange(file, src, map, "articles");
  const { objects, malformedAt } = topLevelObjects(src, map, range.from, range.to);
  if (malformedAt !== -1) fail(malformedAt, "malformed article literal", "an article object never closes");

  const seenSlugs = new Set();
  let articleCount = 0;
  let analysisCount = 0;
  let recentAnalysis = 0;

  for (const o of objects) {
    articleCount++;
    const slugField = keyString(src, map, o.open, o.close, "slug");
    const slug = slugField ? slugField.value : `article #${articleCount}`;
    if (!slugField) fail(o.open, "malformed article literal", "missing slug");
    else if (seenSlugs.has(slug)) fail(slugField.idx, "duplicate slug", `"${slug}" appears more than once (route collision)`);
    else seenSlugs.add(slug);

    const author = keyString(src, map, o.open, o.close, "author");
    if (!author) {
      fail(o.open, "malformed article literal", `${slug}: missing author (byline)`);
    } else if (author.value !== BYLINE) {
      fail(
        author.idx,
        "off-policy byline",
        `${slug}: "${author.value}" (the byline is always exactly "${BYLINE}"; docs/analysis-playbook.md rule 12)`,
      );
    }

    const status = keyString(src, map, o.open, o.close, "status");
    if (status && status.value === "analysis") analysisCount++;

    const date = keyString(src, map, o.open, o.close, "date");
    if (!date) {
      fail(o.open, "missing article date", `${slug}: every article carries its real publish date`);
    } else {
      const dateMs = Date.parse(date.value);
      if (Number.isNaN(dateMs)) {
        fail(date.idx, "unparseable date", `${slug}: "${date.value}"`);
      } else if (dateMs - nowMs > DAY_MS) {
        fail(date.idx, "future-dated article", `${slug} is dated ${date.value}, after NOW — articles publish on or before the site clock`);
      } else if (status && status.value === "analysis" && nowMs - dateMs <= RUN_WINDOW_DAYS * DAY_MS) {
        recentAnalysis++;
      }
    }

    const title = keyString(src, map, o.open, o.close, "title");
    if (title && /\?\s*$/.test(title.value)) {
      fail(title.idx, "question-mark title", `${slug}: "${title.value}" (the Betteridge ban; docs/analysis-playbook.md rule 11)`);
    }

    const relArtists = keyStringList(src, map, o.open, o.close, "artistSlugs");
    if (relArtists === null) fail(o.open, "malformed article literal", `${slug}: artistSlugs never closes`);
    else for (const s of relArtists) {
      if (!artistSlugs.has(s)) fail(o.open, "dangling related slug", `${slug}: artistSlugs "${s}" matches no artist (the article page drops it silently)`);
    }
    const relGalleries = keyStringList(src, map, o.open, o.close, "gallerySlugs");
    if (relGalleries === null) fail(o.open, "malformed article literal", `${slug}: gallerySlugs never closes`);
    else for (const s of relGalleries) {
      if (!gallerySlugs.has(s)) fail(o.open, "dangling related slug", `${slug}: gallerySlugs "${s}" matches no gallery (the article page drops it silently)`);
    }
  }

  if (recentAnalysis < RUN_FLOOR) {
    warnings.push(
      `latest run looks light: ${recentAnalysis} analysis piece${recentAnalysis === 1 ? "" : "s"} dated within ` +
        `${RUN_WINDOW_DAYS} days of NOW (the playbook floor is ${RUN_FLOOR} per publishing run; docs/analysis-playbook.md rule 13).`,
    );
  }

  return { failures, warnings, articleCount, analysisCount };
}

const targets = process.argv.slice(2);
const files = targets.length ? targets : ["src/lib/seed.ts"];

let total = 0;
const allWarnings = [];
const counts = [];
for (const file of files) {
  const { failures, warnings, articleCount, analysisCount } = scanFile(file);
  counts.push(`${articleCount} articles, ${analysisCount} analysis`);
  allWarnings.push(...warnings);
  for (const f of failures) {
    total++;
    console.error(`${file}:${f.line}  ${f.kind}  ${f.detail}`);
  }
}

for (const w of allWarnings) console.warn(`⚠ ${w}`);

if (total > 0) {
  console.error(
    `\n✖ Found ${total} article issue${total > 1 ? "s" : ""}. Analysis articles carry the ` +
      `"${BYLINE}" byline, real dates on or before NOW, assertive titles, and resolvable ` +
      `related slugs (see docs/analysis-playbook.md).`,
  );
  process.exit(1);
}
console.log(`✓ No article issues (${files.join(", ")}: ${counts.join("; ")}).`);
