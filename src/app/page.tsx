import { Fragment } from "react";
import Link from "next/link";
import {
  getArticles,
  getEvents,
  getFeaturedGallery,
  getGalleriesForPillar,
  getOpenPredictions,
  getRankings,
  getReels,
  getShorts,
  hasFeaturedArtist,
  pillarFillEmbeds,
} from "@/lib/data";
import { PILLAR_LABELS, PILLAR_ORDER, TAG_LABELS, pillarSlug } from "@/lib/types";
import type { Article, Pillar } from "@/lib/types";
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
import JsonLd from "@/components/JsonLd";
import { renderEmphasis } from "@/lib/text";

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

export default async function HomePage() {
  const featured = await getFeaturedGallery();
  const [bands, articles, rankings, forecasts, events, reels, shorts] =
    await Promise.all([
      Promise.all(
        PILLAR_ORDER.map(async (pillar) => {
          const galleries = (await getGalleriesForPillar(pillar))
            .filter((g) => g.slug !== featured.slug && hasFeaturedArtist(g))
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
      getReels(14),
      getShorts(14),
    ]);
  // Each table is interleaved right after its pillar's band (K-Pop, K-Drama today).
  const rankingByPillar = new Map(rankings.map((r) => [r.pillar, r]));
  // The Fan Forecast, split for rhythm: the three soonest-closing questions land
  // after the K-Pop chapter and the next three close the K-Drama chapter, so the
  // return-visit hook recurs deeper in the scroll.
  const leadForecasts = forecasts.slice(0, 3);
  const nextForecasts = forecasts.slice(3, 6);
  // The soonest shows lead a horizontal D-Day rail under the hero, the urgency hook.
  const upcomingEvents = events.slice(0, 8);
  const renderedBands = bands.filter((b) => b.galleries.length > 0);
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
            "Photo-first K-Culture newspaper and magazine: the freshest, organized, credited photos of Korean celebrities across K-Pop, K-Drama, K-Movie and Fashion.",
        }}
      />

      <h1 className="sr-only">
        MyKStars: the freshest organized, credited photos of Korean celebrities
      </h1>

      {/* Hero — global featured gallery */}
      <section className="mx-auto max-w-6xl px-5 pt-6">
        <Link href={`/photos/${featured.slug}`} className="group block">
          <div className="relative h-[56vw] max-h-[560px] min-h-[340px] overflow-hidden rounded-tile border border-line">
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
                priorityCount={b.pillar === "k-pop" ? 3 : 0}
                fillEmbeds={b.fillEmbeds}
              />
            </section>
            {ranking && <RankingTable ranking={ranking} />}
            {/* Analysis interlude — K-Pop reads best right after its ranking (it breaks
                the chapter's long dark run); Fashion and K-Movie follow their bands
                directly. K-Drama's interlude sits after the In motion rail below. */}
            {b.pillar !== "k-drama" && (
              <AnalysisInterlude pillar={b.pillar} articles={interludes.get(b.pillar) ?? []} />
            )}
            {/* On the feed — a live Instagram rail right after the K-Pop band */}
            {b.pillar === "k-pop" && reels.length > 0 && (
              <section className="mx-auto max-w-6xl px-5 mt-16">
                <div className="mb-6">
                  <h2 className="kicker">On the feed</h2>
                </div>
                <div className="flex snap-x items-start gap-3 overflow-x-auto pb-2">
                  {reels.map((c) => (
                    <ClipCard key={c.id} clip={c} />
                  ))}
                </div>
              </section>
            )}
            {/* Fan Forecast — the first three questions, right after the K-Pop chapter;
                the next three run after the K-Drama chapter, the return-visit hook */}
            {b.pillar === "k-pop" && leadForecasts.length > 0 && (
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
                  {leadForecasts.map((p) => (
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
            {/* Analysis interlude for K-Drama — right after the In motion rail */}
            {b.pillar === "k-drama" && (
              <AnalysisInterlude pillar={b.pillar} articles={interludes.get(b.pillar) ?? []} />
            )}
            {/* Fan Forecast, part two — the next three questions keep the vote hook
                alive deeper in the scroll; each card carries its own pillar kicker,
                so a mixed cluster reads fine here */}
            {b.pillar === "k-drama" && nextForecasts.length > 0 && (
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
                  {nextForecasts.map((p) => (
                    <PredictionCard key={p.slug} prediction={p} />
                  ))}
                </div>
              </section>
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
