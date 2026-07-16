import Image from "next/image";
import type { MediaItem } from "@/lib/types";
import FacadeTile from "./FacadeTile";
import { stripEmphasis } from "@/lib/text";
import { IconCamera } from "./icons";

const TONES = ["#141414", "#171717", "#1b1b1b", "#191617"];

// Renders one media item to fill its (relatively-positioned) parent.
// - embed      → visual-only facade tile (video stays on source; interactivity,
//                if any, is owned by the caller — a cover <Link>, a filmstrip
//                <button>, or the LiveEmbed player wrapper)
// - image      → next/image (AVIF/WebP negotiation handled by the pipeline)
// - placeholder→ neutral tile standing in for licensed/embedded imagery, with a
//                baked-in credit line (we never strip credits).
export default function PhotoMedia({
  item,
  sizes = "(max-width: 768px) 100vw, 33vw",
  preload = false,
  showCredit = false,
  fit = "cover",
  position,
  compact = false,
}: {
  item: MediaItem;
  sizes?: string;
  preload?: boolean;
  showCredit?: boolean;
  fit?: "cover" | "contain";
  // object-position override (e.g. "50% 30%" to keep portrait faces in frame)
  position?: string;
  // icon-only facade for tiny slots (e.g. the gallery filmstrip)
  compact?: boolean;
}) {
  if (item.kind === "embed") {
    return <FacadeTile item={item} compact={compact} />;
  }

  if (item.kind === "image" && item.src) {
    return (
      <Image
        src={item.src}
        alt={stripEmphasis(item.alt)}
        fill
        sizes={sizes}
        preload={preload}
        className={fit === "contain" ? "object-contain" : "object-cover"}
        style={position ? { objectPosition: position } : undefined}
      />
    );
  }

  const bg = TONES[(item.tone ?? 0) % TONES.length];
  return (
    <div
      role="img"
      aria-label={stripEmphasis(item.alt)}
      className="absolute inset-0 flex items-center justify-center"
      style={{ background: bg }}
    >
      <IconCamera size={30} className="text-[#303030]" />
      {showCredit && (
        <span className="absolute bottom-1.5 right-2 text-[10px] tracking-wide text-white/30">
          {item.credit.name}
        </span>
      )}
    </div>
  );
}
