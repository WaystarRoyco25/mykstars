import type { EventRegion, EventType } from "@/lib/types";
import {
  EVENT_TYPE_LABELS,
  EVENT_TYPE_ORDER,
  REGION_LABELS,
  REGION_ORDER,
} from "@/lib/types";
import FilterLink from "./FilterLink";

// Typographic filter for the schedule — red active underline, pure <Link>s (no
// client JS), matching StarsFilters. Two rows: region (the international
// audience leads, Korea last) and event type. The active state is driven by the
// page's ?region / ?type params; "International" / "All" are the defaults.
type RegionKey = EventRegion | "international";

type Props = {
  activeRegion: RegionKey;
  activeType: EventType | null;
};

const BASE = "/schedule";

const REGION_CHIPS: { key: RegionKey; label: string }[] = [
  { key: "international", label: "International" },
  ...REGION_ORDER.map((region) => ({ key: region, label: REGION_LABELS[region] })),
];

function buildHref(region: RegionKey, type: EventType | null): string {
  const params = new URLSearchParams();
  if (region !== "international") params.set("region", region);
  if (type) params.set("type", type);
  const qs = params.toString();
  return qs ? `${BASE}?${qs}` : BASE;
}

export default function ScheduleFilter({ activeRegion, activeType }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <nav
        aria-label="Filter by region"
        className="flex items-center gap-5 sm:gap-7 overflow-x-auto"
      >
        {REGION_CHIPS.map(({ key, label }) => (
          <FilterLink
            key={key}
            href={buildHref(key, activeType)}
            active={key === activeRegion}
          >
            {label}
          </FilterLink>
        ))}
      </nav>

      <nav
        aria-label="Filter by type"
        className="flex items-center gap-5 sm:gap-7 overflow-x-auto text-muted-2"
      >
        <FilterLink
          href={buildHref(activeRegion, null)}
          active={activeType === null}
        >
          All
        </FilterLink>
        {EVENT_TYPE_ORDER.map((t) => (
          <FilterLink
            key={t}
            href={buildHref(activeRegion, t)}
            active={activeType === t}
          >
            {EVENT_TYPE_LABELS[t]}s
          </FilterLink>
        ))}
      </nav>
    </div>
  );
}
