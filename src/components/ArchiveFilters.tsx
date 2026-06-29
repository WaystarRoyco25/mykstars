import Link from "next/link";
import type { CategoryTag, GallerySort, Pillar } from "@/lib/types";
import {
  PILLAR_LABELS,
  PILLAR_ORDER,
  PILLAR_TAGS,
  TAG_LABELS,
  pillarSlug,
} from "@/lib/types";
import { IconClose } from "./icons";

// Typographic filter for the photo archive (/photos) — red active underline,
// pure <Link>s (no client JS), mirroring ScheduleFilter / CategoryFilter. Three
// stacked rows (pillar, then tag, then sort) plus a removable artist pill. The
// active state is driven by the page's ?pillar / ?tag / ?artist / ?sort params;
// "All" and "Latest" are the defaults and are never serialized, so the bare
// /photos is the canonical "everything, newest" view.
type Props = {
  activePillar: Pillar | null;
  activeTag: CategoryTag | null;
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
  tag?: CategoryTag | null;
  artist?: string | null;
  sort?: GallerySort;
}): string {
  const params = new URLSearchParams();
  if (p.pillar) params.set("pillar", pillarSlug(p.pillar));
  if (p.tag) params.set("tag", p.tag);
  if (p.artist) params.set("artist", p.artist);
  if (p.sort && p.sort !== "latest") params.set("sort", p.sort);
  const qs = params.toString();
  return qs ? `${BASE}?${qs}` : BASE;
}

function chipClass(isActive: boolean): string {
  return `label whitespace-nowrap pb-1.5 border-b-2 transition-colors ${
    isActive ? "text-bone border-crimson" : "border-transparent hover:text-bone"
  }`;
}

const SORTS: { key: GallerySort; label: string }[] = [
  { key: "latest", label: "Latest" },
  { key: "oldest", label: "Oldest" },
  { key: "photos", label: "Most photos" },
];

export default function ArchiveFilters({
  activePillar,
  activeTag,
  activeArtist,
  activeArtistName,
  activeSort,
}: Props) {
  return (
    <div className="flex flex-col gap-3">
      {/* Pillar — the primary axis. Switching pillar drops the now-invalid tag. */}
      <nav
        aria-label="Filter by pillar"
        className="flex items-center gap-5 sm:gap-7 overflow-x-auto"
      >
        <Link
          href={buildHref({ pillar: null, tag: null, artist: activeArtist, sort: activeSort })}
          aria-current={activePillar === null ? "page" : undefined}
          className={chipClass(activePillar === null)}
        >
          All
        </Link>
        {PILLAR_ORDER.map((p) => (
          <Link
            key={p}
            href={buildHref({ pillar: p, tag: null, artist: activeArtist, sort: activeSort })}
            aria-current={activePillar === p ? "page" : undefined}
            className={chipClass(activePillar === p)}
          >
            {PILLAR_LABELS[p]}
          </Link>
        ))}
      </nav>

      {/* Tag — only within an active pillar (tag is a within-pillar refinement). */}
      {activePillar && (
        <nav
          aria-label="Filter by tag"
          className="flex items-center gap-5 sm:gap-7 overflow-x-auto text-muted-2"
        >
          <Link
            href={buildHref({ pillar: activePillar, tag: null, artist: activeArtist, sort: activeSort })}
            aria-current={activeTag === null ? "page" : undefined}
            className={chipClass(activeTag === null)}
          >
            All
          </Link>
          {PILLAR_TAGS[activePillar].map((t) => (
            <Link
              key={t}
              href={buildHref({ pillar: activePillar, tag: t, artist: activeArtist, sort: activeSort })}
              aria-current={activeTag === t ? "page" : undefined}
              className={chipClass(activeTag === t)}
            >
              {TAG_LABELS[t]}
            </Link>
          ))}
        </nav>
      )}

      {/* Sort */}
      <nav
        aria-label="Sort"
        className="flex items-center gap-5 sm:gap-7 overflow-x-auto text-muted-2"
      >
        {SORTS.map(({ key, label }) => (
          <Link
            key={key}
            href={buildHref({ pillar: activePillar, tag: activeTag, artist: activeArtist, sort: key })}
            aria-current={activeSort === key ? "page" : undefined}
            className={chipClass(activeSort === key)}
          >
            {label}
          </Link>
        ))}
      </nav>

      {/* Active artist — a removable pill (no on-page artist picker by design). */}
      {activeArtist && (
        <div>
          <Link
            href={buildHref({ pillar: activePillar, tag: activeTag, artist: null, sort: activeSort })}
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
