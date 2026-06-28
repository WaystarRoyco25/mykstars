import DDayBadge from "./DDayBadge";
import { absoluteDate, dDayLabel } from "@/lib/format";
import type { Prediction, PredictionStatus } from "@/lib/types";

// The lifecycle chip shown on cards and the detail header. Open questions get the
// live D-Day countdown to the voting cutoff (reusing the schedule's badge);
// closed questions read "Voting closed"; resolved questions read "Resolved" + the
// date the outcome became official.
export default function PredictionStatusBadge({
  prediction,
  status,
}: {
  prediction: Prediction;
  status: PredictionStatus;
}) {
  if (status === "resolved") {
    return (
      <span className="label text-crimson inline-flex items-center gap-2">
        Resolved
        {prediction.resolution && (
          <span className="text-muted-2">{absoluteDate(prediction.resolution.resolvedAt)}</span>
        )}
      </span>
    );
  }

  if (status === "closed") {
    return <span className="label text-muted-2">Voting closed</span>;
  }

  return (
    <span className="inline-flex items-center gap-2">
      <span className="label text-muted">Closes</span>
      <DDayBadge date={prediction.closesAt} initialLabel={dDayLabel(prediction.closesAt)} />
    </span>
  );
}
