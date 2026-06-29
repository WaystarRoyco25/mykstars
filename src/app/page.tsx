import { Fragment } from "react";
import Link from "next/link";
import {
  getArticles,
  getArtistsInFocus,
  getEvents,
  getFeaturedGallery,
  getGalleriesForPillar,
  getOpenPredictions,
  getRankings,
  getReels,
  getShorts,
  pillarFillEmbeds,
} from "@/lib/data";
import { PILLAR_LABELS, PILLAR_ORDER, TAG_LABELS, pillarSlug } from "@/lib/types";
import type { Pillar } from "@/lib/types";
import { relativeTime } from "@/lib/format";
import { NOW } from "@/lib/seed";
import PhotoMedia from "@/components/PhotoMedia";
import AttributionBadge from "@/components/AttributionBadge";
import GalleryGrid from "@/components/GalleryGrid";
import ClipCard from "@/components/ClipCard";
import RankingTable from "@/components/RankingTable";
import ArticleListItem from "@/components/ArticleListItem";
import PredictionCard from "@/components/PredictionCard";
import EventCard from "@/components/EventCard";
import ArtistCard from "@/components/ArtistCard";
import JsonLd from "@/components/JsonLd";
import { renderEmphasis } from "@/lib/text";

// Tiles per pillar band, weighted to coverage (K-Pop > K-Drama > Fashion > K-Movie).
const BAND_COUNT: Record<Pillar, number> = {
  "k-pop": 12,
  "k-drama": 10,
  "fashion-beauty": 8,
  "k-movie": 6,
};

export default async function HomePage() {
  const featured = await getFeaturedGallery();
  const [bands, articles, rankings, forecasts, events, peopleInFocus, reels, shorts] =
    await Promise.all([
      Promise.all(
        PILLAR_ORDER.map(async (pillar) => {
          const galleries = (await getGalleriesForPillar(pillar))
            .filter((g) => g.slug !== featured.slug)
            .slice(0, BAND_COUNT[pillar]);
          // Top up a thin band with the band artists' official-account tiles so it
          // never renders with empty columns (deficit only; a full band is unchanged).
          return {
            pillar,
            galleries,
            fillEmbeds: pillarFillEmbeds(galleries, BAND_COUNT[pillar] - galleries.length),
          };
        }),
      ),
      getArticles(),
      getRankings(),
      getOpenPredictions(),
      getEvents({ upcomingFrom: NOW }),
      getArtistsInFocus(6),
      getReels(14),
      getShorts(14),
    ]);
  // Each table is interleaved right after its pillar's band (K-Pop, K-Drama today).
  const rankingByPillar = new Map(rankings.map((r) => [r.pillar, r]));
  // The Fan Forecast block, interleaved after the K-Pop band: six open questions
  // (soonest-closing first) drive the return-visit loop from the home page.
  const topForecasts = forecasts.slice(0, 6);
  // The soonest shows lead a horizontal D-Day rail under the hero, the urgency hook.
  const upcomingEvents = events.slice(0, 8);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "MyKStars",
          url: "https://mykstars.com",
          description:
            "Photo-first K-Culture newspaper and magazine: the freshest, organized, credited photos of Korean celebrities across K-Pop, K-Drama, K-Movie and Fashion.",
        }}
      />

      <h1 className="sr-only">
        MyKStars: the freshest organized, credited photos of Korean celebrities
      </h1>

      {/* Hero — global featured gallery */}
      <section className="mx-auto max-w-6xl px-5 pt-6">
        <Link href={`/photos/${featured.slug}`} className="group block">
          <div className="relative h-[56vw] max-h-[560px] min-h-[340px] overflow-hidden border border-line">
            <PhotoMedia item={featured.cover} sizes="100vw" priority />
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-ink/55" aria-hidden />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-9">
              <p className="kicker">
                {PILLAR_LABELS[featured.pillar]} · {TAG_LABELS[featured.category]} · Featured
              </p>
              <h2 className="font-serif text-3xl sm:text-5xl leading-[1.05] mt-3 max-w-3xl group-hover:text-crimson transition-colors">
                {renderEmphasis(featured.title)}
              </h2>
              <div className="mt-4 flex items-center gap-3 text-sm text-bone">
                <span className="label text-bone">{featured.media.length} photos</span>
                <span className="text-muted">·</span>
                <span className="label text-muted">{relativeTime(featured.date)}</span>
                <span className="text-muted">·</span>
                <AttributionBadge source={featured.source} asLink={false} className="text-muted" />
              </div>
            </div>
          </div>
        </Link>
      </section>

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
      {bands
        .filter((b) => b.galleries.length > 0)
        .map((b) => {
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
                  priorityCount={b.pillar === "k-pop" ? 3 : 0}
                  fillEmbeds={b.fillEmbeds}
                />
              </section>
              {ranking && <RankingTable ranking={ranking} />}
              {/* On the feed — a live Instagram rail right after the K-Pop band */}
              {b.pillar === "k-pop" && reels.length > 0 && (
                <section className="mx-auto max-w-6xl px-5 mt-16">
                  <div className="mb-6">
                    <h2 className="kicker">On the feed</h2>
                  </div>
                  <div className="flex snap-x gap-3 overflow-x-auto pb-2">
                    {reels.map((c) => (
                      <ClipCard key={c.id} clip={c} />
                    ))}
                  </div>
                </section>
              )}
              {/* Fan Forecast — interleaved right after the K-Pop band, the return-visit hook */}
              {b.pillar === "k-pop" && topForecasts.length > 0 && (
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
                    {topForecasts.map((p) => (
                      <PredictionCard key={p.slug} prediction={p} />
                    ))}
                  </div>
                </section>
              )}
              {/* In motion — a live YouTube rail right after the K-Drama band */}
              {b.pillar === "k-drama" && shorts.length > 0 && (
                <section className="mx-auto max-w-6xl px-5 mt-16">
                  <div className="mb-6">
                    <h2 className="kicker">In motion</h2>
                  </div>
                  <div className="flex snap-x gap-3 overflow-x-auto pb-2">
                    {shorts.map((c) => (
                      <ClipCard key={c.id} clip={c} />
                    ))}
                  </div>
                </section>
              )}
              {/* People in focus — interleaved after the K-Drama band, a pillar spread into the per-person hubs */}
              {b.pillar === "k-drama" && peopleInFocus.length > 0 && (
                <section className="mx-auto max-w-6xl px-5 mt-16">
                  <div className="flex items-end justify-between mb-6">
                    <Link href="/artists" className="group inline-block">
                      <h2 className="kicker group-hover:text-bone transition-colors">People in focus</h2>
                    </Link>
                    <Link href="/artists" className="label hover:text-bone transition-colors">
                      All people →
                    </Link>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-line border border-line">
                    {peopleInFocus.map(({ artist, photoSets }) => (
                      <ArtistCard key={artist.slug} artist={artist} photoSets={photoSets} />
                    ))}
                  </div>
                </section>
              )}
            </Fragment>
          );
        })}

      {/* Analysis — light editorial band */}
      <section className="bg-bone text-ink mt-16">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <div className="flex items-end justify-between mb-8">
            <h2 className="kicker">Analysis</h2>
            <Link href="/news" className="label text-muted-2 hover:text-ink transition-colors">
              All analysis →
            </Link>
          </div>
          <div className="flex flex-col gap-6">
            {articles.slice(0, 8).map((a) => (
              <ArticleListItem key={a.slug} article={a} on="light" />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
