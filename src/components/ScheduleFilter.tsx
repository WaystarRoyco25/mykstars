import Link from "next/link";
import type { EventRegion, EventType } from "@/lib/types";
import {
  EVENT_TYPE_LABELS,
  EVENT_TYPE_ORDER,
  REGION_LABELS,
  REGION_ORDER,
} from "@/lib/types";

// Typographic filter for the schedule — red active underline, pure <Link>s (no
// client JS), mirroring CategoryFilter. Two rows: region (the international
// audience leads, Korea last) and event type. The active state is driven by the
// page's ?region / ?type params; "International" / "All" are the defaults.
type RegionKey = EventRegion | "international";

type Props = {
  activeRegion: RegionKey;
  activeType: EventType | null;
};

const BASE = "/schedule";

function buildHref(region: RegionKey, type: EventType | null): string {
  const params = new URLSearchParams();
  if (region !== "international") params.set("region", region);
  if (type) params.set("type", type);
  const qs = params.toString();
  return qs ? `${BASE}?${qs}` : BASE;
}

function chipClass(isActive: boolean): string {
  return `label whitespace-nowrap pb-1.5 border-b-2 transition-colors ${
    isActive ? "text-bone border-crimson" : "border-transparent hover:text-bone"
  }`;
}

export default function ScheduleFilter({ activeRegion, activeType }: Props) {
  const regionChips: { key: RegionKey; label: string }[] = [
    { key: "international", label: "International" },
    ...REGION_ORDER.map((r) => ({ key: r, label: REGION_LABELS[r] })),
  ];

  return (
    <div className="flex flex-col gap-3">
      <nav
        aria-label="Filter by region"
        className="flex items-center gap-5 sm:gap-7 overflow-x-auto"
      >
        {regionChips.map(({ key, label }) => (
          <Link
            key={key}
            href={buildHref(key, activeType)}
            aria-current={key === activeRegion ? "page" : undefined}
            className={chipClass(key === activeRegion)}
          >
            {label}
          </Link>
        ))}
      </nav>

      <nav
        aria-label="Filter by type"
        className="flex items-center gap-5 sm:gap-7 overflow-x-auto text-muted-2"
      >
        <Link
          href={buildHref(activeRegion, null)}
          aria-current={activeType === null ? "page" : undefined}
          className={chipClass(activeType === null)}
        >
          All
        </Link>
        {EVENT_TYPE_ORDER.map((t) => (
          <Link
            key={t}
            href={buildHref(activeRegion, t)}
            aria-current={activeType === t ? "page" : undefined}
            className={chipClass(activeType === t)}
          >
            {EVENT_TYPE_LABELS[t]}s
          </Link>
        ))}
      </nav>
    </div>
  );
}
