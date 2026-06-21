import { NOW } from "./seed";

// Relative time ("2h ago"), computed against a fixed reference so server-rendered
// output is deterministic (no hydration drift). When real data lands, pass the
// real current time or compute on the server only.
export function relativeTime(iso: string, nowIso: string = NOW): string {
  const then = new Date(iso).getTime();
  const now = new Date(nowIso).getTime();
  const sec = Math.max(0, Math.round((now - then) / 1000));
  const min = Math.round(sec / 60);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  return absoluteDate(iso);
}

export function absoluteDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Seoul",
  }).format(new Date(iso));
}
