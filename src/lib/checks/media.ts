import type { ImageRef, MediaAsset } from "../domain/media";
import {
  checkMediaAssetRecords,
  storagePathMatches,
} from "./media-asset-records";
import { checkMediaReferenceUsage } from "./media-reference-usage";
import type { CheckIssue } from "./result";

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

export { storagePathMatches };

export function checkMedia(input: MediaCheckInput): MediaCheckResult {
  const registryFile = input.registryFile ?? "src/content/media-assets.ts";
  const assetRecords = checkMediaAssetRecords({
    assets: input.assets,
    nowIso: input.nowIso,
    registryFile,
  });
  const referenceUsage = checkMediaReferenceUsage({
    assets: input.assets,
    assetsById: assetRecords.assetsById,
    imageUses: input.imageUses,
    registryFile,
  });

  return {
    issues: [...assetRecords.issues, ...referenceUsage.issues],
    assetCount: input.assets.length,
    imageCount: input.imageUses.length,
    usedAssetCount: referenceUsage.usedAssetIds.size,
  };
}
