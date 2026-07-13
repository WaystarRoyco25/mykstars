import { Fragment } from "react";
import Link from "next/link";
import {
  clipFillMedia,
  getArticles,
  getArtist,
  getCurrentEdition,
  getEvents,
  getGalleriesForPillar,
  getHomeHero,
  getMusicClips,
  getOpenPredictions,
  getPredictions,
  getPredictionTallies,
  getPulses,
  getRankings,
  getSpotlightForDate,
  getVarietyClips,
  hasFeaturedArtist,
  pillarFillEmbeds,
} from "@/lib/data";
import { PILLAR_LABELS, PILLAR_ORDER, TAG_LABELS, pillarSlug } from "@/lib/types";
import type {
  Article,
  Artist,
  Clip,
  FeedEdition,
  Gallery,
  Pillar,
  Prediction,
  PredictionTally,
  Pulse,
  StarEvent,
} from "@/lib/types";
import type { HomeHero } from "@/lib/data";
import { relativeTime } from "@/lib/format";
import { NOW } from "@/lib/content";
import PhotoMedia from "@/components/PhotoMedia";
import AttributionBadge from "@/components/AttributionBadge";
import GalleryGrid from "@/components/GalleryGrid";
import LiveEmbed from "@/components/LiveEmbed";
import { clipMedia } from "@/lib/media";
import ClipCard from "@/components/ClipCard";
import RankingTable from "@/components/RankingTable";
import ArticleListItem from "@/components/ArticleListItem";
import PredictionCard from "@/components/PredictionCard";
import PulseItem from "@/components/PulseItem";
import EventCard from "@/components/EventCard";
import JsonLd from "@/components/JsonLd";
import { renderEmphasis } from "@/lib/text";
import { roleLabel } from "@/lib/people";

// Tiles per pillar band, weighted to coverage (K-Pop > K-Drama > Fashion > K-Movie).
const BAND_COUNT: Record<Pillar, number> = {
  "k-pop": 12,
  "k-drama": 10,
  "fashion-beauty": 8,
  "k-movie": 6,
};

// Up to this many of a pillar's articles interleave inside its chapter.
const INTERLUDE_CAP = 3;

// Distributes the newest-first article list across the page: up to INTERLUDE_CAP
// per rendered pillar chapter, while site-wide (no-pillar) pieces, overflow past
// a cap, and articles for unrendered pillars all fall through to the closing
// Analysis band. Every article lands in exactly one place, nothing shows twice.
function planHomeArticles(
  articles: Article[],
  renderedPillars: ReadonlySet<Pillar>,
): { interludes: Map<Pillar, Article[]>; closer: Article[] } {
  const interludes = new Map<Pillar, Article[]>();
  const closer: Article[] = [];
  for (const article of articles) {
    if (article.pillar && renderedPillars.has(article.pillar)) {
      const list = interludes.get(article.pillar) ?? [];
      if (list.length < INTERLUDE_CAP) {
        list.push(article);
        interludes.set(article.pillar, list);
        continue;
      }
    }
    closer.push(article);
  }
  return { interludes, closer };
}

// A thin, light analysis interlude inside a pillar's chapter — the same bone
// treatment as the closing Analysis band, slimmed down (kicker only; the
// "All analysis" CTA lives once, on the closer). Renders nothing when the
// pillar has no articles, so there is never an empty band.
function AnalysisInterlude({
  pillar,
  articles,
}: {
  pillar: Pillar;
  articles: Article[];
}) {
  if (articles.length === 0) return null;
  return (
    <section className="bg-bone text-ink mt-16">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="mb-6">
          <Link href="/analysis" className="group inline-block">
            <h2 className="kicker group-hover:text-ink transition-colors">
              {PILLAR_LABELS[pillar]} analysis
            </h2>
          </Link>
        </div>
        <div className="flex flex-col gap-6">
          {articles.map((a) => (
            <ArticleListItem key={a.slug} article={a} on="light" />
          ))}
        </div>
      </div>
    </section>
  );
}

function ClipRail({
  title,
  description,
  clips,
}: {
  title: string;
  description: string;
  clips: Clip[];
}) {
  return (
    <section className="mx-auto max-w-6xl px-5 mt-16">
      <div className="mb-6">
        <h2 className="kicker">{title}</h2>
        <p className="text-muted mt-3 max-w-2xl leading-relaxed">{description}</p>
      </div>
      <div className="flex snap-x gap-3 overflow-x-auto pb-2">
        {clips.map((clip) => (
          <ClipCard key={clip.id} clip={clip} />
        ))}
      </div>
    </section>
  );
}

function ForecastRail({
  predictions,
  tallies,
}: {
  predictions: Prediction[];
  tallies: ReadonlyMap<string, PredictionTally>;
}) {
  return (
    <section className="mx-auto max-w-6xl px-5 mt-16">
      <div className="flex items-end justify-between mb-6">
        <Link href="/predictions" className="group inline-block">
          <h2 className="kicker group-hover:text-bone transition-colors">Fan Forecast</h2>
        </Link>
        <Link href="/predictions" className="label hover:text-bone transition-colors">
          All forecasts →
        </Link>
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        {predictions.map((prediction) => (
          <PredictionCard
            key={prediction.slug}
            prediction={prediction}
            tally={tallies.get(prediction.slug)!}
          />
        ))}
      </div>
    </section>
  );
}

function PulseBand({
  pulses,
  artistsBySlug,
}: {
  pulses: Pulse[];
  artistsBySlug: ReadonlyMap<string, Artist>;
}) {
  if (pulses.length === 0) return null;
  return (
    <section className="bg-bone text-ink mt-16">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <h2 className="kicker mb-6">The pulse</h2>
        <div className="flex flex-col gap-6">
          {pulses.map((pulse) => (
            <PulseItem
              key={pulse.slug}
              pulse={pulse}
              artists={pulse.artistSlugs
                .map((slug) => artistsBySlug.get(slug))
                .filter((artist): artist is Artist => Boolean(artist))}
              on="light"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function EditionEventRail({ events }: { events: StarEvent[] }) {
  if (events.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-5 mt-12">
      <div className="mb-6 flex items-end justify-between">
        <Link href="/schedule" className="group inline-block">
          <h2 className="kicker group-hover:text-bone transition-colors">On the calendar</h2>
        </Link>
        <Link href="/schedule" className="label hover:text-bone transition-colors">
          All dates →
        </Link>
      </div>
      <div className="flex snap-x gap-3 overflow-x-auto pb-2">
        {events.map((event) => (
          <EventCard key={event.slug} event={event} />
        ))}
      </div>
    </section>
  );
}

function EditionGalleryBand({ pillar, galleries }: { pillar: Pillar; galleries: Gallery[] }) {
  if (galleries.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-5 mt-12">
      <div className="mb-6">
        <Link href={`/${pillarSlug(pillar)}`} className="group inline-block">
          <h2 className="kicker group-hover:text-bone transition-colors">
            {PILLAR_LABELS[pillar]}
          </h2>
        </Link>
      </div>
      <GalleryGrid galleries={galleries} preloadCount={pillar === "k-pop" ? 3 : 0} />
    </section>
  );
}

function AnalysisCloser({ articles }: { articles: Article[] }) {
  if (articles.length === 0) return null;
  return (
    <section className="bg-bone text-ink mt-16">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="flex items-end justify-between mb-8">
          <h2 className="kicker">Analysis</h2>
          <Link href="/analysis" className="label text-muted-2 hover:text-ink transition-colors">
            All analysis →
          </Link>
        </div>
        <div className="flex flex-col gap-6">
          {articles.map((article) => (
            <ArticleListItem key={article.slug} article={article} on="light" />
          ))}
        </div>
      </div>
    </section>
  );
}

function SpotlightStrip({ artists }: { artists: Artist[] }) {
  if (artists.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-5 mt-16">
      <h2 className="kicker mb-6">In the Spotlight</h2>
      <div className="flex flex-wrap gap-3">
        {artists.map((artist) => (
          <Link
            key={artist.slug}
            href={`/artists/${artist.slug}`}
            className="border border-line px-4 py-2 hover:border-crimson transition-colors group"
          >
            <span className="font-serif text-lg group-hover:text-crimson transition-colors">
              {artist.name}
            </span>
            <span className="label text-muted ml-2">{roleLabel(artist)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function EditionHero({ hero }: { hero: HomeHero }) {
  if (hero.kind === "gallery") {
    return (
      <section className="mx-auto max-w-6xl px-5 pt-6">
        <Link href={`/photos/${hero.gallery.slug}`} className="group block">
          <div className="relative h-[56vw] max-h-[560px] min-h-[340px] overflow-hidden rounded-tile border border-line">
            <PhotoMedia item={hero.gallery.cover} sizes="100vw" preload />
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-ink/55" aria-hidden />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-9">
              <p className="kicker">
                {PILLAR_LABELS[hero.gallery.pillar]} · {TAG_LABELS[hero.gallery.category]} · Featured
              </p>
              <h2 className="font-serif text-3xl sm:text-5xl leading-[1.05] mt-3 max-w-3xl group-hover:text-crimson transition-colors">
                {renderEmphasis(hero.gallery.title)}
              </h2>
              <div className="mt-4 flex items-center gap-3 text-sm text-bone">
                <span className="label text-bone">{hero.gallery.media.length} photos</span>
                <span className="text-muted">·</span>
                <span className="label text-muted">{relativeTime(hero.gallery.date, NOW)}</span>
                <span className="text-muted">·</span>
                <AttributionBadge source={hero.gallery.source} asLink={false} className="text-muted" />
              </div>
            </div>
          </div>
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-5 pt-6">
      <div className="group overflow-hidden rounded-tile border border-line transition-colors hover:border-crimson">
        <div className="relative aspect-video max-h-[560px] w-full overflow-hidden bg-ink-2">
          <LiveEmbed item={clipMedia(hero.clip)} />
        </div>
        <div className="p-6 sm:p-8">
          <p className="kicker">
            {PILLAR_LABELS[hero.clip.pillar]} ·{" "}
            {hero.clip.genre === "music" ? "In motion" : "On air"} · Featured
          </p>
          <h2 className="font-serif text-3xl sm:text-5xl leading-[1.05] mt-3 max-w-3xl">
            {renderEmphasis(hero.clip.caption)}
          </h2>
          <div className="mt-4 flex items-center gap-3 text-sm text-bone">
            <span className="label text-muted">{relativeTime(hero.clip.date, NOW)}</span>
            <span className="text-muted">·</span>
            <AttributionBadge source={hero.clip.credit} asLink={false} className="text-muted" />
          </div>
        </div>
      </div>
    </section>
  );
}

function requireReference<T>(
  map: ReadonlyMap<string, T>,
  id: string,
  format: string,
  editionId: string,
): T {
  const item = map.get(id);
  if (!item) {
    throw new Error(`Edition ${editionId} references missing ${format} "${id}".`);
  }
  return item;
}

async function EditionHomePage({ edition }: { edition: FeedEdition }) {
  const forecastSlugs = new Set(
    edition.bands.flatMap((band) =>
      band.kind === "forecast-rail" ? band.predictionSlugs : [],
    ),
  );
  const predictionsPromise = getPredictions();
  const forecastTalliesPromise = predictionsPromise.then((items) =>
    getPredictionTallies(items.filter((prediction) => forecastSlugs.has(prediction.slug))),
  );
  const [
    galleryLists,
    articles,
    pulses,
    rankings,
    predictions,
    forecastTallies,
    events,
    musicClips,
    varietyClips,
    spotlight,
  ] = await Promise.all([
    Promise.all(PILLAR_ORDER.map((pillar) => getGalleriesForPillar(pillar))),
    getArticles(),
    getPulses(),
    getRankings(),
    predictionsPromise,
    forecastTalliesPromise,
    getEvents(),
    getMusicClips(1000),
    getVarietyClips(1000),
    getSpotlightForDate(NOW),
  ]);

  const pulseArtistSlugs = [...new Set(pulses.flatMap((pulse) => pulse.artistSlugs))];
  const pulseArtists = (
    await Promise.all(pulseArtistSlugs.map((slug) => getArtist(slug)))
  ).filter((artist): artist is Artist => Boolean(artist));
  const artistsBySlug = new Map(pulseArtists.map((artist) => [artist.slug, artist]));
  const galleriesBySlug = new Map(
    galleryLists.flat().map((gallery) => [gallery.slug, gallery]),
  );
  const articlesBySlug = new Map(articles.map((article) => [article.slug, article]));
  const pulsesBySlug = new Map(pulses.map((pulse) => [pulse.slug, pulse]));
  const rankingsBySlug = new Map(rankings.map((ranking) => [ranking.slug, ranking]));
  const predictionsBySlug = new Map(
    predictions.map((prediction) => [prediction.slug, prediction]),
  );
  const talliesBySlug = new Map(
    forecastTallies.map((tally) => [tally.predictionSlug, tally]),
  );
  const eventsBySlug = new Map(events.map((event) => [event.slug, event]));
  const clipsById = new Map(
    [...musicClips, ...varietyClips].map((clip) => [clip.id, clip]),
  );

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "MyKStars",
          url: "https://mykstars.com",
          description:
            "Credited coverage of Korean celebrities across K-Pop, K-Drama, K-Movie and Fashion: official video, schedules, fan forecasts and credible analysis.",
        }}
      />
      <h1 className="sr-only">
        MyKStars: Korean celebrities in focus, from K-Pop to K-Drama, K-Movie and Fashion
      </h1>

      {edition.bands.map((band, index) => {
        const key = `${band.kind}-${index}`;
        switch (band.kind) {
          case "hero": {
            if (Boolean(band.gallerySlug) === Boolean(band.clipId)) {
              throw new Error(`Edition ${edition.id} hero must reference exactly one item.`);
            }
            const hero: HomeHero = band.gallerySlug
              ? {
                  kind: "gallery",
                  gallery: requireReference(
                    galleriesBySlug,
                    band.gallerySlug,
                    "gallery",
                    edition.id,
                  ),
                }
              : {
                  kind: "clip",
                  clip: requireReference(
                    clipsById,
                    band.clipId!,
                    "clip",
                    edition.id,
                  ),
                };
            return <EditionHero key={key} hero={hero} />;
          }
          case "event-rail":
            return (
              <EditionEventRail
                key={key}
                events={band.eventSlugs.map((slug) =>
                  requireReference(eventsBySlug, slug, "event", edition.id),
                )}
              />
            );
          case "gallery-band":
            return (
              <EditionGalleryBand
                key={key}
                pillar={band.pillar}
                galleries={band.gallerySlugs.map((slug) =>
                  requireReference(galleriesBySlug, slug, "gallery", edition.id),
                )}
              />
            );
          case "clip-rail":
            return (
              <ClipRail
                key={key}
                title={band.title}
                description={band.description}
                clips={band.clipIds.map((id) =>
                  requireReference(clipsById, id, "clip", edition.id),
                )}
              />
            );
          case "ranking":
            return (
              <RankingTable
                key={key}
                ranking={requireReference(rankingsBySlug, band.slug, "ranking", edition.id)}
              />
            );
          case "analysis": {
            const bandArticles = band.articleSlugs.map((slug) =>
              requireReference(articlesBySlug, slug, "article", edition.id),
            );
            return band.pillar ? (
              <AnalysisInterlude key={key} pillar={band.pillar} articles={bandArticles} />
            ) : (
              <AnalysisCloser key={key} articles={bandArticles} />
            );
          }
          case "pulse-band":
            return (
              <PulseBand
                key={key}
                pulses={band.pulseSlugs.map((slug) =>
                  requireReference(pulsesBySlug, slug, "pulse", edition.id),
                )}
                artistsBySlug={artistsBySlug}
              />
            );
          case "forecast-rail": {
            const bandPredictions = band.predictionSlugs.map((slug) =>
              requireReference(predictionsBySlug, slug, "forecast", edition.id),
            );
            for (const prediction of bandPredictions) {
              requireReference(talliesBySlug, prediction.slug, "forecast tally", edition.id);
            }
            return (
              <ForecastRail
                key={key}
                predictions={bandPredictions}
                tallies={talliesBySlug}
              />
            );
          }
          case "spotlight-strip":
            return <SpotlightStrip key={key} artists={spotlight} />;
        }
      })}
    </>
  );
}

export default async function HomePage() {
  const edition = await getCurrentEdition();
  return edition ? <EditionHomePage edition={edition} /> : <FallbackHomePage />;
}

async function FallbackHomePage() {
  const forecastsPromise = getOpenPredictions();
  const forecastTalliesPromise = forecastsPromise.then((forecasts) =>
    getPredictionTallies(forecasts.slice(0, 6)),
  );
  const [
    hero,
    pillarGalleries,
    articles,
    rankings,
    forecasts,
    forecastTallies,
    events,
    musicClips,
    varietyClips,
  ] = await Promise.all([
    getHomeHero(),
    Promise.all(
      PILLAR_ORDER.map(async (pillar) => ({
        pillar,
        galleries: await getGalleriesForPillar(pillar),
      })),
    ),
    getArticles(),
    getRankings(),
    forecastsPromise,
    forecastTalliesPromise,
    getEvents({ upcomingFrom: NOW }),
    getMusicClips(14),
    getVarietyClips(14),
  ]);
  const featuredSlug = hero?.kind === "gallery" ? hero.gallery.slug : null;
  const bands = pillarGalleries.map(({ pillar, galleries: pillarGalleryList }) => {
    const galleries = pillarGalleryList
      .filter((gallery) => gallery.slug !== featuredSlug && hasFeaturedArtist(gallery))
      .slice(0, BAND_COUNT[pillar]);
    // Top up a thin band with the band artists' official-account tiles so it
    // never renders with empty columns (deficit only; a full band is unchanged).
    // With no galleries at all (the interim while placeholders sit archived),
    // the band runs entirely on the pillar's own clip tiles instead.
    const fillEmbeds =
      galleries.length > 0
        ? pillarFillEmbeds(galleries, BAND_COUNT[pillar] - galleries.length)
        : clipFillMedia(BAND_COUNT[pillar], pillar);
    return { pillar, galleries, fillEmbeds };
  });
  // Each table is interleaved right after its pillar's band (K-Pop, K-Drama today).
  const rankingByPillar = new Map(rankings.map((r) => [r.pillar, r]));
  // The Fan Forecast, split for rhythm: the three soonest-closing questions land
  // after the K-Pop chapter and the next three close the K-Drama chapter, so the
  // return-visit hook recurs deeper in the scroll.
  const leadForecasts = forecasts.slice(0, 3);
  const nextForecasts = forecasts.slice(3, 6);
  const forecastTallyBySlug = new Map(
    forecastTallies.map((tally) => [tally.predictionSlug, tally]),
  );
  // The soonest shows lead a horizontal D-Day rail under the hero, the urgency hook.
  const upcomingEvents = events.slice(0, 8);
  // A band renders while it has anything to show — galleries or clip fill — so
  // the chapter (and the ranking, rails and interludes hanging off it) survives
  // the interim.
  const renderedBands = bands.filter((b) => b.galleries.length + b.fillEmbeds.length > 0);
  // Pillar-matched analysis: each chapter gets up to three of its own articles as a
  // light interlude; the site-wide standards pieces and any overflow close the page.
  const { interludes, closer } = planHomeArticles(
    articles,
    new Set(renderedBands.map((b) => b.pillar)),
  );

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "MyKStars",
          url: "https://mykstars.com",
          description:
            "Credited coverage of Korean celebrities across K-Pop, K-Drama, K-Movie and Fashion: official video, schedules, fan forecasts and credible analysis.",
        }}
      />

      <h1 className="sr-only">
        MyKStars: Korean celebrities in focus, from K-Pop to K-Drama, K-Movie and Fashion
      </h1>

      {/* Hero — the featured gallery when one is published, else the newest
          official clip (the video-led interim while permitted photography is
          sourced). The clip hero keeps the ClipCard grammar at hero scale:
          click-to-play player above, caption block below. */}
      {hero?.kind === "gallery" && (
        <section className="mx-auto max-w-6xl px-5 pt-6">
          <Link href={`/photos/${hero.gallery.slug}`} className="group block">
            <div className="relative h-[56vw] max-h-[560px] min-h-[340px] overflow-hidden rounded-tile border border-line">
              <PhotoMedia item={hero.gallery.cover} sizes="100vw" preload />
              <div className="absolute inset-x-0 bottom-0 h-2/3 bg-ink/55" aria-hidden />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-9">
                <p className="kicker">
                  {PILLAR_LABELS[hero.gallery.pillar]} · {TAG_LABELS[hero.gallery.category]} · Featured
                </p>
                <h2 className="font-serif text-3xl sm:text-5xl leading-[1.05] mt-3 max-w-3xl group-hover:text-crimson transition-colors">
                  {renderEmphasis(hero.gallery.title)}
                </h2>
                <div className="mt-4 flex items-center gap-3 text-sm text-bone">
                  <span className="label text-bone">{hero.gallery.media.length} photos</span>
                  <span className="text-muted">·</span>
                  <span className="label text-muted">{relativeTime(hero.gallery.date, NOW)}</span>
                  <span className="text-muted">·</span>
                  <AttributionBadge source={hero.gallery.source} asLink={false} className="text-muted" />
                </div>
              </div>
            </div>
          </Link>
        </section>
      )}
      {hero?.kind === "clip" && (
        <section className="mx-auto max-w-6xl px-5 pt-6">
          <div className="group overflow-hidden rounded-tile border border-line transition-colors hover:border-crimson">
            <div className="relative aspect-video max-h-[560px] w-full overflow-hidden bg-ink-2">
              <LiveEmbed item={clipMedia(hero.clip)} />
            </div>
            <div className="p-6 sm:p-8">
              <p className="kicker">
                {PILLAR_LABELS[hero.clip.pillar]} ·{" "}
                {hero.clip.genre === "music" ? "In motion" : "On air"} · Featured
              </p>
              <h2 className="font-serif text-3xl sm:text-5xl leading-[1.05] mt-3 max-w-3xl">
                {renderEmphasis(hero.clip.caption)}
              </h2>
              <div className="mt-4 flex items-center gap-3 text-sm text-bone">
                <span className="label text-muted">{relativeTime(hero.clip.date, NOW)}</span>
                <span className="text-muted">·</span>
                <AttributionBadge source={hero.clip.credit} asLink={false} className="text-muted" />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Schedule — a horizontal D-Day rail of the soonest shows, the urgency hook */}
      {upcomingEvents.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 mt-12">
          <div className="mb-6 flex items-end justify-between">
            <Link href="/schedule" className="group inline-block">
              <h2 className="kicker group-hover:text-bone transition-colors">On the calendar</h2>
            </Link>
            <Link href="/schedule" className="label hover:text-bone transition-colors">
              All dates →
            </Link>
          </div>
          <div className="flex snap-x gap-3 overflow-x-auto pb-2">
            {upcomingEvents.map((e) => (
              <EventCard key={e.slug} event={e} />
            ))}
          </div>
        </section>
      )}

      {/* One band per pillar, with its ranking table interleaved right after it */}
      {renderedBands.map((b) => {
        const ranking = rankingByPillar.get(b.pillar);
        return (
          <Fragment key={b.pillar}>
            <section className="mx-auto max-w-6xl px-5 mt-12">
              <div className="mb-6">
                <Link href={`/${pillarSlug(b.pillar)}`} className="group inline-block">
                  <h2 className="kicker group-hover:text-bone transition-colors">
                    {PILLAR_LABELS[b.pillar]}
                  </h2>
                </Link>
              </div>
              <GalleryGrid
                galleries={b.galleries}
                preloadCount={b.pillar === "k-pop" ? 3 : 0}
                fillEmbeds={b.fillEmbeds}
              />
            </section>
            {ranking && <RankingTable ranking={ranking} />}
            {/* Analysis interlude — K-Pop reads best right after its ranking (it breaks
                the chapter's long dark run); Fashion and K-Movie follow their bands
                directly. K-Drama's interlude sits after the On air rail below. */}
            {b.pillar !== "k-drama" && (
              <AnalysisInterlude pillar={b.pillar} articles={interludes.get(b.pillar) ?? []} />
            )}
            {/* In motion — the music-video rail right after the K-Pop band, its home genre */}
            {b.pillar === "k-pop" && musicClips.length > 0 && (
              <ClipRail
                title="In motion"
                description="The music videos of the moment, straight from the official channels."
                clips={musicClips}
              />
            )}
            {/* Fan Forecast — the first three questions, right after the K-Pop chapter;
                the next three run after the K-Drama chapter, the return-visit hook */}
            {b.pillar === "k-pop" && leadForecasts.length > 0 && (
              <ForecastRail predictions={leadForecasts} tallies={forecastTallyBySlug} />
            )}
            {/* On air — the comedy / variety / talk-show rail right after the K-Drama
                band, where the roster's actors and directors live */}
            {b.pillar === "k-drama" && varietyClips.length > 0 && (
              <ClipRail
                title="On air"
                description="The roster on the talk and variety circuit, in Korea and abroad."
                clips={varietyClips}
              />
            )}
            {/* Analysis interlude for K-Drama — right after the On air rail */}
            {b.pillar === "k-drama" && (
              <AnalysisInterlude pillar={b.pillar} articles={interludes.get(b.pillar) ?? []} />
            )}
            {/* Fan Forecast, part two — the next three questions keep the vote hook
                alive deeper in the scroll; each card carries its own pillar kicker,
                so a mixed cluster reads fine here */}
            {b.pillar === "k-drama" && nextForecasts.length > 0 && (
              <ForecastRail predictions={nextForecasts} tallies={forecastTallyBySlug} />
            )}
          </Fragment>
        );
      })}

      {/* Analysis closer — the site-wide standards pieces plus anything past the interlude caps */}
      {closer.length > 0 && (
        <section className="bg-bone text-ink mt-16">
          <div className="mx-auto max-w-6xl px-5 py-14">
            <div className="flex items-end justify-between mb-8">
              <h2 className="kicker">Analysis</h2>
              <Link href="/analysis" className="label text-muted-2 hover:text-ink transition-colors">
                All analysis →
              </Link>
            </div>
            <div className="flex flex-col gap-6">
              {closer.slice(0, 8).map((a) => (
                <ArticleListItem key={a.slug} article={a} on="light" />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
