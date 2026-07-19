export type Pillar = "k-pop" | "k-drama" | "k-movie" | "fashion-beauty";

export const PILLAR_LABELS: Record<Pillar, string> = {
  "k-pop": "K-Pop",
  "k-drama": "K-Drama",
  "k-movie": "K-Movie",
  "fashion-beauty": "Fashion & Beauty",
};

export const PILLAR_ORDER: Pillar[] = [
  "k-pop",
  "k-drama",
  "fashion-beauty",
  "k-movie",
];

const PILLAR_SLUGS: Record<Pillar, string> = {
  "k-pop": "k-pop",
  "k-drama": "k-drama",
  "k-movie": "k-movie",
  "fashion-beauty": "fashion",
};

export function pillarSlug(pillar: Pillar): string {
  return PILLAR_SLUGS[pillar];
}

export function pillarFromSlug(slug: string): Pillar | undefined {
  return PILLAR_ORDER.find((pillar) => PILLAR_SLUGS[pillar] === slug);
}

export type CategoryTag =
  | "airport"
  | "red-carpet"
  | "comeback"
  | "event"
  | "pictorial"
  | "stills"
  | "casting"
  | "press"
  | "review"
  | "ost"
  | "calendar"
  | "festival"
  | "director"
  | "crossover"
  | "campaign"
  | "beauty"
  | "fashion-week";

export const TAG_LABELS: Record<CategoryTag, string> = {
  airport: "Airport",
  "red-carpet": "Red carpet",
  comeback: "Comeback",
  event: "Event",
  pictorial: "Pictorial",
  stills: "Stills",
  casting: "Casting",
  press: "Press",
  review: "Reviews",
  ost: "OST",
  calendar: "Calendar",
  festival: "Festival",
  director: "Directors",
  crossover: "Crossover",
  campaign: "Campaign",
  beauty: "Beauty",
  "fashion-week": "Fashion week",
};
