import { PILLAR_LABELS, PILLAR_ORDER, pillarSlug } from "@/lib/types";
import type { Pillar } from "@/lib/types";
import FilterLink from "./FilterLink";

// Pillar filter for the Fan Forecast — pure <Link>s (no client JS), mirroring
// ScheduleFilter. "All" is the default; the active pillar drives
// the page's ?pillar param.
const BASE = "/predictions";

export default function PredictionFilter({ activePillar }: { activePillar: Pillar | null }) {
  return (
    <nav aria-label="Filter by pillar" className="flex items-center gap-5 sm:gap-7 overflow-x-auto">
      <FilterLink
        href={BASE}
        active={activePillar === null}
      >
        All
      </FilterLink>
      {PILLAR_ORDER.map((p) => (
        <FilterLink
          key={p}
          href={`${BASE}?pillar=${pillarSlug(p)}`}
          active={activePillar === p}
        >
          {PILLAR_LABELS[p]}
        </FilterLink>
      ))}
    </nav>
  );
}
