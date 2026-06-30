import type { Clip } from "@/lib/types";
import AttributionBadge from "./AttributionBadge";
import LiveEmbed from "./LiveEmbed";
import { clipMedia } from "@/lib/media";
import { renderEmphasis } from "@/lib/text";

// A fixed-width card for the home rails (Reels / Shorts), the live-video sibling
// of EventCard. YouTube gets a fixed landscape 16:9 tile (its thumbnails are 16:9)
// that swaps to the player on click. Instagram loads the real reel in place as it
// scrolls into view and grows the card to the reel's natural height (layout="flow"),
// so the rail reflows as tiles lazy-load.
export default function ClipCard({ clip }: { clip: Clip }) {
  const isIg = clip.platform === "instagram";
  return (
    <div
      className={`group flex shrink-0 snap-start flex-col border border-line transition-colors hover:border-crimson ${
        isIg ? "w-[21rem]" : "w-[22rem]"
      }`}
    >
      <div className={`relative bg-ink-2 ${isIg ? "" : "aspect-video overflow-hidden"}`}>
        <LiveEmbed item={clipMedia(clip)} layout={isIg ? "flow" : "fill"} />
      </div>
      <div className="flex flex-col gap-1.5 p-3">
        <p className="line-clamp-2 text-sm leading-snug text-bone">{renderEmphasis(clip.caption)}</p>
        <AttributionBadge source={clip.credit} asLink={false} className="text-muted-2" />
      </div>
    </div>
  );
}
