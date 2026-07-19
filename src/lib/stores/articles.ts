import "server-only";

import { articles } from "../../content/articles";
import { byDateDesc, freezeCopy, relationshipIndex, uniqueIndex } from "./immutable";

const all = freezeCopy(articles);
const bySlug = uniqueIndex("article", all, (article) => article.slug);
const newest = byDateDesc(all);
const byArtist = relationshipIndex(
  newest,
  (article) => article.related?.artistSlugs,
);

export const articleStore = Object.freeze({
  all,
  bySlug,
  newest,
  byArtist,
});
