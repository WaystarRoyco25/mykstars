import "server-only";

import { clips } from "../../content/clips";
import { byDateDesc, freezeCopy, relationshipIndex, uniqueIndex } from "./immutable";

const all = freezeCopy(clips);
const byId = uniqueIndex("clip", all, (clip) => clip.id);
const newest = byDateDesc(all);
const byArtist = relationshipIndex(newest, (clip) => clip.artistSlugs);

export const clipStore = Object.freeze({
  all,
  byId,
  newest,
  byArtist,
});
