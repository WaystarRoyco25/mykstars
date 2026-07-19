import "server-only";

import type { EventRegion, EventType, StarEvent } from "../domain/events";
import { eventStore } from "../stores/events";

export async function getEvents(opts?: {
  region?: EventRegion | "international";
  type?: EventType;
  upcomingFrom?: string;
}): Promise<StarEvent[]> {
  let list = [...eventStore.soonest];
  if (opts?.upcomingFrom) {
    const from = opts.upcomingFrom.slice(0, 10);
    list = list.filter((event) => (event.endDate ?? event.date) >= from);
  }
  if (opts?.region === "international") {
    list = list.filter((event) => event.region !== "korea");
  } else if (opts?.region) {
    list = list.filter((event) => event.region === opts.region);
  }
  if (opts?.type) list = list.filter((event) => event.type === opts.type);
  return list;
}
