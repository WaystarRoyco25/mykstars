import Image from "next/image";
import type { MediaItem } from "@/lib/types";
import EmbedFacade from "./EmbedFacade";
import { stripEmphasis } from "@/lib/text";
import { IconCamera } from "./icons";

const TONES = ["#141414", "#171717", "#1b1b1b", "#191617"];

// Renders one media item to fill its (relatively-positioned) parent.
// - embed      → lazy facade (photo stays on source)
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
}: {
  item: MediaItem;
  sizes?: string;
  preload?: boolean;
  showCredit?: boolean;
  fit?: "cover" | "contain";
  // object-position override (e.g. "50% 30%" to keep portrait faces in frame)
  position?: string;
}) {
  if (item.kind === "embed") {
    return <EmbedFacade item={item} className="absolute inset-0" />;
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
