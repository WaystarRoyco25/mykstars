// Helpers for the live, lazy social embeds (see components/LiveEmbed.tsx).
// Pure URL parsing plus a singleton loader for Instagram's embed.js. Nothing here
// touches the DOM at module scope, so the file is safe to import anywhere; the
// window/document calls only run when invoked from a client effect.

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
// we crop it to fill the vertical card with object-cover.
export function youtubeThumbnail(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

// Normalize an Instagram permalink for the blockquote's data-instgrm-permalink:
// force https, drop query/hash, ensure a trailing slash. Leaves non-URLs as-is.
export function instagramPermalink(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname.endsWith("/") ? u.pathname : `${u.pathname}/`;
    return `https://www.instagram.com${path}`;
  } catch {
    return url;
  }
}

// --- Instagram embed.js: load once, idempotently, for the whole page ---------
// next/script would also de-dupe, but a module singleton is more robust when many
// LiveEmbeds mount at once and each needs to await readiness before calling
// Embeds.process(). Resolves immediately if the script is already present.
declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

const IG_SCRIPT_ID = "instagram-embed-js";
let igPromise: Promise<void> | null = null;

export function loadInstagram(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.instgrm?.Embeds) return Promise.resolve();
  if (igPromise) return igPromise;
  igPromise = new Promise<void>((resolve, reject) => {
    const done = () => resolve();
    const fail = () => {
      igPromise = null; // allow a later retry
      reject(new Error("instagram embed.js failed to load"));
    };
    const existing = document.getElementById(IG_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      if (window.instgrm?.Embeds) return resolve();
      existing.addEventListener("load", done);
      existing.addEventListener("error", fail);
      return;
    }
    const s = document.createElement("script");
    s.id = IG_SCRIPT_ID;
    s.src = "https://www.instagram.com/embed.js";
    s.async = true;
    s.addEventListener("load", done);
    s.addEventListener("error", fail);
    document.body.appendChild(s);
  });
  return igPromise;
}

// Ask Instagram to (re)hydrate any unprocessed blockquotes currently in the DOM.
export function processInstagram(): void {
  if (typeof window === "undefined") return;
  window.instgrm?.Embeds?.process();
}
