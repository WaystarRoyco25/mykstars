import type { MediaItem } from "@/lib/types";
import { IconArrowUpRight, IconCamera } from "./icons";
import { stripEmphasis } from "@/lib/text";
import { isEmbeddablePost } from "@/lib/embeds";
import LiveEmbed from "./LiveEmbed";

const PLATFORM_LABEL: Record<string, string> = {
  tiktok: "TikTok",
  youtube: "YouTube",
};

// A masonry tile for a video embed used to top up a sparse grid so it never
// renders with empty columns. When the item is a specific, embeddable post (a
// YouTube permalink) it renders as a click-to-play player in place (LiveEmbed),
// the same on-site experience as the home rails. When it is only an
// official-account link (a channel URL, the backstop fill), it stays a
// lightweight link-out tile. Either way the media is never rehosted: it lives on
// the source platform and is always credited.
export default function EmbedCard({ item }: { item: MediaItem }) {
  const platform = item.platform ? PLATFORM_LABEL[item.platform] ?? "source" : "source";

  // Real post → live player in an orientation-sized box (layout="flow"): 16:9 for
  // landscape clips, 3:4 otherwise, so a video tile packs into the masonry like a
  // wide brick without collapsing the column.
  if (isEmbeddablePost(item)) {
    return (
      <div className="relative mb-2 break-inside-avoid overflow-hidden rounded-tile border border-line bg-ink-2 md:mb-3">
        <LiveEmbed item={item} layout="flow" />
      </div>
    );
  }

  // Account-only link-out (a profile URL): the lightweight backstop tile.
  return (
    <a
      href={item.embedUrl ?? item.credit.url}
      target="_blank"
      rel="nofollow noopener noreferrer"
      aria-label={`${stripEmphasis(item.alt)}, view on ${platform}`}
      className="group relative mb-2 block aspect-[3/4] break-inside-avoid overflow-hidden rounded-tile border border-line bg-ink-2 md:mb-3"
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center text-bone">
        <IconCamera size={26} className="text-muted-2" />
        <span className="label">Official {platform}</span>
        <span className="label inline-flex items-center gap-1 text-crimson group-hover:underline">
          View on {platform}
          <IconArrowUpRight size={12} />
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-3">
        <span className="block truncate text-[11px] text-muted">{item.credit.name}</span>
      </div>
    </a>
  );
}
