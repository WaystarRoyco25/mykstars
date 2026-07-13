import type { Metadata } from "next";
import Link from "next/link";
import { getDirectoryFacets, getStarsDirectory } from "@/lib/data";
import {
  CAREER_STAGE_LABELS,
  pillarFromSlug,
} from "@/lib/types";
import type { Artist, CareerStage, CoverageLevel } from "@/lib/types";
import { singleParam } from "@/lib/params";
import { roleLabel } from "@/lib/people";
import StarsFilters from "@/components/StarsFilters";
import CompanyLogo from "@/components/CompanyLogo";

export const metadata: Metadata = {
  title: "Stars",
  description:
    "Every star MyKStars covers, in one directory: search by name and narrow by pillar, career stage, profile type, agency, debut year or coverage level.",
};

const TYPES = ["group", "soloist", "individual"] as const;
type ProfileType = (typeof TYPES)[number];

// One star, one row-chip: the pillar-page People chip grammar carrying the
// directory's extra facts (stage, agency, debut year).
function StarRow({ artist }: { artist: Artist }) {
  return (
    <Link
      href={`/artists/${artist.slug}`}
      className="border border-line px-4 py-3 hover:border-crimson transition-colors group"
    >
      <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-serif text-lg group-hover:text-crimson transition-colors">
          {artist.name}
        </span>
        {artist.koreanName && (
          <span className="text-sm text-muted">{artist.koreanName}</span>
        )}
        <span className="label text-muted">{CAREER_STAGE_LABELS[artist.careerStage]}</span>
      </span>
      <span className="label text-muted-2 mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span>{roleLabel(artist)}</span>
        {artist.agency && (
          <>
            <span aria-hidden>·</span>
            <CompanyLogo name={artist.agency} fallback={<span>{artist.agency}</span>} />
          </>
        )}
        {artist.debutYear && (
          <>
            <span aria-hidden>·</span>
            <span>Debuted {artist.debutYear}</span>
          </>
        )}
      </span>
    </Link>
  );
}

export default async function StarsPage({ searchParams }: PageProps<"/artists">) {
  const query = await searchParams;

  // Validate page-side: unknown values are dropped, so a junk query degrades to
  // the unfiltered view rather than 404ing (the /photos convention).
  const pillar = pillarFromSlug(singleParam(query.pillar) ?? "") ?? null;
  const stageParam = singleParam(query.stage);
  const stage: CareerStage | null =
    stageParam && stageParam in CAREER_STAGE_LABELS ? (stageParam as CareerStage) : null;
  const typeParam = singleParam(query.type);
  const type: ProfileType | null = TYPES.find((t) => t === typeParam) ?? null;
  const coverageParam = singleParam(query.coverage);
  const coverage: CoverageLevel | null =
    coverageParam === "active" || coverageParam === "catalog" ? coverageParam : null;
  const agencyParam = (singleParam(query.agency) ?? "").trim();
  const debutParam = singleParam(query.debut) ?? "";
  const debutYear = /^\d{4}$/.test(debutParam) ? Number(debutParam) : null;
  const q = (singleParam(query.q) ?? "").trim();

  const facets = await getDirectoryFacets();
  const agency = facets.agencies.includes(agencyParam) ? agencyParam : null;

  const stars = await getStarsDirectory({
    pillar: pillar ?? undefined,
    stage: stage ?? undefined,
    type: type ?? undefined,
    coverage: coverage ?? undefined,
    agency: agency ?? undefined,
    debutYear: debutYear ?? undefined,
    q: q || undefined,
  });

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <header className="mb-8">
        <p className="kicker">Stars</p>
        <h1 className="font-serif text-4xl sm:text-5xl mt-2">The roster</h1>
        <p className="text-muted mt-3 max-w-2xl leading-relaxed">
          Every group, soloist, actor and director MyKStars covers. Search by
          name, or narrow by pillar, career stage, profile type, agency, debut
          year or coverage level.
        </p>
      </header>

      <div className="border-b border-line pb-5">
        <StarsFilters
          activePillar={pillar}
          activeStage={stage}
          activeType={type}
          activeCoverage={coverage}
          activeAgency={agency}
          activeDebutYear={debutYear}
          activeQuery={q || null}
          agencies={facets.agencies}
          debutYears={facets.debutYears}
        />
      </div>

      <p className="label text-muted mt-4 mb-6">
        {stars.length} {stars.length === 1 ? "star" : "stars"}
      </p>

      {stars.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {stars.map((a) => (
            <StarRow key={a.slug} artist={a} />
          ))}
        </div>
      ) : (
        <p className="text-muted">No stars match this filter yet.</p>
      )}
    </div>
  );
}
