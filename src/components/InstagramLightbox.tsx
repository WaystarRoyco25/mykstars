"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { MediaItem } from "@/lib/types";
import { loadInstagram, processInstagram } from "@/lib/instagram-embed";
import AttributionBadge from "./AttributionBadge";
import { IconClose } from "./icons";
import { renderEmphasis, stripEmphasis } from "@/lib/text";

// A dark modal that reveals the real Instagram post on top of the feed, so the
// scrolling grid never reflows (Instagram's card self-sizes; letting it grow in
// place would push a masonry column around). The photo is served by Instagram
// inside its own iframe — the server test — and Instagram's chrome is confined to
// this overlay, keeping the dark feed clean. The blockquote is handed to embed.js
// via dangerouslySetInnerHTML so React does not try to reconcile the iframe that
// embed.js swaps in; the permalink is our validated, canonical URL.
export default function InstagramLightbox({
  permalink,
  item,
  onClose,
}: {
  permalink: string;
  item: MediaItem;
  onClose: () => void;
}) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const holderRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Lock body scroll and move focus to the close control while open.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  // Escape closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Load embed.js (cached by the tile's prefetch), then let it hydrate the
  // blockquote. Poll briefly for the rendered iframe so we can cross-fade in.
  useEffect(() => {
    let cancelled = false;
    let poll: ReturnType<typeof setInterval> | undefined;
    let stopAt: ReturnType<typeof setTimeout> | undefined;
    loadInstagram()
      .then(() => {
        if (cancelled) return;
        processInstagram();
        poll = setInterval(() => {
          if (holderRef.current?.querySelector("iframe")) {
            setReady(true);
            if (poll) clearInterval(poll);
          }
        }, 120);
        stopAt = setTimeout(() => {
          if (poll) clearInterval(poll);
          if (!cancelled && !holderRef.current?.querySelector("iframe")) setFailed(true);
        }, 8000);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      if (poll) clearInterval(poll);
      if (stopAt) clearTimeout(stopAt);
    };
  }, [permalink]);

  const blockquote = `<blockquote class="instagram-media" data-instgrm-permalink="${permalink}" data-instgrm-version="14" style="margin:0;width:100%;min-width:326px;max-width:540px;border:0;"></blockquote>`;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={stripEmphasis(item.alt)}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/85 p-4 backdrop-blur-sm"
    >
      <button
        ref={closeRef}
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-line bg-ink-2 text-bone transition-colors hover:text-crimson"
      >
        <IconClose size={20} />
      </button>

      <div className="w-full max-w-[540px]" onClick={(e) => e.stopPropagation()}>
        <div className="relative min-h-[240px] overflow-hidden rounded-tile">
          {!ready && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-ink-2 text-center">
              {failed ? (
                <>
                  <p className="label text-muted">This post could not be loaded.</p>
                  <a
                    href={permalink}
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    className="label text-crimson hover:underline"
                  >
                    Open on Instagram
                  </a>
                </>
              ) : (
                <span className="label text-muted">Loading Instagram post…</span>
              )}
            </div>
          )}
          <div
            ref={holderRef}
            className={`max-h-[80vh] overflow-y-auto transition-opacity duration-300 ${
              ready ? "opacity-100" : "opacity-0"
            }`}
            dangerouslySetInnerHTML={{ __html: blockquote }}
          />
        </div>

        <div className="mt-3 flex items-start justify-between gap-4">
          <p className="text-sm leading-relaxed text-bone">{renderEmphasis(item.alt)}</p>
          <AttributionBadge source={item.credit} className="shrink-0 text-muted" />
        </div>
      </div>
    </div>,
    document.body,
  );
}
