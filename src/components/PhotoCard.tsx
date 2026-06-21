import Link from "next/link";
import type { Gallery } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import { relativeTime } from "@/lib/format";
import PhotoMedia from "./PhotoMedia";
import AttributionBadge from "./AttributionBadge";

// A single gallery card: cover tile + typographic category + serif headline +
// timestamp and credit. Monochrome by design — the photography carries the color.
export default function PhotoCard({
  gallery,
  priority = false,
}: {
  gallery: Gallery;
  priority?: boolean;
}) {
  return (
    <Link href={`/photos/${gallery.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden border border-line">
        <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.03]">
          <PhotoMedia item={gallery.cover} priority={priority} showCredit />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="label text-muted">{CATEGORY_LABELS[gallery.category]}</span>
        <span className="text-muted">·</span>
        <span className="label text-muted">{gallery.media.length} photos</span>
      </div>
      <h3 className="font-serif text-lg leading-snug mt-1.5 group-hover:text-crimson transition-colors">
        {gallery.title}
      </h3>
      <div className="mt-2 flex items-center gap-2 text-xs text-muted">
        <span>{relativeTime(gallery.date)}</span>
        <span>·</span>
        <AttributionBadge source={gallery.source} asLink={false} className="text-muted" />
      </div>
    </Link>
  );
}
