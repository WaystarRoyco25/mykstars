import "server-only";

import { artists } from "../../content/profiles";
import type { Artist } from "../domain/artists";
import { freezeCopy, uniqueIndex, valuesForKeys } from "./immutable";

const all = freezeCopy(artists);
const bySlug = uniqueIndex("artist", all, (artist) => artist.slug);
const byName = freezeCopy(
  all.toSorted((a, b) => a.name.localeCompare(b.name)),
);

export const artistStore = Object.freeze({
  all,
  bySlug,
  byName,
  forSlugs(slugs: readonly string[]): Artist[] {
    return valuesForKeys(bySlug, slugs);
  },
});
