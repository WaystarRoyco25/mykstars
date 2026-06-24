"use client";

import { useSyncExternalStore } from "react";
import { dDayLabel } from "@/lib/format";

// Live D-Day countdown chip. The rest of the site is intentionally frozen at NOW
// for deterministic SSR, so we expose two snapshots: the server (and hydration)
// snapshot is the frozen `initialLabel` — matching the SSR markup exactly — and
// the client snapshot recomputes against the visitor's real clock, so once
// hydrated the number is actually live. No store updates, so subscribe is a noop.
const subscribe = () => () => {};

export default function DDayBadge({
  date,
  initialLabel,
}: {
  date: string;
  initialLabel: string;
}) {
  const label = useSyncExternalStore(
    subscribe,
    () => dDayLabel(date, new Date().toISOString()),
    () => initialLabel,
  );

  const ended = label === "Ended";
  return (
    <span
      className={`label tabular-nums tracking-normal ${ended ? "text-muted-2" : "text-crimson"}`}
    >
      {label}
    </span>
  );
}
