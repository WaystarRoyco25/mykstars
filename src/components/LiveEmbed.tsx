"use client";

import { useEffect, useRef, useState } from "react";
import type { MediaItem } from "@/lib/types";
import { stripEmphasis } from "@/lib/text";
import {
  instagramEmbedPermalink,
  instagramPermalink,
  isInstagramRendered,
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
import { useInView } from "@/lib/useInView";
import EmbedFacade from "./EmbedFacade";
import { IconArrowUpRight, IconCamera, IconPlay } from "./icons";

// How a live embed fills its slot:
//  - "fill" (default): absolute inset-0, sized by a fixed-size parent (the home
//    rails and gallery covers), with any overflow scrolling inside the box.
//  - "flow": normal flow at the post's natural height, so the iframe grows the tile
//    (the photo grid). Nothing is cropped; the masonry reflows as tiles lazy-load.
export type EmbedLayout = "fill" | "flow";

// A live social embed that upgrades a cheap, crawlable link-out into the real player
// as it scrolls into view (no click needed):
//  - YouTube: a no-cookie lite-embed — a real thumbnail (already content) that swaps
//    to the player on click. No autoplay-on-scroll, so it keeps click-to-play.
//  - Instagram: the official blockquote + embed.js. embed.js hydration is flaky, so
//    we feed it the canonical (username-less) permalink, retry process() on a backoff
//    and detect a real render, falling back to the link-out facade if it never lands.
//  - X: the official blockquote + widgets.js (dark theme), scoped to its container.
// On the server (and pre-scroll) every platform renders the link-out facade, so the
// page is light and crawlable; the client upgrades it in place when near the viewport.
export default function LiveEmbed({
  item,
  layout = "fill",
}: {
  item: MediaItem;
  layout?: EmbedLayout;
}) {
  if (item.platform === "youtube") {
    // Untouched click-to-play thumbnail; in flow mode it needs a sized box of its own.
    const yt = <YouTubeEmbed item={item} />;
    return layout === "flow" ? <div className="relative aspect-[3/4]">{yt}</div> : yt;
  }
  if (item.platform === "instagram") return <InstagramEmbed item={item} layout={layout} />;
  if (item.platform === "x") return <XEmbed item={item} layout={layout} />;
  return <FacadeFallback item={item} layout={layout} />;
}

// The link-out tile we degrade to (no post id, or the embed failed to render). In
// flow mode it needs its own sized box since EmbedFacade fills its parent.
function FacadeFallback({ item, layout }: { item: MediaItem; layout: EmbedLayout }) {
  if (layout === "flow") {
    return (
      <div className="relative aspect-[3/4]">
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

// The idle, pre-activation tile: a real link-out anchor (crawlable, works JS-off)
// that also watches for scroll-in (inViewRef) and activates on click as a fallback.
function EmbedFacadeTile({
  inViewRef,
  href,
  platform,
  layout,
  onActivate,
}: {
  inViewRef: (node: HTMLAnchorElement | null) => void;
  href: string;
  platform: string;
  layout: EmbedLayout;
  onActivate: () => void;
}) {
  return (
    <a
      ref={inViewRef}
      href={href}
      target="_blank"
      rel="nofollow noopener noreferrer"
      onClick={(e) => {
        e.preventDefault();
        onActivate();
      }}
      className={`group flex flex-col items-center justify-center gap-3 bg-ink-2 text-bone ${
        layout === "flow" ? "relative aspect-[3/4]" : "absolute inset-0"
      }`}
    >
      <IconCamera size={26} className="text-muted-2" />
      <span className="label">{platform}</span>
      <span className="label inline-flex items-center gap-1 text-crimson">
        View post
        <IconArrowUpRight size={12} />
      </span>
    </a>
  );
}

function InstagramEmbed({ item, layout }: { item: MediaItem; layout: EmbedLayout }) {
  const [inViewRef, inView] = useInView<HTMLAnchorElement>();
  const [active, setActive] = useState(false);
  const [failed, setFailed] = useState(false);
  // Set once a real render lands, so the flow-mode loading reservation can be released.
  const [rendered, setRendered] = useState(false);
  // The ref goes on the stable wrapper, NOT the blockquote: embed.js replaces the
  // blockquote with an iframe on success, which would detach a blockquote ref.
  const wrapRef = useRef<HTMLDivElement>(null);

  // Scroll-in OR a click upgrades the facade to the real embed.
  const activate = active || inView;

  // Once the blockquote is mounted (after activation), load embed.js (once) and ask
  // Instagram to upgrade it. embed.js hydration is unreliable, so we re-run process()
  // on a bounded backoff and confirm a real render before giving up to the facade.
  useEffect(() => {
    if (!activate || failed) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const delays = [200, 500, 1000, 2000];

    const attempt = (i: number) => {
      if (cancelled) return;
      processInstagram(); // global; idempotent for already-rendered blockquotes
      timers.push(
        setTimeout(() => {
          if (cancelled) return;
          if (isInstagramRendered(wrapRef.current)) {
            setRendered(true); // real render landed, release the loading reservation
            return; // success, stop retrying
          }
          if (i + 1 < delays.length) attempt(i + 1);
          else setFailed(true); // never rendered (login wall, removed post) → facade
        }, delays[i]),
      );
    };

    loadInstagram()
      .then(() => {
        if (!cancelled) attempt(0);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [activate, failed]);

  // Canonical, username-less URL hydrates reliably; null → not an embeddable post.
  const embedPermalink = instagramEmbedPermalink(item.embedUrl ?? item.credit.url);
  if (!embedPermalink || failed) return <FacadeFallback item={item} layout={layout} />;

  // The prettier username URL for the human-facing link-out.
  const linkPermalink = instagramPermalink(item.embedUrl ?? item.credit.url);

  if (!activate) {
    return (
      <EmbedFacadeTile
        inViewRef={inViewRef}
        href={linkPermalink}
        platform="Instagram"
        layout={layout}
        onActivate={() => setActive(true)}
      />
    );
  }

  return (
    <div
      ref={wrapRef}
      className={
        layout === "flow"
          ? `relative w-full bg-bone ${rendered ? "" : "min-h-[24rem]"}`
          : "absolute inset-0 overflow-y-auto bg-bone"
      }
    >
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={embedPermalink}
        data-instgrm-version="14"
        style={{ margin: 0, width: "100%", minWidth: 0 }}
      >
        <a href={linkPermalink} target="_blank" rel="nofollow noopener noreferrer">
          {stripEmphasis(item.alt)}
        </a>
      </blockquote>
    </div>
  );
}

function XEmbed({ item, layout }: { item: MediaItem; layout: EmbedLayout }) {
  const [inViewRef, inView] = useInView<HTMLAnchorElement>();
  const [active, setActive] = useState(false);
  const [failed, setFailed] = useState(false);
  // Set once a real render lands, so the flow-mode loading reservation can be released.
  const [rendered, setRendered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activate = active || inView;

  // Once the blockquote is mounted, load widgets.js (once) and ask X to upgrade just
  // this container. X is reliable, but a light render check mirrors the IG path so a
  // deleted/blocked tweet degrades to the facade instead of a blank dark box.
  useEffect(() => {
    if (!activate || failed) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const delays = [300, 1200];

    const attempt = (i: number) => {
      if (cancelled) return;
      processTwitter(containerRef.current ?? undefined);
      timers.push(
        setTimeout(() => {
          if (cancelled) return;
          if (containerRef.current?.querySelector("twitter-widget, iframe")) {
            setRendered(true); // real render landed, release the loading reservation
            return; // success
          }
          if (i + 1 < delays.length) attempt(i + 1);
          else setFailed(true);
        }, delays[i]),
      );
    };

    loadTwitter()
      .then(() => {
        if (!cancelled) attempt(0);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [activate, failed]);

  // A bare profile / unparseable URL can't be embedded as a tweet — link out instead.
  if (!tweetId(item.embedUrl) || failed) return <FacadeFallback item={item} layout={layout} />;

  const permalink = xPermalink(item.embedUrl ?? item.credit.url);

  if (!activate) {
    return (
      <EmbedFacadeTile
        inViewRef={inViewRef}
        href={permalink}
        platform="X"
        layout={layout}
        onActivate={() => setActive(true)}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={
        layout === "flow" ? `relative w-full bg-ink ${rendered ? "" : "min-h-[24rem]"}` : "absolute inset-0 overflow-y-auto bg-ink"
      }
    >
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
