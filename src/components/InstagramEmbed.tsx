"use client";

import { useEffect, useRef, useState } from "react";
import type { MediaItem } from "@/lib/types";
import { instagramPermalink } from "@/lib/embeds";
import { loadInstagram, prefetchInstagram } from "@/lib/instagram-embed";
import FacadeTile from "./FacadeTile";
import InstagramLightbox from "./InstagramLightbox";
import { stripEmphasis } from "@/lib/text";

// The in-feed Instagram tile: a light, crawlable facade that reveals the real
// post in a modal on tap. The <a> is a real link to the permalink (works with no
// JS and for crawlers, and modified-clicks still open the post in a new tab);
// with JS it opens the lightbox instead. embed.js is prefetched — not executed —
// when the tile nears the viewport, so the first reveal feels instant while the
// scroll path stays free of third-party code. Fills its relatively-positioned
// parent (pass className="absolute inset-0" from a fill-layout caller).
export default function InstagramEmbed({
  item,
  className = "",
}: {
  item: MediaItem;
  className?: string;
}) {
  const permalink = instagramPermalink(item.embedUrl);
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLAnchorElement>(null);
  const label = stripEmphasis(item.alt);

  // Warm caches once the tile is within ~a screen of the viewport. Nothing
  // executes; this only preconnects and caches the script bytes.
  useEffect(() => {
    const el = anchorRef.current;
    if (!el || !permalink) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          prefetchInstagram();
          io.disconnect();
        }
      },
      { rootMargin: "600px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [permalink]);

  // Unparseable permalink → a plain link-out, never a broken embed.
  if (!permalink) {
    return (
      <a
        href={item.embedUrl ?? item.credit.url}
        target="_blank"
        rel="nofollow noopener noreferrer"
        aria-label={`${label}, view on Instagram`}
        className={`group block ${className}`}
      >
        <FacadeTile item={item} cta="View on Instagram" />
      </a>
    );
  }

  return (
    <>
      <a
        ref={anchorRef}
        href={permalink}
        target="_blank"
        rel="nofollow noopener noreferrer"
        aria-haspopup="dialog"
        aria-label={`${label}, view Instagram post`}
        onPointerEnter={prefetchInstagram}
        onClick={(e) => {
          // Preserve open-in-new-tab affordances; otherwise reveal in place.
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
          e.preventDefault();
          loadInstagram();
          setOpen(true);
        }}
        className={`group block ${className}`}
      >
        <FacadeTile item={item} cta="Tap to view" />
      </a>
      {open && (
        <InstagramLightbox permalink={permalink} item={item} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
