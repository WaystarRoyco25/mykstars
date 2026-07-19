#!/usr/bin/env node
// Re-host helper for permitted photography (docs/roster-playbook.md rule 7,
// docs/engineering.md media pipeline). Runs the byte-identical re-host ritual
// AFTER a human has confirmed the subject and the license on the source page:
// download the original bytes, sha256 them, upload those exact bytes to the
// Supabase media bucket, read the stored object back and prove it matches,
// then print a ready-to-paste MediaAsset literal. Picking the frame stays a
// human editorial act; check:media stays the gate on the result.
//
// Modes:
//   Commons (license auto-verified from the File: page):
//     node scripts/rehost-media.mjs \
//       --commons "https://commons.wikimedia.org/wiki/File:Example.jpg" \
//       --asset-id newjeans-2026-example --storage-path profiles/newjeans/2026/newjeans-2026-example.jpg
//   Owner-approved press material (owner has already made the rights call):
//     node scripts/rehost-media.mjs --url https://example.com/frame.jpg \
//       --rights-basis agency-press-kit --credit-name "Example Ent." \
//       --credit-url https://example.com/pressroom/123 \
//       --asset-id ... --storage-path ...
//
// A REPLACEMENT image always takes a NEW assetId: object URLs are
// content-addressed and CDN-cached for about 31 days, so re-using a path would
// serve stale bytes. If the target path already holds a different object, this
// script refuses to overwrite it.

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const USER_AGENT = "MyKStars-rehost/1.0 (https://mykstars.com; editorial sourcing)";
const PHOTO_EXT = /^(jpe?g|png)$/i;
const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// Whatever this prints must pass check:media. agency-press-kit is permitted for
// stored images but never auto-classified: it exists only behind an explicit
// --rights-basis flag, i.e. an owner decision already made.
const PERMITTED_BASES = new Set(["cc-by", "cc-by-sa", "public-domain", "agency-press-kit"]);

function die(message) {
  console.error(`✖ ${message}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Environment (same contract as naver-leads.mjs: .env.local names are
// documented in docs/engineering.md, values never committed or printed).
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
const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/+$/, "");
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  die("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set. Add them to .env.local.");
}
// Must resolve to the same host as SUPABASE_PUBLIC_MEDIA_BASE_URL in
// src/lib/media-assets.ts; derived here so upload and read-back cannot drift.
const PUBLIC_BASE = `${SUPABASE_URL}/storage/v1/object/public/media`;

// ---------------------------------------------------------------------------
// Arguments
// ---------------------------------------------------------------------------

const argv = process.argv.slice(2);
const strFlag = (name) => {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return undefined;
  const value = argv[i + 1];
  if (value === undefined || value.startsWith("--")) die(`--${name} needs a value`);
  argv.splice(i, 2);
  return value;
};

const commonsPage = strFlag("commons");
const directUrl = strFlag("url");
const rightsBasisFlag = strFlag("rights-basis");
const creditNameFlag = strFlag("credit-name");
const creditUrlFlag = strFlag("credit-url");
const assetId = strFlag("asset-id");
const storagePath = strFlag("storage-path");
if (argv.length > 0) die(`Unrecognized arguments: ${argv.join(" ")}`);

if (!assetId || !storagePath) die("--asset-id and --storage-path are both required.");
if (!ID_RE.test(assetId)) die(`Asset id "${assetId}" is not kebab-case.`);
if (!commonsPage === !directUrl) die("Pass exactly one of --commons or --url.");
if (directUrl && (!rightsBasisFlag || !creditNameFlag || !creditUrlFlag)) {
  die("--url mode needs --rights-basis, --credit-name and --credit-url (the owner's rights call).");
}
if (rightsBasisFlag && !PERMITTED_BASES.has(rightsBasisFlag)) {
  die(`--rights-basis "${rightsBasisFlag}" is not a permitted stored-image basis.`);
}

// Mirrors storagePathMatches() in src/lib/checks/media-asset-records.ts
// (check:media stays the authoritative gate), narrowed to photo extensions.
function storagePathOk(path, id) {
  const parts = path.split("/");
  const file = (name) => name.startsWith(`${id}.`) && PHOTO_EXT.test(name.slice(id.length + 1));
  if (parts[0] === "profiles") {
    return parts.length === 4 && ID_RE.test(parts[1]) && /^\d{4}$/.test(parts[2]) && file(parts[3]);
  }
  if (parts[0] === "galleries") {
    return parts.length === 3 && ID_RE.test(parts[1]) && file(parts[2]);
  }
  return false;
}
if (!storagePathOk(storagePath, assetId)) {
  die(
    `Storage path "${storagePath}" must be profiles/{slug}/{yyyy}/${assetId}.{jpg|jpeg|png} ` +
      `or galleries/{gallerySlug}/${assetId}.{jpg|jpeg|png}.`,
  );
}
const ext = storagePath.slice(storagePath.lastIndexOf(".") + 1).toLowerCase();
const contentType = ext === "png" ? "image/png" : "image/jpeg";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

// Strip markup and entities from Commons metadata, and keep credit names
// inside house style: em and en dashes never enter content strings
// (check:style scans media-assets.ts), so they recast to a comma.
function plain(html) {
  return (html ?? "")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s*[–—]\s*/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
}

// Copy of classifyLicense() in scripts/find-photos.mjs (the canonical copy):
// allowlist by exact shape, never a prefix test, NC/ND rejected explicitly.
function classifyLicense(code, shortName) {
  const c = (code ?? "").toLowerCase().trim();
  const s = (shortName ?? "").toLowerCase().trim();
  if (!c && !s) return null;
  if (/nc|noncommercial|non-commercial/.test(c) || /\bnc\b|noncommercial/.test(s)) return null;
  if (/nd|noderiv/.test(c) || /\bnd\b|noderiv/.test(s)) return null;
  if (/^cc-by-sa-\d/.test(c)) return "cc-by-sa";
  if (/^cc-by-\d/.test(c)) return "cc-by";
  if (c === "cc-zero" || c === "cc0" || c.startsWith("pd")) return "public-domain";
  return null;
}

async function fetchOk(url, options, what) {
  let response;
  try {
    response = await fetch(url, options);
  } catch (error) {
    die(`${what} failed: ${error.message}${error.cause?.code ? ` (${error.cause.code})` : ""}`);
  }
  return response;
}

// Download with one honored retry on 429 (upload.wikimedia.org throttles
// bursts with Retry-After; docs/engineering.md). Long throttles are surfaced
// instead of silently slept through.
async function download(url, what) {
  for (let attempt = 0; ; attempt += 1) {
    const response = await fetchOk(url, { headers: { "User-Agent": USER_AGENT } }, what);
    if (response.status === 429 && attempt === 0) {
      const wait = Number(response.headers.get("retry-after") ?? "0");
      if (wait > 0 && wait <= 120) {
        console.log(`   throttled (429); honoring Retry-After ${wait}s`);
        await sleep(wait * 1000);
        continue;
      }
      die(`${what}: throttled (429, Retry-After ${wait || "unknown"}s). Try again later.`);
    }
    if (!response.ok) die(`${what}: HTTP ${response.status} ${response.statusText}`);
    return Buffer.from(await response.arrayBuffer());
  }
}

// Pixel dimensions from the actual bytes, so the registry never trusts remote
// metadata: PNG reads IHDR, JPEG scans for the first frame header (SOFn).
function probeDimensions(bytes) {
  if (bytes.length > 24 && bytes.readUInt32BE(0) === 0x89504e47) {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }
  if (bytes.length > 4 && bytes.readUInt16BE(0) === 0xffd8) {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) return null;
      const marker = bytes[offset + 1];
      const size = bytes.readUInt16BE(offset + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { width: bytes.readUInt16BE(offset + 7), height: bytes.readUInt16BE(offset + 5) };
      }
      offset += 2 + size;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Resolve the source
// ---------------------------------------------------------------------------

let source; // { fileUrl, creditName, creditUrl, rightsBasis, license, reportedWidth, reportedHeight }

if (commonsPage) {
  const rawTitle = commonsPage.includes("/wiki/")
    ? decodeURIComponent(commonsPage.split("/wiki/")[1].split("?")[0])
    : commonsPage;
  const title = rawTitle.replace(/_/g, " ");
  if (!/^File:/i.test(title)) die(`"${title}" is not a File: page.`);

  const params = new URLSearchParams({
    action: "query",
    titles: title,
    prop: "imageinfo",
    iiprop: "url|size|extmetadata",
    format: "json",
    origin: "*",
  });
  const response = await fetchOk(
    `${COMMONS_API}?${params}`,
    { headers: { "User-Agent": USER_AGENT } },
    "Commons imageinfo",
  );
  if (!response.ok) die(`Commons imageinfo: HTTP ${response.status}`);
  const data = await response.json();
  const page = Object.values(data.query?.pages ?? {})[0];
  const info = page?.imageinfo?.[0];
  if (!info) die(`Commons has no image info for ${title} (typo, or the file was deleted?).`);

  const meta = info.extmetadata;
  const value = (field) => plain(meta?.[field]?.value ?? "");
  const basis = classifyLicense(value("License"), value("LicenseShortName"));
  if (!basis || !PERMITTED_BASES.has(basis) || basis === "agency-press-kit") {
    die(
      `License "${value("LicenseShortName") || value("License") || "unknown"}" is not permitted ` +
        `(cc-by, cc-by-sa, public-domain only; NC and ND are refused).`,
    );
  }
  source = {
    fileUrl: info.url,
    creditName: value("Artist") || value("Credit") || "unknown",
    creditUrl: info.descriptionurl,
    rightsBasis: basis,
    license: value("LicenseShortName") || value("License"),
    reportedWidth: info.width,
    reportedHeight: info.height,
  };
} else {
  source = {
    fileUrl: directUrl,
    creditName: plain(creditNameFlag),
    creditUrl: creditUrlFlag,
    rightsBasis: rightsBasisFlag,
    license: rightsBasisFlag,
    reportedWidth: undefined,
    reportedHeight: undefined,
  };
}

const sourceExt = source.fileUrl.split("?")[0].slice(source.fileUrl.split("?")[0].lastIndexOf(".") + 1).toLowerCase();
if ((sourceExt === "png") !== (ext === "png")) {
  die(`Source file is .${sourceExt} but the storage path says .${ext}; re-host verbatim, never transcode.`);
}

// ---------------------------------------------------------------------------
// The byte-identical ritual
// ---------------------------------------------------------------------------

console.log(`Source: ${source.fileUrl}`);
console.log(`   license ${source.license} -> ${source.rightsBasis}; credit ${source.creditName}`);

const bytes = await download(source.fileUrl, "Source download");
const checksum = sha256(bytes);
const dims = probeDimensions(bytes);
if (!dims || !dims.width || !dims.height) die("Could not read pixel dimensions from the downloaded bytes.");
if (source.reportedWidth && (dims.width !== source.reportedWidth || dims.height !== source.reportedHeight)) {
  die(
    `Downloaded ${dims.width}x${dims.height} but Commons reports ` +
      `${source.reportedWidth}x${source.reportedHeight}; wrong file or a thumbnail URL.`,
  );
}
console.log(`   ${bytes.length.toLocaleString()} bytes, ${dims.width}x${dims.height}, sha256 ${checksum.slice(0, 12)}…`);

const publicUrl = `${PUBLIC_BASE}/${storagePath}`;
const preflight = await fetchOk(publicUrl, {}, "Pre-flight check");
let alreadyHosted = false;
if (preflight.ok) {
  const existing = sha256(Buffer.from(await preflight.arrayBuffer()));
  if (existing !== checksum) {
    die(
      `${storagePath} already holds a DIFFERENT object (sha256 ${existing.slice(0, 12)}…). ` +
        `Paths are content-addressed; give the new image a new assetId instead of overwriting.`,
    );
  }
  alreadyHosted = true;
  console.log("   already hosted with identical bytes; skipping upload");
}

if (!alreadyHosted) {
  const upload = await fetchOk(
    `${SUPABASE_URL}/storage/v1/object/media/${storagePath}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SERVICE_KEY}`,
        apikey: SERVICE_KEY,
        "Content-Type": contentType,
        "x-upsert": "true",
      },
      body: bytes,
    },
    "Upload",
  );
  if (!upload.ok) die(`Upload: HTTP ${upload.status} ${(await upload.text()).slice(0, 200)}`);

  // Read back around any cached pre-flight miss and prove the stored object is
  // byte-identical to what was downloaded.
  const verify = await download(`${publicUrl}?rehost-verify=${checksum.slice(0, 8)}`, "Read-back");
  if (sha256(verify) !== checksum) die("Read-back sha256 does not match the upload. Investigate before authoring.");
  console.log("   uploaded and read back byte-identical");
}

// ---------------------------------------------------------------------------
// The registry literal
// ---------------------------------------------------------------------------

const kstDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" });
const acquisitionDate = kstDay.format(new Date());
const reviewDate = `${Number(acquisitionDate.slice(0, 4)) + 1}${acquisitionDate.slice(4)}`.replace(/-02-29$/, "-02-28");
const quote = (s) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

console.log(`\nPaste into src/content/media-assets.ts (then wire a reference and run npm run check:media):\n`);
console.log(`  {
    id: "${assetId}",
    credit: {
      name: "${quote(source.creditName)}",
      url: "${quote(source.creditUrl)}",
      kind: "licensed",
    },
    rightsBasis: "${source.rightsBasis}",
    acquisitionDate: "${acquisitionDate}",
    reviewDate: "${reviewDate}",
    width: ${dims.width},
    height: ${dims.height},
    checksum: "${checksum}",
    storagePath: "${storagePath}",
  },`);
console.log(
  `\nCredit name came from the source page; trim it by hand if it reads like markup.` +
    `\nacquisitionDate is today (${acquisitionDate}); NOW must be at or after it before checks pass.`,
);
