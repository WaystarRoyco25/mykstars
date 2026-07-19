import "server-only";

import { cache } from "react";

import type { Ranking } from "../domain/stories";
import type { Pillar } from "../domain/taxonomy";
import { isPromotedArtist } from "../policy/artists";
import { artistStore } from "../stores/artists";
import { rankingStore } from "../stores/rankings";

function stripUnpromotedLinks(ranking: Ranking): Ranking {
  if (
    !ranking.rows.some((row) => {
      if (!row.artistSlug) return false;
      const artist = artistStore.bySlug.get(row.artistSlug);
      return artist !== undefined && !isPromotedArtist(artist);
    })
  ) {
    return ranking;
  }
  return {
    ...ranking,
    rows: ranking.rows.map((row) => {
      if (!row.artistSlug) return row;
      const artist = artistStore.bySlug.get(row.artistSlug);
      return artist !== undefined && !isPromotedArtist(artist)
        ? { ...row, artistSlug: undefined }
        : row;
    }),
  };
}

const visibleRankings = rankingStore.all.map(stripUnpromotedLinks);
const visibleRankingBySlug = new Map(
  visibleRankings.map((ranking) => [ranking.slug, ranking]),
);
const visibleRankingByPillar = new Map(
  visibleRankings.map((ranking) => [ranking.pillar, ranking]),
);

export async function getRankings(): Promise<Ranking[]> {
  return [...visibleRankings];
}

const readRanking = cache(async (slug: string): Promise<Ranking | undefined> =>
  visibleRankingBySlug.get(slug),
);

export async function getRanking(slug: string): Promise<Ranking | undefined> {
  return readRanking(slug);
}

export async function getRankingForPillar(
  pillar: Pillar,
): Promise<Ranking | undefined> {
  return visibleRankingByPillar.get(pillar);
}
