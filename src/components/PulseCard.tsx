import Link from "next/link";
import type { Artist, Pulse } from "@/lib/types";
import { PILLAR_LABELS } from "@/lib/types";
import { absoluteDate } from "@/lib/format";
import { renderEmphasis } from "@/lib/text";
import AttributionBadge from "./AttributionBadge";

// A Pulse rendered as a dark masonry tile, so the lightest feed format (a dated,
// sourced text update) sits in the same grid as video (EmbedCard) and photo
// (PhotoCard) tiles: a text post among the clips, the X-feed grammar. Same
// content as PulseItem, wrapped in the standard tile frame (rounded-tile,
// hairline border, ink-2 lift, crimson hover). Packs into the column masonry as
// a variable-height brick.
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

  return (
    <article className="group mb-2 break-inside-avoid rounded-tile border border-line bg-ink-2 p-5 transition-colors hover:border-crimson md:mb-3">
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
    </article>
  );
}
