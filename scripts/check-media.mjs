#!/usr/bin/env node
// Permitted-media guard (WAVE-1B-PROMPT.md section 4a). Stored images use a
// deliberately narrow authoring grammar: top-level object literals in the
// mediaAssets array and inline MediaItem object literals in content. Direct,
// unique, plain-literal fields keep this dependency-free checker honest. Any
// unsupported factory, spread, computed value, nested substitute or duplicate
// field fails loudly instead of disappearing from the scan.

import { readFileSync } from "node:fs";
import { CODE, contextMap, lineAt, lineStarts } from "./source-scanner.mjs";
import { arrayRange } from "./content-lexer.mjs";
import { contentFiles, loadNow } from "./content-files.mjs";

const MEDIA_ASSETS_FILE = "src/content/media-assets.ts";
const COMMENT = 1;
const STORED_IMAGE_BASES = new Set([
  "cc-by",
  "cc-by-sa",
  "public-domain",
  "agency-press-kit",
]);
const SHA256_RE = /^[0-9a-f]{64}$/i;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const YEAR_RE = /^\d{4}$/;
const EXT_RE = /^[a-z0-9]+$/i;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

const failures = [];
const fail = (file, starts, idx, kind, detail) =>
  failures.push({ file, line: lineAt(starts, Math.max(0, idx)), kind, detail });

function meaningfulText(src, map, from, to) {
  let out = "";
  for (let index = from; index < to; index++) {
    out += map[index] === COMMENT ? " " : src[index];
  }
  return out.trim();
}

// Split an array span into top-level entries. Strings and comments come from
// contextMap; braces, brackets and calls are balanced in code context.
function topLevelEntries(src, map, from, to) {
  const entries = [];
  let depth = 0;
  let start = from;
  for (let index = from; index < to; index++) {
    if (map[index] !== CODE) continue;
    const char = src[index];
    if (char === "{" || char === "[" || char === "(") depth++;
    else if (char === "}" || char === "]" || char === ")") depth--;
    else if (char === "," && depth === 0) {
      if (meaningfulText(src, map, start, index)) entries.push({ from: start, to: index });
      start = index + 1;
    }
  }
  if (meaningfulText(src, map, start, to)) entries.push({ from: start, to });
  return entries;
}

function codeBounds(src, map, from, to) {
  let first = -1;
  let last = -1;
  for (let index = from; index < to; index++) {
    if (map[index] !== CODE || /\s/.test(src[index])) continue;
    if (first === -1) first = index;
    last = index;
  }
  return first === -1 ? null : { first, last };
}

function matchingObjectClose(src, map, open, limit) {
  let depth = 0;
  for (let index = open; index < limit; index++) {
    if (map[index] !== CODE) continue;
    if (src[index] === "{") depth++;
    else if (src[index] === "}") {
      depth--;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function nextSignificantCode(src, map, from, to) {
  for (let index = from; index < to; index++) {
    if (map[index] === COMMENT) continue;
    if (map[index] === CODE && /\s/.test(src[index])) continue;
    return index;
  }
  return -1;
}

// Parse direct object properties only. The content grammar uses identifier
// keys and colon values; shorthand, spreads and computed/quoted keys are
// intentionally rejected so nested fields can never satisfy an outer record.
function directProperties(file, src, map, starts, open, close) {
  const properties = new Map();
  let cursor = open + 1;
  while (cursor < close) {
    const keyStart = nextSignificantCode(src, map, cursor, close);
    if (keyStart === -1) break;
    if (src[keyStart] === ",") {
      cursor = keyStart + 1;
      continue;
    }
    const keyMatch = /^[A-Za-z_$][\w$]*/.exec(src.slice(keyStart, close));
    if (!keyMatch || map[keyStart] !== CODE) {
      fail(file, starts, keyStart, "unsupported object syntax", "expected a direct identifier property; spreads, shorthand and quoted or computed keys are not allowed");
      break;
    }
    const key = keyMatch[0];
    const colon = nextSignificantCode(src, map, keyStart + key.length, close);
    if (colon === -1 || src[colon] !== ":") {
      fail(file, starts, keyStart, "unsupported object syntax", `${key} must use an explicit colon value`);
      break;
    }
    const valueStart = nextSignificantCode(src, map, colon + 1, close);
    if (valueStart === -1) {
      fail(file, starts, colon, "missing property value", `${key} has no value`);
      break;
    }

    let braces = 0;
    let brackets = 0;
    let parens = 0;
    let end = close;
    for (let index = valueStart; index < close; index++) {
      if (map[index] !== CODE) continue;
      const char = src[index];
      if (char === "{") braces++;
      else if (char === "}") braces--;
      else if (char === "[") brackets++;
      else if (char === "]") brackets--;
      else if (char === "(") parens++;
      else if (char === ")") parens--;
      else if (char === "," && braces === 0 && brackets === 0 && parens === 0) {
        end = index;
        break;
      }
    }
    const field = { key, idx: keyStart, value: meaningfulText(src, map, valueStart, end) };
    const list = properties.get(key) ?? [];
    list.push(field);
    properties.set(key, list);
    cursor = end < close ? end + 1 : close;
  }

  for (const [key, fields] of properties) {
    if (fields.length > 1) {
      fail(file, starts, fields[1].idx, "duplicate property", `${key} appears ${fields.length} times; the runtime value would be ambiguous`);
    }
  }
  return properties;
}

function oneField(file, starts, properties, key, label) {
  const fields = properties.get(key) ?? [];
  if (fields.length === 0) {
    fail(file, starts, 0, `missing ${key}`, `${label}: every media asset needs ${key}`);
    return null;
  }
  return fields[0];
}

function plainString(file, starts, field, label) {
  if (!field) return null;
  const match = /^"([^"\\]*)"$/.exec(field.value);
  if (!match) {
    fail(file, starts, field.idx, "nonliteral string", `${label}: ${field.key} must be a plain double-quoted string without escapes`);
    return null;
  }
  return match[1];
}

function positiveInteger(file, starts, field, label) {
  if (!field) return null;
  if (!/^[1-9]\d*$/.test(field.value)) {
    fail(file, starts, field.idx, `invalid ${field.key}`, `${label}: ${field.key} must be a positive integer literal`);
    return null;
  }
  const value = Number(field.value);
  if (!Number.isSafeInteger(value)) {
    fail(file, starts, field.idx, `invalid ${field.key}`, `${label}: ${field.key} exceeds the safe integer range`);
    return null;
  }
  return value;
}

function parseDateOnly(value) {
  const match = DATE_RE.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) return null;
  return value;
}

function storagePathMatches(path, id) {
  if (!id) return false;
  const parts = path.split("/");
  const filenameMatches = (filename) => {
    const prefix = `${id}.`;
    return filename.startsWith(prefix) && EXT_RE.test(filename.slice(prefix.length));
  };
  if (parts[0] === "profiles") {
    return parts.length === 4 && SLUG_RE.test(parts[1]) && YEAR_RE.test(parts[2]) && filenameMatches(parts[3]);
  }
  if (parts[0] === "galleries") {
    return parts.length === 3 && SLUG_RE.test(parts[1]) && filenameMatches(parts[2]);
  }
  return false;
}

function enclosingObject(src, map, index) {
  let depth = 0;
  let open = -1;
  for (let cursor = index; cursor >= 0; cursor--) {
    if (map[cursor] !== CODE) continue;
    if (src[cursor] === "}") depth++;
    else if (src[cursor] === "{") {
      if (depth === 0) {
        open = cursor;
        break;
      }
      depth--;
    }
  }
  if (open === -1) return null;
  const close = matchingObjectClose(src, map, open, src.length);
  return close === -1 ? null : { open, close };
}

const { iso: nowIso } = loadNow();
const nowDate = nowIso.slice(0, 10);
if (!parseDateOnly(nowDate)) {
  console.error(`src/content/now.ts: NOW does not begin with a valid ISO calendar date: ${nowIso}`);
  process.exit(1);
}

const registrySrc = readFileSync(MEDIA_ASSETS_FILE, "utf8");
const registryMap = contextMap(registrySrc);
const registryStarts = lineStarts(registrySrc);
const registryRange = arrayRange(MEDIA_ASSETS_FILE, registrySrc, registryMap, "mediaAssets");
const registryEntries = topLevelEntries(registrySrc, registryMap, registryRange.from, registryRange.to);
const assetIds = new Set();

for (const entry of registryEntries) {
  const bounds = codeBounds(registrySrc, registryMap, entry.from, entry.to);
  if (!bounds || registrySrc[bounds.first] !== "{") {
    fail(MEDIA_ASSETS_FILE, registryStarts, bounds?.first ?? entry.from, "unsupported media asset entry", "mediaAssets entries must be top-level object literals; factory calls are not silently skipped");
    continue;
  }
  const close = matchingObjectClose(registrySrc, registryMap, bounds.first, entry.to);
  if (close === -1 || close !== bounds.last) {
    fail(MEDIA_ASSETS_FILE, registryStarts, bounds.first, "malformed media asset", "the top-level asset object does not close cleanly");
    continue;
  }
  const properties = directProperties(MEDIA_ASSETS_FILE, registrySrc, registryMap, registryStarts, bounds.first, close);
  const id = plainString(
    MEDIA_ASSETS_FILE,
    registryStarts,
    oneField(MEDIA_ASSETS_FILE, registryStarts, properties, "id", "media asset"),
    "media asset",
  );
  const label = id ? `asset ${id}` : `asset at line ${lineAt(registryStarts, bounds.first)}`;
  if (id !== null) {
    if (!id) fail(MEDIA_ASSETS_FILE, registryStarts, bounds.first, "empty asset id", `${label}: id cannot be empty`);
    else if (!SLUG_RE.test(id)) fail(MEDIA_ASSETS_FILE, registryStarts, bounds.first, "invalid asset id", `${label}: id must be a lowercase kebab-case token`);
    else if (assetIds.has(id)) fail(MEDIA_ASSETS_FILE, registryStarts, bounds.first, "duplicate asset id", `${label}: id appears more than once`);
    else assetIds.add(id);
  }

  const basis = plainString(MEDIA_ASSETS_FILE, registryStarts, oneField(MEDIA_ASSETS_FILE, registryStarts, properties, "rightsBasis", label), label);
  if (basis !== null && !STORED_IMAGE_BASES.has(basis)) {
    fail(MEDIA_ASSETS_FILE, registryStarts, properties.get("rightsBasis")?.[0]?.idx ?? bounds.first, "disallowed stored-image basis", `${label}: "${basis}" cannot back a stored image; use cc-by, cc-by-sa, public-domain or agency-press-kit`);
  }

  const acquired = plainString(MEDIA_ASSETS_FILE, registryStarts, oneField(MEDIA_ASSETS_FILE, registryStarts, properties, "acquisitionDate", label), label);
  if (acquired !== null) {
    if (!parseDateOnly(acquired)) fail(MEDIA_ASSETS_FILE, registryStarts, properties.get("acquisitionDate")[0].idx, "invalid acquisition date", `${label}: acquisitionDate must be a real YYYY-MM-DD calendar date`);
    else if (acquired > nowDate) fail(MEDIA_ASSETS_FILE, registryStarts, properties.get("acquisitionDate")[0].idx, "future acquisition date", `${label}: ${acquired} sits after NOW ${nowDate}`);
  }

  const review = plainString(MEDIA_ASSETS_FILE, registryStarts, oneField(MEDIA_ASSETS_FILE, registryStarts, properties, "reviewDate", label), label);
  if (review !== null) {
    if (!parseDateOnly(review)) fail(MEDIA_ASSETS_FILE, registryStarts, properties.get("reviewDate")[0].idx, "invalid review date", `${label}: reviewDate must be a real YYYY-MM-DD calendar date`);
    else if (review < nowDate) fail(MEDIA_ASSETS_FILE, registryStarts, properties.get("reviewDate")[0].idx, "overdue rights review", `${label}: reviewDate ${review} is before NOW ${nowDate}`);
  }

  positiveInteger(MEDIA_ASSETS_FILE, registryStarts, oneField(MEDIA_ASSETS_FILE, registryStarts, properties, "width", label), label);
  positiveInteger(MEDIA_ASSETS_FILE, registryStarts, oneField(MEDIA_ASSETS_FILE, registryStarts, properties, "height", label), label);

  const checksum = plainString(MEDIA_ASSETS_FILE, registryStarts, oneField(MEDIA_ASSETS_FILE, registryStarts, properties, "checksum", label), label);
  if (checksum !== null && !SHA256_RE.test(checksum)) {
    fail(MEDIA_ASSETS_FILE, registryStarts, properties.get("checksum")[0].idx, "invalid checksum", `${label}: checksum must be a 64-character hexadecimal SHA-256 digest`);
  }

  const storagePath = plainString(MEDIA_ASSETS_FILE, registryStarts, oneField(MEDIA_ASSETS_FILE, registryStarts, properties, "storagePath", label), label);
  if (storagePath !== null && !storagePathMatches(storagePath, id)) {
    fail(MEDIA_ASSETS_FILE, registryStarts, properties.get("storagePath")[0].idx, "invalid storage path", `${label}: "${storagePath}" must match profiles/{slug}/{yyyy}/{assetId}.{ext} or galleries/{gallerySlug}/{assetId}.{ext}`);
  }

  const sourceUrl = plainString(MEDIA_ASSETS_FILE, registryStarts, oneField(MEDIA_ASSETS_FILE, registryStarts, properties, "sourceUrl", label), label);
  if (sourceUrl !== null) {
    try {
      const parsed = new URL(sourceUrl);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error("bad protocol");
    } catch {
      fail(MEDIA_ASSETS_FILE, registryStarts, properties.get("sourceUrl")[0].idx, "invalid source URL", `${label}: sourceUrl must be an absolute HTTP(S) URL`);
    }
  }

  const credit = oneField(MEDIA_ASSETS_FILE, registryStarts, properties, "credit", label);
  if (credit && !/^\{[\s\S]*\}$/.test(credit.value)) {
    fail(MEDIA_ASSETS_FILE, registryStarts, credit.idx, "invalid credit", `${label}: credit must be an inline Source object literal`);
  }
}

let imageCount = 0;
for (const file of contentFiles()) {
  const src = readFileSync(file, "utf8");
  const map = contextMap(src);
  const starts = lineStarts(src);
  const seenObjects = new Set();
  // Find direct kind properties first, then inspect only values that begin as
  // an image discriminant. This admits comments between the colon and value,
  // while avoiding a strict parse of unrelated placeholder/source objects that
  // legitimately use shorthand fields.
  const kindRe = /\bkind\b/g;
  let match;
  while ((match = kindRe.exec(src)) !== null) {
    if (map[match.index] !== CODE) continue;
    const colon = nextSignificantCode(src, map, match.index + match[0].length, src.length);
    if (colon === -1 || src[colon] !== ":") continue;
    const valueStart = nextSignificantCode(src, map, colon + 1, src.length);
    if (
      valueStart === -1 ||
      (!src.startsWith('"image"', valueStart) && !src.startsWith("'image'", valueStart))
    ) continue;
    const object = enclosingObject(src, map, match.index);
    if (!object || seenObjects.has(object.open)) continue;
    const properties = directProperties(file, src, map, starts, object.open, object.close);
    const kinds = properties.get("kind") ?? [];
    if (kinds.length === 0 || kinds[0].value !== '"image"') {
      fail(file, starts, match.index, "unsupported image discriminant", 'kind: "image" must use the direct plain double-quoted literal grammar');
      seenObjects.add(object.open);
      continue;
    }
    seenObjects.add(object.open);
    imageCount++;
    const assetIdField = oneField(file, starts, properties, "assetId", `image at line ${lineAt(starts, object.open)}`);
    const assetId = plainString(file, starts, assetIdField, `image at line ${lineAt(starts, object.open)}`);
    if (assetId !== null && !assetIds.has(assetId)) {
      fail(file, starts, assetIdField?.idx ?? object.open, "dangling media asset", `assetId "${assetId}" matches no record in ${MEDIA_ASSETS_FILE}`);
    }
  }

}

if (failures.length > 0) {
  for (const issue of failures) {
    console.error(`${issue.file}:${issue.line}  ${issue.kind}  ${issue.detail}`);
  }
  console.error(`\n✖ Found ${failures.length} media issue${failures.length === 1 ? "" : "s"}. Stored images need direct, unique, permitted and current rights records.`);
  process.exit(1);
}

console.log(`✓ Media rights OK (${registryEntries.length} asset${registryEntries.length === 1 ? "" : "s"}; ${imageCount} image media item${imageCount === 1 ? "" : "s"} across ${contentFiles().length} content files).`);
