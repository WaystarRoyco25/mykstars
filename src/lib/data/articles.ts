import "server-only";

import { cache } from "react";

import type { Article } from "../domain/stories";
import type { Pillar } from "../domain/taxonomy";
import { articleStore } from "../stores/articles";

export async function getArticles(opts?: { pillar?: Pillar }): Promise<Article[]> {
  return articleStore.newest.filter(
    (article) => !opts?.pillar || article.pillar === opts.pillar,
  );
}

const readArticle = cache(async (slug: string): Promise<Article | undefined> =>
  articleStore.bySlug.get(slug),
);

export async function getArticle(slug: string): Promise<Article | undefined> {
  return readArticle(slug);
}

export async function getRelatedArticles(artistSlug: string): Promise<Article[]> {
  return [...(articleStore.byArtist.get(artistSlug) ?? [])];
}

export function allArticleSlugs(): string[] {
  return articleStore.all.map((article) => article.slug);
}
