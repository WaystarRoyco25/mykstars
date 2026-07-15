"use client";

import { useState } from "react";
import type { MediaItem } from "@/lib/types";
import { stripEmphasis } from "@/lib/text";
import { youtubeEmbedSrc, youtubeId, youtubeThumbnail } from "@/lib/embeds";
import EmbedFacade from "./EmbedFacade";
import InstagramEmbed from "./InstagramEmbed";
import { IconPlay } from "./icons";

// How a live embed fills its slot:
//  - "fill" (default): absolute inset-0, sized by a fixed-size parent (the home
//    rails and gallery covers).
//  - "flow": normal flow in a self-sized box (the photo grid). The box follows the
//    item's orientation — 16:9 for landscape video tiles, 3:4 otherwise — so a clip
//    reads as a horizontal brick among the portrait photos.
type EmbedLayout = "fill" | "flow";

// A live embed that upgrades a cheap, crawlable link-out into the real player.
// YouTube is a no-cookie lite-embed: a real thumbnail (already content) that swaps
// to the player on click. No autoplay-on-scroll, so it keeps click-to-play.
// Anything else (tiktok reserved, bare account URLs) renders the link-out facade.
// The server renders every platform light and crawlable; the client upgrades
// YouTube in place.
export default function LiveEmbed({
  item,
  layout = "fill",
}: {
  item: MediaItem;
  layout?: EmbedLayout;
}) {
  if (item.platform === "youtube") {
    // Click-to-play thumbnail; in flow mode it needs a sized box of its own.
    const yt = <YouTubeEmbed item={item} />;
    return layout === "flow" ? <div className={`relative ${flowAspect(item)}`}>{yt}</div> : yt;
  }
  if (item.platform === "instagram") {
    // Facade that reveals the real post in a modal on tap (server test, no
    // rehost). Fills its box; in flow mode it needs a sized box of its own.
    const ig = <InstagramEmbed item={item} className="absolute inset-0" />;
    return layout === "flow" ? <div className={`relative ${flowAspect(item)}`}>{ig}</div> : ig;
  }
  return <FacadeFallback item={item} layout={layout} />;
}

// The flow-mode box follows the item's orientation so landscape video tiles keep
// their 16:9 frame inside the vertical-leaning masonry.
function flowAspect(item: MediaItem): string {
  return item.orientation === "landscape" ? "aspect-video" : "aspect-[3/4]";
}

// The link-out tile we degrade to (no video id, or a reserved platform). In
// flow mode it needs its own sized box since EmbedFacade fills its parent.
function FacadeFallback({ item, layout }: { item: MediaItem; layout: EmbedLayout }) {
  if (layout === "flow") {
    return (
      <div className={`relative ${flowAspect(item)}`}>
        <EmbedFacade item={item} className="absolute inset-0" />
      </div>
    );
  }
  return <EmbedFacade item={item} className="absolute inset-0" />;
}

function YouTubeEmbed({ item }: { item: MediaItem }) {
  const [playing, setPlaying] = useState(false);
  const id = youtubeId(item.embedUrl);
  if (!id) return <EmbedFacade item={item} className="absolute inset-0" />;

  if (playing) {
    return (
      <iframe
        src={youtubeEmbedSrc(id)}
        title={stripEmphasis(item.alt)}
        allow="autoplay; encrypted-media; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        className="absolute inset-0 h-full w-full border-0 bg-ink"
      />
    );
  }

  return (
    <a
      href={item.embedUrl ?? item.credit.url}
      target="_blank"
      rel="nofollow noopener noreferrer"
      onClick={(e) => {
        e.preventDefault();
        setPlaying(true);
      }}
      aria-label={`Play ${stripEmphasis(item.alt)} on YouTube`}
      className="group absolute inset-0 block h-full w-full overflow-hidden bg-ink-2"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- third-party CDN thumbnail, intentionally not run through next/image */}
      <img
        src={youtubeThumbnail(id)}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <span className="absolute inset-0 bg-ink/25 transition-colors group-hover:bg-ink/10" aria-hidden />
      <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-ink/70 text-bone backdrop-blur transition-transform group-hover:scale-110">
        <IconPlay size={24} className="ml-1" />
      </span>
    </a>
  );
}
