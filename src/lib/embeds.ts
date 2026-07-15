// Helpers for the live, lazy embeds (see components/LiveEmbed.tsx). Pure URL
// parsing only: no DOM access, no third-party scripts, so the file stays safe to
// import anywhere (server or client). Instagram returned in July 2026 as a
// click-to-reveal embed; its permalink parser lives here, but the embed.js loader
// (DOM + script work) lives in lib/instagram-embed.ts so this module stays
// server-safe. (X stays retired.)

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

// A public Instagram post/reel/tv shortcode: URL-safe characters only. We never
// fabricate these — every embedded permalink is a real, verified post.
const IG_SHORTCODE = /^[A-Za-z0-9_-]+$/;

// Canonical permalink for a public Instagram post, or null when the URL is not a
// parseable post permalink (a bare profile URL, a story, an unparseable string).
// embed.js needs the /p|reel|tv/{shortcode}/ permalink form; we normalize to it
// so a trailing query string or missing slash never breaks the reveal. Callers
// fall back to a plain link-out when this returns null (never a broken embed).
export function instagramPermalink(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host !== "instagram.com" && host !== "instagr.am") return null;
    const m = u.pathname.match(/^\/(?:[^/]+\/)?(p|reel|tv)\/([^/?#]+)/);
    if (!m || !IG_SHORTCODE.test(m[2])) return null;
    return `https://www.instagram.com/${m[1]}/${m[2]}/`;
  } catch {
    return null;
  }
}

// Whether a media item points at a specific, embeddable post (not a bare channel
// or an unparseable URL). The grid uses this to choose a live embed over the
// link-out facade. Mirrors the per-platform parsers above.
export function isEmbeddablePost(item: MediaItem): boolean {
  if (item.kind !== "embed" || !item.embedUrl) return false;
  switch (item.platform) {
    case "youtube":
      return youtubeId(item.embedUrl) != null;
    case "instagram":
      return instagramPermalink(item.embedUrl) != null;
    default:
      return false;
  }
}
