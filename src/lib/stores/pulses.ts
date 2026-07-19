import "server-only";

import { pulses } from "../../content/pulses";
import { byDateDesc, freezeCopy, relationshipIndex, uniqueIndex } from "./immutable";

const all = freezeCopy(pulses);
const bySlug = uniqueIndex("Pulse", all, (pulse) => pulse.slug);
const newest = byDateDesc(all);
const byArtist = relationshipIndex(newest, (pulse) => pulse.artistSlugs);

export const pulseStore = Object.freeze({
  all,
  bySlug,
  newest,
  byArtist,
});
