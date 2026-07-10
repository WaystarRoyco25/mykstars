import Link from "next/link";
import type { GallerySort, Pillar } from "@/lib/types";
import { PILLAR_LABELS, PILLAR_ORDER, pillarSlug } from "@/lib/types";
import { IconClose } from "./icons";
import FilterLink from "./FilterLink";

// Typographic filter for the photo archive (/photos) — red active underline,
// pure <Link>s (no client JS), mirroring ScheduleFilter. Two stacked rows
// (pillar, then sort) plus a removable artist pill. The active state is driven
// by the page's ?pillar / ?artist / ?sort params; "All" and "Latest" are the
// defaults and are never serialized, so the bare /photos is the canonical
// "everything, newest" view.
type Props = {
  activePillar: Pillar | null;
  activeArtist: string | null; // slug; null when not filtering by artist
  activeArtistName?: string; // resolved page-side, for the removable pill label
  activeSort: GallerySort;
};

const BASE = "/photos";

// Build a /photos href from a full param set, omitting defaults so the canonical
// view stays bare (mirrors ScheduleFilter.buildHref). Pillar serializes to its
// URL slug; sort omits "latest".
function buildHref(p: {
  pillar?: Pillar | null;
  artist?: string | null;
  sort?: GallerySort;
}): string {
  const params = new URLSearchParams();
  if (p.pillar) params.set("pillar", pillarSlug(p.pillar));
  if (p.artist) params.set("artist", p.artist);
  if (p.sort && p.sort !== "latest") params.set("sort", p.sort);
  const qs = params.toString();
  return qs ? `${BASE}?${qs}` : BASE;
}

const SORTS: { key: GallerySort; label: string }[] = [
  { key: "latest", label: "Latest" },
  { key: "oldest", label: "Oldest" },
  { key: "photos", label: "Most photos" },
];

export default function ArchiveFilters({
  activePillar,
  activeArtist,
  activeArtistName,
  activeSort,
}: Props) {
  return (
    <div className="flex flex-col gap-3">
      {/* Pillar — the primary axis. */}
      <nav
        aria-label="Filter by pillar"
        className="flex items-center gap-5 sm:gap-7 overflow-x-auto"
      >
        <FilterLink
          href={buildHref({ pillar: null, artist: activeArtist, sort: activeSort })}
          active={activePillar === null}
        >
          All
        </FilterLink>
        {PILLAR_ORDER.map((p) => (
          <FilterLink
            key={p}
            href={buildHref({ pillar: p, artist: activeArtist, sort: activeSort })}
            active={activePillar === p}
          >
            {PILLAR_LABELS[p]}
          </FilterLink>
        ))}
      </nav>

      {/* Sort */}
      <nav
        aria-label="Sort"
        className="flex items-center gap-5 sm:gap-7 overflow-x-auto text-muted-2"
      >
        {SORTS.map(({ key, label }) => (
          <FilterLink
            key={key}
            href={buildHref({ pillar: activePillar, artist: activeArtist, sort: key })}
            active={activeSort === key}
          >
            {label}
          </FilterLink>
        ))}
      </nav>

      {/* Active artist — a removable pill (no on-page artist picker by design). */}
      {activeArtist && (
        <div>
          <Link
            href={buildHref({ pillar: activePillar, artist: null, sort: activeSort })}
            className="label inline-flex items-center gap-1.5 border border-line px-3 py-1.5 hover:border-crimson hover:text-bone transition-colors"
          >
            <span>Artist: {activeArtistName ?? activeArtist}</span>
            <IconClose size={12} />
          </Link>
        </div>
      )}
    </div>
  );
}
