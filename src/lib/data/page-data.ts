import "server-only";

import { cache } from "react";

import type { Artist } from "../domain/artists";
import type { MediaItem } from "../domain/media";
import type { Article, Gallery, Pulse } from "../domain/stories";
import { articleStore } from "../stores/articles";
import { galleryStore } from "../stores/galleries";
import {
  profileTimeline,
  type TimelineEntry,
} from "../stores/profile-timeline";
import { pulseStore } from "../stores/pulses";
import { getArtist, getArtistsBySlugs } from "./artists";
import { getGalleriesBySlugs } from "./galleries";
import { sparseFill } from "./home-fill";

export async function getProfileTimeline(artistSlug: string): Promise<TimelineEntry[]> {
  return profileTimeline(artistSlug);
}

export interface ArtistCatalogPageData {
  artist: Artist;
  galleries: Gallery[];
  timeline: TimelineEntry[];
  fillEmbeds: MediaItem[];
  fillGalleries: Gallery[];
  groupProfile?: Artist;
  memberProfiles: Artist[];
}

const readArtistCatalogPageData = cache(
  async (artistSlug: string): Promise<ArtistCatalogPageData | undefined> => {
    const artist = await getArtist(artistSlug);
    if (!artist) return undefined;
    const galleries = [...(galleryStore.listedByArtist.get(artistSlug) ?? [])];
    const timeline = profileTimeline(artistSlug, galleries);
    const { embeds: fillEmbeds, galleries: fillGalleries } = await sparseFill(
      artist,
      galleries,
    );
    const groupProfile = artist.memberOf
      ? await getArtist(artist.memberOf)
      : undefined;
    const memberProfiles = await getArtistsBySlugs(artist.members ?? []);
    return {
      artist,
      galleries,
      timeline,
      fillEmbeds,
      fillGalleries,
      groupProfile,
      memberProfiles,
    };
  },
);

export async function getArtistCatalogPageData(
  artistSlug: string,
): Promise<ArtistCatalogPageData | undefined> {
  return readArtistCatalogPageData(artistSlug);
}

export interface ArticlePageData {
  article: Article;
  relatedArtists: Artist[];
  relatedGalleries: Gallery[];
}

const readArticlePageData = cache(
  async (slug: string): Promise<ArticlePageData | undefined> => {
    const article = articleStore.bySlug.get(slug);
    if (!article) return undefined;
    const [relatedArtists, relatedGalleries] = await Promise.all([
      getArtistsBySlugs(article.related?.artistSlugs ?? []),
      getGalleriesBySlugs(article.related?.gallerySlugs ?? []),
    ]);
    return { article, relatedArtists, relatedGalleries };
  },
);

export async function getArticlePageData(
  slug: string,
): Promise<ArticlePageData | undefined> {
  return readArticlePageData(slug);
}

export interface GalleryPageData {
  gallery: Gallery;
  artists: Artist[];
}

const readGalleryPageData = cache(
  async (slug: string): Promise<GalleryPageData | undefined> => {
    const gallery = galleryStore.bySlug.get(slug);
    if (!gallery) return undefined;
    return { gallery, artists: await getArtistsBySlugs(gallery.artistSlugs) };
  },
);

export async function getGalleryPageData(
  slug: string,
): Promise<GalleryPageData | undefined> {
  return readGalleryPageData(slug);
}

export interface PulsePageData {
  pulse: Pulse;
  artists: Artist[];
}

const readPulsePageData = cache(
  async (slug: string): Promise<PulsePageData | undefined> => {
    const pulse = pulseStore.bySlug.get(slug);
    if (!pulse) return undefined;
    return { pulse, artists: await getArtistsBySlugs(pulse.artistSlugs) };
  },
);

export async function getPulsePageData(
  slug: string,
): Promise<PulsePageData | undefined> {
  return readPulsePageData(slug);
}

export type { TimelineEntry } from "../stores/profile-timeline";
