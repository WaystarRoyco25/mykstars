"use client";

// The Instagram embed.js loader (DOM + third-party script work), kept out of
// lib/embeds.ts so that module stays server-safe (pure URL parsing). We use the
// token-free blockquote + embed.js path deliberately: Meta's oEmbed API now needs
// an access token with tightened expiry and no longer returns thumbnails, so it
// buys nothing here and only adds a breakage liability. Nothing here executes
// until a reveal; prefetch only warms caches. The photo is always served by
// Instagram (the server test), never rehosted.

const SCRIPT_SRC = "https://www.instagram.com/embed.js";

// Shared singleton so the 2nd..Nth reveals reuse one script + one promise.
let loadPromise: Promise<void> | null = null;

declare global {
  interface Window {
    instgrm?: { Embeds?: { process?: () => void } };
  }
}

function addHint(rel: string, href: string, as?: string) {
  const sel = as
    ? `link[rel="${rel}"][href="${href}"][as="${as}"]`
    : `link[rel="${rel}"][href="${href}"]`;
  if (document.head.querySelector(sel)) return;
  const link = document.createElement("link");
  link.rel = rel;
  link.href = href;
  if (as) link.as = as;
  document.head.appendChild(link);
}

// Warm DNS/TLS and pull embed.js into the browser cache WITHOUT executing it, so
// the first reveal mounts near-instantly. Cheap and idempotent; call when the
// first Instagram tile nears the viewport (or on pointer intent). No third-party
// code runs as a result of this.
export function prefetchInstagram(): void {
  if (typeof document === "undefined") return;
  addHint("preconnect", "https://www.instagram.com");
  addHint("preconnect", "https://scontent.cdninstagram.com");
  addHint("dns-prefetch", "https://scontent.cdninstagram.com");
  addHint("preload", SCRIPT_SRC, "script");
}

// Inject + execute embed.js exactly once, resolving when window.instgrm is ready.
// Reuses the preloaded bytes if prefetchInstagram already ran.
export function loadInstagram(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.instgrm?.Embeds?.process) return Promise.resolve();
  if (loadPromise) return loadPromise;
  loadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("instagram embed.js failed to load")),
        { once: true },
      );
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("instagram embed.js failed to load"));
    document.body.appendChild(script);
  });
  return loadPromise;
}

// Ask embed.js to (re)scan the DOM and hydrate any pending blockquote.instagram-media.
export function processInstagram(): void {
  if (typeof window === "undefined") return;
  window.instgrm?.Embeds?.process?.();
}
