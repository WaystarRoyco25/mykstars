# Design conventions ("One surface, one language")

This is the standing brief for **any change a reader can see**: tiles, grids, bands, chrome,
new components. The house rule: reuse what exists, and never introduce a color, radius,
spacing or type value that is not already in the system. Brand tokens live in
`src/app/globals.css` (Tailwind v4 `@theme`).

## Brand

- **Editorial-noir, 60-30-10:** `#0e0e0e` ink (60), `#f0f4f5` bone (30), `#cc001e` crimson
  (10, the single accent). No per-category color coding; the photography carries the color.
- **Type:** Playfair Display for display, Inter for body, both via `next/font`.
- The tagline "K-stars, in focus" lives only in the metadata titles, the OG share image and
  `manifest.ts` (the site's descriptor for search and social). Never render it on-page, and
  never remove it from those three surfaces.

## Tiles and radius

- Every tile, card, cover and rail frame carries `rounded-tile` (`--radius-tile: 12px` in
  `globals.css`), plus `overflow-hidden` when it holds edge-to-edge media. Already on:
  PhotoCard, EmbedCard, ClipCard, EventCard, PredictionCard, PulseCard, ArticleListItem,
  the home hero, and the artist and pulse pages.
- Deliberately un-rounded today (a possible future pass, not an oversight): pillar-page
  covers, the `GalleryViewer` detail carousel, and the artists index grid.

## Photo grids (the mosaic ground rule)

Owner ground rule since 2026-06-29: photo grids pack as an interlocking, gap-free masonry
with no empty space at any width, and each cover's info sits in a black gradient bar at the
bottom of the picture. Cropping covers to fit is explicitly allowed.

- Implementation: `GalleryGrid.tsx` is CSS multi-column masonry (column-balanced, server
  components only, no client width measuring); `PhotoCard.tsx` is the brick, its aspect from
  `aspectClass(orientation)` in `src/lib/media.ts` (`orientationOf()` classifies from real
  dimensions), filled `object-cover`, with the gradient bar carrying the title
  (`renderEmphasis`), relative time and `via {source}`. No below-card metadata, no
  per-gallery layout config.
- `placeMixed()` (`src/content/galleries.ts`) lands a landscape frame every 3rd tile so grids
  never read as a monotone portrait feed; landscape-led gallery sets are welcome.
- A sparse grid never renders empty columns. Fill order (`pillarFillEmbeds` and friends in
  `src/lib/data/home-fill.ts`): the band's artists' own YouTube clip tiles first (click-to-play
  landscape bricks), then official-channel link-out tiles, then related same-pillar galleries.
  Never scraped, always credited; the retained Instagram and X handles never render.
- Scope: the scrolling grids only. The featured hero and the `GalleryViewer` carousel are
  intentionally different surfaces.
- On the record: a dense row/col-span CSS grid was tried first and left holes on sparse
  pages; multi-column replaced it. Accepted tradeoffs: single-width tiles, column-major
  order, minor bottom-edge unevenness.

## Company logos

- Wherever a company is named (ranking `detail` lines, agency lines on artist cards and
  headers), render the real logo as a full-color mark on a small light bone chip
  (`rounded-[6px] bg-bone`, 14px-high plain `<img>`). Registry: `src/lib/companies.ts`
  (17 companies); component: `CompanyLogo.tsx`, which returns `null` for unknown names so
  callers fall back to their existing text. `splitCompanyDetail()` splits compound details
  ("tvN · Kim Tae-ri") into company and remainder.
- Adding one (recurring task): drop the file in `public/logos/companies/` and add one
  registry line. Prefer a rectangular or horizontal lockup over a square emblem (even chip
  weight, owner preference). Source an official SVG or transparent PNG from Wikimedia
  Commons (`Special:FilePath/<Filename>`) or Logopedia's MediaWiki API (it carries horizontal
  variants Commons lacks). Sanitize SVGs (strip `<script>` and `on*` attributes); recolor
  pure-white wordmarks to near-black for the light chip. The trademark and nominative-use
  note lives on `src/app/about/editorial-standards/page.tsx`.

## The home page (a dark doomscroll)

- Home is one uninterrupted dark (`bg-ink`) band stack rendered from the monthly edition.
  There are no bone or light sections; every Analysis surface on home renders dark
  (`ArticleListItem on="dark"`). The all-dark feed is a deliberate owner call (2026-07-15)
  that reversed the earlier "Pulse renders as a bone band" policy.
- The return-visit engine is live, time-urgent modules interleaved between photo bands
  (D-Day countdowns, vote tallies), never an endless feed.
- The Pulse band is the only masonry on the page (`columns-1 sm:columns-2 md:columns-3`):
  `PulseCard` tiles mixed with the featured artists' deduped official-clip tiles
  (`getPulseBandFill()` in `src/lib/data/home-fill.ts`, capped by `PULSE_BAND_FILL_CAP` in
  `src/lib/home/resolve-edition.ts`). Pulse tiles stack their photo above the text.
- `PulseItem.tsx` still exists and serves the artist-hub timelines; it simply no longer
  appears on home. Do not delete it.
- Rejected, and stays rejected: infinite scroll and "Load more", and page-wide masonry (the
  masonry stays local to the Pulse band). Server-first: home is a server component; the
  client islands are the countdown chips and `LiveEmbed`.

## Analysis rows

- Every Analysis list row (home interludes and closer, `/analysis`, pillar pages, artist
  hubs, all through the single `ArticleListItem.tsx`) shows a `w-24 aspect-[4/5] rounded-tile`
  thumbnail left of the title when the article carries `media`. The text-only row is the
  designed fallback, not a bug (the standards and one industry piece run text-only on
  purpose).
- The photo credit rides the meta line as a linked `AttributionBadge` ("MyKStars ·
  Jul 16, 2026 · via K-POPIT"), never a pill over the small thumb.
- `sizes="240px"`, not `"96px"`: `object-cover` inside the 96x120 box must cover 120px of
  height, so a landscape source needs about 240px of served width; 96px makes `next/image`
  serve a file that upscales blurry (the comment sits in `ArticleListItem.tsx`).
