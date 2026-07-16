// Helpers for the live, lazy embeds (see components/LiveEmbed.tsx). Pure URL
// parsing only: no DOM access, no third-party scripts, so the file stays safe to
// import anywhere (server or client). YouTube is the only live embed: Instagram
// and X are both retired, and photography comes from the permitted MediaAsset
// registry instead. (TikTok reserved.)

import type { MediaItem } from "./types";

// A YouTube video id is exactly 11 chars of [A-Za-z0-9_-].
const YT_ID = /^[A-Za-z0-9_-]{11}$/;

function isYoutubeId(id: string | null | undefined): id is string {
  return !!id && YT_ID.test(id);
}

// Pull the 11-char video id out of any common YouTube URL shape:
// youtube.com/shorts/ID, youtu.be/ID, watch?v=ID, youtube.com/embed/ID.
// Returns null for anything we can't confidently parse (so callers fall back to
// the link-out facade rather than mounting a broken iframe).
export function youtubeId(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.slice(1).split("/")[0];
      return isYoutubeId(id) ? id : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      const v = u.searchParams.get("v");
      if (isYoutubeId(v)) return v;
      const m = u.pathname.match(/\/(?:shorts|embed|v|live)\/([^/?#]+)/);
      if (m && isYoutubeId(m[1])) return m[1];
    }
  } catch {
    // not a parseable URL — fall through to the loose match below
  }
  const m = url.match(/(?:shorts\/|embed\/|live\/|v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

// The privacy-enhanced player domain (no cookies until the user plays).
export function youtubeEmbedSrc(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0`;
}

// hqdefault always exists (unlike maxresdefault, which 404s for some uploads);
// the tile crops it to fill via object-cover.
export function youtubeThumbnail(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

// Whether a media item points at a specific, embeddable post (not a bare channel
// or an unparseable URL). The grid uses this to choose a live embed over the
// link-out facade. Mirrors the per-platform parsers above.
export function isEmbeddablePost(item: MediaItem): boolean {
  if (item.kind !== "embed" || !item.embedUrl) return false;
  switch (item.platform) {
    case "youtube":
      return youtubeId(item.embedUrl) != null;
    default:
      return false;
  }
}
