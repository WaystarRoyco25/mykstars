import Link from "next/link";

import ArticleListItem from "@/components/ArticleListItem";
import AttributionBadge from "@/components/AttributionBadge";
import ClipCard from "@/components/ClipCard";
import EmbedCard from "@/components/EmbedCard";
import EventCard from "@/components/EventCard";
import GalleryGrid from "@/components/GalleryGrid";
import JsonLd from "@/components/JsonLd";
import LiveEmbed from "@/components/LiveEmbed";
import PhotoMedia from "@/components/PhotoMedia";
import PredictionCard from "@/components/PredictionCard";
import PulseCard from "@/components/PulseCard";
import RankingTable from "@/components/RankingTable";
import { NOW } from "@/lib/content";
import { getCurrentEdition } from "@/lib/data";
import { relativeTime } from "@/lib/format";
import { CLIP_RAIL_PRESENTATIONS } from "@/lib/edition/descriptors";
import {
  resolveEdition,
  resolveFallbackHome,
  type ResolvedHomeBand,
} from "@/lib/home-model";
import { clipMedia } from "@/lib/media";
import { roleLabel } from "@/lib/people";
import { renderEmphasis } from "@/lib/text";
import { PILLAR_LABELS, TAG_LABELS, pillarSlug } from "@/lib/types";
import type {
  Article,
  Artist,
  Clip,
  ClipRailPresentation,
  Gallery,
  MediaItem,
  Pillar,
  Prediction,
  PredictionTally,
  Pulse,
  StarEvent,
} from "@/lib/types";
import type { HomeHero } from "@/lib/data";

function AnalysisInterlude({
  pillar,
  articles,
}: {
  pillar: Pillar;
  articles: Article[];
}) {
  if (articles.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-5 mt-16">
      <div className="mb-6">
        <Link href="/analysis" className="group inline-block">
          <h2 className="kicker group-hover:text-bone transition-colors">
            {PILLAR_LABELS[pillar]} analysis
          </h2>
        </Link>
      </div>
      <div className="flex flex-col gap-6">
        {articles.map((article) => (
          <ArticleListItem key={article.slug} article={article} on="dark" />
        ))}
      </div>
    </section>
  );
}

function ClipRail({
  presentation,
  clips,
}: {
  presentation: ClipRailPresentation;
  clips: Clip[];
}) {
  const { title, description } = CLIP_RAIL_PRESENTATIONS[presentation];
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
  fillEmbeds = [],
}: {
  pulses: Pulse[];
  artistsBySlug: ReadonlyMap<string, Artist>;
  fillEmbeds?: MediaItem[];
}) {
  if (pulses.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-5 mt-16">
      <h2 className="kicker mb-6">The pulse</h2>
      <div className="columns-1 sm:columns-2 md:columns-3 gap-2 md:gap-3">
        {pulses.map((pulse) => (
          <PulseCard
            key={pulse.slug}
            pulse={pulse}
            artists={pulse.artistSlugs
              .map((slug) => artistsBySlug.get(slug))
              .filter((artist): artist is Artist => Boolean(artist))}
          />
        ))}
        {fillEmbeds.map((item) => (
          <EmbedCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

function HomeEventRail({ events }: { events: StarEvent[] }) {
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

function HomeGalleryBand({
  pillar,
  galleries,
  fillEmbeds,
}: {
  pillar: Pillar;
  galleries: Gallery[];
  fillEmbeds: MediaItem[];
}) {
  if (galleries.length + fillEmbeds.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-5 mt-12">
      <div className="mb-6">
        <Link href={`/${pillarSlug(pillar)}`} className="group inline-block">
          <h2 className="kicker group-hover:text-bone transition-colors">
            {PILLAR_LABELS[pillar]}
          </h2>
        </Link>
      </div>
      <GalleryGrid
        galleries={galleries}
        preloadCount={pillar === "k-pop" ? 3 : 0}
        fillEmbeds={fillEmbeds}
      />
    </section>
  );
}

function AnalysisCloser({ articles }: { articles: Article[] }) {
  if (articles.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-5 mt-16">
      <div className="flex items-end justify-between mb-8">
        <h2 className="kicker">Analysis</h2>
        <Link href="/analysis" className="label hover:text-bone transition-colors">
          All analysis →
        </Link>
      </div>
      <div className="flex flex-col gap-6">
        {articles.map((article) => (
          <ArticleListItem key={article.slug} article={article} on="dark" />
        ))}
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

function HomeHero({ hero }: { hero: HomeHero }) {
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

function ResolvedHomePage({ bands }: { bands: ResolvedHomeBand[] }) {
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

      {bands.map((band, index) => {
        const key = `${band.kind}-${index}`;
        switch (band.kind) {
          case "hero":
            return <HomeHero key={key} hero={band.hero} />;
          case "event-rail":
            return <HomeEventRail key={key} events={band.events} />;
          case "gallery-band":
            return (
              <HomeGalleryBand
                key={key}
                pillar={band.pillar}
                galleries={band.galleries}
                fillEmbeds={band.fillEmbeds}
              />
            );
          case "clip-rail":
            return <ClipRail key={key} {...band} />;
          case "ranking":
            return <RankingTable key={key} ranking={band.ranking} />;
          case "analysis":
            return band.pillar ? (
              <AnalysisInterlude key={key} pillar={band.pillar} articles={band.articles} />
            ) : (
              <AnalysisCloser key={key} articles={band.articles} />
            );
          case "pulse-band":
            return <PulseBand key={key} {...band} />;
          case "forecast-rail":
            return <ForecastRail key={key} {...band} />;
          case "spotlight-strip":
            return <SpotlightStrip key={key} artists={band.artists} />;
        }
      })}
    </>
  );
}

export default async function HomePage() {
  const edition = await getCurrentEdition();
  const bands = edition
    ? await resolveEdition(edition, NOW)
    : await resolveFallbackHome(NOW);
  return <ResolvedHomePage bands={bands} />;
}
