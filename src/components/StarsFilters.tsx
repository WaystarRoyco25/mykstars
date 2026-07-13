import type { CareerStage, CoverageLevel, Pillar } from "@/lib/types";
import {
  CAREER_STAGE_LABELS,
  CAREER_STAGE_ORDER,
  COVERAGE_LEVEL_LABELS,
  PILLAR_LABELS,
  PILLAR_ORDER,
  pillarSlug,
} from "@/lib/types";
import FilterLink from "./FilterLink";

// Typographic filter for the Stars directory (/artists), mirroring
// ArchiveFilters: red active underline, pure <Link>s for the enum axes, plus
// one native GET form for the inputs links cannot express (name search, agency,
// debut year). Server component, no client JS — the form works with JavaScript
// disabled. Defaults are never serialized, so the bare /artists is the
// canonical "everyone" view.
type ProfileType = "group" | "soloist" | "individual";

type Props = {
  activePillar: Pillar | null;
  activeStage: CareerStage | null;
  activeType: ProfileType | null;
  activeCoverage: CoverageLevel | null;
  activeAgency: string | null;
  activeDebutYear: number | null;
  activeQuery: string | null;
  agencies: string[];
  debutYears: number[];
};

const BASE = "/artists";

const TYPE_LABELS: Record<ProfileType, string> = {
  group: "Groups",
  soloist: "Soloists",
  individual: "Individuals",
};

// TakedownForm's field treatment, sized for inline filter controls.
const field =
  "bg-ink-2 border border-line px-3 py-2 text-sm text-bone placeholder:text-muted-2 focus:border-crimson outline-none";

function buildHref(p: {
  pillar?: Pillar | null;
  stage?: CareerStage | null;
  type?: ProfileType | null;
  coverage?: CoverageLevel | null;
  agency?: string | null;
  debutYear?: number | null;
  q?: string | null;
}): string {
  const params = new URLSearchParams();
  if (p.pillar) params.set("pillar", pillarSlug(p.pillar));
  if (p.stage) params.set("stage", p.stage);
  if (p.type) params.set("type", p.type);
  if (p.coverage) params.set("coverage", p.coverage);
  if (p.agency) params.set("agency", p.agency);
  if (p.debutYear) params.set("debut", String(p.debutYear));
  if (p.q) params.set("q", p.q);
  const qs = params.toString();
  return qs ? `${BASE}?${qs}` : BASE;
}

export default function StarsFilters({
  activePillar,
  activeStage,
  activeType,
  activeCoverage,
  activeAgency,
  activeDebutYear,
  activeQuery,
  agencies,
  debutYears,
}: Props) {
  // Every link keeps the other axes (including the form-driven ones) intact.
  const current = {
    pillar: activePillar,
    stage: activeStage,
    type: activeType,
    coverage: activeCoverage,
    agency: activeAgency,
    debutYear: activeDebutYear,
    q: activeQuery,
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Pillar — the primary axis. */}
      <nav aria-label="Filter by pillar" className="flex items-center gap-5 sm:gap-7 overflow-x-auto">
        <FilterLink href={buildHref({ ...current, pillar: null })} active={activePillar === null}>
          All
        </FilterLink>
        {PILLAR_ORDER.map((p) => (
          <FilterLink key={p} href={buildHref({ ...current, pillar: p })} active={activePillar === p}>
            {PILLAR_LABELS[p]}
          </FilterLink>
        ))}
      </nav>

      {/* Career stage */}
      <nav aria-label="Filter by career stage" className="flex items-center gap-5 sm:gap-7 overflow-x-auto text-muted-2">
        <FilterLink href={buildHref({ ...current, stage: null })} active={activeStage === null}>
          All stages
        </FilterLink>
        {CAREER_STAGE_ORDER.map((s) => (
          <FilterLink key={s} href={buildHref({ ...current, stage: s })} active={activeStage === s}>
            {CAREER_STAGE_LABELS[s]}
          </FilterLink>
        ))}
      </nav>

      {/* Profile type and coverage level, one compact row. */}
      <nav aria-label="Filter by profile type and coverage" className="flex items-center gap-5 sm:gap-7 overflow-x-auto text-muted-2">
        <FilterLink href={buildHref({ ...current, type: null })} active={activeType === null}>
          All types
        </FilterLink>
        {(Object.keys(TYPE_LABELS) as ProfileType[]).map((t) => (
          <FilterLink key={t} href={buildHref({ ...current, type: t })} active={activeType === t}>
            {TYPE_LABELS[t]}
          </FilterLink>
        ))}
        <span className="text-muted-2" aria-hidden>·</span>
        <FilterLink href={buildHref({ ...current, coverage: null })} active={activeCoverage === null}>
          All coverage
        </FilterLink>
        {(Object.keys(COVERAGE_LEVEL_LABELS) as CoverageLevel[]).map((c) => (
          <FilterLink key={c} href={buildHref({ ...current, coverage: c })} active={activeCoverage === c}>
            {COVERAGE_LEVEL_LABELS[c]}
          </FilterLink>
        ))}
      </nav>

      {/* Name search + facet selects: a plain GET form (works without JS).
          Hidden inputs carry the link-driven axes across a submit. */}
      <form action={BASE} className="mt-1 flex flex-wrap items-end gap-3">
        {activePillar && <input type="hidden" name="pillar" value={pillarSlug(activePillar)} />}
        {activeStage && <input type="hidden" name="stage" value={activeStage} />}
        {activeType && <input type="hidden" name="type" value={activeType} />}
        {activeCoverage && <input type="hidden" name="coverage" value={activeCoverage} />}
        <div>
          <label className="label block mb-2" htmlFor="stars-q">
            Name
          </label>
          <input
            className={`${field} w-48`}
            id="stars-q"
            name="q"
            type="search"
            defaultValue={activeQuery ?? ""}
            placeholder="Search stars"
          />
        </div>
        <div>
          <label className="label block mb-2" htmlFor="stars-agency">
            Agency
          </label>
          <select className={field} id="stars-agency" name="agency" defaultValue={activeAgency ?? ""}>
            <option value="">All</option>
            {agencies.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label block mb-2" htmlFor="stars-debut">
            Debut year
          </label>
          <select className={field} id="stars-debut" name="debut" defaultValue={activeDebutYear ?? ""}>
            <option value="">All</option>
            {debutYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="label border border-line px-4 py-2.5 hover:border-crimson hover:text-bone transition-colors"
        >
          Apply
        </button>
      </form>
    </div>
  );
}
