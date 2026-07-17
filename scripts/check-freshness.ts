#!/usr/bin/env node
import { clips } from "../src/content/clips";
import { galleries } from "../src/content/galleries";
import { NOW } from "../src/content/now";
import { artists } from "../src/content/profiles";
import { pulses } from "../src/content/pulses";
import {
  NOW_DRIFT_WARN_DAYS,
  checkFreshness,
  type EmbeddedMediaRecord,
} from "../src/lib/checks/freshness";
import { formatIssue } from "../src/lib/checks/result";
import { DAY_MS, MAX_CLIP_AGE_DAYS } from "../src/lib/editorial-policy";

const embeddedMedia: EmbeddedMediaRecord[] = [];
for (const gallery of galleries) {
  embeddedMedia.push({
    file: "src/content/galleries.ts",
    owner: `${gallery.slug} cover`,
    media: gallery.cover,
  });
  for (const media of gallery.media) {
    embeddedMedia.push({ file: "src/content/galleries.ts", owner: gallery.slug, media });
  }
}
for (const pulse of pulses) {
  if (pulse.media) {
    embeddedMedia.push({ file: "src/content/pulses", owner: pulse.slug, media: pulse.media });
  }
}
for (const artist of artists) {
  if (artist.hero) {
    embeddedMedia.push({ file: "src/content/profiles.ts", owner: artist.slug, media: artist.hero });
  }
}

const nowMs = Date.parse(NOW);
const driftDays = Number.isNaN(nowMs) ? 0 : Math.abs(Date.now() - nowMs) / DAY_MS;
if (driftDays > NOW_DRIFT_WARN_DAYS) {
  console.warn(
    `⚠ NOW (${NOW}) is ${Math.round(driftDays)} days from the real clock: ` +
      `run the NOW-bump ritual (docs/roster-playbook.md) with this refresh.`,
  );
}

const result = checkFreshness({ clips, embeddedMedia, nowIso: NOW });
if (result.issues.length > 0) {
  for (const value of result.issues) console.error(formatIssue(value));
  console.error(
    `\n✖ Found ${result.issues.length} freshness issue${result.issues.length === 1 ? "" : "s"}. ` +
      `Clips may be at most ${MAX_CLIP_AGE_DAYS} days old vs NOW; replace with real, ` +
      `currently-verified official posts (see docs/roster-playbook.md).`,
  );
  process.exitCode = 1;
} else {
  console.log(
    `✓ No stale or undated embeds (${result.clipCount} clips, ${result.embedCount} embedded media items).`,
  );
}
