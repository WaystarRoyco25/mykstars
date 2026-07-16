import Link from "next/link";
import type { Artist, Pulse } from "@/lib/types";
import { PILLAR_LABELS } from "@/lib/types";
import { absoluteDate } from "@/lib/format";
import { renderEmphasis } from "@/lib/text";
import { aspectClass, orientationOf } from "@/lib/media";
import AttributionBadge from "./AttributionBadge";
import PhotoMedia from "./PhotoMedia";
import LiveEmbed from "./LiveEmbed";

// A Pulse rendered as a dark masonry tile, so the lightest feed format (a dated,
// sourced text update) sits in the same grid as video (EmbedCard) and photo
// (PhotoCard) tiles: a text post among the clips, the X-feed grammar. When a
// Pulse carries permitted photography (media.kind === "image") the photo leads
// the tile, magazine-card style, with its own credit chip so a photo credit is
// never dropped. Same content as PulseItem, wrapped in the standard tile frame
// (rounded-tile, hairline border, ink-2 lift, crimson hover). Packs into the
// column masonry as a variable-height brick.
export default function PulseCard({
  pulse,
  artists,
}: {
  pulse: Pulse;
  artists: Artist[];
}) {
  const artistNames =
    artists.length > 0
      ? artists.map((artist) => artist.name).join(", ")
      : PILLAR_LABELS[pulse.pillar];
  const photo = pulse.media?.kind === "image" ? pulse.media : undefined;
  // An embed lead (an official video) plays in place on tap rather than linking
  // to the detail page, so the clip is one tap away in the feed.
  const embed = pulse.media?.kind === "embed" ? pulse.media : undefined;

  return (
    <article className="group mb-2 break-inside-avoid overflow-hidden rounded-tile border border-line bg-ink-2 transition-colors hover:border-crimson md:mb-3">
      {photo && (
        <div className="relative">
          <Link
            href={`/pulse/${pulse.slug}`}
            className={`relative block ${aspectClass(orientationOf(photo))}`}
          >
            <PhotoMedia
              item={photo}
              sizes="(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw"
            />
          </Link>
          <AttributionBadge
            source={photo.credit}
            className="absolute bottom-2 right-2 z-10 rounded-full bg-black/55 px-2 py-0.5 text-[10px] text-white/80 backdrop-blur-sm"
          />
        </div>
      )}
      {embed && (
        <div className="relative">
          <div className={`relative ${aspectClass(orientationOf(embed))}`}>
            <LiveEmbed item={embed} />
          </div>
          <AttributionBadge
            source={embed.credit}
            className="absolute bottom-2 right-2 z-10 rounded-full bg-black/55 px-2 py-0.5 text-[10px] text-white/80 backdrop-blur-sm"
          />
        </div>
      )}
      <div className="p-5">
        <p className="label text-muted">
          {artistNames} · {absoluteDate(pulse.date)}
        </p>
        <Link href={`/pulse/${pulse.slug}`} className="mt-2 inline-block">
          <h3 className="font-serif text-xl leading-snug transition-colors group-hover:text-crimson">
            {renderEmphasis(pulse.heading)}
          </h3>
        </Link>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {renderEmphasis(pulse.body)}
        </p>
        <AttributionBadge source={pulse.source} className="mt-3 text-muted" />
      </div>
    </article>
  );
}
