import type { Artist } from "../domain/artists";
import type { Article, Gallery } from "../domain/stories";
import { checkArticleStructure } from "./article-structure";
import { recycledPhrasingIssues } from "./article-phrasing";
import type { CheckIssue } from "./result";

export { ANALYSIS_BYLINE } from "./article-structure";
export {
  DOMAIN_PHRASES,
  FORMULA_ARTICLE_FLOOR,
  FORMULA_GRAM_WORDS,
} from "./article-phrasing";

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
  const structural = checkArticleStructure(input, file);

  return {
    issues: [
      ...structural.issues,
      ...recycledPhrasingIssues(input.articles, file),
    ],
    articleCount: structural.articleCount,
    analysisCount: structural.analysisCount,
    recentAnalysisCount: structural.recentAnalysisCount,
  };
}
