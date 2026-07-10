// Relative time ("2h ago"), computed against a fixed reference so server-rendered
// output is deterministic (no hydration drift). When real data lands, pass the
// real current time or compute on the server only.
export function relativeTime(iso: string, nowIso: string): string {
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

const SEOUL_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "Asia/Seoul",
});

export function absoluteDate(iso: string): string {
  return SEOUL_DATE_FORMATTER.format(new Date(iso));
}

// --- D-Day schedule helpers ---------------------------------------------------
// Schedule dates are venue-LOCAL calendar dates (date-only, e.g. "2026-08-15").
// We anchor every calculation to UTC midnight of the date portion so the
// displayed day matches what was announced, with no timezone drift — a US
// evening show never slips to "tomorrow" the way Asia/Seoul formatting would.
const MS_PER_DAY = 86_400_000;
const UTC_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
const UTC_MONTH_DAY_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
const UTC_MONTH_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function utcDate(iso: string): Date {
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`);
}

function dayStartUTC(iso: string): number {
  return utcDate(iso).getTime();
}

// Whole days from `now` until `dateIso` (negative once the date has passed).
// Server callers pass the fixed site clock; DDayBadge passes the real client clock.
function daysUntil(dateIso: string, nowIso: string): number {
  return Math.round((dayStartUTC(dateIso) - dayStartUTC(nowIso)) / MS_PER_DAY);
}

export function dDayLabel(dateIso: string, nowIso: string): string {
  const d = daysUntil(dateIso, nowIso);
  if (d > 0) return `D-${d}`;
  if (d === 0) return "D-DAY";
  return "Ended";
}

// "Aug 15, 2026" — formatted in UTC so the date-only value renders verbatim.
function eventDate(dateIso: string): string {
  return UTC_DATE_FORMATTER.format(utcDate(dateIso));
}

// "Aug 15 to 16, 2026" for a multi-night run; falls back to a single date. A
// worded range, per house style (no dash fakery); it also avoids the ICU
// fallback pattern that garbles a bare {day, year} format request.
export function eventDateRange(startIso: string, endIso?: string): string {
  if (!endIso) return eventDate(startIso);
  const sameMonth = startIso.slice(0, 7) === endIso.slice(0, 7);
  if (sameMonth) {
    const startDay = UTC_MONTH_DAY_FORMATTER.format(utcDate(startIso));
    const end = utcDate(endIso);
    return `${startDay} to ${end.getUTCDate()}, ${end.getUTCFullYear()}`;
  }
  return `${eventDate(startIso)} to ${eventDate(endIso)}`;
}

// "August 2026" — the month-group heading on the schedule page.
export function monthLabel(dateIso: string): string {
  return UTC_MONTH_FORMATTER.format(utcDate(dateIso));
}
