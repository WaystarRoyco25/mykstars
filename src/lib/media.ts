import type { MediaItem, Orientation } from "./types";

// Resolve a media item's orientation for the vertical-leaning masonry.
// Explicit `orientation` wins; otherwise derive from intrinsic width/height
// (with a small tolerance band → "square"); default to portrait so the grid
// leans vertical even when an item carries no dimensions.
export function orientationOf(m: MediaItem): Orientation {
  if (m.orientation) return m.orientation;
  if (m.width && m.height) {
    if (m.width > m.height * 1.15) return "landscape";
    if (m.height > m.width * 1.15) return "portrait";
    return "square";
  }
  return "portrait";
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
