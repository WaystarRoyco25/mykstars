import { cache } from "react";

import { clipMedia } from "../media";
import { contentRepository } from "../content-repository";
import {
  DEFAULT_ARTIST_PILLAR,
  artistPillars,
  hasPromotedSubject,
  isFashionLensGallery,
  isPromotedArtist,
} from "../editorial-policy";
import { EMBED_PLATFORM_LABELS } from "../types";
import type {
  Article,
  Artist,
  CareerStage,
  Clip,
  ClipGenre,
  CoverageLevel,
  EmbedPlatform,
  EventRegion,
  EventType,
  Gallery,
  MediaItem,
  Pillar,
  Pulse,
  Ranking,
  SocialLink,
  StarEvent,
} from "../types";
import type { TimelineEntry } from "../content-repository";

const repository = contentRepository;

export function hasFeaturedArtist(gallery: Gallery): boolean {
  return hasPromotedSubject(gallery.artistSlugs, repository.artistBySlug);
}

export async function getGalleriesForPillar(pillar: Pillar): Promise<Gallery[]> {
  return repository.listedGalleriesNewest.filter((gallery) =>
    pillar === "fashion-beauty"
      ? isFashionLensGallery(gallery)
      : gallery.pillar === pillar,
  );
}

const readGallery = cache(async (slug: string): Promise<Gallery | undefined> =>
  repository.galleryBySlug.get(slug),
);

export async function getGallery(slug: string): Promise<Gallery | undefined> {
  return readGallery(slug);
}

export async function getGalleriesBySlugs(slugs: readonly string[]): Promise<Gallery[]> {
  return slugs
    .map((slug) => repository.galleryBySlug.get(slug))
    .filter((gallery): gallery is Gallery => gallery !== undefined);
}

export async function getFeaturedGallery(): Promise<Gallery | undefined> {
  return (
    repository.listedGalleriesNewest.find(hasFeaturedArtist) ??
    repository.listedGalleriesNewest[0]
  );
}

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

export async function getGalleriesByArtist(artistSlug: string): Promise<Gallery[]> {
  return [...(repository.listedGalleriesByArtist.get(artistSlug) ?? [])];
}

export async function getArtistsByPillar(pillar: Pillar): Promise<Artist[]> {
  return repository.artistsByName.filter(
    (artist) => isPromotedArtist(artist) && artistPillars(artist).includes(pillar),
  );
}

const readArtist = cache(async (slug: string): Promise<Artist | undefined> => {
  const artist = repository.artistBySlug.get(slug);
  return artist && artist.publicationState !== "draft" ? artist : undefined;
});

export async function getArtist(slug: string): Promise<Artist | undefined> {
  return readArtist(slug);
}

export async function getArtistsBySlugs(slugs: readonly string[]): Promise<Artist[]> {
  return repository
    .artistsForSlugs(slugs)
    .filter((artist) => artist.publicationState !== "draft");
}

export async function getStarsDirectory(opts?: {
  pillar?: Pillar;
  stage?: CareerStage;
  type?: Artist["type"];
  agency?: string;
  debutYear?: number;
  coverage?: CoverageLevel;
  q?: string;
}): Promise<Artist[]> {
  let list = repository.artistsByName.filter(
    (artist) => artist.publicationState === "published",
  );
  if (opts?.pillar) {
    list = list.filter((artist) => artistPillars(artist).includes(opts.pillar!));
  }
  if (opts?.stage) list = list.filter((artist) => artist.careerStage === opts.stage);
  if (opts?.type) list = list.filter((artist) => artist.type === opts.type);
  if (opts?.coverage) {
    list = list.filter((artist) => artist.coverageLevel === opts.coverage);
  }
  if (opts?.agency) list = list.filter((artist) => artist.agency === opts.agency);
  if (opts?.debutYear) {
    list = list.filter((artist) => artist.debutYear === opts.debutYear);
  }
  const query = opts?.q?.trim().toLowerCase();
  if (query) list = list.filter((artist) => artist.name.toLowerCase().includes(query));
  return list;
}

export async function getDirectoryFacets(): Promise<{
  agencies: string[];
  debutYears: number[];
}> {
  const published = repository.artists.filter(
    (artist) => artist.publicationState === "published",
  );
  return {
    agencies: [
      ...new Set(
        published
          .map((artist) => artist.agency)
          .filter((agency): agency is string => Boolean(agency)),
      ),
    ].sort((a, b) => a.localeCompare(b)),
    debutYears: [
      ...new Set(
        published
          .map((artist) => artist.debutYear)
          .filter((year): year is number => typeof year === "number"),
      ),
    ].sort((a, b) => b - a),
  };
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
  return repository.clipsNewest
    .filter(
      (clip) =>
        clip.artistSlugs.some((slug) => slugSet.has(slug)) &&
        hasPromotedSubject(clip.artistSlugs, repository.artistBySlug),
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
    const artist = repository.artistBySlug.get(slug);
    if (!artist || !isPromotedArtist(artist)) continue;
    for (const item of artistEmbeds(artist)) {
      if (push(item)) return output;
    }
  }
  return output;
}

export function clipFillMedia(cap: number, pillar?: Pillar): MediaItem[] {
  if (cap <= 0) return [];
  let list = repository.clipsNewest.filter((clip) =>
    hasPromotedSubject(clip.artistSlugs, repository.artistBySlug),
  );
  if (pillar) {
    const lensArtists = new Set(
      repository.artists
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

export async function getArticles(opts?: { pillar?: Pillar }): Promise<Article[]> {
  return repository.articlesNewest.filter(
    (article) => !opts?.pillar || article.pillar === opts.pillar,
  );
}

const readArticle = cache(async (slug: string): Promise<Article | undefined> =>
  repository.articleBySlug.get(slug),
);

export async function getArticle(slug: string): Promise<Article | undefined> {
  return readArticle(slug);
}

export async function getRelatedArticles(artistSlug: string): Promise<Article[]> {
  return [...(repository.articlesByArtist.get(artistSlug) ?? [])];
}

export async function getPulses(opts?: {
  artist?: string;
  limit?: number;
}): Promise<Pulse[]> {
  let list = opts?.artist
    ? [...(repository.pulsesByArtist.get(opts.artist) ?? [])]
    : [...repository.pulsesNewest];
  if (opts?.limit !== undefined) list = list.slice(0, Math.max(0, opts.limit));
  return list;
}

const readPulse = cache(async (slug: string): Promise<Pulse | undefined> =>
  repository.pulseBySlug.get(slug),
);

export async function getPulse(slug: string): Promise<Pulse | undefined> {
  return readPulse(slug);
}

export async function getProfileTimeline(artistSlug: string): Promise<TimelineEntry[]> {
  return repository.profileTimeline(artistSlug);
}

function stripUnpromotedLinks(ranking: Ranking): Ranking {
  if (
    !ranking.rows.some((row) => {
      if (!row.artistSlug) return false;
      const artist = repository.artistBySlug.get(row.artistSlug);
      return artist !== undefined && !isPromotedArtist(artist);
    })
  ) {
    return ranking;
  }
  return {
    ...ranking,
    rows: ranking.rows.map((row) => {
      if (!row.artistSlug) return row;
      const artist = repository.artistBySlug.get(row.artistSlug);
      return artist !== undefined && !isPromotedArtist(artist)
        ? { ...row, artistSlug: undefined }
        : row;
    }),
  };
}

const visibleRankings = repository.rankings.map(stripUnpromotedLinks);
const visibleRankingBySlug = new Map(
  visibleRankings.map((ranking) => [ranking.slug, ranking]),
);
const visibleRankingByPillar = new Map(
  visibleRankings.map((ranking) => [ranking.pillar, ranking]),
);

export async function getRankings(): Promise<Ranking[]> {
  return [...visibleRankings];
}

const readRanking = cache(async (slug: string): Promise<Ranking | undefined> =>
  visibleRankingBySlug.get(slug),
);

export async function getRanking(slug: string): Promise<Ranking | undefined> {
  return readRanking(slug);
}

export async function getRankingForPillar(
  pillar: Pillar,
): Promise<Ranking | undefined> {
  return visibleRankingByPillar.get(pillar);
}

export async function getEvents(opts?: {
  region?: EventRegion | "international";
  type?: EventType;
  upcomingFrom?: string;
}): Promise<StarEvent[]> {
  let list = [...repository.eventsSoonest];
  if (opts?.upcomingFrom) {
    const from = opts.upcomingFrom.slice(0, 10);
    list = list.filter((event) => (event.endDate ?? event.date) >= from);
  }
  if (opts?.region === "international") {
    list = list.filter((event) => event.region !== "korea");
  } else if (opts?.region) {
    list = list.filter((event) => event.region === opts.region);
  }
  if (opts?.type) list = list.filter((event) => event.type === opts.type);
  return list;
}

export async function getClips(opts?: {
  platform?: EmbedPlatform;
  genre?: ClipGenre;
  pillar?: Pillar;
  artist?: string;
}): Promise<Clip[]> {
  let list = [...repository.clipsNewest];
  if (opts?.platform) list = list.filter((clip) => clip.platform === opts.platform);
  if (opts?.genre) list = list.filter((clip) => clip.genre === opts.genre);
  if (opts?.pillar) list = list.filter((clip) => clip.pillar === opts.pillar);
  if (opts?.artist) {
    list = list.filter((clip) => clip.artistSlugs.includes(opts.artist!));
  }
  return list;
}

export async function getMusicClips(limit = 12): Promise<Clip[]> {
  return repository.clipsNewest
    .filter(
      (clip) =>
        clip.genre === "music" &&
        hasPromotedSubject(clip.artistSlugs, repository.artistBySlug),
    )
    .slice(0, limit);
}

export async function getVarietyClips(limit = 12): Promise<Clip[]> {
  return repository.clipsNewest
    .filter(
      (clip) =>
        clip.genre === "variety" &&
        hasPromotedSubject(clip.artistSlugs, repository.artistBySlug),
    )
    .slice(0, limit);
}

export function allGallerySlugs(): string[] {
  return repository.galleries.map((gallery) => gallery.slug);
}

export function publishedGallerySlugs(): string[] {
  return repository.listedGalleriesNewest.map((gallery) => gallery.slug);
}

export function allArtistSlugs(): string[] {
  return repository.artists
    .filter((artist) => artist.publicationState !== "draft")
    .map((artist) => artist.slug);
}

export function allArticleSlugs(): string[] {
  return repository.articles.map((article) => article.slug);
}

export function allPulseSlugs(): string[] {
  return repository.pulses.map((pulse) => pulse.slug);
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
    const galleries = [...(repository.listedGalleriesByArtist.get(artistSlug) ?? [])];
    const timeline = repository.profileTimeline(artistSlug, galleries);
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
    const article = repository.articleBySlug.get(slug);
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
    const gallery = repository.galleryBySlug.get(slug);
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
    const pulse = repository.pulseBySlug.get(slug);
    if (!pulse) return undefined;
    return { pulse, artists: await getArtistsBySlugs(pulse.artistSlugs) };
  },
);

export async function getPulsePageData(
  slug: string,
): Promise<PulsePageData | undefined> {
  return readPulsePageData(slug);
}

export type { TimelineEntry } from "../content-repository";
