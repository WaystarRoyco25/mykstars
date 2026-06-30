"use client";

import { useEffect, useRef, useState } from "react";
import type { MediaItem } from "@/lib/types";
import { stripEmphasis } from "@/lib/text";
import {
  instagramPermalink,
  loadInstagram,
  loadTwitter,
  processInstagram,
  processTwitter,
  tweetId,
  xPermalink,
  youtubeEmbedSrc,
  youtubeId,
  youtubeThumbnail,
} from "@/lib/embeds";
import EmbedFacade from "./EmbedFacade";
import { IconArrowUpRight, IconCamera, IconPlay } from "./icons";

// A live social embed that stays cheap until the user asks for it. The idle state
// is a real link-out anchor (works with JS off and is crawlable); its onClick
// upgrades it in place to the real player:
//  - YouTube: a no-cookie lite-embed — a real thumbnail (already content) that swaps
//    to the player on click. No autoplay-on-scroll.
//  - Instagram: the official blockquote + embed.js, loaded on click. Instagram's
//    own embeds are unreliable on some hosts/contexts (login walls, frame blocks),
//    so we default to the clean facade tile rather than risk a blank auto-embed, and
//    fall back to the link-out facade if the script fails.
//  - X: the official blockquote + widgets.js, loaded on click (dark theme). Same
//    click-to-load and graceful-facade-fallback contract as Instagram.
// Fills its (relatively-positioned) parent, like PhotoMedia.
export default function LiveEmbed({ item }: { item: MediaItem }) {
  if (item.platform === "youtube") return <YouTubeEmbed item={item} />;
  if (item.platform === "instagram") return <InstagramEmbed item={item} />;
  if (item.platform === "x") return <XEmbed item={item} />;
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

function InstagramEmbed({ item }: { item: MediaItem }) {
  const [active, setActive] = useState(false);
  const [failed, setFailed] = useState(false);

  // Once the blockquote is in the DOM (after a click), load embed.js (once) and ask
  // Instagram to upgrade it. If the script fails, drop to the link-out facade.
  useEffect(() => {
    if (!active || failed) return;
    let cancelled = false;
    loadInstagram()
      .then(() => {
        if (!cancelled) processInstagram();
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [active, failed]);

  if (failed) return <EmbedFacade item={item} className="absolute inset-0" />;

  const permalink = instagramPermalink(item.embedUrl ?? item.credit.url);

  if (!active) {
    return (
      <a
        href={permalink}
        target="_blank"
        rel="nofollow noopener noreferrer"
        onClick={(e) => {
          e.preventDefault();
          setActive(true);
        }}
        className="group absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink-2 text-bone"
      >
        <IconCamera size={26} className="text-muted-2" />
        <span className="label">Instagram</span>
        <span className="label inline-flex items-center gap-1 text-crimson">
          View post
          <IconArrowUpRight size={12} />
        </span>
      </a>
    );
  }

  return (
    <div className="absolute inset-0 overflow-y-auto bg-bone">
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={permalink}
        data-instgrm-version="14"
        style={{ margin: 0, width: "100%", minWidth: 0 }}
      >
        <a href={permalink} target="_blank" rel="nofollow noopener noreferrer">
          {stripEmphasis(item.alt)}
        </a>
      </blockquote>
    </div>
  );
}

function XEmbed({ item }: { item: MediaItem }) {
  const [active, setActive] = useState(false);
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Once the blockquote is in the DOM (after a click), load widgets.js (once) and
  // ask X to upgrade just this container. If the script fails, drop to the facade.
  useEffect(() => {
    if (!active || failed) return;
    let cancelled = false;
    loadTwitter()
      .then(() => {
        if (!cancelled) processTwitter(ref.current ?? undefined);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [active, failed]);

  // A bare profile / unparseable URL can't be embedded as a tweet — link out instead.
  if (!tweetId(item.embedUrl) || failed)
    return <EmbedFacade item={item} className="absolute inset-0" />;

  const permalink = xPermalink(item.embedUrl ?? item.credit.url);

  if (!active) {
    return (
      <a
        href={permalink}
        target="_blank"
        rel="nofollow noopener noreferrer"
        onClick={(e) => {
          e.preventDefault();
          setActive(true);
        }}
        className="group absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink-2 text-bone"
      >
        <IconCamera size={26} className="text-muted-2" />
        <span className="label">X</span>
        <span className="label inline-flex items-center gap-1 text-crimson">
          View post
          <IconArrowUpRight size={12} />
        </span>
      </a>
    );
  }

  return (
    <div ref={ref} className="absolute inset-0 overflow-y-auto bg-ink">
      <blockquote
        className="twitter-tweet"
        data-theme="dark"
        data-dnt="true"
        data-conversation="none"
        style={{ margin: 0, width: "100%" }}
      >
        <a href={permalink} target="_blank" rel="nofollow noopener noreferrer">
          {stripEmphasis(item.alt)}
        </a>
      </blockquote>
    </div>
  );
}
