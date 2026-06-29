import TallyBar from "./TallyBar";
import type { Prediction, PredictionStatus, PredictionTally } from "@/lib/types";
import { renderEmphasis } from "@/lib/text";

// Renders a prediction's options. Once the vote total clears the reveal threshold
// (or the question is resolved) it shows the sentiment bars; below the threshold
// it hides the counts and nudges participation — the cold-start guard that keeps
// a "3 votes, 67%" from ever showing.
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

      {hidden && (
        <p className="text-muted text-sm mt-3 leading-relaxed">
          {tally.totalVotes === 0
            ? "Be the first to call it."
            : `${tally.totalVotes.toLocaleString("en-US")} ${
                tally.totalVotes === 1 ? "fan has" : "fans have"
              } weighed in. The breakdown reveals at ${prediction.tallyVisibleThreshold} votes.`}
        </p>
      )}
    </div>
  );
}
