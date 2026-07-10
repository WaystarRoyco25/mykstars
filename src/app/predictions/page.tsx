import type { Metadata } from "next";
import { getPredictions, getPredictionTallies } from "@/lib/data";
import { pillarFromSlug } from "@/lib/types";
import type { Pillar } from "@/lib/types";
import PredictionCard from "@/components/PredictionCard";
import PredictionFilter from "@/components/PredictionFilter";
import JsonLd from "@/components/JsonLd";
import { stripEmphasis } from "@/lib/text";
import { singleParam } from "@/lib/params";

export const metadata: Metadata = {
  title: "Fan Forecast",
  description:
    "Predict the next big moments in K-culture: awards, charts, comebacks and box office. A vote-only fan-sentiment meter: what fans believe and hope, not a betting market.",
};

export default async function PredictionsPage({
  searchParams,
}: PageProps<"/predictions">) {
  const query = await searchParams;
  const pillarParam = singleParam(query.pillar);
  const activePillar: Pillar | null = pillarParam ? (pillarFromSlug(pillarParam) ?? null) : null;

  const predictions = await getPredictions({ pillar: activePillar ?? undefined });
  const tallies = await getPredictionTallies(predictions);
  const tallyBySlug = new Map(tallies.map((tally) => [tally.predictionSlug, tally]));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "MyKStars · Fan Forecast",
    itemListElement: predictions.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: stripEmphasis(p.question),
    })),
  };

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <JsonLd data={jsonLd} />

      <header className="mb-8">
        <p className="kicker">Fan Forecast</p>
        <h1 className="font-serif text-4xl sm:text-5xl mt-2">Call it before it happens</h1>
        <p className="text-muted mt-3 max-w-2xl leading-relaxed">
          A fan-sentiment meter for the moments ahead: awards, charts, comebacks, box office. Cast
          your pick, then come back when it resolves. This is for fun and for fandom: what fans
          believe and hope, never a bet.
        </p>
      </header>

      <div className="mb-10 border-b border-line pb-3">
        <PredictionFilter activePillar={activePillar} />
      </div>

      {predictions.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2">
          {predictions.map((p) => (
            <PredictionCard key={p.slug} prediction={p} tally={tallyBySlug.get(p.slug)!} />
          ))}
        </div>
      ) : (
        <p className="text-muted">No forecasts in this pillar yet.</p>
      )}

      <p className="text-xs text-muted-2 mt-12 max-w-2xl leading-relaxed">
        Voting is live and anonymous: one pick per question, no account needed. Each breakdown
        stays hidden until enough fans have weighed in. Every question resolves against an objective,
        public source and covers professional outcomes only.
      </p>
    </div>
  );
}
