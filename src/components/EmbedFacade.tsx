import type { MediaItem } from "@/lib/types";
import { IconArrowUpRight, IconCamera } from "./icons";
import { stripEmphasis } from "@/lib/text";

const PLATFORM_LABEL: Record<string, string> = {
  tiktok: "TikTok",
  youtube: "YouTube",
};

// "Embed-first" facade: we DON'T rehost the photo and we DON'T load heavy
// third-party scripts on the critical path. We render a lightweight placeholder
// that links to the official post; the real oEmbed can hydrate on interaction
// later. The photo stays on the source platform — the legally safest pattern.
export default function EmbedFacade({
  item,
  className = "",
}: {
  item: MediaItem;
  className?: string;
}) {
  const platform = item.platform ? PLATFORM_LABEL[item.platform] ?? "source" : "source";
  return (
    <a
      href={item.embedUrl ?? item.credit.url}
      target="_blank"
      rel="nofollow noopener noreferrer"
      aria-label={`${stripEmphasis(item.alt)}, view on ${platform}`}
      className={`group flex h-full w-full flex-col items-center justify-center gap-3 bg-ink-2 text-bone ${className}`}
    >
      <IconCamera size={26} className="text-muted-2" />
      <span className="label">Official {platform} post</span>
      <span className="label text-crimson inline-flex items-center gap-1">
        View on {platform}
        <IconArrowUpRight size={12} />
      </span>
    </a>
  );
}
