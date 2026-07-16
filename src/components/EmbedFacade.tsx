import { EMBED_PLATFORM_LABELS, type MediaItem } from "@/lib/types";
import { stripEmphasis } from "@/lib/text";
import FacadeTile from "./FacadeTile";

// "Embed-first" link-out facade: we DON'T rehost the photo and we DON'T load heavy
// third-party scripts on the critical path. A lightweight tile that links to the
// official post or account; the media stays on the source platform (the server
// test). Used for YouTube/TikTok account link-outs and any unparseable embed.
export default function EmbedFacade({
  item,
  className = "",
}: {
  item: MediaItem;
  className?: string;
}) {
  const platform = item.platform ? EMBED_PLATFORM_LABELS[item.platform] : "source";
  return (
    <a
      href={item.embedUrl ?? item.credit.url}
      target="_blank"
      rel="nofollow noopener noreferrer"
      aria-label={`${stripEmphasis(item.alt)}, view on ${platform}`}
      className={`group block ${className}`}
    >
      <FacadeTile item={item} cta={`View on ${platform}`} />
    </a>
  );
}
