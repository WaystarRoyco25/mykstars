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
  const hidden = !tally.revealed && status !== "resolved";
  if (hidden) {
    // The participation nudge shown while the breakdown is still under wraps.
    const nudge =
      tally.totalVotes === 0
        ? "Be the first to call it."
        : `${tally.totalVotes.toLocaleString("en-US")} ${
            tally.totalVotes === 1 ? "fan has" : "fans have"
          } weighed in. The breakdown reveals at ${prediction.tallyVisibleThreshold} votes.`;

    // The VoteForm already lists open options as selectable buttons, so avoid a
    // second, non-interactive copy of the same choices.
    if (status === "open") {
      return <p className="text-muted text-sm leading-relaxed">{nudge}</p>;
    }

    return (
      <div className="border-t border-line">
        {prediction.options.map((option) => (
          <div
            key={option.id}
            className="border-b border-line py-3 font-serif text-base sm:text-lg text-bone"
          >
            {renderEmphasis(option.label)}
          </div>
        ))}
        <p className="text-muted text-sm mt-3 leading-relaxed">{nudge}</p>
      </div>
    );
  }

  const byId = new Map(tally.perOption.map((option) => [option.optionId, option]));
  const winningId = prediction.resolution?.winningOptionId;
  const leadingId =
    status !== "resolved" && tally.totalVotes > 0
      ? tally.perOption.reduce((best, option) => (option.votes > best.votes ? option : best)).optionId
      : undefined;

  return (
    <div className="border-t border-line">
      {prediction.options.map((option) => (
        <div key={option.id} className="border-b border-line">
          <TallyBar
            label={option.label}
            artistSlug={option.artistSlug}
            pct={byId.get(option.id)?.pct ?? 0}
            votes={byId.get(option.id)?.votes ?? 0}
            highlight={
              option.id === winningId
                ? "winner"
                : option.id === leadingId
                  ? "leading"
                  : undefined
            }
          />
        </div>
      ))}
    </div>
  );
}
