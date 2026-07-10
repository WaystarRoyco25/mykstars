import Link from "next/link";
import type { StarEvent } from "@/lib/types";
import { EVENT_TYPE_LABELS } from "@/lib/types";
import { dDayLabel, eventDateRange } from "@/lib/format";
import DDayBadge from "@/components/DDayBadge";
import AttributionBadge from "@/components/AttributionBadge";
import { renderEmphasis } from "@/lib/text";
import { NOW } from "@/lib/seed";

// A compact, fixed-width countdown card for the home-page schedule rail. The rail
// scrolls horizontally, so this is a denser sibling of the schedule page's EventRow
// (a full-width list row). Server component; the only live part is DDayBadge, a
// client island that recomputes the D-Day count against the real clock once hydrated.
export default function EventCard({ event }: { event: StarEvent }) {
  return (
    <Link
      href="/schedule"
      className="group flex w-60 shrink-0 snap-start flex-col gap-2 rounded-tile border border-line p-4 transition-colors hover:border-crimson hover:bg-ink-2"
    >
      <div className="flex items-center justify-between gap-2">
        <DDayBadge date={event.date} initialLabel={dDayLabel(event.date, NOW)} />
        <span className="text-xs text-muted tabular-nums">
          {eventDateRange(event.date, event.endDate)}
        </span>
      </div>

      <h3 className="mt-1 font-serif text-xl leading-tight transition-colors group-hover:text-crimson">
        {event.headliner}
      </h3>

      <div className="flex flex-col gap-0.5">
        <span className="label text-muted-2">{EVENT_TYPE_LABELS[event.type]}</span>
        <span className="text-sm text-muted">
          {event.city}, {event.country}
        </span>
      </div>

      {event.tour && (
        <p className="line-clamp-1 text-xs text-muted-2">{renderEmphasis(event.tour)}</p>
      )}

      <AttributionBadge source={event.source} asLink={false} className="mt-auto text-muted-2" />
    </Link>
  );
}
