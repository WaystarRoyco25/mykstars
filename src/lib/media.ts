import type { MediaItem, Orientation } from "./domain/media";
import type { Clip } from "./domain/stories";

// Resolve a media item's orientation for the vertical-leaning masonry.
// Stored images arrive with an orientation derived by the asset resolver.
// Embeds and placeholders may provide a contextual orientation; otherwise the
// grid defaults to portrait so its existing vertical rhythm stays intact.
export function orientationOf(m: MediaItem): Orientation {
  return m.orientation ?? "portrait";
}

// Tailwind aspect-ratio class per orientation for the column-balanced masonry.
// Portraits get a tall box, landscapes a wide one, squares a 1:1 cell; the cover
// crops to fill via object-cover. Different heights interlock like bricks while
// CSS multi-column balancing keeps the columns even, so there is no empty space
// regardless of how many galleries a page holds (see GalleryGrid).
export function aspectClass(o: Orientation): string {
  if (o === "landscape") return "aspect-[3/2]";
  if (o === "square") return "aspect-square";
  return "aspect-[3/4]";
}

// Adapt a Clip to the MediaItem the embed renderers speak (LiveEmbed, PhotoMedia,
// EmbedCard). Pure mapping, no I/O: the single source of truth for the Clip ->
// MediaItem shape, shared by the home rails (ClipCard) and the grid fill (data.ts).
// Reels/Shorts default to portrait.
export function clipMedia(clip: Clip): MediaItem {
  return {
    id: clip.id,
    kind: "embed",
    platform: clip.platform,
    embedUrl: clip.embedUrl,
    alt: clip.caption,
    credit: clip.credit,
    orientation: clip.orientation ?? "portrait",
  };
}
