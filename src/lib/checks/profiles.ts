import type { Artist } from "../domain/artists";
import type { Prediction } from "../domain/forecasts";
import type { MediaAsset } from "../domain/media";
import type { Ranking } from "../domain/stories";
import {
  validateProfileHeroRights,
  type AuthoredArtistForCheck,
} from "./profile-hero-rights";
import { validatePreviewProfilePolicy } from "./profile-preview-policy";
import { validateProfileRelationships } from "./profile-relationships";
import {
  createProfileShapeState,
  validateProfileShapeAndVerification,
} from "./profile-shape";
import { issue, type CheckIssue } from "./result";

export { PREVIEW_PROFILE_CAP } from "./profile-preview-policy";
export type { AuthoredArtistForCheck } from "./profile-hero-rights";

export interface ProfileCheckInput {
  artists: readonly Artist[];
  authoredArtists: readonly AuthoredArtistForCheck[];
  mediaAssets: readonly MediaAsset[];
  predictions: readonly Prediction[];
  rankings: readonly Ranking[];
  nowIso: string;
  file?: string;
}

export interface ProfileCheckResult {
  issues: CheckIssue[];
  profileCount: number;
  stageCounts: ReadonlyMap<string, number>;
  coverageCounts: ReadonlyMap<string, number>;
  draftCount: number;
}

export function checkProfiles(input: ProfileCheckInput): ProfileCheckResult {
  const file = input.file ?? "src/content/profiles.ts";
  const issues: CheckIssue[] = [];
  const nowMs = Date.parse(input.nowIso);
  const assetById = new Map(input.mediaAssets.map((asset) => [asset.id, asset]));
  const authoredBySlug = new Map(input.authoredArtists.map((artist) => [artist.slug, artist]));
  const state = createProfileShapeState();

  if (Number.isNaN(nowMs)) {
    issues.push(issue("src/content/now.ts", "unparseable NOW", `"${input.nowIso}"`));
  }

  for (const [index, artist] of input.artists.entries()) {
    const shape = validateProfileShapeAndVerification(
      artist,
      index,
      file,
      nowMs,
      state,
    );
    issues.push(...shape.issues);
    issues.push(
      ...validateProfileHeroRights(
        artist,
        shape.label,
        authoredBySlug,
        assetById,
        file,
      ),
    );
  }

  issues.push(...validateProfileRelationships(input.artists, state.bySlug, file));
  issues.push(
    ...validatePreviewProfilePolicy(
      input.artists,
      input.predictions,
      input.rankings,
      state.previewCount,
      file,
    ),
  );

  return {
    issues,
    profileCount: state.bySlug.size,
    stageCounts: state.stageCounts,
    coverageCounts: state.coverageCounts,
    draftCount: state.draftCount,
  };
}
