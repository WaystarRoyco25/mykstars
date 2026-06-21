// Domain model for MyKStars.
// These types are the contract between the UI and the data layer (see data.ts).
// Today the data layer is backed by local seed data; swapping in a headless CMS
// (Sanity/Payload) later means re-implementing data.ts against these same types.

export type Category =
  | "airport"
  | "red-carpet"
  | "comeback"
  | "event"
  | "pictorial";

export const CATEGORY_LABELS: Record<Category, string> = {
  airport: "Airport",
  "red-carpet": "Red carpet",
  comeback: "Comeback",
  event: "Event",
  pictorial: "Pictorial",
};

export const CATEGORY_ORDER: Category[] = [
  "airport",
  "red-carpet",
  "comeback",
  "event",
  "pictorial",
];

// How a piece of media reaches us. This encodes the "defensible aggregation"
// model from the plan: prefer embeds (photo stays on source) and licensed
// imagery; never silently rehost. Every item carries a credit.
export type SourceKind =
  | "press" // Korean photo desk (OSEN, Newsen, Star News...)
  | "wire" // wire service (Yonhap, News1, AP, Reuters)
  | "official" // agency / label press kit
  | "licensed" // paid stock (Getty incl. imazins, etc.)
  | "embed" // official social embed (IG / X / TikTok / YouTube)
  | "magazine"; // publisher pictorial

export interface Source {
  name: string; // outlet / photographer / platform
  url: string; // link back to the original
  kind: SourceKind;
}

export type MediaKind = "placeholder" | "image" | "embed";
export type EmbedPlatform = "instagram" | "x" | "tiktok" | "youtube";

export interface MediaItem {
  id: string;
  kind: MediaKind;
  alt: string;
  credit: Source; // attribution is required — no exceptions
  src?: string; // when kind === "image"
  width?: number;
  height?: number;
  embedUrl?: string; // when kind === "embed"
  platform?: EmbedPlatform; // when kind === "embed"
  tone?: number; // 0..3, decorative variety for placeholders
}

export interface Artist {
  slug: string;
  name: string;
  koreanName?: string;
  type: "group" | "soloist";
  agency?: string;
  debutYear?: number;
  bio: string;
}

export interface Gallery {
  slug: string;
  title: string;
  category: Category;
  artistSlugs: string[];
  event?: string;
  date: string; // ISO date
  source: Source; // primary source for the set
  cover: MediaItem;
  media: MediaItem[];
  excerpt: string;
}

export type ArticleStatus = "analysis" | "confirmed" | "unverified";

export interface Article {
  slug: string;
  title: string;
  dek: string; // standfirst / summary
  status: ArticleStatus;
  author: string;
  date: string; // ISO date
  body: string[]; // paragraphs
  source?: Source;
  related?: {
    artistSlugs?: string[];
    gallerySlugs?: string[];
  };
}
