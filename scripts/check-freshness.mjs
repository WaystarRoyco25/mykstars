#!/usr/bin/env node
// Embed-freshness guard (see docs/roster-playbook.md): the site clock NOW lives
// in src/content/now.ts. Clips (the yt()/tv() factories, YouTube) carry a hard
// freshness obligation: at most 180 days old, unless a dated, still-future
// evergreenUntil exemption applies. Gallery- and Pulse-embedded media
// (kind: "embed") is archival: not age-gated, but its date must exist, parse, and
// not sit in the future. A post dated after NOW is the fabricated-date failure
// mode this guard exists to catch.
//
// Like check-style.mjs, this is a hand-rolled scanner, not an AST parser: the
// clip factories yt()/tv() take positional string arguments whose order is
// already enforced by TypeScript (tsc --noEmit), so the scanner only needs to
// find the calls, split their top-level arguments, and read the date slots.
// A call it cannot parse is a loud failure, never a silent skip. Known
// limitation: a new clip factory (e.g. TikTok) needs a matching entry in
// FACTORIES below.
//
// Usage:  node scripts/check-freshness.mjs [file ...]   (defaults to src/content/*.ts)

import { readFileSync } from "node:fs";
import { CODE, contextMap, lineAt, lineStarts } from "./source-scanner.mjs";
import { contentFiles, loadNow } from "./content-files.mjs";

const MAX_AGE_DAYS = 180; // clips only (yt/tv factories, YouTube); gallery/Pulse/IG embeds are archival
const NOW_DRIFT_WARN_DAYS = 14;
const DAY_MS = 86_400_000;

// factory name -> { dateArg (0-based), arity, evergreenArg }
const FACTORIES = {
  yt: { dateArg: 3, arity: 6, evergreenArg: 6 },
  tv: { dateArg: 4, arity: 7, evergreenArg: 7 },
};
const FACTORY_NAMES = Object.keys(FACTORIES).join("|");

// Split the text of an argument list on top-level commas (paren/bracket/brace
// depth 0, and never inside a string per the context map).
function splitArgs(src, map, from, to) {
  const args = [];
  let depth = 0;
  let start = from;
  for (let i = from; i < to; i++) {
    if (map[i] !== CODE) continue;
    const c = src[i];
    if (c === "(" || c === "[" || c === "{") depth++;
    else if (c === ")" || c === "]" || c === "}") depth--;
    else if (c === "," && depth === 0) {
      args.push(src.slice(start, i).trim());
      start = i + 1;
    }
  }
  const last = src.slice(start, to).trim();
  if (last.length > 0) args.push(last); // tolerate a trailing comma
  return args;
}

function unquote(arg) {
  const m = /^["']([^]*)["']$/.exec(arg);
  return m ? m[1] : null;
}

function scanFile(file, nowMs) {
  const src = readFileSync(file, "utf8");
  const map = contextMap(src);
  const starts = lineStarts(src);
  const failures = [];
  const fail = (idx, kind, detail) =>
    failures.push({ line: lineAt(starts, idx), kind, detail });

  const ageDays = (iso) => (nowMs - Date.parse(iso)) / DAY_MS;

  // --- clip factory calls ---
  let clipCount = 0;
  const callRe = new RegExp(`\\b(${FACTORY_NAMES})\\(`, "g");
  let m;
  while ((m = callRe.exec(src)) !== null) {
    const nameIdx = m.index;
    if (map[nameIdx] !== CODE) continue; // in a comment or string
    if (/function\s+$/.test(src.slice(Math.max(0, nameIdx - 12), nameIdx))) continue; // the definition
    const spec = FACTORIES[m[1]];
    const openIdx = nameIdx + m[1].length;

    // Walk to the matching close paren (code-context parens only).
    let depth = 0;
    let closeIdx = -1;
    for (let i = openIdx; i < src.length; i++) {
      if (map[i] !== CODE) continue;
      if (src[i] === "(") depth++;
      else if (src[i] === ")") {
        depth--;
        if (depth === 0) {
          closeIdx = i;
          break;
        }
      }
    }
    if (closeIdx === -1) {
      fail(nameIdx, "malformed factory call", `${m[1]}( never closes`);
      continue;
    }

    const args = splitArgs(src, map, openIdx + 1, closeIdx);
    if (args.length < spec.arity || args.length > spec.arity + 1) {
      fail(nameIdx, "malformed factory call", `${m[1]}() has ${args.length} args, expected ${spec.arity}(+1)`);
      continue;
    }
    clipCount++;
    const id = unquote(args[0]) ?? `${m[1]}() at this line`;
    const date = unquote(args[spec.dateArg]);
    if (date === null) {
      fail(nameIdx, "malformed factory call", `${id}: date argument is not a plain string literal`);
      continue;
    }
    if (Number.isNaN(Date.parse(date))) {
      fail(nameIdx, "unparseable date", `${id}: "${date}"`);
      continue;
    }
    const age = ageDays(date);
    if (age < -1) {
      fail(nameIdx, "future-dated clip", `${id} is dated ${date}, after NOW — a true publish date can never be in the site's future`);
      continue;
    }
    const evergreen = args.length > spec.arity ? unquote(args[spec.evergreenArg]) : null;
    if (args.length > spec.arity && evergreen === null) {
      fail(nameIdx, "malformed factory call", `${id}: evergreenUntil is not a plain string literal`);
      continue;
    }
    if (evergreen !== null) {
      const evMs = Date.parse(evergreen);
      if (Number.isNaN(evMs)) {
        fail(nameIdx, "bad evergreenUntil", `${id}: "${evergreen}" does not parse`);
        continue;
      }
      if (evMs >= nowMs) continue; // valid, still-future exemption
      // expired exemptions fall through to the normal age gate
    }
    if (age > MAX_AGE_DAYS) {
      fail(
        nameIdx,
        "stale clip",
        `${id} is ${Math.floor(age)} days old (max ${MAX_AGE_DAYS}${evergreen ? "; evergreenUntil expired" : ""})`,
      );
    }
  }

  // --- gallery-embedded media (kind: "embed" object literals) ---
  let embedCount = 0;
  const embedRe = /kind\s*:\s*"embed"/g;
  while ((m = embedRe.exec(src)) !== null) {
    const kindIdx = m.index;
    if (map[kindIdx] !== CODE) continue;
    // Walk back to the object literal's opening brace...
    let depth = 0;
    let open = -1;
    for (let i = kindIdx; i >= 0; i--) {
      if (map[i] !== CODE) continue;
      if (src[i] === "}") depth++;
      else if (src[i] === "{") {
        if (depth === 0) {
          open = i;
          break;
        }
        depth--;
      }
    }
    // ...and forward to its close, then inspect the literal's text.
    let close = -1;
    depth = 0;
    for (let i = open; i < src.length; i++) {
      if (map[i] !== CODE) continue;
      if (src[i] === "{") depth++;
      else if (src[i] === "}") {
        depth--;
        if (depth === 0) {
          close = i;
          break;
        }
      }
    }
    if (open === -1 || close === -1) {
      fail(kindIdx, "malformed embed literal", "cannot find the enclosing object literal");
      continue;
    }
    const literal = src.slice(open, close + 1);
    // Source objects also carry kind: "embed" (the SourceKind — YT_CHANNEL consts,
    // inline credit objects). A real embedded MediaItem always has an embedUrl;
    // a Source never does. Only the former carries a freshness obligation.
    if (!/embedUrl\s*:/.test(literal)) continue;
    embedCount++;
    const idMatch = /id\s*:\s*"([^"]+)"/.exec(literal);
    const id = idMatch ? idMatch[1] : "embed at this line";
    const dateMatch = /date\s*:\s*"([^"]+)"/.exec(literal);
    if (!dateMatch) {
      fail(kindIdx, "missing date on embed", `${id}: every kind: "embed" media item needs its post's true publish date`);
      continue;
    }
    if (Number.isNaN(Date.parse(dateMatch[1]))) {
      fail(kindIdx, "unparseable date", `${id}: "${dateMatch[1]}"`);
      continue;
    }
    if (ageDays(dateMatch[1]) < -1) {
      fail(kindIdx, "future-dated embed", `${id} is dated ${dateMatch[1]}, after NOW — a true publish date can never be in the site's future`);
    }
  }

  return { failures, clipCount, embedCount };
}

// --- NOW (single canonical location; drift warned once, not per file) ---
const { iso: nowIso, ms: nowMs } = loadNow();
const driftDays = Math.abs(Date.now() - nowMs) / DAY_MS;
if (driftDays > NOW_DRIFT_WARN_DAYS) {
  console.warn(
    `⚠ NOW (${nowIso}) is ${Math.round(driftDays)} days from the real clock — ` +
      `run the NOW-bump ritual (docs/roster-playbook.md) with this refresh.`,
  );
}

const targets = process.argv.slice(2);
const files = targets.length ? targets : contentFiles();

let total = 0;
let clipTotal = 0;
let embedTotal = 0;
for (const file of files) {
  const { failures, clipCount, embedCount } = scanFile(file, nowMs);
  clipTotal += clipCount;
  embedTotal += embedCount;
  for (const f of failures) {
    total++;
    console.error(`${file}:${f.line}  ${f.kind}  ${f.detail}`);
  }
}

if (total > 0) {
  console.error(
    `\n✖ Found ${total} freshness issue${total > 1 ? "s" : ""}. ` +
      `Clips may be at most ${MAX_AGE_DAYS} days old vs NOW; replace with real, ` +
      `currently-verified official posts (see docs/roster-playbook.md).`,
  );
  process.exit(1);
}
console.log(
  `✓ No stale or undated embeds (${files.length} content files: ${clipTotal} clips, ${embedTotal} gallery embeds).`,
);
