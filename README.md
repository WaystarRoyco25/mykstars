# MyKStars

> Broad, credited coverage of Korean celebrities across K-Pop, K-Drama, K-Movie and Fashion: official video, schedules, fan forecasts and credible analysis, published as one human-approved monthly edition. Fast, English-first, mobile-first.

The wedge: organized, attributed coverage of the stars that matter (the thing every incumbent, Soompi, allkpop, Koreaboo, Kpopmap, leaves on the table) delivered with a sophisticated **editorial-noir** identity rather than the usual pastel clickbait. Photography is openly licensed and re-hosted with rights records; the credit-and-link discipline covers every media kind.

## Stack

- **Next.js 16** (App Router, SSG/ISR) + **React 19** + **TypeScript**
- **Tailwind CSS v4** with editorial-noir design tokens (`#0e0e0e` ink · `#f0f4f5` bone · `#cc001e` crimson, 60-30-10)
- **Playfair Display** (display serif) + **Inter** (body) via `next/font`
- Image config set for **AVIF → WebP** negotiation (`next.config.ts`)

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (static-generates all routes; prebuild runs the six content checks)
npm run verify   # the six content checks + check:generated + typecheck + lint + backend tests
```

## Architecture

- `src/lib/types.ts` — domain model (Artist with careerStage, coverageLevel and publicationState; Gallery, MediaItem, Article, Source, Pulse, MediaAsset, FeedEdition).
- `src/content/` — typed, versioned content files (profiles, galleries, articles, rankings, events, predictions, clips, pulses, monthly editions, the site clock `now.ts`), aggregated by `src/lib/content.ts`. The hand-rolled check scripts under `scripts/` lex these files directly.
- `src/lib/edition/` — the edition engine: `npm run gen:edition -- <YYYY-MM> <publishedAt>` writes a committed `src/content/editions/<id>.ts`, validated by `check:edition` (see `docs/edition-playbook.md`).
- `src/lib/data.ts` — **the CMS seam**. Every page reads through these async functions, backed by `src/lib/content.ts`. Swap in a headless CMS later by re-implementing this module against the same signatures, with no page changes.
- `src/components/` — `GalleryViewer` (swipeable/keyboard), `PhotoCard`, `AttributionBadge`, `EmbedFacade`, `StatusFlag` (rumor-vs-confirmed), `StarsFilters`, etc.
- `src/app/` — home, `artists/` (the Stars directory + `[artistSlug]` per-person hubs), `photos/[gallerySlug]` gallery permalinks (the browse index is retired; `/photos` redirects home), `analysis/` (+ `[slug]`), `predictions/`, `schedule/`, `legal/dmca` with its Server Action, `about/editorial-standards`, `sitemap.ts`, `robots.ts`, `opengraph-image` routes.

## Defensible aggregation (content/legal model)

Aggregation is engineered to **survive**, not just to repost:

- **Embed-first for video, licensed for photos** — official YouTube embeds (TikTok-ready) so video stays on the source, split across two rails; Instagram/X embeds were retired in July 2026. Photography is openly licensed (Wikimedia Commons CC-BY/CC-BY-SA/public domain) or an agency press kit, re-hosted once with a rights record.
- **Attribution as infrastructure** — every `MediaItem` *requires* a credit; we link back and never strip credit lines.
- **DMCA/takedown in v1** — `/legal/dmca` with authoritative Server Action validation.
- **Licensed-spine on-ramp** — wire/agency/stock feeds (Getty *imazins*, Yonhap, News1, Newsen…) drop in behind the same data layer when ad revenue justifies it.

## SEO / Discover

`max-image-preview:large` site-wide, NewsArticle/ImageGallery JSON-LD, crawlable SSG HTML, image + Google-News-ready sitemaps, and per-route Open Graph cards.

## Status

The broad-coverage model is live end to end: 40 published profiles (careerStage / coverageLevel / publicationState / lastVerified, guarded by `check:profiles`), every one carrying a permitted hero from the 43-asset `MediaAsset` rights registry (Supabase Storage re-hosts); Pulse items with permanent URLs; and the monthly edition engine rendering the home page from the committed July 2026 edition (`docs/edition-playbook.md`). The 43 placeholder-era galleries stay archived with live URLs and a noindex archival notice. The photo-archive index is retired: `/photos` redirects home while per-gallery permalinks stay live. Editorial rules live in `docs/` (agent hub: `AGENTS.md`); `npm run verify` runs the full check suite and gates every change.
