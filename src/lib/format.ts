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

// --- D-Day schedule helpers ---------------------------------------------------
// Schedule dates are venue-LOCAL calendar dates (date-only, e.g. "2026-08-15").
// We anchor every calculation to UTC midnight of the date portion so the
// displayed day matches what was announced, with no timezone drift — a US
// evening show never slips to "tomorrow" the way Asia/Seoul formatting would.
const MS_PER_DAY = 86_400_000;

function dayStartUTC(iso: string): number {
  return Date.parse(`${iso.slice(0, 10)}T00:00:00Z`);
}

// Whole days from `now` until `dateIso` (negative once the date has passed).
// Defaults to the fixed NOW so server output stays deterministic, matching
// relativeTime above; DDayBadge re-runs this against the real clock on mount.
export function daysUntil(dateIso: string, nowIso: string = NOW): number {
  return Math.round((dayStartUTC(dateIso) - dayStartUTC(nowIso)) / MS_PER_DAY);
}

export function dDayLabel(dateIso: string, nowIso: string = NOW): string {
  const d = daysUntil(dateIso, nowIso);
  if (d > 0) return `D-${d}`;
  if (d === 0) return "D-DAY";
  return "Ended";
}

// "Aug 15, 2026" — formatted in UTC so the date-only value renders verbatim.
export function eventDate(dateIso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${dateIso.slice(0, 10)}T00:00:00Z`));
}

// "Aug 15-16, 2026" for a multi-night run; falls back to a single date.
export function eventDateRange(startIso: string, endIso?: string): string {
  if (!endIso) return eventDate(startIso);
  const sameMonth = startIso.slice(0, 7) === endIso.slice(0, 7);
  if (sameMonth) {
    const startDay = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${startIso.slice(0, 10)}T00:00:00Z`));
    const endDay = new Intl.DateTimeFormat("en-US", {
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${endIso.slice(0, 10)}T00:00:00Z`));
    return `${startDay}-${endDay}`;
  }
  return `${eventDate(startIso)} to ${eventDate(endIso)}`;
}

// "August 2026" — the month-group heading on the schedule page.
export function monthLabel(dateIso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${dateIso.slice(0, 10)}T00:00:00Z`));
}
