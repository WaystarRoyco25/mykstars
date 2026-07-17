import {
  DAY_MS,
  PROFILE_HERO_RIGHTS_BASES,
  PROFILE_VERIFICATION_MAX_DAYS,
  isRightsBasisIn,
} from "../editorial-policy";
import type {
  Artist,
  AuthoredMediaItem,
  MediaAsset,
  Prediction,
  Ranking,
} from "../types";
import { issue, type CheckIssue } from "./result";

export const PREVIEW_PROFILE_CAP = 10;

export const LEGACY_PROFILE_SLUGS = Object.freeze([
  "newjeans",
  "blackpink",
  "iu",
  "stray-kids",
  "aespa",
  "cha-eunwoo",
  "twice",
  "lee-min-ho",
  "park-eun-bin",
  "kim-tae-ri",
  "park-chan-wook",
  "bong-joon-ho",
  "jung-hoyeon",
  "bts",
  "seventeen",
  "ive",
  "cortis",
  "hearts2hearts",
  "babymonster",
  "le-sserafim",
  "byeon-woo-seok",
] as const);

const CAREER_STAGES = new Set(["preview", "rookie", "rising", "established", "icon"]);
const COVERAGE_LEVELS = new Set(["active", "catalog"]);
const PUBLICATION_STATES = new Set(["draft", "published", "archived"]);

export interface AuthoredArtistForCheck extends Omit<Artist, "hero"> {
  hero?: AuthoredMediaItem;
}

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
  const legacySlugs = new Set<string>(LEGACY_PROFILE_SLUGS);
  const assetById = new Map(input.mediaAssets.map((asset) => [asset.id, asset]));
  const authoredBySlug = new Map(input.authoredArtists.map((artist) => [artist.slug, artist]));
  const bySlug = new Map<string, Artist>();
  const stageCounts = new Map<string, number>();
  const coverageCounts = new Map<string, number>();
  let previewCount = 0;
  let draftCount = 0;

  if (Number.isNaN(nowMs)) {
    issues.push(issue("src/content/now.ts", "unparseable NOW", `"${input.nowIso}"`));
  }

  for (const [index, artist] of input.artists.entries()) {
    const slug = artist.slug || `profile #${index + 1}`;
    if (!artist.slug) {
      issues.push(issue(file, "malformed profile literal", `profile #${index + 1}: missing slug`));
    } else if (bySlug.has(artist.slug)) {
      issues.push(
        issue(file, "duplicate slug", `"${artist.slug}" appears more than once (route collision)`),
      );
    } else {
      bySlug.set(artist.slug, artist);
    }

    if (!artist.careerStage) {
      issues.push(issue(file, "missing careerStage", `${slug}: every profile carries a career stage`));
    } else if (!CAREER_STAGES.has(artist.careerStage)) {
      issues.push(issue(file, "invalid careerStage", `${slug}: "${artist.careerStage}"`));
    } else {
      stageCounts.set(artist.careerStage, (stageCounts.get(artist.careerStage) ?? 0) + 1);
      if (artist.careerStage === "preview") previewCount++;
    }

    if (!artist.coverageLevel) {
      issues.push(
        issue(file, "missing coverageLevel", `${slug}: every profile carries a coverage level`),
      );
    } else if (!COVERAGE_LEVELS.has(artist.coverageLevel)) {
      issues.push(issue(file, "invalid coverageLevel", `${slug}: "${artist.coverageLevel}"`));
    } else {
      coverageCounts.set(
        artist.coverageLevel,
        (coverageCounts.get(artist.coverageLevel) ?? 0) + 1,
      );
    }

    if (!artist.publicationState) {
      issues.push(
        issue(
          file,
          "missing publicationState",
          `${slug}: every profile carries a publication state`,
        ),
      );
    } else if (!PUBLICATION_STATES.has(artist.publicationState)) {
      issues.push(
        issue(file, "invalid publicationState", `${slug}: "${artist.publicationState}"`),
      );
    } else if (artist.publicationState === "draft") {
      draftCount++;
    }

    if (!artist.lastVerified) {
      issues.push(
        issue(
          file,
          "missing lastVerified",
          `${slug}: every profile carries its last verification date`,
        ),
      );
    } else {
      const verifiedMs = Date.parse(artist.lastVerified);
      if (Number.isNaN(verifiedMs)) {
        issues.push(
          issue(file, "unparseable date", `${slug}: lastVerified "${artist.lastVerified}"`),
        );
      } else if (!Number.isNaN(nowMs) && verifiedMs > nowMs) {
        issues.push(
          issue(
            file,
            "future-dated verification",
            `${slug}: lastVerified ${artist.lastVerified} sits after NOW`,
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
              `${slug}: last verified ${Math.floor(age)} days ago (max ${cadence} for ${artist.careerStage === "preview" ? "preview" : artist.coverageLevel} profiles): re-verify per docs/roster-playbook.md`,
            ),
          );
        }
      }
    }

    const authored = authoredBySlug.get(artist.slug);
    if (!authored) {
      issues.push(
        issue(file, "missing authored profile", `${slug}: no authored profile record resolves here`),
      );
      continue;
    }
    const hero = authored.hero;
    if (
      artist.publicationState === "published" &&
      !legacySlugs.has(artist.slug) &&
      hero === undefined
    ) {
      issues.push(
        issue(
          file,
          "missing hero",
          `${slug}: a newly published profile needs a permitted hero (or stays draft): docs/roster-playbook.md`,
        ),
      );
    } else if (hero?.kind === "placeholder") {
      issues.push(
        issue(file, "placeholder hero", `${slug}: a placeholder is never a permitted hero`),
      );
    } else if (hero?.kind === "image") {
      const asset = assetById.get(hero.assetId);
      if (!asset) {
        issues.push(
          issue(
            file,
            "unregistered hero image",
            `${slug}: assetId "${hero.assetId}" matches no media asset`,
          ),
        );
      } else if (!isRightsBasisIn(asset.rightsBasis, PROFILE_HERO_RIGHTS_BASES)) {
        issues.push(
          issue(
            file,
            "disallowed hero basis",
            `${slug}: asset "${hero.assetId}" has rightsBasis "${asset.rightsBasis}" (allowed: ${PROFILE_HERO_RIGHTS_BASES.join(", ")})`,
          ),
        );
      }
    }
  }

  for (const artist of input.artists) {
    if (artist.memberOf) {
      const group = bySlug.get(artist.memberOf);
      if (!group) {
        issues.push(
          issue(
            file,
            "dangling memberOf",
            `${artist.slug}: memberOf "${artist.memberOf}" matches no profile`,
          ),
        );
      } else if (!(group.members ?? []).includes(artist.slug)) {
        issues.push(
          issue(
            file,
            "one-way relationship",
            `${artist.slug}: memberOf "${artist.memberOf}", but that profile's members list does not name ${artist.slug} back`,
          ),
        );
      }
    }

    for (const memberSlug of artist.members ?? []) {
      const member = bySlug.get(memberSlug);
      if (!member) {
        issues.push(
          issue(
            file,
            "dangling member",
            `${artist.slug}: members entry "${memberSlug}" matches no profile`,
          ),
        );
      } else if (member.memberOf !== artist.slug) {
        issues.push(
          issue(
            file,
            "one-way relationship",
            `${artist.slug}: lists member "${memberSlug}", but that profile's memberOf does not point back`,
          ),
        );
      }
    }
  }

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
    input.artists
      .filter((artist) => artist.careerStage === "preview")
      .map((artist) => artist.slug),
  );
  for (const prediction of input.predictions) {
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
  for (const ranking of input.rankings) {
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

  return {
    issues,
    profileCount: bySlug.size,
    stageCounts,
    coverageCounts,
    draftCount,
  };
}
