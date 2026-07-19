import type { Artist } from "../domain/artists";
import type { Prediction } from "../domain/forecasts";
import { isPromotedArtist } from "./artists";

// State precedence is shared by rendering, voting, and edition selection.
export function effectivePredictionStatus(
  prediction: Prediction,
  nowIso: string,
): Prediction["status"] {
  if (prediction.status === "resolved" || prediction.resolution) return "resolved";
  if (prediction.status === "closed") return "closed";

  const closesMs = Date.parse(prediction.closesAt);
  const nowMs = Date.parse(nowIso);
  return !Number.isNaN(closesMs) && !Number.isNaN(nowMs) && closesMs <= nowMs
    ? "closed"
    : "open";
}

export function isPredictionOpenAt(
  prediction: Prediction,
  nowIso: string,
): boolean {
  const opensMs = Date.parse(prediction.opensAt);
  const nowMs = Date.parse(nowIso);
  return (
    !Number.isNaN(opensMs) &&
    !Number.isNaN(nowMs) &&
    opensMs <= nowMs &&
    effectivePredictionStatus(prediction, nowIso) === "open"
  );
}

export function promotesOnlyUnpromotedOptions(
  prediction: Prediction,
  artistsBySlug: ReadonlyMap<string, Artist>,
): boolean {
  const tagged = prediction.options
    .map((option) => option.artistSlug)
    .filter((slug): slug is string => typeof slug === "string");
  return (
    tagged.length > 0 &&
    tagged.every((slug) => {
      const artist = artistsBySlug.get(slug);
      return artist !== undefined && !isPromotedArtist(artist);
    })
  );
}
