export type SourceKind =
  | "press"
  | "wire"
  | "official"
  | "licensed"
  | "embed"
  | "magazine";

export interface Source {
  name: string;
  url: string;
  kind: SourceKind;
}

export type MediaKind = "placeholder" | "image" | "embed";

// SocialPlatform is intentionally wider. Only these platforms render embeds.
export type EmbedPlatform = "tiktok" | "youtube";

export const EMBED_PLATFORM_LABELS: Record<EmbedPlatform, string> = {
  tiktok: "TikTok",
  youtube: "YouTube",
};

export type Orientation = "portrait" | "landscape" | "square";

interface MediaItemBase {
  id: string;
  alt: string;
  credit: Source;
  orientation?: Orientation;
}

export interface ImageMediaItem extends MediaItemBase {
  kind: "image";
  src: string;
  width: number;
  height: number;
  orientation: Orientation;
  assetId: string;
  embedUrl?: never;
  platform?: never;
  tone?: never;
  date?: never;
}

export interface EmbedMediaItem extends MediaItemBase {
  kind: "embed";
  embedUrl: string;
  platform: EmbedPlatform;
  src?: never;
  width?: never;
  height?: never;
  assetId?: never;
  tone?: never;
  date?: string;
}

export interface PlaceholderMediaItem extends MediaItemBase {
  kind: "placeholder";
  orientation: Orientation;
  tone?: number;
  src?: never;
  width?: never;
  height?: never;
  assetId?: never;
  embedUrl?: never;
  platform?: never;
  date?: never;
}

export type MediaItem =
  | ImageMediaItem
  | EmbedMediaItem
  | PlaceholderMediaItem;

export interface ImageRef {
  kind: "image";
  assetId: string;
  alt: string;
  id?: string;
  crop?: Readonly<{
    orientation?: Orientation;
  }>;
}

export type AuthoredMediaItem =
  | ImageRef
  | EmbedMediaItem
  | PlaceholderMediaItem;

export type RightsBasis =
  | "cc-by"
  | "cc-by-sa"
  | "public-domain"
  | "agency-press-kit"
  | "official-embed"
  | "licensed"
  | "owner-supplied";

export interface MediaAsset {
  id: string;
  credit: Source;
  rightsBasis: RightsBasis;
  sourceUrl?: string;
  acquisitionDate: string;
  reviewDate: string;
  width: number;
  height: number;
  checksum: string;
  storagePath: string;
}
