import { ARTICLE_WINDOW_DAYS, DAY_MS } from "../editorial-policy";
import type { Article, Artist, Gallery } from "../types";
import { issue, type CheckIssue } from "./result";

export const ANALYSIS_BYLINE = "MyKStars";
export const ANALYSIS_RUN_FLOOR = 4;

export interface ArticleCheckInput {
  articles: readonly Article[];
  artists: readonly Pick<Artist, "slug">[];
  galleries: readonly Pick<Gallery, "slug">[];
  nowIso: string;
  file?: string;
}

export interface ArticleCheckResult {
  issues: CheckIssue[];
  articleCount: number;
  analysisCount: number;
  recentAnalysisCount: number;
}

export function checkArticles(input: ArticleCheckInput): ArticleCheckResult {
  const file = input.file ?? "src/content/articles.ts";
  const issues: CheckIssue[] = [];
  const nowMs = Date.parse(input.nowIso);
  const artistSlugs = new Set(input.artists.map((artist) => artist.slug));
  const gallerySlugs = new Set(input.galleries.map((gallery) => gallery.slug));
  const seenSlugs = new Set<string>();
  let analysisCount = 0;
  let recentAnalysisCount = 0;

  for (const [index, article] of input.articles.entries()) {
    const label = article.slug || `article #${index + 1}`;
    if (!article.slug) {
      issues.push(issue(file, "malformed article literal", `article #${index + 1}: missing slug`));
    } else if (seenSlugs.has(article.slug)) {
      issues.push(
        issue(
          file,
          "duplicate slug",
          `"${article.slug}" appears more than once (route collision)`,
        ),
      );
    } else {
      seenSlugs.add(article.slug);
    }

    if (article.author !== ANALYSIS_BYLINE) {
      issues.push(
        issue(
          file,
          "off-policy byline",
          `${label}: "${article.author}" (the byline is always exactly "${ANALYSIS_BYLINE}"; docs/analysis-playbook.md rule 12)`,
        ),
      );
    }

    if (article.status === "analysis") analysisCount++;

    if (!article.date) {
      issues.push(
        issue(file, "missing article date", `${label}: every article carries its real publish date`),
      );
    } else {
      const dateMs = Date.parse(article.date);
      if (Number.isNaN(dateMs)) {
        issues.push(issue(file, "unparseable date", `${label}: "${article.date}"`));
      } else if (Number.isNaN(nowMs)) {
        issues.push(issue("src/content/now.ts", "unparseable NOW", `"${input.nowIso}"`));
      } else if (dateMs > nowMs) {
        issues.push(
          issue(
            file,
            "future-dated article",
            `${label} is dated ${article.date}, after NOW: articles publish on or before the site clock`,
          ),
        );
      } else if (
        article.status === "analysis" &&
        nowMs - dateMs <= ARTICLE_WINDOW_DAYS * DAY_MS
      ) {
        recentAnalysisCount++;
      }
    }

    if (/\?\s*$/.test(article.title)) {
      issues.push(
        issue(
          file,
          "question-mark title",
          `${label}: "${article.title}" (the Betteridge ban; docs/analysis-playbook.md rule 11)`,
        ),
      );
    }

    for (const slug of article.related?.artistSlugs ?? []) {
      if (!artistSlugs.has(slug)) {
        issues.push(
          issue(
            file,
            "dangling related slug",
            `${label}: artistSlugs "${slug}" matches no artist (the article page drops it silently)`,
          ),
        );
      }
    }
    for (const slug of article.related?.gallerySlugs ?? []) {
      if (!gallerySlugs.has(slug)) {
        issues.push(
          issue(
            file,
            "dangling related slug",
            `${label}: gallerySlugs "${slug}" matches no gallery (the article page drops it silently)`,
          ),
        );
      }
    }
  }

  return {
    issues,
    articleCount: input.articles.length,
    analysisCount,
    recentAnalysisCount,
  };
}
