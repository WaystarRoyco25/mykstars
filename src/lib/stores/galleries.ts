import "server-only";

import { galleries } from "../../content/galleries";
import { isGalleryListed } from "../policy/galleries";
import {
  byDateDesc,
  freezeCopy,
  relationshipIndex,
  uniqueIndex,
} from "./immutable";

const all = freezeCopy(galleries);
const bySlug = uniqueIndex("gallery", all, (gallery) => gallery.slug);
const listedNewest = byDateDesc(all.filter(isGalleryListed));
const listedByArtist = relationshipIndex(
  listedNewest,
  (gallery) => gallery.artistSlugs,
);

export const galleryStore = Object.freeze({
  all,
  bySlug,
  listedNewest,
  listedByArtist,
});
