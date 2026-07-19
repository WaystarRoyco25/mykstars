import type { MediaItem } from "./media";
import type { Pillar } from "./taxonomy";

export type Discipline = "idol" | "actor" | "director" | "model";

export type CareerStage =
  | "preview"
  | "rookie"
  | "rising"
  | "established"
  | "icon";

export type CoverageLevel = "active" | "catalog";

export type PublicationState = "draft" | "published" | "archived";

export const CAREER_STAGE_LABELS: Record<CareerStage, string> = {
  preview: "Pre-debut",
  rookie: "Rookie",
  rising: "Rising",
  established: "Established",
  icon: "Icon",
};

export const CAREER_STAGE_ORDER: CareerStage[] = [
  "rookie",
  "rising",
  "established",
  "icon",
  "preview",
];

export const COVERAGE_LEVEL_LABELS: Record<CoverageLevel, string> = {
  active: "Active coverage",
  catalog: "Catalog",
};

export interface OfficialLink {
  label: string;
  url: string;
}

// Instagram and X remain verification records but are not embed platforms.
export type SocialPlatform = "instagram" | "x" | "tiktok" | "youtube";

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
  handle: string;
}

export interface Artist {
  slug: string;
  name: string;
  koreanName?: string;
  type: "group" | "soloist" | "individual";
  disciplines?: Discipline[];
  pillars?: Pillar[];
  agency?: string;
  debutYear?: number;
  knownFor?: string[];
  bio: string;
  social?: SocialLink[];
  careerStage: CareerStage;
  coverageLevel: CoverageLevel;
  publicationState: PublicationState;
  lastVerified: string;
  currentActivity?: string;
  memberOf?: string;
  members?: string[];
  officialLinks?: OfficialLink[];
  aliases?: string[];
  hero?: MediaItem;
}
