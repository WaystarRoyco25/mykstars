import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  allArtistSlugs,
  getArtist,
  getGalleriesByArtist,
  getRelatedArticles,
} from "@/lib/data";
import GalleryGrid from "@/components/GalleryGrid";
import ArticleListItem from "@/components/ArticleListItem";
import JsonLd from "@/components/JsonLd";
import { roleLabel } from "@/lib/people";

export function generateStaticParams() {
  return allArtistSlugs().map((artistSlug) => ({ artistSlug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ artistSlug: string }>;
}): Promise<Metadata> {
  const { artistSlug } = await params;
  const artist = await getArtist(artistSlug);
  if (!artist) return { title: "Artist not found" };
  return {
    title: artist.name,
    description: `${artist.name} — photo timeline, profile and the latest credited galleries on MyKStars.`,
  };
}

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ artistSlug: string }>;
}) {
  const { artistSlug } = await params;
  const artist = await getArtist(artistSlug);
  if (!artist) notFound();

  const [galleries, related] = await Promise.all([
    getGalleriesByArtist(artistSlug),
    getRelatedArticles(artistSlug),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": artist.type === "group" ? "MusicGroup" : "Person",
          name: artist.name,
          alternateName: artist.koreanName,
          description: artist.bio,
        }}
      />

      <nav className="label text-muted mb-6">
        <Link href="/artists" className="hover:text-bone">People</Link>
        <span className="mx-2">/</span>
        <span>{artist.name}</span>
      </nav>

      <header className="border-b border-line pb-8 mb-10">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h1 className="font-serif text-4xl sm:text-6xl">{artist.name}</h1>
          {artist.koreanName && (
            <span className="text-muted text-xl">{artist.koreanName}</span>
          )}
        </div>
        <p className="label mt-4 text-muted">
          {roleLabel(artist)}
          {artist.agency ? ` · ${artist.agency}` : ""}
          {artist.debutYear ? ` · Debuted ${artist.debutYear}` : ""}
        </p>
        <p className="text-muted mt-4 max-w-2xl leading-relaxed">{artist.bio}</p>
      </header>

      <section className="mb-16">
        <h2 className="kicker mb-6">Photo timeline</h2>
        {galleries.length > 0 ? (
          <GalleryGrid galleries={galleries} priorityCount={3} />
        ) : (
          <p className="text-muted">No photo sets yet.</p>
        )}
      </section>

      {related.length > 0 && (
        <section>
          <h2 className="kicker mb-6">Related analysis</h2>
          <div className="flex flex-col gap-6">
            {related.map((a) => (
              <ArticleListItem key={a.slug} article={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
