import "server-only";

import { editions } from "../../content/editions";
import { freezeCopy, uniqueIndex } from "./immutable";

const all = freezeCopy(editions);
const byId = uniqueIndex("edition", all, (edition) => edition.id);

export const editionStore = Object.freeze({ all, byId });
