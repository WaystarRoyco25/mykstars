import type { ReactNode } from "react";
import Link from "next/link";
import { effectiveStatus, getPredictionTally } from "@/lib/data";
import { PILLAR_LABELS, PREDICTION_CATEGORY_LABELS } from "@/lib/types";
import type { Prediction } from "@/lib/types";
import PredictionStatusBadge from "./PredictionStatusBadge";
import { renderEmphasis } from "@/lib/text";

// A compact Fan Forecast card for the list page and the home teaser. Links
// through to the question; shows the pillar/category kicker, the lifecycle chip,
// and a one-line sentiment summary. Tone is celebratory — fan hope, not an oracle.
export default async function PredictionCard({ prediction }: { prediction: Prediction }) {
  const status = effectiveStatus(prediction);
  const tally = await getPredictionTally(prediction.slug);

  let summary: ReactNode = null;
  if (tally) {
    if (status === "resolved" && prediction.resolution) {
      const win = prediction.options.find((o) => o.id === prediction.resolution!.winningOptionId);
      summary = (
        <span className="text-crimson">Result: {win ? renderEmphasis(win.label) : "TBD"}</span>
      );
    } else if (!tally.revealed) {
      summary = (
        <span className="text-muted">
          {tally.totalVotes === 0
            ? "Be the first to call it"
            : `${tally.totalVotes.toLocaleString("en-US")} fans in so far`}
        </span>
      );
    } else {
      const lead = tally.perOption.reduce((best, o) => (o.votes > best.votes ? o : best));
      const leadLabel = prediction.options.find((o) => o.id === lead.optionId)?.label ?? "";
      summary = (
        <span className="text-muted">
          <span className="text-bone">{renderEmphasis(leadLabel)}</span> leading ·{" "}
          <span className="tabular-nums">{lead.pct}%</span>
        </span>
      );
    }
  }

  return (
    <article className="rounded-tile border border-line p-5 hover:border-crimson transition-colors flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between gap-3">
        <span className="kicker">
          {PILLAR_LABELS[prediction.pillar]} · {PREDICTION_CATEGORY_LABELS[prediction.category]}
        </span>
        <PredictionStatusBadge
          closesAt={prediction.closesAt}
          isResolved={status === "resolved"}
          resolvedAt={prediction.resolution?.resolvedAt}
          initialStatus={status}
        />
      </div>

      <Link href={`/predictions/${prediction.slug}`} className="group">
        <h3 className="font-serif text-xl sm:text-2xl leading-snug group-hover:text-crimson transition-colors">
          {renderEmphasis(prediction.question)}
        </h3>
      </Link>

      <p className="text-sm text-muted leading-relaxed flex-1">{renderEmphasis(prediction.framing)}</p>

      <div className="text-sm">{summary}</div>
    </article>
  );
}
