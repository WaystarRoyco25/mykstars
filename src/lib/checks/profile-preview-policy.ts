import type { Artist } from "../domain/artists";
import type { Prediction } from "../domain/forecasts";
import type { Ranking } from "../domain/stories";
import { issue, type CheckIssue } from "./result";

export const PREVIEW_PROFILE_CAP = 10;

export function validatePreviewProfilePolicy(
  artists: readonly Artist[],
  predictions: readonly Prediction[],
  rankings: readonly Ranking[],
  previewCount: number,
  file: string,
): CheckIssue[] {
  const issues: CheckIssue[] = [];

  if (previewCount > PREVIEW_PROFILE_CAP) {
    issues.push(
      issue(
        file,
        "preview cap exceeded",
        `${previewCount} preview profiles (cap ${PREVIEW_PROFILE_CAP})`,
      ),
    );
  }

  const previewSlugs = new Set(
    artists
      .filter((artist) => artist.careerStage === "preview")
      .map((artist) => artist.slug),
  );
  for (const prediction of predictions) {
    for (const option of prediction.options) {
      if (option.artistSlug && previewSlugs.has(option.artistSlug)) {
        issues.push(
          issue(
            "src/content/predictions.ts",
            "preview profile as forecast subject",
            `"${option.artistSlug}" is a preview (pre-debut) profile: activity-only coverage, docs/roster-playbook.md`,
          ),
        );
      }
    }
  }
  for (const ranking of rankings) {
    for (const row of ranking.rows) {
      if (row.artistSlug && previewSlugs.has(row.artistSlug)) {
        issues.push(
          issue(
            "src/content/rankings.ts",
            "preview profile as ranking link",
            `"${row.artistSlug}" is a preview (pre-debut) profile: activity-only coverage, docs/roster-playbook.md`,
          ),
        );
      }
    }
  }

  return issues;
}
