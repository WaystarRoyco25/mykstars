import "server-only";

import { predictions } from "../../content/predictions";
import { freezeCopy, uniqueIndex } from "./immutable";

const all = freezeCopy(predictions);
const bySlug = uniqueIndex("prediction", all, (prediction) => prediction.slug);

export const forecastStore = Object.freeze({ all, bySlug });
