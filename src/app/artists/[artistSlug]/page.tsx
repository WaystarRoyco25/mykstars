import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  allArtistSlugs,
  getArtist,
  getGalleriesByArtist,
  getProfileTimeline,
  getSpotlightForDate,
  sparseFill,
} from "@/lib/data";
import type { TimelineEntry } from "@/lib/data";
import { CAREER_STAGE_LABELS, EVENT_TYPE_LABELS } from "@/lib/types";
import GalleryGrid from "@/components/GalleryGrid";
import ArticleListItem from "@/components/ArticleListItem";
import PulseItem from "@/components/PulseItem";
import JsonLd from "@/components/JsonLd";
import LiveEmbed from "@/components/LiveEmbed";
import PhotoMedia from "@/components/PhotoMedia";
import { IconArrowUpRight } from "@/components/icons";
import { absoluteDate, eventDateRange } from "@/lib/format";
import { orientationOf } from "@/lib/media";
import { roleLabel } from "@/lib/people";
import { renderEmphasis, stripEmphasis } from "@/lib/text";
import CompanyLogo from "@/components/CompanyLogo";
import { NOW } from "@/lib/content";

export function generateStaticParams() {
  return allArtistSlugs().map((artistSlug) => ({ artistSlug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/artists/[artistSlug]">): Promise<Metadata> {
  const { artistSlug } = await params;
  const artist = await getArtist(artistSlug);
  if (!artist) return { title: "Artist not found" };
  return {
    title: artist.name,
    description: `${artist.name}: profile, timeline and credited coverage on MyKStars.`,
  };
}

// One row of the unified timeline. Articles keep their standard list item; the
// other formats share the same row grammar (serif title, format label, dated
// credit line) so the mixed stream reads as one column.
function TimelineRow({ entry }: { entry: TimelineEntry }) {
  if (entry.format === "article") {
    return <ArticleListItem article={entry.article} />;
  }
  if (entry.format === "pulse") {
    return <PulseItem pulse={entry.pulse} artists={entry.artists} />;
  }

  let label: string;
  let title: React.ReactNode;
  let meta: string;
  let href: string | null = null;
  let externalUrl: string | null = null;
  if (entry.format === "gallery") {
    label = "Photos";
    title = renderEmphasis(entry.gallery.title);
    href = `/photos/${entry.gallery.slug}`;
    meta = `${absoluteDate(entry.date)} · via ${entry.gallery.source.name}`;
  } else if (entry.format === "clip") {
    label = entry.clip.genre === "music" ? "In motion" : "On air";
    title = renderEmphasis(entry.clip.caption);
    externalUrl = entry.clip.embedUrl;
    meta = `${absoluteDate(entry.date)} · via ${entry.clip.credit.name}`;
  } else {
    label = EVENT_TYPE_LABELS[entry.event.type];
    title = `${entry.event.headliner} · ${entry.event.tour ?? entry.event.venue ?? entry.event.city}`;
    href = "/schedule";
    meta = `${eventDateRange(entry.event.date, entry.event.endDate)} · ${entry.event.city}, ${entry.event.country} · via ${entry.event.source.name}`;
  }

  const heading = (
    <h3 className="font-serif text-xl leading-snug group-hover:text-crimson transition-colors">
      {title}
    </h3>
  );

  return (
    <article className="border-t border-line pt-5">
      <div className="flex items-baseline justify-between gap-4">
        {href ? (
          <Link href={href} className="group">
            {heading}
          </Link>
        ) : externalUrl ? (
          <a
            href={externalUrl}
            target="_blank"
            rel="nofollow noopener noreferrer"
            className="group"
          >
            {heading}
          </a>
        ) : (
          heading
        )}
        <span className="label text-muted shrink-0">{label}</span>
      </div>
      <p className="label mt-3 text-muted">{meta}</p>
    </article>
  );
}

function timelineKey(entry: TimelineEntry): string {
  switch (entry.format) {
    case "gallery":
      return `gallery-${entry.gallery.slug}`;
    case "clip":
      return `clip-${entry.clip.id}`;
    case "article":
      return `article-${entry.article.slug}`;
    case "pulse":
      return `pulse-${entry.pulse.slug}`;
    case "event":
      return `event-${entry.event.slug}`;
  }
}

export default async function ArtistPage({
  params,
}: PageProps<"/artists/[artistSlug]">) {
  const { artistSlug } = await params;
  const artist = await getArtist(artistSlug);
  if (!artist) notFound();

  const [galleries, timeline, spotlight] = await Promise.all([
    getGalleriesByArtist(artistSlug),
    getProfileTimeline(artistSlug),
    getSpotlightForDate(NOW),
  ]);
  const isInSpotlight = spotlight.some((profile) => profile.slug === artistSlug);
  // Keep the visual grid from looking empty: top up a sparse grid with the
  // artist's curated posts (live embeds) and official-account tiles, then related
  // same-pillar sets (credited; never rehosted or fabricated).
  const { embeds: fillEmbeds, galleries: fillGalleries } = await sparseFill(
    artist,
    galleries,
  );
  const groupProfile = artist.memberOf ? await getArtist(artist.memberOf) : undefined;
  const memberProfiles = (
    await Promise.all((artist.members ?? []).map((s) => getArtist(s)))
  ).filter((a): a is NonNullable<typeof a> => Boolean(a));

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": artist.type === "group" ? "MusicGroup" : "Person",
          name: artist.name,
          alternateName: artist.koreanName,
          description: stripEmphasis(artist.bio),
        }}
      />

      <nav className="label text-muted mb-6">
        <Link href="/" className="hover:text-bone">MyKStars</Link>
        <span className="mx-2">/</span>
        <Link href="/artists" className="hover:text-bone">Stars</Link>
        <span className="mx-2">/</span>
        <span>{artist.name}</span>
      </nav>

      {/* Permitted hero — an image backed by the media-asset registry, or the
          official-embed fallback. Absent on the legacy roster until permitted
          media lands. */}
      {artist.hero && (
        <div className="relative h-[48vw] max-h-[460px] min-h-[260px] overflow-hidden rounded-tile border border-line mb-8">
          {artist.hero.kind === "embed" ? (
            <LiveEmbed item={artist.hero} />
          ) : (
            <PhotoMedia
              item={artist.hero}
              sizes="100vw"
              preload
              // The hero box is a wide letterbox, so a portrait photo overflows
              // it vertically and a centred crop lands on the chest, cutting the
              // face off. Bias the crop toward the upper third, where the face
              // sits in a press or red-carpet frame. Landscape heroes fill the
              // box closely and stay centred.
              position={orientationOf(artist.hero) === "portrait" ? "50% 22%" : undefined}
            />
          )}
        </div>
      )}

      <header className="border-b border-line pb-8 mb-10">
        {isInSpotlight && (
          <span className="kicker mb-4 inline-block border border-crimson px-3 py-1.5">
            In the Spotlight
          </span>
        )}
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h1 className="font-serif text-4xl sm:text-6xl">{artist.name}</h1>
          {artist.koreanName && (
            <span className="text-muted text-xl">{artist.koreanName}</span>
          )}
        </div>
        <p className="label mt-4 text-muted flex items-center gap-1.5 flex-wrap">
          <span>{roleLabel(artist)}</span>
          <span aria-hidden>·</span>
          <span>{CAREER_STAGE_LABELS[artist.careerStage]}</span>
          {artist.agency && (
            <>
              <span aria-hidden>·</span>
              <CompanyLogo name={artist.agency} fallback={<span>{artist.agency}</span>} />
            </>
          )}
          {artist.debutYear && (
            <>
              <span aria-hidden>·</span>
              <span>Debuted {artist.debutYear}</span>
            </>
          )}
        </p>
        <p className="text-muted mt-4 max-w-2xl leading-relaxed">{renderEmphasis(artist.bio)}</p>
        {artist.currentActivity && (
          <p className="text-muted mt-3 max-w-2xl leading-relaxed">
            {renderEmphasis(artist.currentActivity)}
          </p>
        )}
        {(groupProfile || memberProfiles.length > 0) && (
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="label text-muted">{groupProfile ? "Group" : "Members"}</span>
            {(groupProfile ? [groupProfile] : memberProfiles).map((p) => (
              <Link
                key={p.slug}
                href={`/artists/${p.slug}`}
                className="font-serif text-lg border border-line px-4 py-2 hover:border-crimson hover:text-crimson transition-colors"
              >
                {p.name}
              </Link>
            ))}
          </div>
        )}
        {artist.officialLinks && artist.officialLinks.length > 0 && (
          <p className="label mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-muted">
            {artist.officialLinks.map((l) => (
              <a
                key={l.url}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-bone transition-colors"
              >
                {l.label}
                <IconArrowUpRight size={12} />
              </a>
            ))}
          </p>
        )}
        <p className="label mt-4 text-muted-2">
          Last verified {absoluteDate(artist.lastVerified)}
        </p>
      </header>

      <section className="mb-16">
        <div className="flex items-end justify-between mb-6">
          <h2 className="kicker">In focus</h2>
          {galleries.length > 0 && (
            <Link
              href={`/photos?artist=${artistSlug}`}
              className="label hover:text-bone transition-colors"
            >
              All photos of {artist.name} →
            </Link>
          )}
        </div>
        {galleries.length + fillEmbeds.length + fillGalleries.length > 0 ? (
          <GalleryGrid
            galleries={galleries}
            preloadCount={3}
            fillEmbeds={fillEmbeds}
            fillGalleries={fillGalleries}
          />
        ) : (
          <p className="text-muted">No photo sets yet.</p>
        )}
      </section>

      {timeline.length > 0 && (
        <section>
          <h2 className="kicker mb-6">Timeline</h2>
          <div className="flex flex-col gap-6">
            {timeline.map((entry) => (
              <TimelineRow key={timelineKey(entry)} entry={entry} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
