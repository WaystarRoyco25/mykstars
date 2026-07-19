import type { Source } from "./media";
import type { Pillar } from "./taxonomy";

export type PredictionCategory =
  | "award"
  | "chart"
  | "comeback"
  | "box-office"
  | "tour"
  | "debut"
  | "campaign";

export const PREDICTION_CATEGORY_LABELS: Record<PredictionCategory, string> = {
  award: "Awards",
  chart: "Charts",
  comeback: "Comeback",
  "box-office": "Box office",
  tour: "Tour",
  debut: "Debut",
  campaign: "Campaign",
};

export type PredictionStatus = "open" | "closed" | "resolved";

export interface PredictionOption {
  id: string;
  label: string;
  artistSlug?: string;
}

export interface Resolution {
  winningOptionId: string;
  resolvedAt: string;
  source: Source;
  note?: string;
}

export interface Prediction {
  slug: string;
  pillar: Pillar;
  category: PredictionCategory;
  question: string;
  framing: string;
  opensAt: string;
  closesAt: string;
  status: PredictionStatus;
  options: PredictionOption[];
  resolutionSourceLabel: string;
  resolutionSource: Source;
  resolution?: Resolution;
  tallyVisibleThreshold: number;
  asOf: string;
}

export interface PredictionTallyOption {
  optionId: string;
  votes: number;
  pct: number;
}

export interface PredictionTally {
  predictionSlug: string;
  totalVotes: number;
  perOption: PredictionTallyOption[];
  revealed: boolean;
  asOf: string;
}
