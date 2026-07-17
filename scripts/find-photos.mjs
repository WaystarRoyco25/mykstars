#!/usr/bin/env node
// Permitted-photo finder (docs/roster-playbook.md). A read-only research helper
// for the sourcing pass: it searches Wikimedia Commons for an artist and prints
// license-clean candidates. It never writes content files, never downloads, and
// never uploads. Picking a frame, re-hosting it and authoring the MediaAsset
// stays a human editorial act; check:media is the gate on the result.
//
// Why it queries in Korean as well as English (owner call, 2026-07-16): Korean
// outlets such as 티비텐 TV10 publish to YouTube under CC BY, and those frames
// reach Commons under Korean-titled filenames (e.g. "아일릿 (ILLIT) 가요광장
// 출근길 (1).jpg") that an English query never matches. Measured on the live API,
// the union finds materially more than English alone: RIIZE 10 -> 49 usable
// files, NMIXX 41 -> 70. So every artist is searched under BOTH names and the
// results are unioned.
//
// Two failure modes this script exists to prevent, both hit while researching it:
//   1. A silent transport error read as "no photos exist". Every request failure
//      is fatal here; an empty result only ever means an empty result.
//   2. A loose license filter. "CC BY-NC 4.0" and "CC BY-NC-ND 4.0" both start
//      with "CC BY", so a prefix test admits exactly the licenses we must refuse.
//      classifyLicense() allowlists by exact shape and rejects NC/ND explicitly.

import { readFileSync } from "node:fs";

const PROFILES_FILE = "src/content/profiles.ts";
const MEDIA_ASSETS_FILE = "src/content/media-assets.ts";
const API = "https://commons.wikimedia.org/w/api.php";
// Commons asks automated clients to identify themselves and stay serial.
const USER_AGENT = "MyKStars-photo-finder/1.0 (https://mykstars.com; editorial sourcing)";
const REQUEST_GAP_MS = 400;
// Matches the narrowest image already shipping in media-assets.ts (725x868, a
// profile hero). A tighter floor is not the site's standard and hides real finds:
// at 1200 this script reported zero permitted photos for Roh Yoon-seo, whose only
// Commons portraits are 1080x1350. Raise it per-run with --min-width when
// sourcing a hero, which fills a 100vw box and wants the pixels.
const DEFAULT_MIN_WIDTH = 700;
const DEFAULT_LIMIT = 12;
const SEARCH_LIMIT = 50;

// Rights bases a stored image may publish under. Mirrors STORED_IMAGE_BASES in
// check-media.ts: whatever this prints must be able to pass that gate.
//
// CC BY-ND is absent deliberately, and not only because Commons refuses to host
// it ("Publication of derivative work must be allowed"). PhotoMedia renders
// object-cover into fixed aspect boxes, so the site crops every photo to fit a
// tile, and cropping is a CC adaptation. The next/image AVIF/WebP re-encode
// would be fine on its own (CC 4.0 section 2(a)(4): technical and format changes
// never produce Adapted Material), but the cropping is not.
const PERMITTED_BASES = new Set(["cc-by", "cc-by-sa", "public-domain"]);

// Not photographs of the artist: vector marks, signatures, and screenshot chrome.
const TITLE_EXCLUDE = /signature|logo|wordmark|\blogotype\b/i;
const PHOTO_EXT = /\.(jpe?g|png)$/i;

function die(message) {
  console.error(`✖ ${message}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Commons API
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// One API call. Any transport, HTTP or API-level error is fatal: a helper that
// degrades to "no results" on a network blip would quietly tell the editor that
// an artist has no permitted photography, which is the exact false negative this
// script is meant to remove.
async function api(params) {
  const url = `${API}?${new URLSearchParams({ ...params, format: "json", origin: "*" })}`;
  let response;
  try {
    response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  } catch (error) {
    die(`Commons request failed: ${error.message}${error.cause?.code ? ` (${error.cause.code})` : ""}`);
  }
  if (!response.ok) die(`Commons returned HTTP ${response.status} ${response.statusText}`);

  const body = await response.text();
  let json;
  try {
    json = JSON.parse(body);
  } catch {
    die(`Commons returned a non-JSON response (${body.slice(0, 80).replace(/\s+/g, " ")}…)`);
  }
  if (json.error) die(`Commons API error: ${json.error.code} ${json.error.info ?? ""}`);
  return json;
}

// Map a Commons license to one of the site's permitted rights bases, or null to
// reject. Allowlist by exact shape rather than prefix: "cc-by-nc-4.0" fails
// /^cc-by-\d/ because an "n" follows the dash, and "cc-by-nc-sa-4.0" fails
// /^cc-by-sa-\d/ for the same reason. The explicit NC/ND rejects below are
// redundant against those patterns and kept as defense in depth.
function classifyLicense(code, shortName) {
  const c = (code ?? "").toLowerCase().trim();
  const s = (shortName ?? "").toLowerCase().trim();
  if (!c && !s) return null; // unverifiable: fail closed

  if (/nc|noncommercial|non-commercial/.test(c) || /\bnc\b|noncommercial/.test(s)) return null;
  if (/nd|noderiv/.test(c) || /\bnd\b|noderiv/.test(s)) return null;

  if (/^cc-by-sa-\d/.test(c)) return "cc-by-sa";
  if (/^cc-by-\d/.test(c)) return "cc-by";
  if (c === "cc-zero" || c === "cc0" || c.startsWith("pd")) return "public-domain";
  return null;
}

function extmeta(meta, field) {
  const value = meta?.[field]?.value;
  if (typeof value !== "string") return "";
  return value.replace(/<[^>]+>/g, "").trim();
}

// Commons dates are free text: "2026-02-19", "2026-02-19 14:30:00", "28 January
// 2024", "Unknown date". Normalize to ISO yyyy-mm-dd, or "" when there is no
// real date. Truncating the raw string instead would leave "28 January", which
// sorts ABOVE "2026-02-19" and would rank a 2024 photo as the newest.
function isoDate(raw) {
  if (!raw) return "";
  const iso = raw.match(/\d{4}-\d{2}-\d{2}/);
  if (iso) return iso[0];
  const parsed = Date.parse(raw);
  if (Number.isNaN(parsed)) return "";
  // Read back the local calendar fields, not toISOString(): "28 January 2024"
  // parses as local midnight, which in KST (UTC+9) converts to 2024-01-27 in UTC
  // and reports the day before the one Commons actually states.
  const d = new Date(parsed);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Does the filename itself name this artist? Commons full-text search matches
// anything mentioning the name ANYWHERE on the file page (description, category,
// the uploader's other captions), which drags in unrelated files: a plain search
// for "Roh Yoon-seo" returns 2018 Youth Olympics gymnastics before it returns
// her. A name in the title is a far stronger signal, so titled candidates rank
// first. Compared loosely because Commons romanization is inconsistent (she is
// filed as "Noh Yoon-seo", not "Roh"), which is also why the hangul half of the
// search matters: it is the one spelling that does not drift.
function titlesArtist(title, artist) {
  const flat = (s) => s.toLowerCase().replace(/[^a-z0-9가-힣]/g, "");
  const t = flat(title);
  if (artist.koreanName && t.includes(flat(artist.koreanName))) return true;
  return t.includes(flat(artist.name));
}

// Search Commons for one term and return the permitted, photo-shaped candidates.
// generator=search, not categorymembers: K-pop files live in year subcategories
// ("Category:Aespa in 2025"), so a flat category listing returns almost nothing.
async function search(term, minWidth) {
  const data = await api({
    action: "query",
    generator: "search",
    gsrsearch: term,
    gsrnamespace: "6",
    gsrlimit: String(SEARCH_LIMIT),
    prop: "imageinfo",
    iiprop: "url|size|extmetadata",
  });

  const out = new Map();
  for (const page of Object.values(data.query?.pages ?? {})) {
    const info = page.imageinfo?.[0];
    if (!info) continue;
    const title = page.title.replace(/^File:/, "");
    if (!PHOTO_EXT.test(title) || TITLE_EXCLUDE.test(title)) continue;
    if ((info.width ?? 0) < minWidth) continue;

    const meta = info.extmetadata;
    const basis = classifyLicense(extmeta(meta, "License"), extmeta(meta, "LicenseShortName"));
    if (!basis || !PERMITTED_BASES.has(basis)) continue;

    out.set(title, {
      title,
      basis,
      license: extmeta(meta, "LicenseShortName") || extmeta(meta, "License"),
      width: info.width,
      height: info.height,
      date: isoDate(extmeta(meta, "DateTimeOriginal")) || isoDate(extmeta(meta, "DateTime")),
      credit: extmeta(meta, "Artist") || extmeta(meta, "Credit") || "unknown",
      descriptionUrl: info.descriptionurl,
      fileUrl: info.url,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

// Slice profiles.ts on its top-level `    slug: "…"` markers so each artist's
// fields are read from that artist's own object and cannot bleed into the next.
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

// Slugs that already own at least one MediaAsset. Asset ids are slug-prefixed
// (e.g. "ive-2026-golden-disc"), the same convention check-media.ts relies on
// for storage paths.
function slugsWithAssets(artists) {
  const src = readFileSync(MEDIA_ASSETS_FILE, "utf8");
  const ids = [...src.matchAll(/^ {4}id: "([^"]+)",$/gm)].map((m) => m[1]);
  return new Set(artists.map((a) => a.slug).filter((slug) => ids.some((id) => id.startsWith(`${slug}-`))));
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

const minWidth = flag("min-width", DEFAULT_MIN_WIDTH);
const limit = flag("limit", DEFAULT_LIMIT);
const all = argv.includes("--all");
const wanted = argv.filter((a) => !a.startsWith("--"));

const artists = loadArtists();
const covered = slugsWithAssets(artists);

let targets;
if (wanted.length > 0) {
  targets = wanted.map((slug) => {
    const artist = artists.find((a) => a.slug === slug);
    if (!artist) die(`Unknown artist slug "${slug}". See ${PROFILES_FILE}.`);
    return artist;
  });
} else {
  // Default to the gap: active artists with no permitted photo yet. --all adds
  // the already-covered ones, for re-checking whether a better frame has landed.
  targets = artists.filter((a) => a.coverageLevel === "active" && (all || !covered.has(a.slug)));
}
if (targets.length === 0) die("No artists matched.");

console.log(
  `Searching Commons for ${targets.length} artist${targets.length === 1 ? "" : "s"} ` +
    `(min width ${minWidth}px, top ${limit} per artist).`,
);
console.log(`Permitted: ${[...PERMITTED_BASES].join(", ")}. NC and ND are rejected.\n`);

const missing = [];
const noKorean = [];
const noTitled = [];

for (const artist of targets) {
  const label = `${artist.name} (${artist.slug})`;
  if (!artist.koreanName) noKorean.push(artist.slug);

  // Broad search for recall, intitle: for precision. The union is then ranked
  // title-matches first, so the likely-relevant files lead regardless of which
  // query surfaced them.
  const terms = [
    artist.name,
    artist.koreanName,
    `intitle:"${artist.name}"`,
    artist.koreanName && `intitle:${artist.koreanName}`,
  ].filter(Boolean);

  const found = new Map();
  const perTerm = [];
  for (const term of terms) {
    const hits = await search(term, minWidth);
    perTerm.push(`${term}: ${hits.size}`);
    for (const [title, candidate] of hits) if (!found.has(title)) found.set(title, candidate);
    await sleep(REQUEST_GAP_MS);
  }

  for (const c of found.values()) c.titled = titlesArtist(c.title, artist);

  const candidates = [...found.values()].sort(
    (a, b) =>
      Number(b.titled) - Number(a.titled) ||
      (b.date ?? "").localeCompare(a.date ?? "") ||
      b.width * b.height - a.width * a.height,
  );

  const koreanNote = artist.koreanName ? "" : "  [no koreanName: English only]";
  const titledCount = candidates.filter((c) => c.titled).length;
  console.log(`── ${label}${koreanNote}`);
  console.log(
    `   ${perTerm.join("  |  ")}  ->  ${found.size} unique permitted, ${titledCount} name-in-title`,
  );

  if (candidates.length === 0) {
    missing.push(artist.slug);
    console.log("   no permitted candidate found\n");
    continue;
  }
  if (titledCount === 0) noTitled.push(artist.slug);

  for (const c of candidates.slice(0, limit)) {
    console.log(
      `   ${c.titled ? "*" : " "} ${(c.date || "undated").padEnd(10)} ` +
        `${String(c.width).padStart(5)}x${String(c.height).padEnd(5)} ` +
        `${c.basis.padEnd(12)} ${c.title.slice(0, 56)}`,
    );
    console.log(`                ${c.descriptionUrl}`);
  }
  console.log();
}

console.log("─".repeat(72));
console.log(`Searched ${targets.length}; ${missing.length} with no permitted candidate.`);
console.log("* = the artist's name is in the filename. Unmarked rows matched on page text only.");
if (missing.length > 0) console.log(`\nNo candidate at all: ${missing.join(", ")}`);
if (noTitled.length > 0) console.log(`\nNothing name-in-title (weak leads only): ${noTitled.join(", ")}`);
if (noKorean.length > 0) {
  console.log(`\nSearched English-only (no koreanName, so the Korean half never ran): ${noKorean.join(", ")}`);
}
console.log(
  `
Candidates are leads, not clearances. Every pick needs a human look at the
Commons page, because this list is known to carry:
  - Namesakes. "intitle:김선호" returns the footballer and the Defense Minister
    alongside the actor; a name match is not an identity match.
  - Third-party works. Fan photographs of photocards, album art or posters get
    uploaded under the uploader's own CC licence, which cannot clear the agency's
    rights in the artwork underneath.
  - Group shots and crops where the roster artist is incidental or absent.
Confirm the file shows the artist, then re-host it and author the MediaAsset with
the File: page as credit.url. Omit sourceUrl when that is also the acquisition
source; author sourceUrl only when the acquisition or license page is different.`,
);
