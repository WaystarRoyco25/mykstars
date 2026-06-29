import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { allArticleSlugs, getArticle, getArtist, getGallery } from "@/lib/data";
import { absoluteDate } from "@/lib/format";
import StatusFlag from "@/components/StatusFlag";
import AttributionBadge from "@/components/AttributionBadge";
import JsonLd from "@/components/JsonLd";
import { renderEmphasis, stripEmphasis } from "@/lib/text";

export function generateStaticParams() {
  return allArticleSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: "Article not found" };
  const title = stripEmphasis(article.title);
  const description = stripEmphasis(article.dek);
  return {
    title,
    description,
    openGraph: { title, description, type: "article" },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const relatedArtists = (
    await Promise.all((article.related?.artistSlugs ?? []).map((s) => getArtist(s)))
  ).filter((a): a is NonNullable<typeof a> => Boolean(a));
  const relatedGalleries = (
    await Promise.all((article.related?.gallerySlugs ?? []).map((s) => getGallery(s)))
  ).filter((g): g is NonNullable<typeof g> => Boolean(g));

  return (
    <article className="mx-auto max-w-2xl px-5 py-10">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          headline: stripEmphasis(article.title),
          description: stripEmphasis(article.dek),
          datePublished: article.date,
          author: { "@type": "Person", name: article.author },
          publisher: { "@type": "Organization", name: "MyKStars" },
        }}
      />

      <Link href="/news" className="label text-muted hover:text-bone mb-6 inline-block">
        ← News &amp; analysis
      </Link>

      <header className="mb-8">
        <StatusFlag status={article.status} />
        <h1 className="font-serif text-3xl sm:text-4xl leading-tight mt-4">
          {renderEmphasis(article.title)}
        </h1>
        <p className="text-lg text-muted mt-4 leading-relaxed">{renderEmphasis(article.dek)}</p>
        <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-muted border-t border-line pt-5">
          <span>{article.author}</span>
          <span>·</span>
          <span>{absoluteDate(article.date)}</span>
          {article.source && (
            <>
              <span>·</span>
              <AttributionBadge source={article.source} />
            </>
          )}
        </div>
      </header>

      <div className="flex flex-col gap-5 text-[1.0625rem] leading-[1.75] text-bone/90">
        {article.body.map((p, i) => (
          <p key={i}>{renderEmphasis(p)}</p>
        ))}
      </div>

      {(relatedGalleries.length > 0 || relatedArtists.length > 0) && (
        <div className="mt-12 border-t border-line pt-6 flex flex-col gap-4">
          {relatedGalleries.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="label">Photos</span>
              {relatedGalleries.map((g) => (
                <Link
                  key={g.slug}
                  href={`/photos/${g.slug}`}
                  className="font-serif text-lg hover:text-crimson transition-colors"
                >
                  {g.title}
                </Link>
              ))}
            </div>
          )}
          {relatedArtists.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="label">Artists</span>
              {relatedArtists.map((a) => (
                <Link
                  key={a.slug}
                  href={`/artists/${a.slug}`}
                  className="border border-line px-3 py-1 hover:border-crimson hover:text-crimson transition-colors"
                >
                  {a.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
