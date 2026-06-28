"use client";

import { useSyncExternalStore } from "react";
import DDayBadge from "./DDayBadge";
import { absoluteDate, dDayLabel } from "@/lib/format";
import type { PredictionStatus } from "@/lib/types";

// The lifecycle chip shown on cards and the detail header. Open questions get the
// live D-Day countdown to the voting cutoff (reusing the schedule's badge);
// closed questions read "Voting closed"; resolved questions read "Resolved" + the
// date the outcome became official.
//
// Like DDayBadge, the open→closed cut is re-derived against the visitor's real
// clock so a cached card flips to "Voting closed" on its own when closesAt passes —
// no rebuild. The server (and hydration) snapshot is the frozen `initialStatus`,
// matching the SSR markup exactly; "resolved" is time-independent and always wins.
const subscribe = () => () => {};

export default function PredictionStatusBadge({
  closesAt,
  isResolved,
  resolvedAt,
  initialStatus,
}: {
  closesAt: string;
  isResolved: boolean;
  resolvedAt?: string;
  initialStatus: PredictionStatus;
}) {
  const status = useSyncExternalStore<PredictionStatus>(
    subscribe,
    () => (isResolved ? "resolved" : Date.parse(closesAt) <= Date.now() ? "closed" : "open"),
    () => initialStatus,
  );

  if (status === "resolved") {
    return (
      <span className="label text-crimson inline-flex items-center gap-2">
        Resolved
        {resolvedAt && <span className="text-muted-2">{absoluteDate(resolvedAt)}</span>}
      </span>
    );
  }

  if (status === "closed") {
    return <span className="label text-muted-2">Voting closed</span>;
  }

  return (
    <span className="inline-flex items-center gap-2">
      <span className="label text-muted">Closes</span>
      <DDayBadge date={closesAt} initialLabel={dDayLabel(closesAt)} />
    </span>
  );
}
