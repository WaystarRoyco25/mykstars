import { Fragment } from "react";
import Link from "next/link";
import {
  getArticles,
  getFeaturedGallery,
  getGalleriesForPillar,
  getOpenPredictions,
  getRankings,
} from "@/lib/data";
import { PILLAR_LABELS, PILLAR_ORDER, TAG_LABELS, pillarSlug } from "@/lib/types";
import type { Pillar } from "@/lib/types";
import { relativeTime } from "@/lib/format";
import PhotoMedia from "@/components/PhotoMedia";
import AttributionBadge from "@/components/AttributionBadge";
import GalleryGrid from "@/components/GalleryGrid";
import RankingTable from "@/components/RankingTable";
import ArticleListItem from "@/components/ArticleListItem";
import PredictionCard from "@/components/PredictionCard";
import JsonLd from "@/components/JsonLd";

// Tiles per pillar band, weighted to coverage (K-Pop > K-Drama > Fashion > K-Movie).
const BAND_COUNT: Record<Pillar, number> = {
  "k-pop": 6,
  "k-drama": 5,
  "fashion-beauty": 3,
  "k-movie": 2,
};

export default async function HomePage() {
  const featured = await getFeaturedGallery();
  const [bands, articles, rankings, forecasts] = await Promise.all([
    Promise.all(
      PILLAR_ORDER.map(async (pillar) => ({
        pillar,
        galleries: (await getGalleriesForPillar(pillar))
          .filter((g) => g.slug !== featured.slug)
          .slice(0, BAND_COUNT[pillar]),
      })),
    ),
    getArticles(),
    getRankings(),
    getOpenPredictions(),
  ]);
  // Each table is interleaved right after its pillar's band (K-Pop, K-Drama today).
  const rankingByPillar = new Map(rankings.map((r) => [r.pillar, r]));
  // A small teaser of open questions drives the return-visit loop from the home page.
  const topForecasts = forecasts.slice(0, 3);

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
        MyKStars — the freshest organized, credited photos of Korean celebrities
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
                {featured.title}
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
                <GalleryGrid galleries={b.galleries} priorityCount={b.pillar === "k-pop" ? 3 : 0} />
              </section>
              {ranking && <RankingTable ranking={ranking} />}
            </Fragment>
          );
        })}

      {/* Fan Forecast — predictions teaser, the return-visit hook */}
      {topForecasts.length > 0 && (
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
            {articles.slice(0, 4).map((a) => (
              <ArticleListItem key={a.slug} article={a} on="light" />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
