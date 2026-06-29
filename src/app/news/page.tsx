import type { Metadata } from "next";
import { getArticles } from "@/lib/data";
import ArticleListItem from "@/components/ArticleListItem";

export const metadata: Metadata = {
  title: "News & analysis",
  description:
    "Credible, neutral analysis with a clear rumor-vs-confirmed labeling system. No clickbait.",
};

export default async function NewsPage() {
  const articles = await getArticles();

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <header className="mb-10">
        <p className="kicker">News &amp; analysis</p>
        <h1 className="font-serif text-4xl sm:text-5xl mt-2">The context</h1>
        <p className="text-muted mt-3 max-w-2xl leading-relaxed">
          Neutral reporting with the photo context, and a clear label on what is
          confirmed versus unverified.
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
