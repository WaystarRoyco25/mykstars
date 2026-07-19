import type { Artist } from "../domain/artists";
import { PROFILE_VERIFICATION_MAX_DAYS } from "../policy/artists";
import { DAY_MS } from "../policy/time";
import { issue, type CheckIssue } from "./result";

const CAREER_STAGES = new Set(["preview", "rookie", "rising", "established", "icon"]);
const COVERAGE_LEVELS = new Set(["active", "catalog"]);
const PUBLICATION_STATES = new Set(["draft", "published", "archived"]);

export interface ProfileShapeState {
  bySlug: Map<string, Artist>;
  stageCounts: Map<string, number>;
  coverageCounts: Map<string, number>;
  previewCount: number;
  draftCount: number;
}

export function createProfileShapeState(): ProfileShapeState {
  return {
    bySlug: new Map(),
    stageCounts: new Map(),
    coverageCounts: new Map(),
    previewCount: 0,
    draftCount: 0,
  };
}

export function validateProfileShapeAndVerification(
  artist: Artist,
  index: number,
  file: string,
  nowMs: number,
  state: ProfileShapeState,
): { label: string; issues: CheckIssue[] } {
  const issues: CheckIssue[] = [];
  const label = artist.slug || `profile #${index + 1}`;

  if (!artist.slug) {
    issues.push(issue(file, "malformed profile literal", `profile #${index + 1}: missing slug`));
  } else if (state.bySlug.has(artist.slug)) {
    issues.push(
      issue(file, "duplicate slug", `"${artist.slug}" appears more than once (route collision)`),
    );
  } else {
    state.bySlug.set(artist.slug, artist);
  }

  if (!artist.careerStage) {
    issues.push(
      issue(file, "missing careerStage", `${label}: every profile carries a career stage`),
    );
  } else if (!CAREER_STAGES.has(artist.careerStage)) {
    issues.push(issue(file, "invalid careerStage", `${label}: "${artist.careerStage}"`));
  } else {
    state.stageCounts.set(
      artist.careerStage,
      (state.stageCounts.get(artist.careerStage) ?? 0) + 1,
    );
    if (artist.careerStage === "preview") state.previewCount++;
  }

  if (!artist.coverageLevel) {
    issues.push(
      issue(file, "missing coverageLevel", `${label}: every profile carries a coverage level`),
    );
  } else if (!COVERAGE_LEVELS.has(artist.coverageLevel)) {
    issues.push(issue(file, "invalid coverageLevel", `${label}: "${artist.coverageLevel}"`));
  } else {
    state.coverageCounts.set(
      artist.coverageLevel,
      (state.coverageCounts.get(artist.coverageLevel) ?? 0) + 1,
    );
  }

  if (!artist.publicationState) {
    issues.push(
      issue(
        file,
        "missing publicationState",
        `${label}: every profile carries a publication state`,
      ),
    );
  } else if (!PUBLICATION_STATES.has(artist.publicationState)) {
    issues.push(
      issue(file, "invalid publicationState", `${label}: "${artist.publicationState}"`),
    );
  } else if (artist.publicationState === "draft") {
    state.draftCount++;
  }

  if (!artist.lastVerified) {
    issues.push(
      issue(
        file,
        "missing lastVerified",
        `${label}: every profile carries its last verification date`,
      ),
    );
  } else {
    const verifiedMs = Date.parse(artist.lastVerified);
    if (Number.isNaN(verifiedMs)) {
      issues.push(
        issue(file, "unparseable date", `${label}: lastVerified "${artist.lastVerified}"`),
      );
    } else if (!Number.isNaN(nowMs) && verifiedMs > nowMs) {
      issues.push(
        issue(
          file,
          "future-dated verification",
          `${label}: lastVerified ${artist.lastVerified} sits after NOW`,
        ),
      );
    } else if (!Number.isNaN(nowMs)) {
      const cadence =
        artist.careerStage === "preview"
          ? PROFILE_VERIFICATION_MAX_DAYS.preview
          : PROFILE_VERIFICATION_MAX_DAYS[artist.coverageLevel];
      const age = (nowMs - verifiedMs) / DAY_MS;
      if (cadence && age > cadence) {
        issues.push(
          issue(
            file,
            "stale verification",
            `${label}: last verified ${Math.floor(age)} days ago (max ${cadence} for ${artist.careerStage === "preview" ? "preview" : artist.coverageLevel} profiles): re-verify per docs/roster-playbook.md`,
          ),
        );
      }
    }
  }

  return { label, issues };
}
