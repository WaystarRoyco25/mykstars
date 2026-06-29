import type { MediaItem } from "@/lib/types";
import { IconArrowUpRight, IconCamera } from "./icons";
import { stripEmphasis } from "@/lib/text";

const PLATFORM_LABEL: Record<string, string> = {
  instagram: "Instagram",
  x: "X",
  tiktok: "TikTok",
  youtube: "YouTube",
};

// A masonry tile that links out to an artist's official account, used to top up
// a sparse grid so it never renders with empty columns. We never rehost the
// photo: the tile only links to the source platform and names the account, the
// same embed-first, legally-safe pattern as EmbedFacade.
export default function EmbedCard({ item }: { item: MediaItem }) {
  const platform = item.platform ? PLATFORM_LABEL[item.platform] ?? "source" : "source";
  return (
    <a
      href={item.embedUrl ?? item.credit.url}
      target="_blank"
      rel="nofollow noopener noreferrer"
      aria-label={`${stripEmphasis(item.alt)}, view on ${platform}`}
      className="group relative mb-2 block aspect-[3/4] break-inside-avoid overflow-hidden border border-line bg-ink-2 md:mb-3"
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
