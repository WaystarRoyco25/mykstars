import type { Gallery, MediaItem } from "@/lib/types";
import PhotoCard from "./PhotoCard";
import EmbedCard from "./EmbedCard";

// The single site-wide photo grid: a column-balanced masonry (see PhotoCard).
// A sparse grid is topped up so it never renders with empty columns: `fillEmbeds`
// (the artist's official-account tiles) come first, then `fillGalleries` (related
// same-pillar sets, the fallback for artists with no accounts). Both flow in after
// the artist's own galleries and settle into the shortest columns. Empty by
// default, so a full grid is unchanged.
export default function GalleryGrid({
  galleries,
  preloadCount = 0,
  fillEmbeds = [],
  fillGalleries = [],
}: {
  galleries: Gallery[];
  preloadCount?: number;
  fillEmbeds?: MediaItem[];
  fillGalleries?: Gallery[];
}) {
  return (
    <div className="columns-1 sm:columns-2 md:columns-3 gap-2 md:gap-3">
      {galleries.map((g, i) => (
        <PhotoCard key={g.slug} gallery={g} preload={i < preloadCount} />
      ))}
      {fillEmbeds.map((m) => (
        <EmbedCard key={m.id} item={m} />
      ))}
      {fillGalleries.map((g) => (
        <PhotoCard key={g.slug} gallery={g} />
      ))}
    </div>
  );
}
