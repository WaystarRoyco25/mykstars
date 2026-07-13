import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  clipFillMedia,
  getArticles,
  getArtistsByPillar,
  getGalleriesForPillar,
  getRankingForPillar,
} from "@/lib/data";
import {
  PILLAR_LABELS,
  PILLAR_ORDER,
  pillarFromSlug,
  pillarSlug,
} from "@/lib/types";
import type { Pillar } from "@/lib/types";
import { orientationOf } from "@/lib/media";
import { relativeTime } from "@/lib/format";
import { NOW } from "@/lib/content";
import { roleLabel } from "@/lib/people";
import PhotoMedia from "@/components/PhotoMedia";
import AttributionBadge from "@/components/AttributionBadge";
import GalleryGrid from "@/components/GalleryGrid";
import RankingTable from "@/components/RankingTable";
import ArticleListItem from "@/components/ArticleListItem";
import JsonLd from "@/components/JsonLd";
import { renderEmphasis } from "@/lib/text";

// Only the four pillar slugs are valid; anything else 404s (no catch-all surprise).
export const dynamicParams = false;

export function generateStaticParams() {
  return PILLAR_ORDER.map((p) => ({ pillar: pillarSlug(p) }));
}

const PILLAR_BLURBS: Record<Pillar, string> = {
  "k-pop": "Comebacks, stages, airport fashion and pictorials, organized and credited.",
  "k-drama": "Stills, casting, press lines and where to watch: the K-drama desk.",
  "k-movie": "Festivals, directors and the films travelling the international circuit.",
  "fashion-beauty": "Pictorials, house campaigns and front-row fashion across K-culture.",
};

export async function generateMetadata({
  params,
}: PageProps<"/[pillar]">): Promise<Metadata> {
  const { pillar: slug } = await params;
  const pillar = pillarFromSlug(slug);
  if (!pillar) return { title: "Not found" };
  const label = PILLAR_LABELS[pillar];
  const description = PILLAR_BLURBS[pillar];
  return {
    title: label,
    description,
    openGraph: { title: `${label} · MyKStars`, description, type: "website" },
  };
}

export default async function PillarPage({
  params,
}: PageProps<"/[pillar]">) {
  const { pillar: slug } = await params;
  const pillar = pillarFromSlug(slug);
  if (!pillar) notFound();

  const [galleries, people, analysis, ranking] = await Promise.all([
    getGalleriesForPillar(pillar),
    getArtistsByPillar(pillar),
    getArticles({ pillar }),
    getRankingForPillar(pillar),
  ]);

  const featured = galleries[0];
  const rest = galleries.slice(1);
  const heroOrientation = featured ? orientationOf(featured.cover) : "landscape";

  const heroContent = featured ? (
    <>
      <p className="kicker">{PILLAR_LABELS[pillar]} · Featured</p>
      <h2 className="font-serif text-3xl sm:text-5xl leading-[1.05] mt-3 max-w-3xl group-hover:text-crimson transition-colors">
        {renderEmphasis(featured.title)}
      </h2>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-bone">
        <span className="label text-bone">{featured.media.length} photos</span>
        <span className="text-muted">·</span>
        <span className="label text-muted">{relativeTime(featured.date, NOW)}</span>
        <span className="text-muted">·</span>
        <AttributionBadge source={featured.source} asLink={false} className="text-muted" />
      </div>
    </>
  ) : null;

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `${PILLAR_LABELS[pillar]} · MyKStars`,
          description: PILLAR_BLURBS[pillar],
        }}
      />

      <header className="mb-8">
        <p className="kicker">Pillar</p>
        <h1 className="font-serif text-4xl sm:text-6xl mt-2">{PILLAR_LABELS[pillar]}</h1>
        <p className="text-muted mt-3 max-w-2xl leading-relaxed">{PILLAR_BLURBS[pillar]}</p>
      </header>

      {/* Featured — orientation-aware: wide for landscape, split for portrait */}
      {featured &&
        (heroOrientation === "landscape" ? (
          <Link href={`/photos/${featured.slug}`} className="group block mb-10">
            <div className="relative h-[52vw] max-h-[520px] min-h-[320px] overflow-hidden border border-line">
              <PhotoMedia item={featured.cover} sizes="100vw" preload />
              <div className="absolute inset-x-0 bottom-0 h-2/3 bg-ink/55" aria-hidden />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-9">{heroContent}</div>
            </div>
          </Link>
        ) : (
          <Link
            href={`/photos/${featured.slug}`}
            className="group grid sm:grid-cols-[minmax(0,300px)_1fr] gap-5 sm:gap-8 items-end border border-line p-5 sm:p-6 mb-10"
          >
            <div className="relative aspect-[3/4] overflow-hidden border border-line">
              <PhotoMedia
                item={featured.cover}
                sizes="(max-width: 640px) 100vw, 300px"
                preload
                position="50% 30%"
              />
            </div>
            <div>{heroContent}</div>
          </Link>
        ))}

      {/* Masonry — clip-led while the pillar has no published photo sets (the
          interim while placeholder galleries sit archived) */}
      {galleries.length > 0 ? (
        <GalleryGrid galleries={rest} preloadCount={3} />
      ) : (
        <div>
          <p className="label text-muted mb-6">
            Official video while permitted photography is sourced.
          </p>
          <GalleryGrid galleries={[]} fillEmbeds={clipFillMedia(8, pillar)} />
        </div>
      )}

      {/* Ranking — only K-Pop and K-Drama have one today; other pillars render nothing */}
      {ranking && <RankingTable ranking={ranking} className="mt-16" />}

      {/* People strip */}
      {people.length > 0 && (
        <section className="mt-16">
          <h2 className="kicker mb-6">People</h2>
          <div className="flex flex-wrap gap-3">
            {people.map((a) => (
              <Link
                key={a.slug}
                href={`/artists/${a.slug}`}
                className="border border-line px-4 py-2 hover:border-crimson transition-colors group"
              >
                <span className="font-serif text-lg group-hover:text-crimson transition-colors">
                  {a.name}
                </span>
                <span className="label text-muted ml-2">{roleLabel(a)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Analysis */}
      {analysis.length > 0 && (
        <section className="mt-16">
          <div className="flex items-end justify-between mb-6">
            <h2 className="kicker">Analysis</h2>
            <Link href="/analysis" className="label hover:text-bone transition-colors">
              All analysis →
            </Link>
          </div>
          <div className="flex flex-col gap-6">
            {analysis.map((a) => (
              <ArticleListItem key={a.slug} article={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
