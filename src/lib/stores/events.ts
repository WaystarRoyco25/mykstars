import "server-only";

import { events } from "../../content/events";
import { byDateAsc, freezeCopy, relationshipIndex, uniqueIndex } from "./immutable";

const all = freezeCopy(events);
const bySlug = uniqueIndex("event", all, (event) => event.slug);
const soonest = byDateAsc(all);
const byArtist = relationshipIndex(soonest, (event) => event.artistSlugs);

export const eventStore = Object.freeze({
  all,
  bySlug,
  soonest,
  byArtist,
});
