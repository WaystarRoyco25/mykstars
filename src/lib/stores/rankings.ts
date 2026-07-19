import "server-only";

import { rankings } from "../../content/rankings";
import { freezeCopy, uniqueIndex } from "./immutable";

const all = freezeCopy(rankings);
const bySlug = uniqueIndex("ranking", all, (ranking) => ranking.slug);

export const rankingStore = Object.freeze({ all, bySlug });
