import type { Clip } from "@/lib/types";
import AttributionBadge from "./AttributionBadge";
import LiveEmbed from "./LiveEmbed";
import { clipMedia } from "@/lib/media";
import { renderEmphasis } from "@/lib/text";

// A fixed-width card for the home video rails (In motion / On air), the
// live-video sibling of EventCard: a landscape 16:9 tile (YouTube thumbnails are
// 16:9) that swaps to the real player on click.
export default function ClipCard({ clip }: { clip: Clip }) {
  return (
    <div className="group flex w-[22rem] shrink-0 snap-start flex-col overflow-hidden rounded-tile border border-line transition-colors hover:border-crimson">
      <div className="relative aspect-video overflow-hidden bg-ink-2">
        <LiveEmbed item={clipMedia(clip)} />
      </div>
      <div className="flex flex-col gap-1.5 p-3">
        <p className="line-clamp-2 text-sm leading-snug text-bone">{renderEmphasis(clip.caption)}</p>
        <AttributionBadge source={clip.credit} asLink={false} className="text-muted-2" />
      </div>
    </div>
  );
}
