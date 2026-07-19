import "server-only";

import { cache } from "react";

import { NOW } from "../../content/now";
import type { Artist } from "../domain/artists";
import type { FeedEdition } from "../domain/editions";
import { isPromotedArtist } from "../policy/artists";
import { artistStore } from "../stores/artists";
import { editionStore } from "../stores/editions";

const readCurrentEdition = cache(
  async (nowIso: string): Promise<FeedEdition | undefined> => {
    const monthId = nowIso.slice(0, 7);
    const currentMonth = editionStore.byId.get(monthId);
    if (currentMonth) return currentMonth;

    const nowMs = Date.parse(nowIso);
    if (Number.isNaN(nowMs)) return undefined;
    return editionStore.all
      .filter((edition) => {
        const publishedMs = Date.parse(edition.publishedAt);
        return !Number.isNaN(publishedMs) && publishedMs <= nowMs;
      })
      .toSorted((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))[0];
  },
);

export async function getCurrentEdition(
  nowIso: string = NOW,
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
  return artistStore
    .forSlugs([
      ...edition.spotlight.anchors,
      ...(edition.spotlight.weeks[week] ?? []),
    ])
    .filter(isPromotedArtist);
}

export async function getSpotlightForDate(dateIso: string): Promise<Artist[]> {
  const edition = await getCurrentEdition(dateIso);
  return edition ? resolveSpotlightForDate(edition, dateIso) : [];
}
