#!/usr/bin/env node
// Embed-freshness guard (see docs/roster-playbook.md): MyKStars social embeds
// carry a freshness obligation measured against the site clock NOW in
// src/lib/seed.ts — Instagram/X feed clips must be at most 90 days old and
// YouTube clips at most 180, unless a clip carries a dated, still-future
// evergreenUntil exemption. Gallery-embedded media (kind: "embed") is archival,
// so it is not age-gated, but its date must exist, parse, and not sit in the
// future — a post dated after NOW is the fabricated-date failure mode this
// guard exists to catch.
//
// Like check-dashes.mjs, this is a hand-rolled scanner, not an AST parser: the
// clip factories yt()/ig()/x() take positional string arguments whose order is
// already enforced by TypeScript (tsc --noEmit), so the scanner only needs to
// find the calls, split their top-level arguments, and read the date slots.
// A call it cannot parse is a loud failure, never a silent skip. Known
// limitation: a new clip factory (e.g. TikTok) needs a matching entry in
// FACTORIES below.
//
// Usage:  node scripts/check-freshness.mjs [file ...]   (defaults to src/lib/seed.ts)

import { readFileSync } from "node:fs";

const FEED_MAX_AGE_DAYS = 90; // instagram + x
const YOUTUBE_MAX_AGE_DAYS = 180;
const NOW_DRIFT_WARN_DAYS = 14;
const DAY_MS = 86_400_000;

// factory name -> { platform, dateArg (0-based), arity, evergreenArg }
const FACTORIES = {
  yt: { platform: "youtube", dateArg: 3, arity: 6, evergreenArg: 6 },
  ig: { platform: "instagram", dateArg: 4, arity: 8, evergreenArg: 8 },
  x: { platform: "x", dateArg: 4, arity: 8, evergreenArg: 8 },
};

const CODE = 0;
const COMMENT = 1;
const STRING = 2;

// One pass over the source classifying every index as code / comment / string,
// with the same string- and template-expression awareness as check-dashes.mjs.
function contextMap(src) {
  const map = new Uint8Array(src.length);
  let ctx = "code";
  let inTmplExpr = false;
  let braceDepth = 0;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    const next = src[i + 1];
    if (ctx === "line") {
      map[i] = COMMENT;
      if (c === "\n") ctx = "code";
      continue;
    }
    if (ctx === "block") {
      map[i] = COMMENT;
      if (c === "*" && next === "/") {
        map[i + 1] = COMMENT;
        i++;
        ctx = "code";
      }
      continue;
    }
    if (ctx === "sq" || ctx === "dq" || ctx === "tmpl") {
      map[i] = STRING;
      if (c === "\\") {
        if (i + 1 < src.length) map[i + 1] = STRING;
        i++;
        continue;
      }
      if (ctx === "sq" && c === "'") ctx = "code";
      else if (ctx === "dq" && c === '"') ctx = "code";
      else if (ctx === "tmpl") {
        if (c === "`") ctx = "code";
        else if (c === "$" && next === "{") {
          map[i + 1] = CODE;
          i++;
          ctx = "code";
          inTmplExpr = true;
          braceDepth = 1;
        }
      }
      continue;
    }
    // ctx === "code"
    map[i] = CODE;
    if (c === "/" && next === "/") {
      map[i] = COMMENT;
      ctx = "line";
      continue;
    }
    if (c === "/" && next === "*") {
      map[i] = COMMENT;
      ctx = "block";
      continue;
    }
    if (c === "'") {
      map[i] = STRING;
      ctx = "sq";
      continue;
    }
    if (c === '"') {
      map[i] = STRING;
      ctx = "dq";
      continue;
    }
    if (c === "`") {
      map[i] = STRING;
      ctx = "tmpl";
      continue;
    }
    if (inTmplExpr) {
      if (c === "{") braceDepth++;
      else if (c === "}") {
        braceDepth--;
        if (braceDepth === 0) {
          inTmplExpr = false;
          map[i] = STRING;
          ctx = "tmpl";
        }
      }
    }
  }
  return map;
}

function lineStarts(src) {
  const starts = [0];
  for (let i = 0; i < src.length; i++) if (src[i] === "\n") starts.push(i + 1);
  return starts;
}

function lineAt(starts, idx) {
  let lo = 0;
  let hi = starts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (starts[mid] <= idx) lo = mid;
    else hi = mid - 1;
  }
  return lo + 1;
}

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

function scanFile(file) {
  const src = readFileSync(file, "utf8");
  const map = contextMap(src);
  const starts = lineStarts(src);
  const failures = [];
  const warnings = [];
  const fail = (idx, kind, detail) =>
    failures.push({ line: lineAt(starts, idx), kind, detail });

  // --- NOW ---
  const nowMatch = /export const NOW = "([^"]+)"/.exec(src);
  if (!nowMatch) {
    console.error(`${file}: cannot find \`export const NOW = "..."\` — nothing to check against.`);
    process.exit(1);
  }
  const nowMs = Date.parse(nowMatch[1]);
  if (Number.isNaN(nowMs)) {
    console.error(`${file}: NOW ("${nowMatch[1]}") does not parse as a date.`);
    process.exit(1);
  }
  const driftDays = Math.abs(Date.now() - nowMs) / DAY_MS;
  if (driftDays > NOW_DRIFT_WARN_DAYS) {
    warnings.push(
      `NOW (${nowMatch[1]}) is ${Math.round(driftDays)} days from the real clock — ` +
        `run the NOW-bump ritual (docs/roster-playbook.md) with this refresh.`,
    );
  }

  const ageDays = (iso) => (nowMs - Date.parse(iso)) / DAY_MS;

  // --- clip factory calls ---
  let clipCount = 0;
  const callRe = /\b(yt|ig|x)\(/g;
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
    const limit = spec.platform === "youtube" ? YOUTUBE_MAX_AGE_DAYS : FEED_MAX_AGE_DAYS;
    if (age > limit) {
      const kind = spec.platform === "youtube" ? "stale youtube clip" : `stale feed clip (${spec.platform})`;
      fail(
        nameIdx,
        kind,
        `${id} is ${Math.floor(age)} days old (max ${limit}${evergreen ? "; evergreenUntil expired" : ""})`,
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

  return { failures, warnings, clipCount, embedCount };
}

const targets = process.argv.slice(2);
const files = targets.length ? targets : ["src/lib/seed.ts"];

let total = 0;
const allWarnings = [];
const counts = [];
for (const file of files) {
  const { failures, warnings, clipCount, embedCount } = scanFile(file);
  counts.push(`${clipCount} clips, ${embedCount} gallery embeds`);
  allWarnings.push(...warnings);
  for (const f of failures) {
    total++;
    console.error(`${file}:${f.line}  ${f.kind}  ${f.detail}`);
  }
}

for (const w of allWarnings) console.warn(`⚠ ${w}`);

if (total > 0) {
  console.error(
    `\n✖ Found ${total} freshness issue${total > 1 ? "s" : ""}. ` +
      `Feed embeds (Instagram/X) may be at most ${FEED_MAX_AGE_DAYS} days old and YouTube ` +
      `clips ${YOUTUBE_MAX_AGE_DAYS} vs NOW; replace with real, currently-verified official ` +
      `posts (see docs/roster-playbook.md).`,
  );
  process.exit(1);
}
console.log(`✓ No stale or undated embeds (${files.join(", ")}: ${counts.join("; ")}).`);
