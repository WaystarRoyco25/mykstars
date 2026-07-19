import "server-only";

import {
  NOW,
  articles,
  artists,
  clips,
  editions,
  events,
  galleries,
  predictions,
  pulses,
  rankings,
} from "./content";
import type { Artist } from "./domain/artists";
import type { FeedEdition } from "./domain/editions";
import type { StarEvent } from "./domain/events";
import type { Prediction } from "./domain/forecasts";
import type { Article, Clip, Gallery, Pulse, Ranking } from "./domain/stories";
import { isGalleryListed } from "./policy/galleries";
import {
  byDateAsc,
  byDateDesc,
  freezeCopy,
  relationshipIndex,
  requireMany as requireManyFromIndex,
  uniqueIndex,
  valuesForKeys,
} from "./stores/immutable";
import {
  assembleProfileTimeline,
  type TimelineEntry,
} from "./stores/profile-timeline";

export type { TimelineEntry } from "./stores/profile-timeline";

export interface ContentInventory {
  now: string;
  artists: readonly Artist[];
  galleries: readonly Gallery[];
  clips: readonly Clip[];
  articles: readonly Article[];
  pulses: readonly Pulse[];
  rankings: readonly Ranking[];
  events: readonly StarEvent[];
  predictions: readonly Prediction[];
  editions: readonly FeedEdition[];
}

export class ContentRepository {
  readonly now: string;

  readonly artists: readonly Artist[];
  readonly galleries: readonly Gallery[];
  readonly clips: readonly Clip[];
  readonly articles: readonly Article[];
  readonly pulses: readonly Pulse[];
  readonly rankings: readonly Ranking[];
  readonly events: readonly StarEvent[];
  readonly predictions: readonly Prediction[];
  readonly editions: readonly FeedEdition[];

  readonly artistsByName: readonly Artist[];
  readonly listedGalleriesNewest: readonly Gallery[];
  readonly clipsNewest: readonly Clip[];
  readonly articlesNewest: readonly Article[];
  readonly pulsesNewest: readonly Pulse[];
  readonly eventsSoonest: readonly StarEvent[];

  readonly artistBySlug: ReadonlyMap<string, Artist>;
  readonly galleryBySlug: ReadonlyMap<string, Gallery>;
  readonly clipById: ReadonlyMap<string, Clip>;
  readonly articleBySlug: ReadonlyMap<string, Article>;
  readonly pulseBySlug: ReadonlyMap<string, Pulse>;
  readonly rankingBySlug: ReadonlyMap<string, Ranking>;
  readonly eventBySlug: ReadonlyMap<string, StarEvent>;
  readonly predictionBySlug: ReadonlyMap<string, Prediction>;
  readonly editionById: ReadonlyMap<string, FeedEdition>;

  readonly listedGalleriesByArtist: ReadonlyMap<string, readonly Gallery[]>;
  readonly clipsByArtist: ReadonlyMap<string, readonly Clip[]>;
  readonly articlesByArtist: ReadonlyMap<string, readonly Article[]>;
  readonly pulsesByArtist: ReadonlyMap<string, readonly Pulse[]>;
  readonly eventsByArtist: ReadonlyMap<string, readonly StarEvent[]>;

  constructor(inventory: ContentInventory) {
    this.now = inventory.now;

    this.artists = freezeCopy(inventory.artists);
    this.galleries = freezeCopy(inventory.galleries);
    this.clips = freezeCopy(inventory.clips);
    this.articles = freezeCopy(inventory.articles);
    this.pulses = freezeCopy(inventory.pulses);
    this.rankings = freezeCopy(inventory.rankings);
    this.events = freezeCopy(inventory.events);
    this.predictions = freezeCopy(inventory.predictions);
    this.editions = freezeCopy(inventory.editions);

    this.artistBySlug = uniqueIndex("artist", this.artists, (item) => item.slug);
    this.galleryBySlug = uniqueIndex("gallery", this.galleries, (item) => item.slug);
    this.clipById = uniqueIndex("clip", this.clips, (item) => item.id);
    this.articleBySlug = uniqueIndex("article", this.articles, (item) => item.slug);
    this.pulseBySlug = uniqueIndex("Pulse", this.pulses, (item) => item.slug);
    this.rankingBySlug = uniqueIndex("ranking", this.rankings, (item) => item.slug);
    this.eventBySlug = uniqueIndex("event", this.events, (item) => item.slug);
    this.predictionBySlug = uniqueIndex("prediction", this.predictions, (item) => item.slug);
    this.editionById = uniqueIndex("edition", this.editions, (item) => item.id);

    this.artistsByName = freezeCopy(
      this.artists.toSorted((a, b) => a.name.localeCompare(b.name)),
    );
    this.listedGalleriesNewest = byDateDesc(this.galleries.filter(isGalleryListed));
    this.clipsNewest = byDateDesc(this.clips);
    this.articlesNewest = byDateDesc(this.articles);
    this.pulsesNewest = byDateDesc(this.pulses);
    this.eventsSoonest = byDateAsc(this.events);

    this.listedGalleriesByArtist = relationshipIndex(
      this.listedGalleriesNewest,
      (item) => item.artistSlugs,
    );
    this.clipsByArtist = relationshipIndex(this.clipsNewest, (item) => item.artistSlugs);
    this.articlesByArtist = relationshipIndex(
      this.articlesNewest,
      (item) => item.related?.artistSlugs,
    );
    this.pulsesByArtist = relationshipIndex(this.pulsesNewest, (item) => item.artistSlugs);
    this.eventsByArtist = relationshipIndex(this.eventsSoonest, (item) => item.artistSlugs);

    Object.freeze(this);
  }

  artistsForSlugs(slugs: readonly string[]): Artist[] {
    return valuesForKeys(this.artistBySlug, slugs);
  }

  requireMany<T>(
    index: ReadonlyMap<string, T>,
    keys: readonly string[],
    label: string,
    owner: string,
  ): T[] {
    return requireManyFromIndex(index, keys, label, owner);
  }

  profileTimeline(artistSlug: string, ownGalleries?: readonly Gallery[]): TimelineEntry[] {
    return assembleProfileTimeline(
      artistSlug,
      {
        galleriesByArtist: this.listedGalleriesByArtist,
        clipsByArtist: this.clipsByArtist,
        articlesByArtist: this.articlesByArtist,
        pulsesByArtist: this.pulsesByArtist,
        eventsByArtist: this.eventsByArtist,
        artistsForSlugs: (slugs) => this.artistsForSlugs(slugs),
      },
      ownGalleries,
    );
  }
}

export function createContentRepository(inventory: ContentInventory): ContentRepository {
  return new ContentRepository(inventory);
}

export const contentRepository = createContentRepository({
  now: NOW,
  artists,
  galleries,
  clips,
  articles,
  pulses,
  rankings,
  events,
  predictions,
  editions,
});
