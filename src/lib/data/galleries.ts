import "server-only";

import { cache } from "react";

import type { Gallery } from "../domain/stories";
import type { Pillar } from "../domain/taxonomy";
import { hasPromotedSubject } from "../policy/artists";
import { isFashionLensGallery } from "../policy/galleries";
import { artistStore } from "../stores/artists";
import { galleryStore } from "../stores/galleries";

export function hasFeaturedArtist(gallery: Gallery): boolean {
  return hasPromotedSubject(gallery.artistSlugs, artistStore.bySlug);
}

export async function getGalleriesForPillar(pillar: Pillar): Promise<Gallery[]> {
  return galleryStore.listedNewest.filter((gallery) =>
    pillar === "fashion-beauty"
      ? isFashionLensGallery(gallery)
      : gallery.pillar === pillar,
  );
}

const readGallery = cache(async (slug: string): Promise<Gallery | undefined> =>
  galleryStore.bySlug.get(slug),
);

export async function getGallery(slug: string): Promise<Gallery | undefined> {
  return readGallery(slug);
}

export async function getGalleriesBySlugs(slugs: readonly string[]): Promise<Gallery[]> {
  return slugs
    .map((slug) => galleryStore.bySlug.get(slug))
    .filter((gallery): gallery is Gallery => gallery !== undefined);
}

export async function getFeaturedGallery(): Promise<Gallery | undefined> {
  return (
    galleryStore.listedNewest.find(hasFeaturedArtist) ??
    galleryStore.listedNewest[0]
  );
}

export async function getGalleriesByArtist(artistSlug: string): Promise<Gallery[]> {
  return [...(galleryStore.listedByArtist.get(artistSlug) ?? [])];
}

export function allGallerySlugs(): string[] {
  return galleryStore.all.map((gallery) => gallery.slug);
}

export function publishedGallerySlugs(): string[] {
  return galleryStore.listedNewest.map((gallery) => gallery.slug);
}
