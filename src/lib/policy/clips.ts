import type { Clip } from "../domain/stories";
import { DAY_MS } from "./time";

export const MAX_CLIP_AGE_DAYS = 180;

export function isClipFreshAt(clip: Clip, nowMs: number): boolean {
  const clipMs = Date.parse(clip.date);
  if (Number.isNaN(clipMs) || clipMs > nowMs) return false;

  if (clip.evergreenUntil) {
    const evergreenMs = Date.parse(clip.evergreenUntil);
    if (!Number.isNaN(evergreenMs) && evergreenMs >= nowMs) return true;
  }

  return nowMs - clipMs <= MAX_CLIP_AGE_DAYS * DAY_MS;
}
