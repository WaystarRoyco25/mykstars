import "server-only";

import type { EmbedPlatform } from "../domain/media";
import type { Clip, ClipGenre } from "../domain/stories";
import type { Pillar } from "../domain/taxonomy";
import { hasPromotedSubject } from "../policy/artists";
import { artistStore } from "../stores/artists";
import { clipStore } from "../stores/clips";

export async function getClips(opts?: {
  platform?: EmbedPlatform;
  genre?: ClipGenre;
  pillar?: Pillar;
  artist?: string;
}): Promise<Clip[]> {
  let list = [...clipStore.newest];
  if (opts?.platform) list = list.filter((clip) => clip.platform === opts.platform);
  if (opts?.genre) list = list.filter((clip) => clip.genre === opts.genre);
  if (opts?.pillar) list = list.filter((clip) => clip.pillar === opts.pillar);
  if (opts?.artist) {
    list = list.filter((clip) => clip.artistSlugs.includes(opts.artist!));
  }
  return list;
}

export async function getMusicClips(limit = 12): Promise<Clip[]> {
  return clipStore.newest
    .filter(
      (clip) =>
        clip.genre === "music" &&
        hasPromotedSubject(clip.artistSlugs, artistStore.bySlug),
    )
    .slice(0, limit);
}

export async function getVarietyClips(limit = 12): Promise<Clip[]> {
  return clipStore.newest
    .filter(
      (clip) =>
        clip.genre === "variety" &&
        hasPromotedSubject(clip.artistSlugs, artistStore.bySlug),
    )
    .slice(0, limit);
}
