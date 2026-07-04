import TallyBar from "./TallyBar";
import type { Prediction, PredictionStatus, PredictionTally } from "@/lib/types";
import { renderEmphasis } from "@/lib/text";

// Renders a prediction's results. Once the vote total clears the reveal threshold
// (or the question is resolved) it shows the sentiment bars. Below the threshold
// the counts stay hidden (the cold-start guard that keeps a "3 votes, 67%" from
// ever showing) and, while voting is open, we skip re-listing the options here
// since the VoteForm already presents each one as a selectable button.
export default function PredictionOptions({
  prediction,
  tally,
  status,
}: {
  prediction: Prediction;
  tally: PredictionTally;
  status: PredictionStatus;
}) {
  const byId = new Map(tally.perOption.map((o) => [o.optionId, o]));
  const winningId = prediction.resolution?.winningOptionId;

  // The fan favourite among open/closed questions (the current highest share).
  let leadingId: string | undefined;
  if (status !== "resolved" && tally.totalVotes > 0) {
    leadingId = tally.perOption.reduce((best, o) => (o.votes > best.votes ? o : best)).optionId;
  }

  const hidden = !tally.revealed && status !== "resolved";

  // The participation nudge shown while the breakdown is still under wraps.
  const nudge =
    tally.totalVotes === 0
      ? "Be the first to call it."
      : `${tally.totalVotes.toLocaleString("en-US")} ${
          tally.totalVotes === 1 ? "fan has" : "fans have"
        } weighed in. The breakdown reveals at ${prediction.tallyVisibleThreshold} votes.`;

  // Open + below the reveal threshold: the VoteForm below already lists every
  // option as a selectable button, so repeating them here would just be a
  // second, non-interactive copy of the same choices. Show only the nudge.
  if (hidden && status === "open") {
    return <p className="text-muted text-sm leading-relaxed">{nudge}</p>;
  }

  return (
    <div className="border-t border-line">
      {prediction.options.map((o) =>
        hidden ? (
          <div
            key={o.id}
            className="border-b border-line py-3 font-serif text-base sm:text-lg text-bone"
          >
            {renderEmphasis(o.label)}
          </div>
        ) : (
          <div key={o.id} className="border-b border-line">
            <TallyBar
              label={o.label}
              artistSlug={o.artistSlug}
              pct={byId.get(o.id)?.pct ?? 0}
              votes={byId.get(o.id)?.votes ?? 0}
              highlight={o.id === winningId ? "winner" : o.id === leadingId ? "leading" : undefined}
            />
          </div>
        ),
      )}

      {hidden && <p className="text-muted text-sm mt-3 leading-relaxed">{nudge}</p>}
    </div>
  );
}
