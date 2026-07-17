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
import { isGalleryListed } from "./editorial-policy";
import type {
  Article,
  Artist,
  Clip,
  FeedEdition,
  Gallery,
  Prediction,
  Pulse,
  Ranking,
  StarEvent,
} from "./types";

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

export type TimelineEntry =
  | { format: "gallery"; date: string; gallery: Gallery }
  | { format: "clip"; date: string; clip: Clip }
  | { format: "article"; date: string; article: Article }
  | { format: "pulse"; date: string; pulse: Pulse; artists: Artist[] }
  | { format: "event"; date: string; event: StarEvent };

function freezeCopy<T>(items: readonly T[]): readonly T[] {
  return Object.freeze([...items]);
}

function byDateDesc<T extends { date: string }>(items: readonly T[]): readonly T[] {
  return freezeCopy(items.toSorted((a, b) => b.date.localeCompare(a.date)));
}

function byDateAsc<T extends { date: string }>(items: readonly T[]): readonly T[] {
  return freezeCopy(items.toSorted((a, b) => a.date.localeCompare(b.date)));
}

class ImmutableIndex<K, V> implements ReadonlyMap<K, V> {
  readonly #map: Map<K, V>;

  constructor(entries: Iterable<readonly [K, V]>) {
    this.#map = new Map(entries);
    Object.freeze(this);
  }

  get size(): number {
    return this.#map.size;
  }

  get(key: K): V | undefined {
    return this.#map.get(key);
  }

  has(key: K): boolean {
    return this.#map.has(key);
  }

  entries(): MapIterator<[K, V]> {
    return this.#map.entries();
  }

  keys(): MapIterator<K> {
    return this.#map.keys();
  }

  values(): MapIterator<V> {
    return this.#map.values();
  }

  forEach(
    callbackfn: (value: V, key: K, map: ReadonlyMap<K, V>) => void,
    thisArg?: unknown,
  ): void {
    this.#map.forEach((value, key) => callbackfn.call(thisArg, value, key, this));
  }

  [Symbol.iterator](): MapIterator<[K, V]> {
    return this.entries();
  }

  get [Symbol.toStringTag](): string {
    return "Map";
  }
}

function uniqueIndex<T>(
  label: string,
  items: readonly T[],
  keyOf: (item: T) => string,
): ReadonlyMap<string, T> {
  const index = new Map<string, T>();
  for (const item of items) {
    const key = keyOf(item);
    if (index.has(key)) {
      throw new Error(`Duplicate ${label} key "${key}".`);
    }
    index.set(key, item);
  }
  return new ImmutableIndex(index);
}

function relationshipIndex<T>(
  items: readonly T[],
  slugsOf: (item: T) => readonly string[] | undefined,
): ReadonlyMap<string, readonly T[]> {
  const mutable = new Map<string, T[]>();
  for (const item of items) {
    for (const slug of new Set(slugsOf(item) ?? [])) {
      const related = mutable.get(slug) ?? [];
      related.push(item);
      mutable.set(slug, related);
    }
  }
  return new ImmutableIndex(
    [...mutable].map(([slug, related]) => [slug, freezeCopy(related)] as const),
  );
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
    return slugs
      .map((slug) => this.artistBySlug.get(slug))
      .filter((artist): artist is Artist => artist !== undefined);
  }

  requireMany<T>(
    index: ReadonlyMap<string, T>,
    keys: readonly string[],
    label: string,
    owner: string,
  ): T[] {
    return keys.map((key) => {
      const item = index.get(key);
      if (!item) throw new Error(`${owner} references missing ${label} "${key}".`);
      return item;
    });
  }

  profileTimeline(artistSlug: string, ownGalleries?: readonly Gallery[]): TimelineEntry[] {
    const galleriesForArtist = ownGalleries ?? this.listedGalleriesByArtist.get(artistSlug) ?? [];
    const entries: TimelineEntry[] = [
      ...galleriesForArtist.map(
        (gallery): TimelineEntry => ({ format: "gallery", date: gallery.date, gallery }),
      ),
      ...(this.clipsByArtist.get(artistSlug) ?? []).map(
        (clip): TimelineEntry => ({ format: "clip", date: clip.date, clip }),
      ),
      ...(this.articlesByArtist.get(artistSlug) ?? []).map(
        (article): TimelineEntry => ({ format: "article", date: article.date, article }),
      ),
      ...(this.pulsesByArtist.get(artistSlug) ?? []).map(
        (pulse): TimelineEntry => ({
          format: "pulse",
          date: pulse.date,
          pulse,
          artists: this.artistsForSlugs(pulse.artistSlugs),
        }),
      ),
      ...(this.eventsByArtist.get(artistSlug) ?? []).map(
        (event): TimelineEntry => ({ format: "event", date: event.date, event }),
      ),
    ];
    return entries.toSorted((a, b) => b.date.localeCompare(a.date));
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
