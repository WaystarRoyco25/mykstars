import Image from "next/image";
import type { MediaItem } from "@/lib/types";
import EmbedFacade from "./EmbedFacade";
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
  priority = false,
  showCredit = false,
}: {
  item: MediaItem;
  sizes?: string;
  priority?: boolean;
  showCredit?: boolean;
}) {
  if (item.kind === "embed") {
    return <EmbedFacade item={item} className="absolute inset-0" />;
  }

  if (item.kind === "image" && item.src) {
    return (
      <Image
        src={item.src}
        alt={item.alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
      />
    );
  }

  const bg = TONES[(item.tone ?? 0) % TONES.length];
  return (
    <div
      role="img"
      aria-label={item.alt}
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
