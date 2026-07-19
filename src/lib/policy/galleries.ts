import type { Gallery } from "../domain/stories";

export const FASHION_LENS_TAGS = Object.freeze([
  "pictorial",
  "campaign",
  "beauty",
  "fashion-week",
  "airport",
] as const);

export function isGalleryListed(gallery: Gallery): boolean {
  return (gallery.publicationState ?? "published") !== "archived";
}

export function isEditionGalleryEligible(gallery: Gallery): boolean {
  return (
    isGalleryListed(gallery) &&
    gallery.cover.kind !== "placeholder" &&
    gallery.media.length > 0 &&
    gallery.media.every((media) => media.kind !== "placeholder") &&
    (gallery.cover.kind === "image" ||
      gallery.media.some((media) => media.kind === "image"))
  );
}

export function isFashionLensGallery(gallery: Gallery): boolean {
  return (
    gallery.pillar === "fashion-beauty" ||
    FASHION_LENS_TAGS.some((tag) => gallery.category === tag) ||
    gallery.tags?.some((tag) =>
      FASHION_LENS_TAGS.some((lensTag) => lensTag === tag),
    ) === true
  );
}
