import type { EditionPlan } from "../domain/editions";
import { canPartition } from "./chunk-construction";
import {
  CELEBRITY_CAP_RATIO,
  EditionConstraintError,
  flattenEdition,
  itemKey,
  type ContentFeedFormat,
} from "./constraints";
import { hash32 } from "./deterministic";
import {
  type Candidate,
  type FormatCounts,
} from "./engine-internal";
import {
  EVENT_RAIL_SIZE,
  MAX_ARTICLES,
  MIN_ARTICLES,
  MIN_CLIPS,
  MIN_FORECASTS,
  MIN_PULSES,
  MIN_RANKINGS,
} from "./inventory";

export function inventoryMinimums(
  groups: Record<ContentFeedFormat, Candidate[]>,
): void {
  const requirements: Array<[ContentFeedFormat, number, string]> = [
    ["pulse", MIN_PULSES, "the monthly Pulse share"],
    ["clip", MIN_CLIPS, "the official-video floor"],
    ["event", EVENT_RAIL_SIZE, "one eight-item event rail"],
    ["forecast", MIN_FORECASTS, "two three-item forecast rails"],
    ["ranking", MIN_RANKINGS, "format diversity"],
    ["article", MIN_ARTICLES, "the Analysis floor"],
  ];
  for (const [format, minimum, reason] of requirements) {
    if (groups[format].length < minimum) {
      throw new EditionConstraintError(
        `${format}-inventory`,
        `${groups[format].length} eligible ${format} item${groups[format].length === 1 ? "" : "s"}; need at least ${minimum} for ${reason}`,
      );
    }
  }
}

export function contentCoverage(
  edition: EditionPlan,
  candidateByKey: ReadonlyMap<string, Candidate>,
): Set<string> {
  const covered = new Set<string>();
  for (const item of flattenEdition(edition)) {
    for (const slug of candidateByKey.get(itemKey(item))?.artistSlugs ?? []) covered.add(slug);
  }
  return covered;
}

export function allocateCore(
  total: number,
  secondary: number,
  groups: Record<ContentFeedFormat, Candidate[]>,
): Pick<FormatCounts, "pulse" | "gallery" | "clip">[] {
  const remaining = total - secondary;
  const photoTarget = Math.floor(total * 0.25);
  const pulseTarget = Math.round(total * 0.30);
  const options: Array<Pick<FormatCounts, "pulse" | "gallery" | "clip"> & { score: number }> = [];
  for (let gallery = 0; gallery <= Math.min(groups.gallery.length, photoTarget, remaining); gallery++) {
    for (let clip = MIN_CLIPS; clip <= Math.min(groups.clip.length, remaining - gallery); clip++) {
      const pulse = remaining - gallery - clip;
      if (pulse < MIN_PULSES || pulse > groups.pulse.length || !canPartition(pulse, 4, 6)) continue;
      const expectedGallery = Math.min(groups.gallery.length, photoTarget);
      const clipTarget = Math.round(total * 0.25) + (photoTarget - gallery);
      const substitutedPulseTarget = pulseTarget + Math.max(0, clipTarget - groups.clip.length);
      const score = Math.abs(gallery - expectedGallery) * 20 + Math.abs(clip - clipTarget) * 4 + Math.abs(pulse - substitutedPulseTarget) * 3;
      options.push({ pulse, gallery, clip, score });
    }
  }
  return options
    .sort((a, b) => a.score - b.score || b.gallery - a.gallery || b.clip - a.clip || b.pulse - a.pulse)
    .map((option) => ({ pulse: option.pulse, gallery: option.gallery, clip: option.clip }));
}

export function secondaryOptions(
  total: number,
  groups: Record<ContentFeedFormat, Candidate[]>,
): Array<Pick<FormatCounts, "event" | "forecast" | "ranking" | "article">> {
  const options: Array<Pick<FormatCounts, "event" | "forecast" | "ranking" | "article"> & { score: number }> = [];
  const forecastMax = Math.min(12, groups.forecast.length - (groups.forecast.length % 3));
  for (let forecast = MIN_FORECASTS; forecast <= forecastMax; forecast += 3) {
    for (let ranking = MIN_RANKINGS; ranking <= Math.min(2, groups.ranking.length); ranking++) {
      for (let article = MIN_ARTICLES; article <= Math.min(MAX_ARTICLES, groups.article.length); article++) {
        const count = EVENT_RAIL_SIZE + forecast + ranking + article;
        options.push({
          event: EVENT_RAIL_SIZE,
          forecast,
          ranking,
          article,
          score: Math.abs(count / total - 0.20) * 100 - forecast * 0.03 - ranking * 0.02 - article * 0.01,
        });
      }
    }
  }
  // The rolling four-format rule is hard, while the combined secondary share
  // is an editorial target. Long event and forecast rails need enough distinct
  // one-item band boundaries around them to make that rolling rule feasible,
  // so search the richest boundary plans first and use distance from the
  // approved 20 percent share to rank plans with equal scheduling flexibility.
  const boundaryCount = (option: Pick<FormatCounts, "forecast" | "ranking" | "article">) =>
    option.forecast / 3 + option.ranking + option.article;
  return options.sort((a, b) =>
    boundaryCount(b) - boundaryCount(a) || a.score - b.score ||
    a.forecast - b.forecast || a.ranking - b.ranking || a.article - b.article,
  ).map((option) => ({
    event: option.event,
    forecast: option.forecast,
    ranking: option.ranking,
    article: option.article,
  }));
}

export function selectCandidates(
  groups: Record<ContentFeedFormat, Candidate[]>,
  counts: FormatCounts,
  active: ReadonlySet<string>,
  unseen: ReadonlySet<string>,
  required: ReadonlySet<string>,
  total: number,
  editionId: string,
  attempt: number,
): Candidate[] | undefined {
  const cap = Math.floor(total * CELEBRITY_CAP_RATIO);
  const remaining: FormatCounts = { ...counts };
  const selected: Candidate[] = [];
  const selectedKeys = new Set<string>();
  const selectedArtists = new Set<string>();
  const artistCounts = new Map<string, number>();

  while (selected.length < total) {
    const choices = Object.values(groups).flat().filter((candidate) => {
      if (selectedKeys.has(candidate.key) || remaining[candidate.format] <= 0) return false;
      return candidate.artistSlugs.every((slug) => (artistCounts.get(slug) ?? 0) < cap);
    });
    if (choices.length === 0) return undefined;
    choices.sort((a, b) => {
      const requiredA = a.artistSlugs.filter((slug) => required.has(slug) && !selectedArtists.has(slug)).length;
      const requiredB = b.artistSlugs.filter((slug) => required.has(slug) && !selectedArtists.has(slug)).length;
      if (requiredA !== requiredB) return requiredB - requiredA;
      const unseenA = a.artistSlugs.filter((slug) => unseen.has(slug) && !selectedArtists.has(slug)).length;
      const unseenB = b.artistSlugs.filter((slug) => unseen.has(slug) && !selectedArtists.has(slug)).length;
      if (unseenA !== unseenB) return unseenB - unseenA;
      const newA = a.artistSlugs.filter((slug) => active.has(slug) && !selectedArtists.has(slug)).length;
      const newB = b.artistSlugs.filter((slug) => active.has(slug) && !selectedArtists.has(slug)).length;
      if (newA !== newB) return newB - newA;
      const urgencyA = remaining[a.format] / Math.max(1, groups[a.format].filter((candidate) => !selectedKeys.has(candidate.key)).length);
      const urgencyB = remaining[b.format] / Math.max(1, groups[b.format].filter((candidate) => !selectedKeys.has(candidate.key)).length);
      if (urgencyA !== urgencyB) return urgencyB - urgencyA;
      if (a.format === b.format && a.dateMs !== b.dateMs) {
        return a.format === "event" ? a.dateMs - b.dateMs : b.dateMs - a.dateMs;
      }
      return hash32(`${editionId}:${attempt}:${a.key}`) - hash32(`${editionId}:${attempt}:${b.key}`) || a.tie - b.tie;
    });
    const choice = choices[0];
    selected.push(choice);
    selectedKeys.add(choice.key);
    remaining[choice.format]--;
    for (const slug of choice.artistSlugs) {
      selectedArtists.add(slug);
      artistCounts.set(slug, (artistCounts.get(slug) ?? 0) + 1);
    }
  }
  if (Object.values(remaining).some((count) => count !== 0)) return undefined;
  if ([...required].some((slug) => !selectedArtists.has(slug))) return undefined;
  return selected;
}
