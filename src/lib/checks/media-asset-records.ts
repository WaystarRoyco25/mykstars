import {
  STORED_IMAGE_RIGHTS_BASES,
  isRightsBasisIn,
} from "../policy/media-rights";
import type { MediaAsset } from "../domain/media";
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

interface MediaAssetRecordCheckInput {
  assets: readonly MediaAsset[];
  nowIso: string;
  registryFile: string;
}

interface MediaAssetRecordCheckResult {
  issues: CheckIssue[];
  assetsById: ReadonlyMap<string, MediaAsset>;
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

export function checkMediaAssetRecords(
  input: MediaAssetRecordCheckInput,
): MediaAssetRecordCheckResult {
  const issues: CheckIssue[] = [];
  const nowDate = input.nowIso.slice(0, 10);
  const nowIsValid = parseCalendarDate(nowDate) !== undefined;
  const assetsById = new Map<string, MediaAsset>();

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
      issues.push(
        issue(input.registryFile, "empty asset id", `${label}: id cannot be empty`),
      );
    } else if (!SLUG_RE.test(asset.id)) {
      issues.push(
        issue(
          input.registryFile,
          "invalid asset id",
          `${label}: id must be a lowercase kebab-case token`,
        ),
      );
    } else if (assetsById.has(asset.id)) {
      issues.push(
        issue(
          input.registryFile,
          "duplicate asset id",
          `${label}: id appears more than once`,
        ),
      );
    } else {
      assetsById.set(asset.id, asset);
    }

    if (!isRightsBasisIn(asset.rightsBasis, STORED_IMAGE_RIGHTS_BASES)) {
      issues.push(
        issue(
          input.registryFile,
          "disallowed stored-image basis",
          `${label}: "${asset.rightsBasis}" cannot back a stored image; use ${STORED_IMAGE_RIGHTS_BASES.join(", ")}`,
        ),
      );
    }

    if (!parseCalendarDate(asset.acquisitionDate)) {
      issues.push(
        issue(
          input.registryFile,
          "invalid acquisition date",
          `${label}: acquisitionDate must be a real YYYY-MM-DD calendar date`,
        ),
      );
    } else if (nowIsValid && asset.acquisitionDate > nowDate) {
      issues.push(
        issue(
          input.registryFile,
          "future acquisition date",
          `${label}: ${asset.acquisitionDate} sits after NOW ${nowDate}`,
        ),
      );
    }

    if (!parseCalendarDate(asset.reviewDate)) {
      issues.push(
        issue(
          input.registryFile,
          "invalid review date",
          `${label}: reviewDate must be a real YYYY-MM-DD calendar date`,
        ),
      );
    } else if (nowIsValid && asset.reviewDate < nowDate) {
      issues.push(
        issue(
          input.registryFile,
          "overdue rights review",
          `${label}: reviewDate ${asset.reviewDate} is before NOW ${nowDate}`,
        ),
      );
    }

    if (!Number.isSafeInteger(asset.width) || asset.width <= 0) {
      issues.push(
        issue(
          input.registryFile,
          "invalid width",
          `${label}: width must be a positive integer literal`,
        ),
      );
    }
    if (!Number.isSafeInteger(asset.height) || asset.height <= 0) {
      issues.push(
        issue(
          input.registryFile,
          "invalid height",
          `${label}: height must be a positive integer literal`,
        ),
      );
    }
    if (!SHA256_RE.test(asset.checksum)) {
      issues.push(
        issue(
          input.registryFile,
          "invalid checksum",
          `${label}: checksum must be a 64-character hexadecimal SHA-256 digest`,
        ),
      );
    }
    if (!storagePathMatches(asset.storagePath, asset.id)) {
      issues.push(
        issue(
          input.registryFile,
          "invalid storage path",
          `${label}: "${asset.storagePath}" must match profiles/{slug}/{yyyy}/{assetId}.{ext} or galleries/{gallerySlug}/{assetId}.{ext}`,
        ),
      );
    }
    if (!asset.credit || !isAbsoluteHttpUrl(asset.credit.url)) {
      issues.push(
        issue(
          input.registryFile,
          "invalid credit",
          `${label}: credit must carry an absolute HTTP(S) URL`,
        ),
      );
    }
    if (asset.sourceUrl !== undefined && !isAbsoluteHttpUrl(asset.sourceUrl)) {
      issues.push(
        issue(
          input.registryFile,
          "invalid source URL",
          `${label}: sourceUrl must be an absolute HTTP(S) URL`,
        ),
      );
    } else if (asset.sourceUrl !== undefined && asset.sourceUrl === asset.credit?.url) {
      issues.push(
        issue(
          input.registryFile,
          "redundant source URL",
          `${label}: omit sourceUrl when it matches credit.url; sourceUrl is only for an acquisition-source override`,
        ),
      );
    }
  }

  return { issues, assetsById };
}
