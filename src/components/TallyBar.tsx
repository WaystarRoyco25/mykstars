import Link from "next/link";
import { renderEmphasis } from "@/lib/text";

// One option's share of the vote, as a labeled bar. Editorial-noir: crimson fill
// for the leading / winning option, muted for the rest, on an ink-2 track. The
// bar itself is decorative (aria-hidden) — the label and percentage carry the
// meaning for screen readers.
export default function TallyBar({
  label,
  pct,
  votes,
  artistSlug,
  highlight,
}: {
  label: string;
  pct: number;
  votes: number;
  artistSlug?: string;
  highlight?: "winner" | "leading";
}) {
  const isWinner = highlight === "winner";
  const name = artistSlug ? (
    <Link href={`/artists/${artistSlug}`} className="hover:text-crimson transition-colors">
      {renderEmphasis(label)}
    </Link>
  ) : (
    renderEmphasis(label)
  );
  const fill = isWinner ? "bg-crimson" : highlight === "leading" ? "bg-crimson/60" : "bg-muted-2";

  return (
    <div className="py-2.5">
      <div className="flex items-baseline justify-between gap-3 mb-1.5">
        <span
          className={`font-serif text-base sm:text-lg leading-tight ${isWinner ? "text-crimson" : "text-bone"}`}
        >
          {name}
          {isWinner && <span className="label text-crimson ml-2 align-middle">Result</span>}
        </span>
        <span className="tabular-nums text-sm text-bone shrink-0">{pct}%</span>
      </div>
      <div className="h-2 bg-ink-2 overflow-hidden" aria-hidden>
        <div className={`h-full ${fill}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="label text-muted-2 mt-1 tabular-nums">
        {votes.toLocaleString("en-US")} votes
      </div>
    </div>
  );
}
