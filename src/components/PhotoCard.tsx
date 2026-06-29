import Link from "next/link";
import type { Gallery } from "@/lib/types";
import { TAG_LABELS } from "@/lib/types";
import { aspectClass, orientationOf } from "@/lib/media";
import { relativeTime } from "@/lib/format";
import { renderEmphasis } from "@/lib/text";
import PhotoMedia from "./PhotoMedia";
import AttributionBadge from "./AttributionBadge";

// A single gallery card: cover tile + typographic tag + serif headline +
// timestamp and credit. Monochrome by design — the photography carries the color.
// Portrait cards keep the default 3:4; landscape covers break out wide
// (col-span-2 on md+) instead of being cropped to portrait.
export default function PhotoCard({
  gallery,
  priority = false,
}: {
  gallery: Gallery;
  priority?: boolean;
}) {
  const orientation = orientationOf(gallery.cover);
  const wide = orientation === "landscape";
  const sizes = wide
    ? "(max-width: 768px) 100vw, 66vw"
    : "(max-width: 768px) 50vw, 33vw";

  return (
    <Link
      href={`/photos/${gallery.slug}`}
      className={`group block ${wide ? "md:col-span-2" : ""}`}
    >
      <div className={`relative ${aspectClass(orientation)} overflow-hidden border border-line`}>
        <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.03]">
          <PhotoMedia
            item={gallery.cover}
            priority={priority}
            showCredit
            sizes={sizes}
            position={orientation === "portrait" ? "50% 30%" : undefined}
          />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="label text-muted">{TAG_LABELS[gallery.category]}</span>
        <span className="text-muted">·</span>
        <span className="label text-muted">{gallery.media.length} photos</span>
      </div>
      <h3 className="font-serif text-lg leading-snug mt-1.5 group-hover:text-crimson transition-colors">
        {renderEmphasis(gallery.title)}
      </h3>
      <div className="mt-2 flex items-center gap-2 text-xs text-muted">
        <span>{relativeTime(gallery.date)}</span>
        <span>·</span>
        <AttributionBadge source={gallery.source} asLink={false} className="text-muted" />
      </div>
    </Link>
  );
}
