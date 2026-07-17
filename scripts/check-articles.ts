#!/usr/bin/env node
import { articles } from "../src/content/articles";
import { galleries } from "../src/content/galleries";
import { NOW } from "../src/content/now";
import { artists } from "../src/content/profiles";
import {
  ANALYSIS_BYLINE,
  ANALYSIS_RUN_FLOOR,
  checkArticles,
} from "../src/lib/checks/articles";
import { formatIssue } from "../src/lib/checks/result";
import { ARTICLE_WINDOW_DAYS } from "../src/lib/editorial-policy";

const result = checkArticles({ articles, artists, galleries, nowIso: NOW });

if (result.recentAnalysisCount < ANALYSIS_RUN_FLOOR) {
  console.warn(
    `⚠ latest run looks light: ${result.recentAnalysisCount} analysis piece${result.recentAnalysisCount === 1 ? "" : "s"} dated within ` +
      `${ARTICLE_WINDOW_DAYS} days of NOW (the per-edition floor is ${ANALYSIS_RUN_FLOOR}; docs/analysis-playbook.md rule 13).`,
  );
}

if (result.issues.length > 0) {
  for (const value of result.issues) console.error(formatIssue(value));
  console.error(
    `\n✖ Found ${result.issues.length} article issue${result.issues.length === 1 ? "" : "s"}. Analysis articles carry the ` +
      `"${ANALYSIS_BYLINE}" byline, real dates on or before NOW, assertive titles, and resolvable ` +
      `related slugs (see docs/analysis-playbook.md).`,
  );
  process.exitCode = 1;
} else {
  console.log(
    `✓ No article issues (src/content/articles.ts: ${result.articleCount} articles, ${result.analysisCount} analysis).`,
  );
}
