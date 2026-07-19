import type { ImageRef, MediaAsset } from "../domain/media";
import { issue, type CheckIssue } from "./result";

interface MediaReferenceUse {
  file: string;
  owner: string;
  image: ImageRef;
}

interface MediaReferenceUsageCheckInput {
  assets: readonly MediaAsset[];
  assetsById: ReadonlyMap<string, MediaAsset>;
  imageUses: readonly MediaReferenceUse[];
  registryFile: string;
}

interface MediaReferenceUsageCheckResult {
  issues: CheckIssue[];
  usedAssetIds: ReadonlySet<string>;
}

export function checkMediaReferenceUsage(
  input: MediaReferenceUsageCheckInput,
): MediaReferenceUsageCheckResult {
  const issues: CheckIssue[] = [];
  const usedAssetIds = new Set<string>();

  for (const use of input.imageUses) {
    if (!use.image.assetId) {
      issues.push(
        issue(use.file, "missing assetId", `${use.owner}: every authored image needs assetId`),
      );
      continue;
    }
    usedAssetIds.add(use.image.assetId);
    if (!input.assetsById.has(use.image.assetId)) {
      issues.push(
        issue(
          use.file,
          "dangling media asset",
          `${use.owner}: assetId "${use.image.assetId}" matches no record in ${input.registryFile}`,
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
          input.registryFile,
          "unused media asset",
          `asset ${asset.id}: no authored image reference uses this rights record`,
        ),
      );
    }
  }

  return { issues, usedAssetIds };
}
