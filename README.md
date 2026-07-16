# MyKStars

> Broad, credited coverage of Korean celebrities across K-Pop, K-Drama, K-Movie and Fashion: official video, schedules, fan forecasts and credible analysis, published as one human-approved monthly edition. Fast, English-first, mobile-first.

The wedge: organized, attributed coverage of the stars that matter (the thing every incumbent, Soompi, allkpop, Koreaboo, Kpopmap, leaves on the table) delivered with a sophisticated **editorial-noir** identity rather than the usual pastel clickbait. Photography returns as permitted imagery lands (see Status); the credit-and-link discipline covers every media kind either way.

## Stack

- **Next.js 16** (App Router, SSG/ISR) + **React 19** + **TypeScript**
- **Tailwind CSS v4** with editorial-noir design tokens (`#0e0e0e` ink · `#f0f4f5` bone · `#cc001e` crimson, 60-30-10)
- **Playfair Display** (display serif) + **Inter** (body) via `next/font`
- Image config set for **AVIF → WebP** negotiation (`next.config.ts`)

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (static-generates all routes; prebuild runs every check)
npm run lint
npm run check:style && npm run check:articles && npm run check:fresh && npm run check:profiles
```

## Architecture

- `src/lib/types.ts` — domain model (Artist/StarProfile with careerStage, coverageLevel and publicationState; Gallery, MediaItem, Article, Source; the wave-1b content types Pulse, MediaAsset, FeedEdition).
- `src/content/` — typed, versioned content files (profiles, galleries, articles, rankings, events, predictions, clips, the site clock `now.ts`), aggregated by `src/lib/content.ts`. The hand-rolled check scripts under `scripts/` lex these files directly.
- `src/lib/data.ts` — **the CMS seam**. Every page reads through these async functions, backed by `src/lib/content.ts`. Swap in a headless CMS later by re-implementing this module against the same signatures, with no page changes.
- `src/components/` — `GalleryViewer` (swipeable/keyboard), `PhotoCard`, `AttributionBadge`, `EmbedFacade`, `StatusFlag` (rumor-vs-confirmed), `StarsFilters`, etc.
- `src/app/` — home, `artists/` (the Stars directory + `[artistSlug]` per-person hubs), `photos/` (+ `[gallerySlug]`), `analysis/` (+ `[slug]`), `predictions/`, `schedule/`, `legal/dmca`, `about/editorial-standards`, `api/takedown`, `sitemap.ts`, `robots.ts`, `opengraph-image` routes.

## Defensible aggregation (content/legal model)

Aggregation is engineered to **survive**, not just to repost:

- **Embed-first for video, licensed for photos** — official YouTube embeds (TikTok-ready) so video stays on the source, split across two rails; Instagram/X embeds were retired in July 2026. Photography is openly licensed (Wikimedia Commons CC-BY/CC-BY-SA/public domain) or an agency press kit, re-hosted once with a rights record.
- **Attribution as infrastructure** — every `MediaItem` *requires* a credit; we link back and never strip credit lines.
- **DMCA/takedown in v1** — `/legal/dmca` + `/api/takedown`.
- **Licensed-spine on-ramp** — wire/agency/stock feeds (Getty *imazins*, Yonhap, News1, Newsen…) drop in behind the same data layer when ad revenue justifies it.

## SEO / Discover

`max-image-preview:large` site-wide, NewsArticle/ImageGallery JSON-LD, crawlable SSG HTML, image + Google-News-ready sitemaps, and per-route Open Graph cards.

## Status

Wave 1a of the broad-coverage expansion is built: the content split (`src/content/`), the profile coverage model (careerStage / coverageLevel / publicationState / lastVerified, guarded by `check:profiles`), the Stars directory at `/artists`, expanded profile hubs with unified timelines, and the placeholder retirement. The 43 placeholder galleries are archived: their URLs stay live with a noindex archival notice while every listing runs video-led on official YouTube clips. Wave 1b brings permitted media (Supabase Storage + `MediaAsset` rights records), Pulse items with permanent URLs, the monthly edition engine (`docs/edition-playbook.md`), and roster growth to 40 profiles. Editorial rules live in `docs/`; every content edit runs the check suite (`npm run check:style|articles|fresh|profiles`).
