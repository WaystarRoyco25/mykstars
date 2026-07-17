import { cache } from "react";

import { contentRepository } from "../content-repository";
import { isPromotedArtist } from "../editorial-policy";
import type { Artist, FeedEdition } from "../types";

const repository = contentRepository;

const readCurrentEdition = cache(
  async (nowIso: string): Promise<FeedEdition | undefined> => {
    const monthId = nowIso.slice(0, 7);
    const currentMonth = repository.editionById.get(monthId);
    if (currentMonth) return currentMonth;

    const nowMs = Date.parse(nowIso);
    if (Number.isNaN(nowMs)) return undefined;
    return repository.editions
      .filter((edition) => {
        const publishedMs = Date.parse(edition.publishedAt);
        return !Number.isNaN(publishedMs) && publishedMs <= nowMs;
      })
      .toSorted((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))[0];
  },
);

export async function getCurrentEdition(
  nowIso: string = repository.now,
): Promise<FeedEdition | undefined> {
  return readCurrentEdition(nowIso);
}

export function spotlightWeekIndex(dateIso: string): number {
  const day = Number(dateIso.slice(8, 10));
  if (!Number.isFinite(day) || day <= 7) return 0;
  if (day <= 14) return 1;
  if (day <= 21) return 2;
  return 3;
}

export function resolveSpotlightForDate(
  edition: FeedEdition,
  dateIso: string,
): Artist[] {
  const week = spotlightWeekIndex(dateIso);
  return repository
    .artistsForSlugs([
      ...edition.spotlight.anchors,
      ...(edition.spotlight.weeks[week] ?? []),
    ])
    .filter(isPromotedArtist);
}

export async function getSpotlightForDate(dateIso: string): Promise<Artist[]> {
  const edition = await getCurrentEdition(dateIso);
  return edition ? resolveSpotlightForDate(edition, dateIso) : [];
}
