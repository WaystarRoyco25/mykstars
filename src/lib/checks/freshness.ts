import {
  DAY_MS,
  MAX_CLIP_AGE_DAYS,
  isClipFreshAt,
} from "../editorial-policy";
import type { Clip, MediaItem } from "../types";
import { issue, type CheckIssue } from "./result";

export const NOW_DRIFT_WARN_DAYS = 14;

export interface EmbeddedMediaRecord {
  file: string;
  owner: string;
  media: MediaItem;
}

export interface FreshnessCheckInput {
  clips: readonly Clip[];
  embeddedMedia: readonly EmbeddedMediaRecord[];
  nowIso: string;
  clipFile?: string;
}

export interface FreshnessCheckResult {
  issues: CheckIssue[];
  clipCount: number;
  embedCount: number;
}

export function checkFreshness(input: FreshnessCheckInput): FreshnessCheckResult {
  const issues: CheckIssue[] = [];
  const clipFile = input.clipFile ?? "src/content/clips.ts";
  const nowMs = Date.parse(input.nowIso);

  if (Number.isNaN(nowMs)) {
    issues.push(issue("src/content/now.ts", "unparseable NOW", `"${input.nowIso}"`));
    return { issues, clipCount: input.clips.length, embedCount: input.embeddedMedia.length };
  }

  for (const clip of input.clips) {
    const clipMs = Date.parse(clip.date);
    if (Number.isNaN(clipMs)) {
      issues.push(issue(clipFile, "unparseable date", `${clip.id}: "${clip.date}"`));
      continue;
    }
    const ageDays = (nowMs - clipMs) / DAY_MS;
    if (clipMs > nowMs) {
      issues.push(
        issue(
          clipFile,
          "future-dated clip",
          `${clip.id} is dated ${clip.date}, after NOW: a true publish date can never be in the site's future`,
        ),
      );
      continue;
    }

    if (clip.evergreenUntil && Number.isNaN(Date.parse(clip.evergreenUntil))) {
      issues.push(
        issue(
          clipFile,
          "bad evergreenUntil",
          `${clip.id}: "${clip.evergreenUntil}" does not parse`,
        ),
      );
      continue;
    }

    if (!isClipFreshAt(clip, nowMs)) {
      issues.push(
        issue(
          clipFile,
          "stale clip",
          `${clip.id} is ${Math.floor(ageDays)} days old (max ${MAX_CLIP_AGE_DAYS}${clip.evergreenUntil ? "; evergreenUntil expired" : ""})`,
        ),
      );
    }
  }

  let embedCount = 0;
  for (const record of input.embeddedMedia) {
    if (record.media.kind !== "embed") continue;
    embedCount++;
    if (!record.media.date) {
      issues.push(
        issue(
          record.file,
          "missing date on embed",
          `${record.media.id || record.owner}: every kind: "embed" media item needs its post's true publish date`,
        ),
      );
      continue;
    }

    const mediaMs = Date.parse(record.media.date);
    if (Number.isNaN(mediaMs)) {
      issues.push(
        issue(
          record.file,
          "unparseable date",
          `${record.media.id || record.owner}: "${record.media.date}"`,
        ),
      );
    } else if (mediaMs > nowMs) {
      issues.push(
        issue(
          record.file,
          "future-dated embed",
          `${record.media.id || record.owner} is dated ${record.media.date}, after NOW: a true publish date can never be in the site's future`,
        ),
      );
    }
  }

  return { issues, clipCount: input.clips.length, embedCount };
}
