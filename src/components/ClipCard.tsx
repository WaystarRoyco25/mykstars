import type { Clip, MediaItem } from "@/lib/types";
import AttributionBadge from "./AttributionBadge";
import LiveEmbed from "./LiveEmbed";
import { renderEmphasis } from "@/lib/text";

// LiveEmbed speaks MediaItem, so adapt the Clip on the way in (no stored adapter).
function clipMedia(clip: Clip): MediaItem {
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

// A fixed-width card for the home rails (Reels / Shorts) — the live-video sibling
// of EventCard. The media box reserves its size from first paint so the player
// swaps in without shifting layout. YouTube gets a landscape 16:9 tile (its
// thumbnails are 16:9); the Instagram card is a taller vertical box for the reel.
export default function ClipCard({ clip }: { clip: Clip }) {
  const isIg = clip.platform === "instagram";
  return (
    <div
      className={`group flex shrink-0 snap-start flex-col border border-line transition-colors hover:border-crimson ${
        isIg ? "w-[21rem]" : "w-[22rem]"
      }`}
    >
      <div className={`relative overflow-hidden bg-ink-2 ${isIg ? "h-[28rem]" : "aspect-video"}`}>
        <LiveEmbed item={clipMedia(clip)} />
      </div>
      <div className="flex flex-col gap-1.5 p-3">
        <p className="line-clamp-2 text-sm leading-snug text-bone">{renderEmphasis(clip.caption)}</p>
        <AttributionBadge source={clip.credit} asLink={false} className="text-muted-2" />
      </div>
    </div>
  );
}
