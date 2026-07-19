import "server-only";

import { cache } from "react";

import type { Artist, CareerStage, CoverageLevel } from "../domain/artists";
import type { Pillar } from "../domain/taxonomy";
import { artistPillars, isPromotedArtist } from "../policy/artists";
import { artistStore } from "../stores/artists";

export async function getArtistsByPillar(pillar: Pillar): Promise<Artist[]> {
  return artistStore.byName.filter(
    (artist) => isPromotedArtist(artist) && artistPillars(artist).includes(pillar),
  );
}

const readArtist = cache(async (slug: string): Promise<Artist | undefined> => {
  const artist = artistStore.bySlug.get(slug);
  return artist && artist.publicationState !== "draft" ? artist : undefined;
});

export async function getArtist(slug: string): Promise<Artist | undefined> {
  return readArtist(slug);
}

export async function getArtistsBySlugs(slugs: readonly string[]): Promise<Artist[]> {
  return artistStore
    .forSlugs(slugs)
    .filter((artist) => artist.publicationState !== "draft");
}

export async function getStarsDirectory(opts?: {
  pillar?: Pillar;
  stage?: CareerStage;
  type?: Artist["type"];
  agency?: string;
  debutYear?: number;
  coverage?: CoverageLevel;
  q?: string;
}): Promise<Artist[]> {
  let list = artistStore.byName.filter(
    (artist) => artist.publicationState === "published",
  );
  if (opts?.pillar) {
    list = list.filter((artist) => artistPillars(artist).includes(opts.pillar!));
  }
  if (opts?.stage) list = list.filter((artist) => artist.careerStage === opts.stage);
  if (opts?.type) list = list.filter((artist) => artist.type === opts.type);
  if (opts?.coverage) {
    list = list.filter((artist) => artist.coverageLevel === opts.coverage);
  }
  if (opts?.agency) list = list.filter((artist) => artist.agency === opts.agency);
  if (opts?.debutYear) {
    list = list.filter((artist) => artist.debutYear === opts.debutYear);
  }
  const query = opts?.q?.trim().toLowerCase();
  if (query) list = list.filter((artist) => artist.name.toLowerCase().includes(query));
  return list;
}

export async function getDirectoryFacets(): Promise<{
  agencies: string[];
  debutYears: number[];
}> {
  const published = artistStore.all.filter(
    (artist) => artist.publicationState === "published",
  );
  return {
    agencies: [
      ...new Set(
        published
          .map((artist) => artist.agency)
          .filter((agency): agency is string => Boolean(agency)),
      ),
    ].sort((a, b) => a.localeCompare(b)),
    debutYears: [
      ...new Set(
        published
          .map((artist) => artist.debutYear)
          .filter((year): year is number => typeof year === "number"),
      ),
    ].sort((a, b) => b - a),
  };
}

export function allArtistSlugs(): string[] {
  return artistStore.all
    .filter((artist) => artist.publicationState !== "draft")
    .map((artist) => artist.slug);
}
