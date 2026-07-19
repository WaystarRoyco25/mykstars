import type {
  EmbedPlatform,
  ImageMediaItem,
  MediaItem,
  Orientation,
  Source,
} from "./media";
import type { CategoryTag, Pillar } from "./taxonomy";

export type ClipGenre = "music" | "variety";

export interface Clip {
  id: string;
  platform: EmbedPlatform;
  genre: ClipGenre;
  embedUrl: string;
  pillar: Pillar;
  artistSlugs: string[];
  date: string;
  caption: string;
  credit: Source;
  orientation?: Orientation;
  evergreenUntil?: string;
}

export interface Gallery {
  slug: string;
  title: string;
  pillar: Pillar;
  category: CategoryTag;
  tags?: CategoryTag[];
  artistSlugs: string[];
  event?: string;
  date: string;
  source: Source;
  cover: MediaItem;
  media: MediaItem[];
  excerpt: string;
  publicationState?: "published" | "archived";
}

export type ArticleStatus = "analysis" | "confirmed" | "unverified";

export interface Article {
  slug: string;
  title: string;
  dek: string;
  status: ArticleStatus;
  pillar?: Pillar;
  author: string;
  date: string;
  body: string[];
  source?: Source;
  media?: ImageMediaItem;
  related?: {
    artistSlugs?: string[];
    gallerySlugs?: string[];
  };
}

export interface RankingRow {
  rank: number;
  name: string;
  detail?: string;
  value: string;
  change?: number;
  isNew?: boolean;
  artistSlug?: string;
}

export interface Ranking {
  slug: string;
  title: string;
  pillar: Pillar;
  metricLabel: string;
  period: string;
  asOf: string;
  source: Source;
  sample?: boolean;
  blurb?: string;
  rows: RankingRow[];
}

export interface Pulse {
  slug: string;
  heading: string;
  artistSlugs: string[];
  pillar: Pillar;
  date: string;
  body: string;
  source: Source;
  media?: MediaItem;
}
