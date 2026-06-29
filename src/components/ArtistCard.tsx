import Link from "next/link";
import type { Artist } from "@/lib/types";
import { roleLabel } from "@/lib/people";

// One person's card: name, optional Korean name, role and agency, and how many
// credited photo sets they anchor. Shared by the People index (/artists) and the
// home page's "People in focus" grid so the two stay in sync. Server component.
export default function ArtistCard({
  artist,
  photoSets,
}: {
  artist: Artist;
  photoSets: number;
}) {
  return (
    <Link
      href={`/artists/${artist.slug}`}
      className="group bg-ink p-6 hover:bg-ink-2 transition-colors"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-2xl group-hover:text-crimson transition-colors">
          {artist.name}
        </h2>
        {artist.koreanName && <span className="text-muted text-sm">{artist.koreanName}</span>}
      </div>
      <p className="label mt-3 text-muted">
        {roleLabel(artist)}
        {artist.agency ? ` · ${artist.agency}` : ""}
      </p>
      <p className="label mt-1 text-muted">
        {photoSets} photo set{photoSets === 1 ? "" : "s"}
      </p>
    </Link>
  );
}
