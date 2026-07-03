import type { Metadata } from "next";
import { getArticles } from "@/lib/data";
import ArticleListItem from "@/components/ArticleListItem";

export const metadata: Metadata = {
  title: "Analysis",
  description:
    "In-depth analysis of how each artist is doing and where K-culture is heading, with a clear label on what is confirmed versus unverified.",
};

export default async function AnalysisPage() {
  const articles = await getArticles();

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <header className="mb-10">
        <p className="kicker">Analysis</p>
        <h1 className="font-serif text-4xl sm:text-5xl mt-2">In depth</h1>
        <p className="text-muted mt-3 max-w-2xl leading-relaxed">
          How each artist is doing and where the K-culture industry is heading,
          with a clear label on what is confirmed versus unverified.
        </p>
      </header>

      <div className="flex flex-col gap-6">
        {articles.map((a) => (
          <ArticleListItem key={a.slug} article={a} />
        ))}
      </div>
    </div>
  );
}
