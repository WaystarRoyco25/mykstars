"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MediaItem } from "@/lib/types";
import PhotoMedia from "./PhotoMedia";
import AttributionBadge from "./AttributionBadge";
import { IconChevronLeft, IconChevronRight } from "./icons";

// Swipeable, keyboard-navigable gallery stage + filmstrip. Each frame shows its
// own credit, reinforcing per-image attribution.
export default function GalleryViewer({ media }: { media: MediaItem[] }) {
  const [index, setIndex] = useState(0);
  const total = media.length;
  const touchX = useRef<number | null>(null);

  const go = useCallback(
    (n: number) => setIndex(((n % total) + total) % total),
    [total],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, go]);

  const current = media[index];

  return (
    <section aria-roledescription="carousel" aria-label="Photo gallery">
      <div
        className="relative aspect-[3/2] border border-line overflow-hidden bg-ink-2 select-none"
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
          touchX.current = null;
        }}
      >
        <PhotoMedia item={current} sizes="(max-width: 1024px) 100vw, 960px" priority showCredit />

        <button
          type="button"
          onClick={() => go(index - 1)}
          aria-label="Previous photo"
          className="absolute left-0 top-0 h-full w-14 flex items-center justify-center text-bone bg-ink/30 hover:bg-ink/60 transition-colors"
        >
          <IconChevronLeft size={28} />
        </button>
        <button
          type="button"
          onClick={() => go(index + 1)}
          aria-label="Next photo"
          className="absolute right-0 top-0 h-full w-14 flex items-center justify-center text-bone bg-ink/30 hover:bg-ink/60 transition-colors"
        >
          <IconChevronRight size={28} />
        </button>

        <span className="absolute top-3 right-3 label text-bone bg-ink/60 px-2 py-1">
          {index + 1} / {total}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-4">
        <p className="text-sm text-muted">{current.alt}</p>
        <AttributionBadge source={current.credit} />
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        {media.map((m, i) => (
          <button
            type="button"
            key={m.id}
            onClick={() => setIndex(i)}
            aria-label={`Go to photo ${i + 1}`}
            aria-current={i === index ? "true" : undefined}
            className={`relative shrink-0 w-20 aspect-square border overflow-hidden transition-colors ${
              i === index ? "border-crimson" : "border-line hover:border-muted-2"
            }`}
          >
            <PhotoMedia item={m} sizes="80px" />
          </button>
        ))}
      </div>
    </section>
  );
}
