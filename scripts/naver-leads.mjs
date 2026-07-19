#!/usr/bin/env node
// NAVER news lead finder (docs/roster-playbook.md). A read-only research helper
// that ranks the photo hunt: for each artist it pulls the latest news items
// from the NAVER Search API and prints dated headlines, so the sourcing pass
// knows which artists have current heat, which events to chase on Commons, and
// holds dated evidence for lastVerified bumps.
//
// The rights boundary is absolute and one-directional: NAVER output is
// discovery ONLY. Nothing this script prints (headline, link, or any image a
// result page carries) is ever published, re-hosted, or written into a content
// file. NAVER indexes press agencies' copyrighted photos and cannot license
// them onward; permitted photography comes exclusively from the Commons/press
// pipeline (scripts/find-photos.mjs, scripts/rehost-media.mjs, with
// check:media as the gate on the result).
//
// Like find-photos.mjs, every artist is searched under BOTH names. Korean
// outlets file under the hangul name (뉴진스, not NewJeans), so the Korean
// query carries most of the recall; the English query catches international
// coverage. Requests are serial and any transport error is fatal: an empty
// result only ever means an empty result.

import { readFileSync } from "node:fs";

const PROFILES_FILE = "src/content/profiles.ts";
const API = "https://naverapihub.apigw.ntruss.com/search/v1/news";
const REQUEST_GAP_MS = 400;
const DEFAULT_DAYS = 90;
const DEFAULT_LIMIT = 15;
const DISPLAY = 100; // API maximum per request

// Headline markers that make an item a photo-hunt lead. [P] marks photo-op
// coverage (wire photo sets, airport runs, award shows, comebacks, pictorials,
// fan meetings); [A] marks agency-provided material (제공), the trail that can
// lead to official press photography worth an owner rights call.
const PHOTO_MARKERS = ["포토", "공항", "시상식", "컴백", "화보", "팬미팅"];
const AGENCY_MARKER = "제공";

function die(message) {
  console.error(`✖ ${message}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Environment. Keys live in the gitignored .env.local (names documented in
// docs/engineering.md, values never committed); npm scripts do not pass
// --env-file, so the file is parsed here, filling only unset variables.
// ---------------------------------------------------------------------------

function readEnvLocal() {
  let raw;
  try {
    raw = readFileSync(".env.local", "utf8");
  } catch {
    return;
  }
  for (const line of raw.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}

readEnvLocal();
const KEY_ID = process.env.NAVER_API_KEY_ID;
const KEY = process.env.NAVER_API_KEY;
if (!KEY_ID || !KEY) {
  die(
    "NAVER_API_KEY_ID / NAVER_API_KEY are not set. Add them to .env.local " +
      "(see docs/engineering.md, media pipeline).",
  );
}

// ---------------------------------------------------------------------------
// NAVER API
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// One API call. Any transport, HTTP or API-level error is fatal, for the same
// reason as find-photos.mjs: a helper that degrades to "no results" on a
// network blip would quietly report a hot artist as quiet.
async function api(params) {
  const url = `${API}?${new URLSearchParams(params)}`;
  let response;
  try {
    response = await fetch(url, {
      headers: { "X-NCP-APIGW-API-KEY-ID": KEY_ID, "X-NCP-APIGW-API-KEY": KEY },
    });
  } catch (error) {
    die(`NAVER request failed: ${error.message}${error.cause?.code ? ` (${error.cause.code})` : ""}`);
  }
  const body = await response.text();
  let json;
  try {
    json = JSON.parse(body);
  } catch {
    die(`NAVER returned a non-JSON response (${body.slice(0, 80).replace(/\s+/g, " ")}…)`);
  }
  if (!response.ok || json.errorCode) {
    die(`NAVER API error: HTTP ${response.status} ${json.errorCode ?? ""} ${json.errorMessage ?? ""}`);
  }
  return json;
}

// NAVER wraps query matches in <b> tags and escapes entities in both title and
// description. Strip to plain text; &amp; decodes last so it cannot re-open a
// second round of decoding.
function plain(html) {
  return (html ?? "")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
}

// pubDate is RFC 822 with an explicit +0900 offset. Render the Korean calendar
// date: en-CA formatting yields YYYY-MM-DD, and pinning the zone to Asia/Seoul
// keeps late-evening items on the day Korean outlets actually filed them.
const kstDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" });
function isoDate(rfc822) {
  const parsed = Date.parse(rfc822 ?? "");
  return Number.isNaN(parsed) ? "" : kstDay.format(new Date(parsed));
}

// Multi-word terms are phrase-quoted so "Stray Kids" does not match every
// article containing "kids"; single tokens (뉴진스, BLACKPINK) pass through.
const asQuery = (term) => (/\s/.test(term) ? `"${term}"` : term);

// ---------------------------------------------------------------------------
// Content. loadArtists() is duplicated from scripts/find-photos.mjs (the
// canonical copy); both slice profiles.ts on its top-level slug markers so an
// artist's fields cannot bleed into the next object.
// ---------------------------------------------------------------------------

function loadArtists() {
  const src = readFileSync(PROFILES_FILE, "utf8");
  const marks = [...src.matchAll(/^ {4}slug: "([^"]+)",$/gm)];
  if (marks.length === 0) die(`No artists found in ${PROFILES_FILE} (did the authoring shape change?)`);

  return marks.map((mark, i) => {
    const body = src.slice(mark.index, i + 1 < marks.length ? marks[i + 1].index : src.length);
    const field = (name) => body.match(new RegExp(`^ {4}${name}: "([^"]+)",$`, "m"))?.[1] ?? "";
    return {
      slug: mark[1],
      name: field("name"),
      koreanName: field("koreanName"),
      coverageLevel: field("coverageLevel"),
      publicationState: field("publicationState"),
    };
  });
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const value = Number(argv[i + 1]);
  if (!Number.isFinite(value)) die(`--${name} needs a number`);
  argv.splice(i, 2);
  return value;
};

const days = flag("days", DEFAULT_DAYS);
const limit = flag("limit", DEFAULT_LIMIT);
const wanted = argv.filter((a) => !a.startsWith("--"));

const artists = loadArtists();

let targets;
if (wanted.length > 0) {
  targets = wanted.map((slug) => {
    const artist = artists.find((a) => a.slug === slug);
    if (!artist) die(`Unknown artist slug "${slug}". See ${PROFILES_FILE}.`);
    return artist;
  });
} else {
  targets = artists.filter((a) => a.coverageLevel === "active");
}
if (targets.length === 0) die("No artists matched.");

const cutoff = Date.now() - days * 86_400_000;

console.log(
  `NAVER news leads for ${targets.length} artist${targets.length === 1 ? "" : "s"} ` +
    `(last ${days} days, top ${limit} per artist).`,
);
console.log(`[P] photo-op coverage (${PHOTO_MARKERS.join(", ")})  [A] agency-provided (${AGENCY_MARKER})\n`);

const ranking = [];
const quiet = [];
const noKorean = [];

for (const artist of targets) {
  const label = `${artist.name} (${artist.slug})`;
  if (!artist.koreanName) noKorean.push(artist.slug);

  const terms = [artist.koreanName, artist.name].filter(Boolean);
  const found = new Map();
  const perTerm = [];
  for (const term of terms) {
    const data = await api({ query: asQuery(term), display: String(DISPLAY), sort: "date" });
    const items = data.items ?? [];
    perTerm.push(`${term}: ${items.length}`);
    for (const item of items) {
      const key = item.originallink || item.link;
      if (!key || found.has(key)) continue;
      const at = Date.parse(item.pubDate ?? "");
      if (Number.isNaN(at) || at < cutoff) continue;
      const title = plain(item.title);
      const text = `${title} ${plain(item.description)}`;
      found.set(key, {
        title,
        link: key,
        at,
        date: isoDate(item.pubDate),
        photoOp: PHOTO_MARKERS.some((m) => text.includes(m)),
        agency: text.includes(AGENCY_MARKER),
      });
    }
    await sleep(REQUEST_GAP_MS);
  }

  const items = [...found.values()].sort((a, b) => b.at - a.at);
  const flagged = items.filter((i) => i.photoOp || i.agency).length;
  ranking.push({ slug: artist.slug, name: artist.name, total: items.length, flagged });

  const koreanNote = artist.koreanName ? "" : "  [no koreanName: English only]";
  console.log(`── ${label}${koreanNote}`);
  console.log(`   ${perTerm.join("  |  ")}  ->  ${items.length} unique in window, ${flagged} flagged`);

  if (items.length === 0) {
    quiet.push(artist.slug);
    console.log("   no items in the window\n");
    continue;
  }

  for (const item of items.slice(0, limit)) {
    const marks = `${item.photoOp ? "P" : " "}${item.agency ? "A" : " "}`;
    console.log(`   ${marks} ${item.date}  ${item.title.slice(0, 68)}`);
    console.log(`        ${item.link}`);
  }
  console.log();
}

console.log("─".repeat(72));
console.log("Photo-hunt priority (flagged items first, then volume):");
ranking.sort((a, b) => b.flagged - a.flagged || b.total - a.total);
for (const r of ranking) {
  console.log(`   ${String(r.flagged).padStart(4)} flagged / ${String(r.total).padStart(3)} total  ${r.name} (${r.slug})`);
}
if (quiet.length > 0) console.log(`\nNo items in the window: ${quiet.join(", ")}`);
if (noKorean.length > 0) {
  console.log(`\nSearched English-only (no koreanName, so the Korean half never ran): ${noKorean.join(", ")}`);
}
console.log(
  `
Leads, not content. NAVER results point at events and press coverage; the
photos they carry are the outlets' copyrighted work and never publish here.
Chase each lead through the permitted pipeline instead: search the event on
Commons (scripts/find-photos.mjs), confirm subject and license by hand, then
re-host with scripts/rehost-media.mjs and author the MediaAsset record.`,
);
