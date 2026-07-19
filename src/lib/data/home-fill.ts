import "server-only";

import { clipMedia } from "../media";
import type { Artist, SocialLink } from "../domain/artists";
import {
  EMBED_PLATFORM_LABELS,
  type EmbedPlatform,
  type MediaItem,
} from "../domain/media";
import type { Clip, Gallery } from "../domain/stories";
import type { Pillar } from "../domain/taxonomy";
import {
  DEFAULT_ARTIST_PILLAR,
  artistPillars,
  hasPromotedSubject,
  isPromotedArtist,
} from "../policy/artists";
import { artistStore } from "../stores/artists";
import { clipStore } from "../stores/clips";
import { getMusicClips, getVarietyClips } from "./clips";
import { getFeaturedGallery, getGalleriesForPillar } from "./galleries";

export type HomeHero =
  | { kind: "gallery"; gallery: Gallery }
  | { kind: "clip"; clip: Clip };

export async function getHomeHero(): Promise<HomeHero | undefined> {
  const gallery = await getFeaturedGallery();
  if (gallery) return { kind: "gallery", gallery };
  const [music] = await getMusicClips(1);
  if (music) return { kind: "clip", clip: music };
  const [variety] = await getVarietyClips(1);
  return variety ? { kind: "clip", clip: variety } : undefined;
}

function artistEmbeds(artist: Artist): MediaItem[] {
  return (artist.social ?? [])
    .filter(
      (social): social is SocialLink & { platform: EmbedPlatform } =>
        social.platform === "youtube" || social.platform === "tiktok",
    )
    .map(
      (social): MediaItem => ({
        id: `${artist.slug}-${social.platform}`,
        kind: "embed",
        platform: social.platform,
        embedUrl: social.url,
        alt: `${artist.name} on ${EMBED_PLATFORM_LABELS[social.platform]}`,
        credit: { name: social.handle, url: social.url, kind: "embed" },
      }),
    );
}

function distinctArtistSlugs(galleries: readonly Gallery[]): string[] {
  const slugs: string[] = [];
  const seen = new Set<string>();
  for (const gallery of galleries) {
    for (const slug of gallery.artistSlugs) {
      if (seen.has(slug)) continue;
      seen.add(slug);
      slugs.push(slug);
    }
  }
  return slugs;
}

function artistClipEmbeds(slugs: readonly string[], cap: number): MediaItem[] {
  if (cap <= 0) return [];
  const slugSet = new Set(slugs);
  return clipStore.newest
    .filter(
      (clip) =>
        clip.artistSlugs.some((slug) => slugSet.has(slug)) &&
        hasPromotedSubject(clip.artistSlugs, artistStore.bySlug),
    )
    .slice(0, cap)
    .map(clipMedia);
}

export async function sparseFill(
  artist: Artist,
  ownGalleries: Gallery[],
  minTiles = 3,
): Promise<{ embeds: MediaItem[]; galleries: Gallery[] }> {
  const deficit = minTiles - ownGalleries.length;
  if (deficit <= 0) return { embeds: [], galleries: [] };
  const posts = artistClipEmbeds([artist.slug], deficit);
  const postIds = new Set(posts.map((item) => item.id));
  const accounts = artistEmbeds(artist).filter((item) => !postIds.has(item.id));
  const embeds = [...posts, ...accounts].slice(0, deficit);
  const stillShort = deficit - embeds.length;
  if (stillShort <= 0) return { embeds, galleries: [] };
  const pillar = artistPillars(artist)[0] ?? DEFAULT_ARTIST_PILLAR;
  const own = new Set(ownGalleries.map((gallery) => gallery.slug));
  const related = (await getGalleriesForPillar(pillar))
    .filter((gallery) => !own.has(gallery.slug))
    .slice(0, stillShort);
  return { embeds, galleries: related };
}

export function pillarFillEmbeds(
  bandGalleries: Gallery[],
  cap: number,
): MediaItem[] {
  if (cap <= 0) return [];
  const slugs = distinctArtistSlugs(bandGalleries);
  const output: MediaItem[] = [];
  const seen = new Set<string>();
  const push = (item: MediaItem): boolean => {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      output.push(item);
    }
    return output.length >= cap;
  };
  for (const item of artistClipEmbeds(slugs, cap)) {
    if (push(item)) return output;
  }
  for (const slug of slugs) {
    const artist = artistStore.bySlug.get(slug);
    if (!artist || !isPromotedArtist(artist)) continue;
    for (const item of artistEmbeds(artist)) {
      if (push(item)) return output;
    }
  }
  return output;
}

export function clipFillMedia(cap: number, pillar?: Pillar): MediaItem[] {
  if (cap <= 0) return [];
  let list = clipStore.newest.filter((clip) =>
    hasPromotedSubject(clip.artistSlugs, artistStore.bySlug),
  );
  if (pillar) {
    const lensArtists = new Set(
      artistStore.all
        .filter((artist) => artistPillars(artist).includes(pillar))
        .map((artist) => artist.slug),
    );
    list = list.filter(
      (clip) =>
        clip.pillar === pillar ||
        clip.artistSlugs.some((slug) => lensArtists.has(slug)),
    );
  }
  return list.slice(0, cap).map(clipMedia);
}

export function getPulseBandFill(
  artistSlugs: string[],
  excludeClipIds: ReadonlySet<string>,
  cap: number,
): MediaItem[] {
  if (cap <= 0) return [];
  return artistClipEmbeds(artistSlugs, cap + excludeClipIds.size)
    .filter((item) => !excludeClipIds.has(item.id))
    .slice(0, cap);
}
