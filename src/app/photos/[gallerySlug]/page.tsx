import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { allGallerySlugs, getArtist, getGallery } from "@/lib/data";
import { PILLAR_LABELS, TAG_LABELS, pillarSlug } from "@/lib/types";
import { absoluteDate, relativeTime } from "@/lib/format";
import GalleryViewer from "@/components/GalleryViewer";
import AttributionBadge from "@/components/AttributionBadge";
import JsonLd from "@/components/JsonLd";
import { renderEmphasis, stripEmphasis } from "@/lib/text";

export function generateStaticParams() {
  return allGallerySlugs().map((gallerySlug) => ({ gallerySlug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ gallerySlug: string }>;
}): Promise<Metadata> {
  const { gallerySlug } = await params;
  const gallery = await getGallery(gallerySlug);
  if (!gallery) return { title: "Gallery not found" };
  const title = stripEmphasis(gallery.title);
  const description = stripEmphasis(gallery.excerpt);
  return {
    title,
    description,
    openGraph: { title, description, type: "article" },
  };
}

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ gallerySlug: string }>;
}) {
  const { gallerySlug } = await params;
  const gallery = await getGallery(gallerySlug);
  if (!gallery) notFound();

  const artists = (
    await Promise.all(gallery.artistSlugs.map((s) => getArtist(s)))
  ).filter((a): a is NonNullable<typeof a> => Boolean(a));

  return (
    <article className="mx-auto max-w-4xl px-5 py-10">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ImageGallery",
          name: stripEmphasis(gallery.title),
          datePublished: gallery.date,
          about: artists.map((a) => ({ "@type": "Person", name: a.name })),
          publisher: { "@type": "Organization", name: "MyKStars" },
        }}
      />

      <nav className="label text-muted mb-6">
        <Link href="/photos" className="hover:text-bone">Photos</Link>
        <span className="mx-2">/</span>
        <Link href={`/${pillarSlug(gallery.pillar)}`} className="hover:text-bone">
          {PILLAR_LABELS[gallery.pillar]}
        </Link>
        <span className="mx-2">/</span>
        <Link
          href={`/${pillarSlug(gallery.pillar)}?tag=${gallery.category}`}
          className="hover:text-bone"
        >
          {TAG_LABELS[gallery.category]}
        </Link>
      </nav>

      <header className="mb-7">
        <p className="kicker">
          {TAG_LABELS[gallery.category]}
          {gallery.event ? ` · ${gallery.event}` : ""}
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl leading-tight mt-3">
          {renderEmphasis(gallery.title)}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted">
          <span>{relativeTime(gallery.date)}</span>
          <span className="text-muted-2">·</span>
          <span>{absoluteDate(gallery.date)}</span>
          <span className="text-muted-2">·</span>
          <AttributionBadge source={gallery.source} />
        </div>
      </header>

      <GalleryViewer media={gallery.media} />

      <p className="text-muted mt-8 leading-relaxed max-w-2xl">{renderEmphasis(gallery.excerpt)}</p>

      {artists.length > 0 && (
        <div className="mt-8">
          <p className="label mb-3">In this set</p>
          <div className="flex flex-wrap gap-3">
            {artists.map((a) => (
              <Link
                key={a.slug}
                href={`/artists/${a.slug}`}
                className="font-serif text-lg border border-line px-4 py-2 hover:border-crimson hover:text-crimson transition-colors"
              >
                {a.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-muted mt-10 border-t border-line pt-5 leading-relaxed">
        Photos credited to {gallery.source.name}. MyKStars aggregates and embeds from
        original sources with attribution. Rights-holders may request removal via our{" "}
        <Link href="/legal/dmca" className="text-crimson hover:underline">
          takedown form
        </Link>
        .
      </p>
    </article>
  );
}
