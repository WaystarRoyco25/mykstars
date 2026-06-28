import Link from "next/link";
import { PILLAR_LABELS, PILLAR_ORDER, pillarSlug } from "@/lib/types";
import type { Pillar } from "@/lib/types";

// Pillar filter for the Fan Forecast — pure <Link>s (no client JS), mirroring
// ScheduleFilter / CategoryFilter. "All" is the default; the active pillar drives
// the page's ?pillar param.
const BASE = "/predictions";

function chipClass(isActive: boolean): string {
  return `label whitespace-nowrap pb-1.5 border-b-2 transition-colors ${
    isActive ? "text-bone border-crimson" : "border-transparent hover:text-bone"
  }`;
}

export default function PredictionFilter({ activePillar }: { activePillar: Pillar | null }) {
  return (
    <nav aria-label="Filter by pillar" className="flex items-center gap-5 sm:gap-7 overflow-x-auto">
      <Link
        href={BASE}
        aria-current={activePillar === null ? "page" : undefined}
        className={chipClass(activePillar === null)}
      >
        All
      </Link>
      {PILLAR_ORDER.map((p) => (
        <Link
          key={p}
          href={`${BASE}?pillar=${pillarSlug(p)}`}
          aria-current={activePillar === p ? "page" : undefined}
          className={chipClass(activePillar === p)}
        >
          {PILLAR_LABELS[p]}
        </Link>
      ))}
    </nav>
  );
}
