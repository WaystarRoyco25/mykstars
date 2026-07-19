import type { Source } from "./media";

export type EventType = "concert" | "fan-meeting";

export type EventRegion =
  | "north-america"
  | "europe"
  | "asia"
  | "latin-america"
  | "oceania"
  | "korea";

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  concert: "Concert",
  "fan-meeting": "Fan meeting",
};

export const EVENT_TYPE_ORDER: EventType[] = ["concert", "fan-meeting"];

export const REGION_LABELS: Record<EventRegion, string> = {
  "north-america": "North America",
  europe: "Europe",
  asia: "Asia",
  "latin-america": "Latin America",
  oceania: "Oceania",
  korea: "Korea",
};

export const REGION_ORDER: EventRegion[] = [
  "north-america",
  "europe",
  "asia",
  "latin-america",
  "oceania",
  "korea",
];

export type EventStatus = "on-sale" | "sold-out" | "announced" | "postponed";

export interface StarEvent {
  slug: string;
  headliner: string;
  artistSlugs?: string[];
  type: EventType;
  tour?: string;
  date: string;
  endDate?: string;
  venue?: string;
  city: string;
  country: string;
  region: EventRegion;
  status?: EventStatus;
  ticketUrl?: string;
  source: Source;
  note?: string;
}
