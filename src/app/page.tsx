import Link from "next/link";
import { getArticles, getFeaturedGallery, getGalleries } from "@/lib/data";
import { CATEGORY_LABELS } from "@/lib/types";
import { relativeTime } from "@/lib/format";
import PhotoMedia from "@/components/PhotoMedia";
import AttributionBadge from "@/components/AttributionBadge";
import CategoryFilter from "@/components/CategoryFilter";
import GalleryGrid from "@/components/GalleryGrid";
import ArticleListItem from "@/components/ArticleListItem";
import JsonLd from "@/components/JsonLd";

export default async function HomePage() {
  const [featured, galleries, articles] = await Promise.all([
    getFeaturedGallery(),
    getGalleries(),
    getArticles(),
  ]);
  const rest = galleries.filter((g) => g.slug !== featured.slug);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "MyKStars",
          url: "https://mykstars.com",
          description:
            "Photo-first K-Culture newspaper and magazine: the freshest, organized, credited photos of Korean celebrities.",
        }}
      />

      <h1 className="sr-only">
        MyKStars — the freshest organized, credited photos of Korean celebrities
      </h1>

      {/* Hero — featured gallery */}
      <section className="mx-auto max-w-6xl px-5 pt-6">
        <Link href={`/photos/${featured.slug}`} className="group block">
          <div className="relative h-[56vw] max-h-[560px] min-h-[340px] overflow-hidden border border-line">
            <PhotoMedia item={featured.cover} sizes="100vw" priority />
            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-ink/55" aria-hidden />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-9">
              <p className="kicker">{CATEGORY_LABELS[featured.category]} · Featured</p>
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

      {/* Filter */}
      <div className="mx-auto max-w-6xl px-5 mt-8">
        <CategoryFilter />
      </div>

      {/* Latest photos */}
      <section className="mx-auto max-w-6xl px-5 mt-8">
        <div className="flex items-end justify-between mb-6">
          <h2 className="kicker">Latest photos</h2>
          <Link href="/photos" className="label hover:text-bone transition-colors">
            All photos →
          </Link>
        </div>
        <GalleryGrid galleries={rest} priorityCount={3} />
      </section>

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
