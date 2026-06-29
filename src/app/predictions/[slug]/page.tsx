import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import {
  allPredictionSlugs,
  effectiveStatus,
  getPrediction,
  getPredictionTally,
  getVotedOptionId,
  VOTER_COOKIE,
} from "@/lib/data";
import { PILLAR_LABELS, PREDICTION_CATEGORY_LABELS } from "@/lib/types";
import { absoluteDate } from "@/lib/format";
import AttributionBadge from "@/components/AttributionBadge";
import JsonLd from "@/components/JsonLd";
import PredictionOptions from "@/components/PredictionOptions";
import PredictionStatusBadge from "@/components/PredictionStatusBadge";
import VoteForm from "@/components/VoteForm";
import { renderEmphasis, stripEmphasis } from "@/lib/text";

// Known forecast slugs; unknown ones 404 via notFound() below. The page reads
// the voter cookie, so it renders dynamically per request — live tallies, no
// rebuild needed.
export function generateStaticParams() {
  return allPredictionSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const prediction = await getPrediction(slug);
  if (!prediction) return { title: "Not found" };
  const question = stripEmphasis(prediction.question);
  const framing = stripEmphasis(prediction.framing);
  return {
    title: question,
    description: framing,
    openGraph: {
      title: `${question} · MyKStars Fan Forecast`,
      description: framing,
      type: "website",
    },
  };
}

export default async function PredictionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const prediction = await getPrediction(slug);
  if (!prediction) notFound();

  const tally = await getPredictionTally(slug);
  if (!tally) notFound();
  const status = effectiveStatus(prediction);

  // The visitor's existing pick (anonymous, cookie-scoped). Reading the cookie
  // opts this route into dynamic rendering, so the tally above stays live.
  const voterId = (await cookies()).get(VOTER_COOKIE)?.value;
  const votedOptionId = status === "open" ? await getVotedOptionId(slug, voterId) : null;

  const winningLabel = prediction.resolution
    ? (prediction.options.find((o) => o.id === prediction.resolution!.winningOptionId)?.label ?? "")
    : "";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Question",
    name: stripEmphasis(prediction.question),
    ...(prediction.resolution
      ? { acceptedAnswer: { "@type": "Answer", text: winningLabel } }
      : {}),
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <JsonLd data={jsonLd} />

      <Link href="/predictions" className="label hover:text-bone transition-colors">
        ← Fan Forecast
      </Link>

      <header className="mt-6 mb-8">
        <div className="flex items-center justify-between gap-3 mb-3">
          <span className="kicker">
            {PILLAR_LABELS[prediction.pillar]} · {PREDICTION_CATEGORY_LABELS[prediction.category]}
          </span>
          <PredictionStatusBadge
            closesAt={prediction.closesAt}
            isResolved={status === "resolved"}
            resolvedAt={prediction.resolution?.resolvedAt}
            initialStatus={status}
          />
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl leading-tight">
          {renderEmphasis(prediction.question)}
        </h1>
        <p className="text-muted mt-3 leading-relaxed">{renderEmphasis(prediction.framing)}</p>
      </header>

      <PredictionOptions prediction={prediction} tally={tally} status={status} />

      {/* Live voting — open questions only. */}
      {status === "open" && (
        <VoteForm
          slug={prediction.slug}
          options={prediction.options.map((o) => ({ id: o.id, label: o.label }))}
          votedOptionId={votedOptionId}
        />
      )}

      {/* Resolution context */}
      {prediction.resolution?.note && (
        <p className="text-sm text-muted mt-6 leading-relaxed border-l-2 border-crimson pl-4">
          {renderEmphasis(prediction.resolution.note)}
        </p>
      )}

      {/* Honesty line — mirrors RankingTable's "as of · source". */}
      <div className="mt-8 flex items-center gap-2 flex-wrap label">
        <span className="text-muted">As of {absoluteDate(prediction.asOf)}</span>
        <span className="text-muted-2" aria-hidden>
          ·
        </span>
        <AttributionBadge source={prediction.resolutionSource} className="text-muted" />
      </div>
      <p className="text-xs text-muted-2 mt-3 leading-relaxed">
        {renderEmphasis(prediction.resolutionSourceLabel)}
      </p>
    </div>
  );
}
