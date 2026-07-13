import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { allPulseSlugs, getArtist, getPulse } from "@/lib/data";
import { absoluteDate } from "@/lib/format";
import { aspectClass, orientationOf } from "@/lib/media";
import { PILLAR_LABELS } from "@/lib/types";
import AttributionBadge from "@/components/AttributionBadge";
import JsonLd from "@/components/JsonLd";
import LiveEmbed from "@/components/LiveEmbed";
import PhotoMedia from "@/components/PhotoMedia";
import { renderEmphasis, stripEmphasis } from "@/lib/text";

type PulsePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return allPulseSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PulsePageProps): Promise<Metadata> {
  const { slug } = await params;
  const pulse = await getPulse(slug);
  if (!pulse) return { title: "Pulse not found" };
  const title = stripEmphasis(pulse.heading);
  const description = stripEmphasis(pulse.body);
  return {
    title,
    description,
    openGraph: { title, description, type: "article" },
  };
}

export default async function PulsePage({
  params,
}: PulsePageProps) {
  const { slug } = await params;
  const pulse = await getPulse(slug);
  if (!pulse) notFound();

  const artists = (
    await Promise.all(pulse.artistSlugs.map((artistSlug) => getArtist(artistSlug)))
  ).filter((artist): artist is NonNullable<typeof artist> => Boolean(artist));
  const title = stripEmphasis(pulse.heading);
  const description = stripEmphasis(pulse.body);

  return (
    <article className="mx-auto max-w-2xl px-5 py-10">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          headline: title,
          description,
          datePublished: pulse.date,
          mainEntityOfPage: `https://mykstars.com/pulse/${pulse.slug}`,
          author: { "@type": "Organization", name: "MyKStars" },
          publisher: { "@type": "Organization", name: "MyKStars" },
          about: artists.map((artist) => ({
            "@type": artist.type === "group" ? "MusicGroup" : "Person",
            name: artist.name,
          })),
        }}
      />

      <Link href="/" className="label mb-6 inline-block text-muted hover:text-bone">
        ← The pulse
      </Link>

      <header className="mb-8">
        <p className="kicker">
          {PILLAR_LABELS[pulse.pillar]} · Pulse · {absoluteDate(pulse.date)}
        </p>
        <h1 className="mt-4 font-serif text-3xl leading-tight sm:text-4xl">
          {renderEmphasis(pulse.heading)}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted">
          {renderEmphasis(pulse.body)}
        </p>
      </header>

      {pulse.media && (
        <div className="mt-8">
          {pulse.media.kind === "embed" ? (
            <div className="overflow-hidden rounded-tile border border-line bg-ink-2">
              <LiveEmbed item={pulse.media} layout="flow" />
            </div>
          ) : (
            <div
              className={`relative overflow-hidden rounded-tile border border-line bg-ink-2 ${aspectClass(
                orientationOf(pulse.media),
              )}`}
            >
              <PhotoMedia
                item={pulse.media}
                sizes="(max-width: 768px) 100vw, 672px"
                fit="contain"
              />
            </div>
          )}
          <div className="mt-3 flex items-start justify-between gap-4">
            <p className="text-sm leading-relaxed text-muted">
              {renderEmphasis(pulse.media.alt)}
            </p>
            <AttributionBadge source={pulse.media.credit} className="shrink-0 text-muted" />
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-2 label">
        <span className="text-muted">As of {absoluteDate(pulse.date)}</span>
        <span className="text-muted-2" aria-hidden>
          ·
        </span>
        <AttributionBadge source={pulse.source} className="text-muted" />
      </div>

      {artists.length > 0 && (
        <div className="mt-8">
          <p className="label mb-3">In this update</p>
          <div className="flex flex-wrap gap-3">
            {artists.map((artist) => (
              <Link
                key={artist.slug}
                href={`/artists/${artist.slug}`}
                className="border border-line px-4 py-2 font-serif text-lg transition-colors hover:border-crimson hover:text-crimson"
              >
                {artist.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
