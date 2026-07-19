import "server-only";

import type { Artist } from "../domain/artists";
import type { StarEvent } from "../domain/events";
import type { Article, Clip, Gallery, Pulse } from "../domain/stories";
import { articleStore } from "./articles";
import { artistStore } from "./artists";
import { clipStore } from "./clips";
import { eventStore } from "./events";
import { galleryStore } from "./galleries";
import { pulseStore } from "./pulses";

export type TimelineEntry =
  | { format: "gallery"; date: string; gallery: Gallery }
  | { format: "clip"; date: string; clip: Clip }
  | { format: "article"; date: string; article: Article }
  | { format: "pulse"; date: string; pulse: Pulse; artists: Artist[] }
  | { format: "event"; date: string; event: StarEvent };

export interface ProfileTimelineSources {
  galleriesByArtist: ReadonlyMap<string, readonly Gallery[]>;
  clipsByArtist: ReadonlyMap<string, readonly Clip[]>;
  articlesByArtist: ReadonlyMap<string, readonly Article[]>;
  pulsesByArtist: ReadonlyMap<string, readonly Pulse[]>;
  eventsByArtist: ReadonlyMap<string, readonly StarEvent[]>;
  artistsForSlugs(slugs: readonly string[]): Artist[];
}

export function assembleProfileTimeline(
  artistSlug: string,
  sources: ProfileTimelineSources,
  ownGalleries?: readonly Gallery[],
): TimelineEntry[] {
  const galleriesForArtist =
    ownGalleries ?? sources.galleriesByArtist.get(artistSlug) ?? [];
  const entries: TimelineEntry[] = [
    ...galleriesForArtist.map(
      (gallery): TimelineEntry => ({ format: "gallery", date: gallery.date, gallery }),
    ),
    ...(sources.clipsByArtist.get(artistSlug) ?? []).map(
      (clip): TimelineEntry => ({ format: "clip", date: clip.date, clip }),
    ),
    ...(sources.articlesByArtist.get(artistSlug) ?? []).map(
      (article): TimelineEntry => ({ format: "article", date: article.date, article }),
    ),
    ...(sources.pulsesByArtist.get(artistSlug) ?? []).map(
      (pulse): TimelineEntry => ({
        format: "pulse",
        date: pulse.date,
        pulse,
        artists: sources.artistsForSlugs(pulse.artistSlugs),
      }),
    ),
    ...(sources.eventsByArtist.get(artistSlug) ?? []).map(
      (event): TimelineEntry => ({ format: "event", date: event.date, event }),
    ),
  ];
  return entries.toSorted((a, b) => b.date.localeCompare(a.date));
}

const productionSources: ProfileTimelineSources = {
  galleriesByArtist: galleryStore.listedByArtist,
  clipsByArtist: clipStore.byArtist,
  articlesByArtist: articleStore.byArtist,
  pulsesByArtist: pulseStore.byArtist,
  eventsByArtist: eventStore.byArtist,
  artistsForSlugs: artistStore.forSlugs,
};

export function profileTimeline(
  artistSlug: string,
  ownGalleries?: readonly Gallery[],
): TimelineEntry[] {
  return assembleProfileTimeline(artistSlug, productionSources, ownGalleries);
}
