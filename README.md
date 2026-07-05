# MyKStars

> The world's photo-first K-Culture newspaper + magazine. A fast, English-first, mobile-first destination for the freshest organized, **credited** photos of Korean celebrities — plus credible analysis.

The wedge: *"Naver's photo layer, for the world."* Organized, attributed, swipeable HD galleries filterable by artist / event / date — the thing every incumbent (Soompi, allkpop, Koreaboo, Kpopmap) leaves on the table — delivered with a sophisticated **editorial-noir** identity rather than the usual pastel clickbait.

## Stack

- **Next.js 16** (App Router, SSG/ISR) + **React 19** + **TypeScript**
- **Tailwind CSS v4** with editorial-noir design tokens (`#0e0e0e` ink · `#f0f4f5` bone · `#cc001e` crimson, 60-30-10)
- **Playfair Display** (display serif) + **Inter** (body) via `next/font`
- Image config set for **AVIF → WebP** negotiation (`next.config.ts`)

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (static-generates all routes)
npm run lint
```

## Architecture

- `src/lib/types.ts` — domain model (Artist, Gallery, MediaItem, Article, Source).
- `src/lib/data.ts` — **the CMS seam**. Every page reads through these async functions; today they're backed by `src/lib/seed.ts`. Swap in a headless CMS (Sanity/Payload) later by re-implementing this module against the same signatures — no page changes.
- `src/components/` — `GalleryViewer` (swipeable/keyboard), `PhotoCard`, `AttributionBadge`, `EmbedFacade`, `StatusFlag` (rumor-vs-confirmed), `CategoryFilter`, etc.
- `src/app/` — home, `photos/` (+ `[gallerySlug]`), `artists/[artistSlug]` (per-person hubs), `analysis/` (+ `[slug]`), `legal/dmca`, `about/editorial-standards`, `api/takedown`, `sitemap.ts`, `robots.ts`, `opengraph-image` routes.

## Defensible aggregation (content/legal model)

Aggregation is engineered to **survive**, not just to repost:

- **Embed-first** — official YouTube embeds (TikTok-ready) so video stays on the source; Instagram/X embeds were retired in July 2026 in favor of two YouTube rails.
- **Attribution as infrastructure** — every `MediaItem` *requires* a credit; we link back and never strip credit lines.
- **DMCA/takedown in v1** — `/legal/dmca` + `/api/takedown`.
- **Licensed-spine on-ramp** — wire/agency/stock feeds (Getty *imazins*, Yonhap, News1, Newsen…) drop in behind the same data layer when ad revenue justifies it.

## SEO / Discover

`max-image-preview:large` site-wide, NewsArticle/ImageGallery JSON-LD, crawlable SSG HTML, image + Google-News-ready sitemaps, and per-route Open Graph cards.

## Status

Phase 0 (design system) and most of Phase 1 (photo layer, artist hubs, news + flags, DMCA, SEO infra) are built. Media is currently rendered as branded placeholders with baked credits; real licensed/embedded media, a live CMS, faceted search, alerts and monetization are the next phases. Content in `seed.ts` is sample data (neutral captions + analysis/explainers — no unverified claims about real people).
