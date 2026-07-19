import type { Artist } from "../domain/artists";
import type { Pillar } from "../domain/taxonomy";

export const DEFAULT_ARTIST_PILLAR: Pillar = "k-pop";

export const PROFILE_VERIFICATION_MAX_DAYS = Object.freeze({
  active: 60,
  preview: 120,
  catalog: 190,
});

export function artistPillars(artist: Artist): readonly Pillar[] {
  return artist.pillars ?? [DEFAULT_ARTIST_PILLAR];
}

export function isPromotedArtist(artist: Artist): boolean {
  return artist.coverageLevel === "active" && artist.publicationState === "published";
}

// Unknown slugs may represent external chart, event, or clip subjects.
export function hasPromotedSubject(
  artistSlugs: readonly string[],
  artistsBySlug: ReadonlyMap<string, Artist>,
): boolean {
  return (
    artistSlugs.length === 0 ||
    artistSlugs.some((slug) => {
      const artist = artistsBySlug.get(slug);
      return artist === undefined || isPromotedArtist(artist);
    })
  );
}
