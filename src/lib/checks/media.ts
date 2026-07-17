import {
  STORED_IMAGE_RIGHTS_BASES,
  isRightsBasisIn,
} from "../editorial-policy";
import type { ImageRef, MediaAsset } from "../types";
import {
  isAbsoluteHttpUrl,
  issue,
  parseCalendarDate,
  type CheckIssue,
} from "./result";

const SHA256_RE = /^[0-9a-f]{64}$/i;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const YEAR_RE = /^\d{4}$/;
const EXT_RE = /^[a-z0-9]+$/i;

export interface AuthoredImageUse {
  file: string;
  owner: string;
  image: ImageRef;
}

export interface MediaCheckInput {
  assets: readonly MediaAsset[];
  imageUses: readonly AuthoredImageUse[];
  nowIso: string;
  registryFile?: string;
}

export interface MediaCheckResult {
  issues: CheckIssue[];
  assetCount: number;
  imageCount: number;
  usedAssetCount: number;
}

export function storagePathMatches(path: string, id: string): boolean {
  if (typeof path !== "string" || typeof id !== "string" || !id) return false;
  const parts = path.split("/");
  const filenameMatches = (filename: string): boolean => {
    const prefix = `${id}.`;
    return filename.startsWith(prefix) && EXT_RE.test(filename.slice(prefix.length));
  };
  if (parts[0] === "profiles") {
    return (
      parts.length === 4 &&
      SLUG_RE.test(parts[1]) &&
      YEAR_RE.test(parts[2]) &&
      filenameMatches(parts[3])
    );
  }
  if (parts[0] === "galleries") {
    return parts.length === 3 && SLUG_RE.test(parts[1]) && filenameMatches(parts[2]);
  }
  return false;
}

export function checkMedia(input: MediaCheckInput): MediaCheckResult {
  const registryFile = input.registryFile ?? "src/content/media-assets.ts";
  const issues: CheckIssue[] = [];
  const nowDate = input.nowIso.slice(0, 10);
  const nowIsValid = parseCalendarDate(nowDate) !== undefined;
  const assetsById = new Map<string, MediaAsset>();
  const usedAssetIds = new Set<string>();

  if (!nowIsValid) {
    issues.push(
      issue(
        "src/content/now.ts",
        "invalid NOW",
        `NOW does not begin with a valid ISO calendar date: ${input.nowIso}`,
      ),
    );
  }

  for (const [index, asset] of input.assets.entries()) {
    const label = asset.id ? `asset ${asset.id}` : `asset #${index + 1}`;
    if (!asset.id) {
      issues.push(issue(registryFile, "empty asset id", `${label}: id cannot be empty`));
    } else if (!SLUG_RE.test(asset.id)) {
      issues.push(
        issue(
          registryFile,
          "invalid asset id",
          `${label}: id must be a lowercase kebab-case token`,
        ),
      );
    } else if (assetsById.has(asset.id)) {
      issues.push(
        issue(registryFile, "duplicate asset id", `${label}: id appears more than once`),
      );
    } else {
      assetsById.set(asset.id, asset);
    }

    if (!isRightsBasisIn(asset.rightsBasis, STORED_IMAGE_RIGHTS_BASES)) {
      issues.push(
        issue(
          registryFile,
          "disallowed stored-image basis",
          `${label}: "${asset.rightsBasis}" cannot back a stored image; use ${STORED_IMAGE_RIGHTS_BASES.join(", ")}`,
        ),
      );
    }

    if (!parseCalendarDate(asset.acquisitionDate)) {
      issues.push(
        issue(
          registryFile,
          "invalid acquisition date",
          `${label}: acquisitionDate must be a real YYYY-MM-DD calendar date`,
        ),
      );
    } else if (nowIsValid && asset.acquisitionDate > nowDate) {
      issues.push(
        issue(
          registryFile,
          "future acquisition date",
          `${label}: ${asset.acquisitionDate} sits after NOW ${nowDate}`,
        ),
      );
    }

    if (!parseCalendarDate(asset.reviewDate)) {
      issues.push(
        issue(
          registryFile,
          "invalid review date",
          `${label}: reviewDate must be a real YYYY-MM-DD calendar date`,
        ),
      );
    } else if (nowIsValid && asset.reviewDate < nowDate) {
      issues.push(
        issue(
          registryFile,
          "overdue rights review",
          `${label}: reviewDate ${asset.reviewDate} is before NOW ${nowDate}`,
        ),
      );
    }

    if (!Number.isSafeInteger(asset.width) || asset.width <= 0) {
      issues.push(
        issue(
          registryFile,
          "invalid width",
          `${label}: width must be a positive integer literal`,
        ),
      );
    }
    if (!Number.isSafeInteger(asset.height) || asset.height <= 0) {
      issues.push(
        issue(
          registryFile,
          "invalid height",
          `${label}: height must be a positive integer literal`,
        ),
      );
    }
    if (!SHA256_RE.test(asset.checksum)) {
      issues.push(
        issue(
          registryFile,
          "invalid checksum",
          `${label}: checksum must be a 64-character hexadecimal SHA-256 digest`,
        ),
      );
    }
    if (!storagePathMatches(asset.storagePath, asset.id)) {
      issues.push(
        issue(
          registryFile,
          "invalid storage path",
          `${label}: "${asset.storagePath}" must match profiles/{slug}/{yyyy}/{assetId}.{ext} or galleries/{gallerySlug}/{assetId}.{ext}`,
        ),
      );
    }
    if (!asset.credit || !isAbsoluteHttpUrl(asset.credit.url)) {
      issues.push(
        issue(
          registryFile,
          "invalid credit",
          `${label}: credit must carry an absolute HTTP(S) URL`,
        ),
      );
    }
    if (asset.sourceUrl !== undefined && !isAbsoluteHttpUrl(asset.sourceUrl)) {
      issues.push(
        issue(
          registryFile,
          "invalid source URL",
          `${label}: sourceUrl must be an absolute HTTP(S) URL`,
        ),
      );
    } else if (asset.sourceUrl !== undefined && asset.sourceUrl === asset.credit?.url) {
      issues.push(
        issue(
          registryFile,
          "redundant source URL",
          `${label}: omit sourceUrl when it matches credit.url; sourceUrl is only for an acquisition-source override`,
        ),
      );
    }
  }

  for (const use of input.imageUses) {
    if (!use.image.assetId) {
      issues.push(
        issue(use.file, "missing assetId", `${use.owner}: every authored image needs assetId`),
      );
      continue;
    }
    usedAssetIds.add(use.image.assetId);
    if (!assetsById.has(use.image.assetId)) {
      issues.push(
        issue(
          use.file,
          "dangling media asset",
          `${use.owner}: assetId "${use.image.assetId}" matches no record in ${registryFile}`,
        ),
      );
    }
    if (typeof use.image.alt !== "string" || !use.image.alt.trim()) {
      issues.push(
        issue(use.file, "missing image alt", `${use.owner}: contextual alt text cannot be empty`),
      );
    }
  }

  for (const asset of input.assets) {
    if (!usedAssetIds.has(asset.id)) {
      issues.push(
        issue(
          registryFile,
          "unused media asset",
          `asset ${asset.id}: no authored image reference uses this rights record`,
        ),
      );
    }
  }

  return {
    issues,
    assetCount: input.assets.length,
    imageCount: input.imageUses.length,
    usedAssetCount: usedAssetIds.size,
  };
}
