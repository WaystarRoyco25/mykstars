import type { Metadata } from "next";
import { getArchiveGalleries, getArtist } from "@/lib/data";
import { PILLAR_TAGS, pillarFromSlug } from "@/lib/types";
import type { CategoryTag, GallerySort } from "@/lib/types";
import ArchiveFilters from "@/components/ArchiveFilters";
import GalleryGrid from "@/components/GalleryGrid";

export const metadata: Metadata = {
  title: "Photo archive",
  description:
    "The full MyKStars photo archive: every credited set of Korean celebrities across K-Pop, K-Drama, K-Movie and Fashion. Filter by pillar, tag or artist and sort by date or size.",
};

export default async function PhotosPage({
  searchParams,
}: {
  searchParams: Promise<{ pillar?: string; tag?: string; artist?: string; sort?: string }>;
}) {
  const {
    pillar: pillarParam,
    tag: tagParam,
    artist: artistParam,
    sort: sortParam,
  } = await searchParams;

  // Validate page-side (same idiom as the pillar pages): unknown values are
  // dropped, so a junk query degrades to the unfiltered view rather than 404ing.
  const pillar = pillarFromSlug(pillarParam ?? "") ?? null;
  const activeTag =
    pillar && PILLAR_TAGS[pillar].includes(tagParam as CategoryTag)
      ? (tagParam as CategoryTag)
      : null;
  // getArtist both validates the slug and gives us the name for the pill label.
  const artist = artistParam ? await getArtist(artistParam) : undefined;
  const sort: GallerySort =
    sortParam === "oldest" || sortParam === "photos" ? sortParam : "latest";

  const galleries = await getArchiveGalleries({
    pillar: pillar ?? undefined,
    tag: activeTag ?? undefined,
    artist: artist?.slug,
    sort,
  });

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <header className="mb-8">
        <p className="kicker">Photos</p>
        <h1 className="font-serif text-4xl sm:text-5xl mt-2">The archive</h1>
        <p className="text-muted mt-3 max-w-2xl leading-relaxed">
          Every credited set across K-Pop, K-Drama, Fashion and K-Movie, in one
          place. Narrow by pillar, tag or artist, and sort by newest, oldest or
          most photos. Every set links back to its source.
        </p>
      </header>

      <div className="border-b border-line pb-4">
        <ArchiveFilters
          activePillar={pillar}
          activeTag={activeTag}
          activeArtist={artist?.slug ?? null}
          activeArtistName={artist?.name}
          activeSort={sort}
        />
      </div>

      <p className="label text-muted mt-4 mb-6">
        {galleries.length} {galleries.length === 1 ? "photo set" : "photo sets"}
      </p>

      {galleries.length > 0 ? (
        <GalleryGrid galleries={galleries} priorityCount={3} />
      ) : (
        <p className="text-muted">No photo sets match this filter yet.</p>
      )}
    </div>
  );
}
