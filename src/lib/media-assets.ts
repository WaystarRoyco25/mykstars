import { mediaAssets } from "@/content/media-assets";
import type {
  AuthoredMediaItem,
  ImageMediaItem,
  ImageRef,
  MediaAsset,
  MediaItem,
  Orientation,
  Source,
} from "./domain/media";

export const SUPABASE_PUBLIC_MEDIA_BASE_URL =
  "https://rbhajkwsmvbyafzrthwf.supabase.co/storage/v1/object/public/media";

export type ResolvedMediaAsset = Readonly<
  Omit<MediaAsset, "credit" | "sourceUrl"> & {
    credit: Readonly<Source>;
    sourceUrl: string;
  }
>;

export interface MediaAssetLookup {
  readonly size: number;
  get(id: string): ResolvedMediaAsset | undefined;
  require(id: string): ResolvedMediaAsset;
  values(): IterableIterator<ResolvedMediaAsset>;
}

class ImmutableMediaAssetIndex implements MediaAssetLookup {
  readonly #byId: Map<string, ResolvedMediaAsset>;

  constructor(assets: readonly MediaAsset[]) {
    const byId = new Map<string, ResolvedMediaAsset>();
    for (const asset of assets) {
      if (byId.has(asset.id)) {
        throw new Error(`Duplicate media asset id: ${asset.id}`);
      }
      const normalized = Object.freeze({
        ...asset,
        credit: Object.freeze({ ...asset.credit }),
        sourceUrl: asset.sourceUrl ?? asset.credit.url,
      });
      byId.set(asset.id, normalized);
    }
    this.#byId = byId;
    Object.freeze(this);
  }

  get size(): number {
    return this.#byId.size;
  }

  get(id: string): ResolvedMediaAsset | undefined {
    return this.#byId.get(id);
  }

  require(id: string): ResolvedMediaAsset {
    const asset = this.get(id);
    if (!asset) throw new Error(`Unknown media asset id: ${id}`);
    return asset;
  }

  values(): IterableIterator<ResolvedMediaAsset> {
    return this.#byId.values();
  }
}

export function createMediaAssetIndex(
  assets: readonly MediaAsset[],
): MediaAssetLookup {
  return new ImmutableMediaAssetIndex(assets);
}

export const mediaAssetIndex = createMediaAssetIndex(mediaAssets);

export function orientationFromDimensions(
  width: number,
  height: number,
): Orientation {
  if (width > height * 1.15) return "landscape";
  if (height > width * 1.15) return "portrait";
  return "square";
}

export function resolveImageRef(
  ref: ImageRef,
  assets: MediaAssetLookup = mediaAssetIndex,
): ImageMediaItem {
  const asset = assets.require(ref.assetId);
  const storagePath = asset.storagePath.replace(/^\/+/, "");
  return {
    id: ref.id ?? asset.id,
    kind: "image",
    alt: ref.alt,
    credit: asset.credit,
    src: `${SUPABASE_PUBLIC_MEDIA_BASE_URL}/${storagePath}`,
    width: asset.width,
    height: asset.height,
    orientation:
      ref.crop?.orientation ??
      orientationFromDimensions(asset.width, asset.height),
    assetId: asset.id,
  };
}

export function resolveAuthoredMediaItem(
  item: AuthoredMediaItem,
  assets: MediaAssetLookup = mediaAssetIndex,
): MediaItem {
  return item.kind === "image" ? resolveImageRef(item, assets) : item;
}
