import Link from "next/link";
import type { Ranking, RankingRow } from "@/lib/types";
import { absoluteDate } from "@/lib/format";
import { renderEmphasis } from "@/lib/text";
import { splitCompanyDetail } from "@/lib/companies";
import CompanyLogo from "@/components/CompanyLogo";

// A scannable K-Culture chart table, interleaved between photo bands to break up
// the feed. Server component (no client JS), styled to the editorial-noir system:
// crimson kicker title, hairline rules, serif names, right-aligned figures.
// Rows link to an artist hub when artistSlug is set. Sample figures are flagged.

// Rank movement vs. the previous period. On-palette: a rise reads brighter (bone),
// a fall recedes (muted); a debut is flagged crimson. Glyphs are decorative — the
// direction is also stated for screen readers.
function ChangeCell({ row }: { row: RankingRow }) {
  if (row.isNew) return <span className="label text-crimson">New</span>;
  if (row.change === undefined || row.change === 0) {
    return (
      <span className="text-muted">
        <span aria-hidden>—</span>
        <span className="sr-only">no change</span>
      </span>
    );
  }
  const up = row.change > 0;
  return (
    <span className={`tabular-nums ${up ? "text-bone" : "text-muted"}`}>
      <span aria-hidden>{up ? "▲" : "▼"} {Math.abs(row.change)}</span>
      <span className="sr-only">{up ? "up" : "down"} {Math.abs(row.change)}</span>
    </span>
  );
}

// The line under a row's name usually names a company: the idol table carries a
// bare agency ("ADOR"); the drama table carries a network, optionally trailed by
// a lead actor ("tvN · Kim Tae-ri"). Show the logo chip when we recognize the
// company, and keep any trailing text (and every unknown detail) as muted type.
function RowDetail({ detail }: { detail: string }) {
  const { company, rest } = splitCompanyDetail(detail);
  if (!company) {
    return <span className="label text-muted mt-0.5">{renderEmphasis(detail)}</span>;
  }
  return (
    <span className="label text-muted mt-1 inline-flex items-center gap-1.5 flex-wrap">
      <CompanyLogo name={company.name} />
      {rest && <span>{renderEmphasis(rest)}</span>}
    </span>
  );
}

function RowName({ row }: { row: RankingRow }) {
  const inner = (
    <span className="inline-flex flex-col">
      <span className="font-serif text-base sm:text-lg leading-tight group-hover:text-crimson transition-colors">
        {renderEmphasis(row.name)}
      </span>
      {row.detail && <RowDetail detail={row.detail} />}
    </span>
  );
  return row.artistSlug ? (
    <Link href={`/artists/${row.artistSlug}`} className="group">
      {inner}
    </Link>
  ) : (
    <span className="group">{inner}</span>
  );
}

// `className` controls the outer section box. The home page renders self-contained
// sections (default = its own centered container); the pillar page is already
// inside a container, so it passes a spacing-only class to avoid double padding.
export default function RankingTable({
  ranking,
  className = "mx-auto max-w-6xl px-5 mt-12",
}: {
  ranking: Ranking;
  className?: string;
}) {
  return (
    <section className={className}>
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <h2 className="kicker">{renderEmphasis(ranking.title)}</h2>
          {ranking.blurb && (
            <p className="text-muted text-sm mt-1.5 max-w-xl leading-relaxed">
              {renderEmphasis(ranking.blurb)}
            </p>
          )}
        </div>
        <span className="label whitespace-nowrap">{ranking.period}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="label text-muted border-b border-line">
              <th scope="col" className="font-normal text-left py-2 pr-3 w-10">#</th>
              <th scope="col" className="font-normal text-left py-2 pr-3">Name</th>
              <th scope="col" className="font-normal text-right py-2 px-3">{ranking.metricLabel}</th>
              <th scope="col" className="font-normal text-right py-2 pl-3 w-20">Change</th>
            </tr>
          </thead>
          <tbody>
            {ranking.rows.map((row) => (
              <tr key={row.rank} className="border-b border-line hover:bg-ink-2 transition-colors">
                <td className="py-3 pr-3 text-muted tabular-nums align-top">{row.rank}</td>
                <td className="py-3 pr-3 align-top">
                  <RowName row={row} />
                </td>
                <td className="py-3 px-3 text-right tabular-nums align-top whitespace-nowrap">
                  {row.value}
                </td>
                <td className="py-3 pl-3 text-right align-top whitespace-nowrap">
                  <ChangeCell row={row} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center gap-2 flex-wrap label">
        {ranking.sample && <span className="text-crimson">Sample data</span>}
        {ranking.sample && <span className="text-muted" aria-hidden>·</span>}
        <span className="text-muted">As of {absoluteDate(ranking.asOf)}</span>
        <span className="text-muted" aria-hidden>·</span>
        <Link href={ranking.source.url} className="text-muted hover:text-bone transition-colors">
          {ranking.source.name}
        </Link>
      </div>
    </section>
  );
}
