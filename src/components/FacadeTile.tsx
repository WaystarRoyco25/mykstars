import { EMBED_PLATFORM_LABELS, type MediaItem } from "@/lib/types";
import { IconArrowUpRight, IconCamera, IconInstagram } from "./icons";
import { stripEmphasis } from "@/lib/text";

// The shared visual for an embed facade: a branded dark tile shown before a
// reveal, or as the face of a link-out. Presentational only — interactivity (a
// link or a reveal button) is owned by the parent, so this is safe to drop inside
// a <Link> cover or a filmstrip <button> without nesting interactive elements.
// It renders no photo (an embed gives us no file to host); the real image loads
// from the source platform on reveal. Fills its relatively-positioned parent.
export default function FacadeTile({
  item,
  cta,
  compact = false,
}: {
  item: MediaItem;
  cta?: string;
  compact?: boolean;
}) {
  const platform = item.platform ? EMBED_PLATFORM_LABELS[item.platform] : "source";
  const Icon = item.platform === "instagram" ? IconInstagram : IconCamera;
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-ink-2 to-ink px-4 text-center text-bone">
      <Icon
        size={compact ? 20 : 26}
        className="text-muted-2 transition-colors duration-500 group-hover:text-crimson"
      />
      {!compact && <span className="label">Official {platform} post</span>}
      {!compact && cta && (
        <span className="label inline-flex items-center gap-1 text-crimson">
          {cta}
          <IconArrowUpRight size={12} />
        </span>
      )}
      <span className="sr-only">{stripEmphasis(item.alt)}</span>
    </div>
  );
}
