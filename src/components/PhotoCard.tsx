import Link from "next/link";
import type { Gallery } from "@/lib/types";
import { aspectClass, orientationOf } from "@/lib/media";
import { relativeTime } from "@/lib/format";
import { renderEmphasis } from "@/lib/text";
import PhotoMedia from "./PhotoMedia";
import { NOW } from "@/lib/seed";

// A single gallery brick in the column-balanced masonry: the cover fills its box
// and crops to fit (aspectClass sets the box shape per orientation), with a black
// gradient bar carrying title, timestamp and credit at the bottom. Monochrome by
// design, the photography carries the color. Portraits sit tall, landscapes wide,
// so bricks of different heights interlock with no empty space (see GalleryGrid).
export default function PhotoCard({
  gallery,
  preload = false,
}: {
  gallery: Gallery;
  preload?: boolean;
}) {
  const orientation = orientationOf(gallery.cover);
  // Keep faces in frame as covers crop to their cell.
  const position =
    orientation === "portrait"
      ? "50% 30%"
      : orientation === "square"
        ? "50% 35%"
        : undefined;

  return (
    <Link
      href={`/photos/${gallery.slug}`}
      className={`group relative mb-2 md:mb-3 block break-inside-avoid overflow-hidden rounded-tile border border-line ${aspectClass(orientation)}`}
    >
      <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.03]">
        <PhotoMedia
          item={gallery.cover}
          preload={preload}
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw"
          position={position}
        />
      </div>

      {/* Gradient info bar — fades the photo into black so the type stays legible. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink via-ink/55 to-transparent"
        aria-hidden
      />
      <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-3">
        <h3 className="font-serif text-sm sm:text-base leading-snug text-bone line-clamp-2 group-hover:text-crimson transition-colors">
          {renderEmphasis(gallery.title)}
        </h3>
        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted">
          <span className="shrink-0 whitespace-nowrap">{relativeTime(gallery.date, NOW)}</span>
          <span aria-hidden className="shrink-0">·</span>
          <span className="min-w-0 truncate">via {gallery.source.name}</span>
        </div>
      </div>
    </Link>
  );
}
