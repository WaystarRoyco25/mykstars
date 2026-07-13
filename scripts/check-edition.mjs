#!/usr/bin/env node
// Committed-edition guard. This intentionally uses the repository's small
// source lexers instead of a TypeScript parser, and accepts only the plain
// object/array/string artifact shape emitted by generate-edition.ts.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";

import { CODE, contextMap, lineAt, lineStarts } from "./source-scanner.mjs";
import { arrayRange, keyString, keyStringList, topLevelObjects } from "./content-lexer.mjs";
import { contentFiles } from "./content-files.mjs";

const EDITIONS_DIR = "src/content/editions";
const PROFILES_FILE = "src/content/profiles.ts";
const GALLERIES_FILE = "src/content/galleries.ts";
const CLIPS_FILE = "src/content/clips.ts";
const EVENTS_FILE = "src/content/events.ts";
const PREDICTIONS_FILE = "src/content/predictions.ts";
const RANKINGS_FILE = "src/content/rankings.ts";
const ARTICLES_FILE = "src/content/articles.ts";
const MIN_ITEMS = 60;
const MAX_ITEMS = 90;
const EVENT_SIZE = 8;
const WINDOW_SIZE = 12;
const MIN_WINDOW_FORMATS = 4;

const failures = [];
const warnings = [];
const fail = (file, line, kind, detail) => failures.push({ file, line, kind, detail });
const warn = (file, kind, detail) => warnings.push({ file, kind, detail });

function loadArray(file, name) {
  const src = readFileSync(file, "utf8");
  const map = contextMap(src);
  const starts = lineStarts(src);
  const range = arrayRange(file, src, map, name);
  const result = topLevelObjects(src, map, range.from, range.to);
  if (result.malformedAt !== -1) fail(file, lineAt(starts, result.malformedAt), "malformed literal", `${name} contains an unclosed object`);
  return { file, src, map, starts, objects: result.objects };
}

function allKeyStrings(src, map, from, to, key) {
  const values = [];
  const re = new RegExp(`\\b${key}\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`, "g");
  const slice = src.slice(from, to);
  let match;
  while ((match = re.exec(slice)) !== null) {
    const index = from + match.index;
    if (map[index] === CODE) values.push(match[1]);
  }
  return values;
}

function hasCodePattern(src, map, from, to, pattern) {
  const slice = src.slice(from, to);
  let match;
  pattern.lastIndex = 0;
  while ((match = pattern.exec(slice)) !== null) {
    if (map[from + match.index] === CODE) return true;
  }
  return false;
}

function record(registry, key, facts, file, line) {
  if (registry.has(key)) fail(file, line, "duplicate inventory key", `${key} appears more than once`);
  else registry.set(key, facts);
}

function collectObjectArray(registry, file, name, format, options = {}) {
  const loaded = loadArray(file, name);
  for (const object of loaded.objects) {
    const id = keyString(loaded.src, loaded.map, object.open, object.close, options.idKey ?? "slug");
    if (!id) {
      fail(file, lineAt(loaded.starts, object.open), "malformed inventory", `${format} item has no ${options.idKey ?? "slug"}`);
      continue;
    }
    const artists = options.artistKey === "singular"
      ? allKeyStrings(loaded.src, loaded.map, object.open, object.close, "artistSlug")
      : keyStringList(loaded.src, loaded.map, object.open, object.close, "artistSlugs");
    const pillar = keyString(loaded.src, loaded.map, object.open, object.close, "pillar")?.value;
    const state = keyString(loaded.src, loaded.map, object.open, object.close, "publicationState")?.value;
    const hasPlaceholder = format === "gallery" && (
      hasCodePattern(loaded.src, loaded.map, object.open, object.close, /\bkind\s*:\s*"placeholder"/g) ||
      hasCodePattern(loaded.src, loaded.map, object.open, object.close, /\bplace(?:Set|Mixed)?\s*\(/g)
    );
    record(registry, `${format}:${id.value}`, {
      format,
      artists: [...new Set(artists ?? [])],
      ...(pillar ? { pillar } : {}),
      ...(state ? { publicationState: state } : {}),
      ...(hasPlaceholder ? { hasPlaceholder: true } : {}),
    }, file, lineAt(loaded.starts, id.idx));
  }
}

function splitArgs(src, map, from, to) {
  const args = [];
  let depth = 0;
  let start = from;
  for (let index = from; index < to; index++) {
    if (map[index] !== CODE) continue;
    const char = src[index];
    if (char === "(" || char === "[" || char === "{") depth++;
    else if (char === ")" || char === "]" || char === "}") depth--;
    else if (char === "," && depth === 0) {
      args.push(src.slice(start, index).trim());
      start = index + 1;
    }
  }
  const last = src.slice(start, to).trim();
  if (last) args.push(last);
  return args;
}

function unquote(value) {
  const match = /^"([^]*)"$/.exec(value);
  return match ? match[1] : null;
}

function collectClips(registry) {
  const file = CLIPS_FILE;
  const src = readFileSync(file, "utf8");
  const map = contextMap(src);
  const starts = lineStarts(src);
  const re = /\b(yt|tv)\(/g;
  let match;
  while ((match = re.exec(src)) !== null) {
    if (map[match.index] !== CODE || /function\s+$/.test(src.slice(Math.max(0, match.index - 12), match.index))) continue;
    const open = match.index + match[1].length;
    let depth = 0;
    let close = -1;
    for (let index = open; index < src.length; index++) {
      if (map[index] !== CODE) continue;
      if (src[index] === "(") depth++;
      else if (src[index] === ")" && --depth === 0) {
        close = index;
        break;
      }
    }
    if (close === -1) {
      fail(file, lineAt(starts, match.index), "malformed clip", `${match[1]} call never closes`);
      continue;
    }
    const args = splitArgs(src, map, open + 1, close);
    const id = unquote(args[0] ?? "");
    const artistArg = args[2] ?? "";
    const artists = [...artistArg.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((item) => item[1]);
    const pillar = match[1] === "yt" ? "k-pop" : unquote(args[3] ?? "");
    if (!id || !pillar) {
      fail(file, lineAt(starts, match.index), "malformed clip", "clip id, artist list, or pillar is not a plain literal");
      continue;
    }
    record(registry, `clip:${id}`, { format: "clip", artists: [...new Set(artists)], pillar }, file, lineAt(starts, match.index));
  }
}

function collectPulses(registry) {
  for (const file of contentFiles().filter((path) => /src\/content\/pulses\/\d{4}-\d{2}\.ts$/.test(path))) {
    const src = readFileSync(file, "utf8");
    const anchor = /export const (pulses\d+)\s*:\s*Pulse\[\]\s*=\s*\[/.exec(src);
    if (!anchor) {
      fail(file, 1, "missing Pulse anchor", "expected export const pulsesYYYYMM: Pulse[] = [");
      continue;
    }
    collectObjectArray(registry, file, anchor[1], "pulse");
  }
}

function buildRegistry() {
  const registry = new Map();
  collectPulses(registry);
  collectObjectArray(registry, GALLERIES_FILE, "galleries", "gallery");
  collectClips(registry);
  collectObjectArray(registry, EVENTS_FILE, "events", "event");
  collectObjectArray(registry, PREDICTIONS_FILE, "predictions", "forecast", { artistKey: "singular" });
  collectObjectArray(registry, RANKINGS_FILE, "rankings", "ranking", { artistKey: "singular" });
  collectObjectArray(registry, ARTICLES_FILE, "articles", "article");
  return registry;
}

function profileSets() {
  const loaded = loadArray(PROFILES_FILE, "artists");
  const active = new Set();
  const known = new Set();
  for (const object of loaded.objects) {
    const slug = keyString(loaded.src, loaded.map, object.open, object.close, "slug");
    const coverage = keyString(loaded.src, loaded.map, object.open, object.close, "coverageLevel")?.value;
    const state = keyString(loaded.src, loaded.map, object.open, object.close, "publicationState")?.value;
    if (slug) {
      known.add(slug.value);
      if (coverage === "active" && state === "published") active.add(slug.value);
    }
  }
  return { active, known };
}

class LiteralParser {
  constructor(src, start) {
    this.src = src;
    this.index = start;
  }
  skip() {
    while (this.index < this.src.length) {
      if (/\s/.test(this.src[this.index])) {
        this.index++;
        continue;
      }
      if (this.src.startsWith("//", this.index)) {
        this.index = this.src.indexOf("\n", this.index);
        if (this.index === -1) this.index = this.src.length;
        continue;
      }
      if (this.src.startsWith("/*", this.index)) {
        const close = this.src.indexOf("*/", this.index + 2);
        if (close === -1) throw new Error("unclosed block comment");
        this.index = close + 2;
        continue;
      }
      break;
    }
  }
  string() {
    const start = this.index;
    this.index++;
    while (this.index < this.src.length) {
      if (this.src[this.index] === "\\") this.index += 2;
      else if (this.src[this.index++] === "\"") return JSON.parse(this.src.slice(start, this.index));
    }
    throw new Error("unclosed string");
  }
  identifier() {
    const match = /^[A-Za-z_$][\w$-]*/.exec(this.src.slice(this.index));
    if (!match) throw new Error(`expected identifier at offset ${this.index}`);
    this.index += match[0].length;
    return match[0];
  }
  value() {
    this.skip();
    const char = this.src[this.index];
    if (char === "\"") return this.string();
    if (char === "[") return this.array();
    if (char === "{") return this.object();
    const id = this.identifier();
    if (id === "true") return true;
    if (id === "false") return false;
    if (id === "null") return null;
    throw new Error(`unsupported literal ${id}`);
  }
  array() {
    const values = [];
    this.index++;
    while (true) {
      this.skip();
      if (this.src[this.index] === "]") {
        this.index++;
        return values;
      }
      values.push(this.value());
      this.skip();
      if (this.src[this.index] === ",") this.index++;
      else if (this.src[this.index] !== "]") throw new Error(`expected comma or ] at offset ${this.index}`);
    }
  }
  object() {
    const value = {};
    this.index++;
    while (true) {
      this.skip();
      if (this.src[this.index] === "}") {
        this.index++;
        return value;
      }
      const key = this.src[this.index] === "\"" ? this.string() : this.identifier();
      this.skip();
      if (this.src[this.index++] !== ":") throw new Error(`expected colon at offset ${this.index - 1}`);
      value[key] = this.value();
      this.skip();
      if (this.src[this.index] === ",") this.index++;
      else if (this.src[this.index] !== "}") throw new Error(`expected comma or } at offset ${this.index}`);
    }
  }
}

function parseEditionFile(file) {
  const src = readFileSync(file, "utf8");
  const starts = lineStarts(src);
  const anchor = /export const edition\d+\s*:\s*FeedEdition\s*=\s*/.exec(src);
  if (!anchor) throw new Error("missing export const editionYYYYMM: FeedEdition = anchor");
  if (!/Inventory SHA-256: [a-f0-9]{64}/.test(src.slice(0, anchor.index))) {
    fail(file, 1, "missing inventory hash", "generated edition header needs a full SHA-256 inventory hash");
  }
  const parser = new LiteralParser(src, anchor.index + anchor[0].length);
  const edition = parser.value();
  return { edition, starts };
}

function stringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === "string") ? value : null;
}

function commonPillar(items) {
  if (items.length === 0 || items.some((item) => !item.pillar)) return undefined;
  const pillars = new Set(items.map((item) => item.pillar));
  return pillars.size === 1 ? [...pillars][0] : undefined;
}

function resolveItem(file, key, registry) {
  const facts = registry.get(key);
  if (!facts) {
    fail(file, 1, "dangling edition reference", `${key} matches no content item`);
    return { key, format: key.split(":")[0], artists: [] };
  }
  if (facts.format === "gallery" && facts.publicationState === "archived") {
    fail(file, 1, "unpublished gallery reference", `${key} is archived; an edition gallery must be published`);
  }
  if (facts.format === "gallery" && facts.hasPlaceholder) {
    fail(file, 1, "placeholder gallery reference", `${key} contains placeholder cover or media items`);
  }
  return { key, ...facts };
}

function validateEdition(file, edition, registry, active, knownProfiles) {
  const filenameId = basename(file, ".ts");
  if (!edition || typeof edition !== "object") {
    fail(file, 1, "malformed edition", "export is not an object literal");
    return null;
  }
  if (edition.id !== filenameId) fail(file, 1, "edition id mismatch", `id ${String(edition.id)} does not match ${filenameId}.ts`);
  if (typeof edition.publishedAt !== "string" || Number.isNaN(Date.parse(edition.publishedAt))) {
    fail(file, 1, "bad publishedAt", "publishedAt must be a parseable plain string");
  } else if (edition.publishedAt.slice(0, 7) !== edition.id) {
    fail(file, 1, "published month mismatch", `${edition.publishedAt} does not fall in ${edition.id}`);
  }
  if (!Array.isArray(edition.bands)) {
    fail(file, 1, "malformed bands", "bands must be an array");
    return null;
  }

  const items = [];
  const bands = [];
  let spotlightBands = 0;
  for (const [index, band] of edition.bands.entries()) {
    if (!band || typeof band !== "object" || typeof band.kind !== "string") {
      fail(file, 1, "malformed band", `band ${index + 1} has no kind`);
      continue;
    }
    let keys = [];
    let format = band.kind;
    let explicitPillar;
    switch (band.kind) {
      case "hero": {
        const references = [band.gallerySlug, band.clipId].filter((value) => typeof value === "string");
        if (references.length !== 1) fail(file, 1, "malformed hero", `band ${index + 1} needs exactly one gallerySlug or clipId`);
        if (typeof band.gallerySlug === "string") keys = [`gallery:${band.gallerySlug}`];
        if (typeof band.clipId === "string") keys = [`clip:${band.clipId}`];
        format = "hero";
        break;
      }
      case "event-rail": {
        const values = stringArray(band.eventSlugs);
        if (!values || values.length !== EVENT_SIZE) fail(file, 1, "event rail size", `band ${index + 1} needs exactly ${EVENT_SIZE} events`);
        keys = (values ?? []).map((slug) => `event:${slug}`);
        format = "event";
        break;
      }
      case "gallery-band": {
        const values = stringArray(band.gallerySlugs);
        if (!values || values.length === 0) fail(file, 1, "gallery band size", `band ${index + 1} is empty`);
        keys = (values ?? []).map((slug) => `gallery:${slug}`);
        format = "gallery";
        explicitPillar = band.pillar;
        break;
      }
      case "clip-rail": {
        const values = stringArray(band.clipIds);
        if (!values || values.length === 0 || values.length > 14) fail(file, 1, "clip rail size", `band ${index + 1} needs 1 to 14 clips`);
        keys = (values ?? []).map((id) => `clip:${id}`);
        format = "clip";
        break;
      }
      case "ranking":
        if (typeof band.slug !== "string") fail(file, 1, "malformed ranking band", `band ${index + 1} has no slug`);
        else keys = [`ranking:${band.slug}`];
        format = "ranking";
        break;
      case "analysis": {
        const values = stringArray(band.articleSlugs);
        if (!values || values.length === 0) fail(file, 1, "analysis band size", `band ${index + 1} is empty`);
        keys = (values ?? []).map((slug) => `article:${slug}`);
        format = "article";
        explicitPillar = band.pillar;
        break;
      }
      case "pulse-band": {
        const values = stringArray(band.pulseSlugs);
        if (!values || values.length < 4 || values.length > 6) fail(file, 1, "Pulse band size", `band ${index + 1} needs 4 to 6 pulses`);
        keys = (values ?? []).map((slug) => `pulse:${slug}`);
        format = "pulse";
        break;
      }
      case "forecast-rail": {
        const values = stringArray(band.predictionSlugs);
        if (!values || values.length !== 3) fail(file, 1, "forecast rail size", `band ${index + 1} needs exactly 3 forecasts`);
        keys = (values ?? []).map((slug) => `forecast:${slug}`);
        format = "forecast";
        break;
      }
      case "spotlight-strip":
        spotlightBands++;
        format = "spotlight";
        break;
      default:
        fail(file, 1, "unknown band kind", `band ${index + 1}: ${band.kind}`);
    }
    const resolved = keys.map((key) => resolveItem(file, key, registry));
    for (const item of resolved) {
      if (
        item.artists.length > 0 &&
        item.artists.every((slug) => knownProfiles.has(slug)) &&
        item.artists.every((slug) => !active.has(slug))
      ) {
        fail(file, 1, "unpromoted edition item", `${item.key} is tagged only to catalog, draft, or archived profiles`);
      }
    }
    if (explicitPillar && resolved.some((item) => item.pillar && item.pillar !== explicitPillar)) {
      fail(file, 1, "band pillar mismatch", `band ${index + 1} declares ${explicitPillar} but contains another pillar`);
    }
    items.push(...resolved);
    // Rails without a pillar field are cross-desk bands even when one month's
    // selected items happen to share a pillar. Only explicitly pillar-scoped
    // bands, plus a single ranking table, participate in the pillar streak.
    const scopedPillar = explicitPillar ?? (band.kind === "ranking" ? commonPillar(resolved) : undefined);
    bands.push({ format, pillar: scopedPillar });
  }
  if (spotlightBands !== 1) fail(file, 1, "Spotlight band count", `${spotlightBands} spotlight-strip bands, expected exactly 1`);

  if (items.length < MIN_ITEMS || items.length > MAX_ITEMS) {
    fail(file, 1, "edition size", `${items.length} flattened items, expected ${MIN_ITEMS} to ${MAX_ITEMS}`);
  }
  const seenItems = new Set();
  for (const item of items) {
    if (seenItems.has(item.key)) fail(file, 1, "duplicate edition item", `${item.key} appears more than once`);
    seenItems.add(item.key);
  }
  for (let index = 1; index < items.length; index++) {
    const right = new Set(items[index].artists);
    if (items[index - 1].artists.some((slug) => right.has(slug))) {
      fail(file, 1, "celebrity adjacency", `${items[index - 1].key} and ${items[index].key} share a centered celebrity`);
    }
  }
  const cap = Math.floor(items.length * 0.08);
  const appearances = new Map();
  for (const item of items) for (const slug of new Set(item.artists)) appearances.set(slug, (appearances.get(slug) ?? 0) + 1);
  for (const [slug, count] of appearances) {
    if (count > cap) fail(file, 1, "celebrity cap", `${slug} appears ${count} times, above the ${cap}-item cap`);
  }

  const availableFormats = new Set(
    [...registry.values()]
      .filter((facts) => facts.format !== "gallery" || (facts.publicationState !== "archived" && !facts.hasPlaceholder))
      .map((facts) => facts.format),
  );
  for (let from = 0; from + WINDOW_SIZE <= items.length; from++) {
    const formats = new Set(items.slice(from, from + WINDOW_SIZE).map((item) => item.format));
    if (formats.size < MIN_WINDOW_FORMATS) {
      const detail = `items ${from + 1} to ${from + WINDOW_SIZE} contain ${formats.size} formats`;
      if (availableFormats.size < MIN_WINDOW_FORMATS) warn(file, "rolling format diversity", `${detail}; inventory exposes only ${availableFormats.size}`);
      else fail(file, 1, "rolling format diversity", detail);
    }
  }
  for (let index = 2; index < bands.length; index++) {
    const run = bands.slice(index - 2, index + 1);
    if (run.every((band) => band.format === run[0].format)) fail(file, 1, "band format streak", `bands ${index - 1} to ${index + 1} all use ${run[0].format}`);
    if (run[0].pillar && run.every((band) => band.pillar === run[0].pillar)) fail(file, 1, "band pillar streak", `bands ${index - 1} to ${index + 1} all use ${run[0].pillar}`);
  }

  const spotlight = edition.spotlight;
  if (!spotlight || typeof spotlight !== "object") {
    fail(file, 1, "malformed Spotlight", "spotlight must be an object");
  } else {
    const anchors = stringArray(spotlight.anchors);
    const weeks = Array.isArray(spotlight.weeks) && spotlight.weeks.every((week) => stringArray(week)) ? spotlight.weeks : null;
    if (!anchors) fail(file, 1, "malformed Spotlight anchors", "anchors must be a string array");
    else if (anchors.length !== Math.min(12, active.size)) fail(file, 1, "Spotlight anchor count", `${anchors.length} anchors, expected ${Math.min(12, active.size)}`);
    if (!weeks || weeks.length !== 4) fail(file, 1, "Spotlight cohort count", "weeks must contain exactly four string arrays");
    if (anchors && weeks) {
      const placements = [...anchors, ...weeks.flat()];
      const placed = new Set();
      for (const slug of placements) {
        if (placed.has(slug)) fail(file, 1, "duplicate Spotlight placement", `${slug} appears more than once`);
        if (!active.has(slug)) fail(file, 1, "ineligible Spotlight placement", `${slug} is not active and published`);
        placed.add(slug);
      }
      for (const slug of active) if (!placed.has(slug)) fail(file, 1, "missing Spotlight placement", `${slug} is not scheduled`);
    }
  }
  return { id: edition.id, items, coverage: new Set(items.flatMap((item) => item.artists)) };
}

const registry = buildRegistry();
const { active, known: knownProfiles } = profileSets();
const editionFiles = existsSync(EDITIONS_DIR)
  ? readdirSync(EDITIONS_DIR).filter((name) => /^\d{4}-(0[1-9]|1[0-2])\.ts$/.test(name)).sort().map((name) => join(EDITIONS_DIR, name))
  : [];

const checked = [];
const seenIds = new Set();
for (const file of editionFiles) {
  try {
    const { edition } = parseEditionFile(file);
    if (seenIds.has(edition.id)) fail(file, 1, "duplicate edition id", `${edition.id} appears more than once`);
    seenIds.add(edition.id);
    const result = validateEdition(file, edition, registry, active, knownProfiles);
    if (result) checked.push(result);
  } catch (error) {
    fail(file, 1, "unparseable edition", error instanceof Error ? error.message : String(error));
  }
}

checked.sort((a, b) => a.id.localeCompare(b.id));
// Audit the current trailing window. The schema has no profile admission date,
// so replaying every historical window against today's active roster would
// falsely mark later roster additions as having missed editions that predate
// their admission. Each window is guarded when it becomes the latest one.
if (checked.length >= 2) {
  const trailingTwo = checked.slice(-2);
  for (const slug of active) {
    if (trailingTwo.every((edition) => !edition.coverage.has(slug))) {
      warn(trailingTwo.at(-1).id, "quarterly coverage warning", `${slug} has missed two consecutive editions`);
    }
  }
}
if (checked.length >= 3) {
  const trailingThree = checked.slice(-3);
  for (const slug of active) {
    if (trailingThree.every((edition) => !edition.coverage.has(slug))) {
      fail(
        join(EDITIONS_DIR, `${trailingThree.at(-1).id}.ts`),
        1,
        "quarterly coverage failure",
        `${slug} has missed three consecutive editions`,
      );
    }
  }
}

for (const item of warnings) console.warn(`⚠ ${item.file}  ${item.kind}  ${item.detail}`);
if (failures.length > 0) {
  for (const item of failures) console.error(`${item.file}:${item.line}  ${item.kind}  ${item.detail}`);
  console.error(`\n✖ Found ${failures.length} edition issue${failures.length === 1 ? "" : "s"}. Regenerate after fixing the named inventory or constraint.`);
  process.exit(1);
}
if (editionFiles.length === 0) console.log("✓ Edition machinery OK (no committed monthly editions; the permanent home fallback remains active).");
else console.log(`✓ Editions OK (${editionFiles.length} committed edition${editionFiles.length === 1 ? "" : "s"}).`);
