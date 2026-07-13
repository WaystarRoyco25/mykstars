import type { Metadata } from "next";
import { clipFillMedia, getArchiveGalleries, getArtist } from "@/lib/data";
import { pillarFromSlug } from "@/lib/types";
import type { GallerySort } from "@/lib/types";
import { singleParam } from "@/lib/params";
import ArchiveFilters from "@/components/ArchiveFilters";
import GalleryGrid from "@/components/GalleryGrid";

export const metadata: Metadata = {
  title: "Photo archive",
  description:
    "The full MyKStars photo archive: every credited set of Korean celebrities across K-Pop, K-Drama, K-Movie and Fashion. Filter by pillar or artist and sort by date or size.",
};

export default async function PhotosPage({
  searchParams,
}: PageProps<"/photos">) {
  const query = await searchParams;
  const pillarParam = singleParam(query.pillar);
  const artistParam = singleParam(query.artist);
  const sortParam = singleParam(query.sort);

  // Validate page-side: unknown values are dropped, so a junk query degrades to
  // the unfiltered view rather than 404ing.
  const pillar = pillarFromSlug(pillarParam ?? "") ?? null;
  // getArtist both validates the slug and gives us the name for the pill label.
  const artist = artistParam ? await getArtist(artistParam) : undefined;
  const sort: GallerySort =
    sortParam === "oldest" || sortParam === "photos" ? sortParam : "latest";

  const galleries = await getArchiveGalleries({
    pillar: pillar ?? undefined,
    artist: artist?.slug,
    sort,
  });
  // Unfiltered and empty means the whole archive is archived placeholders —
  // the wave-1a interim — so the page leads with video instead of filters.
  const interim =
    galleries.length === 0 && !pillar && !artist && sort === "latest";

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <header className="mb-8">
        <p className="kicker">Photos</p>
        <h1 className="font-serif text-4xl sm:text-5xl mt-2">The archive</h1>
        <p className="text-muted mt-3 max-w-2xl leading-relaxed">
          Every credited set across K-Pop, K-Drama, Fashion and K-Movie, in one
          place. Narrow by pillar or artist, and sort by newest, oldest or most
          photos. Every set links back to its source.
        </p>
      </header>

      {interim ? (
        // The interim while every placeholder gallery sits archived: no dead
        // filters over an empty archive; official video keeps the surface alive.
        <>
          <p className="text-muted -mt-2 mb-8 max-w-2xl leading-relaxed">
            Photo sets return as permitted photography lands. Until then,
            official video keeps the record moving: every tile below plays in
            place and links back to its channel.
          </p>
          <GalleryGrid galleries={[]} fillEmbeds={clipFillMedia(18)} />
        </>
      ) : (
        <>
          <div className="border-b border-line pb-4">
            <ArchiveFilters
              activePillar={pillar}
              activeArtist={artist?.slug ?? null}
              activeArtistName={artist?.name}
              activeSort={sort}
            />
          </div>

          <p className="label text-muted mt-4 mb-6">
            {galleries.length} {galleries.length === 1 ? "photo set" : "photo sets"}
          </p>

          {galleries.length > 0 ? (
            <GalleryGrid galleries={galleries} preloadCount={3} />
          ) : (
            <p className="text-muted">No photo sets match this filter yet.</p>
          )}
        </>
      )}
    </div>
  );
}
