# Home page roadmap

Working notes for the MyKStars home page (`src/app/page.tsx`). Goal: make the front
page a "doomscroll" surface so visitors stay and return, rather than clicking into the
top-nav categories.

## Principle

Bring time-urgent, *live* content to the front page and interleave it between the photo
bands for a varied, hard-to-stop scroll. The engine of return visits is live motion
(D-Day countdowns, vote tallies), not an endless feed.

The constraint that shapes everything: the catalog is finite and credited. As of Step 3
the lever for "more visual content" is curated, official social embeds (Instagram
Reels/posts, YouTube videos), which need no rehosting and no CMS. The photo galleries
(about 30 now) plus those embeds feed the bands and two new live rails; Schedule and
Forecast still carry the time-urgent inventory.

## Shipped

### Step 1 (2026-06): Schedule and Forecast on the home page

- New `src/components/EventCard.tsx`: a horizontal D-Day countdown rail of the soonest
  shows, directly under the hero (the urgency hook).
- Fan Forecast moved up to mid-page (after the K-Pop band) and grown from 3 to 6 cards.
- Denser photo bands (K-Pop 6 to 8, K-Drama 5 to 6) and Analysis (4 to 8 articles).
- Result: the home page order is now Hero, Schedule rail, K-Pop band + ranking, Fan
  Forecast, K-Drama band + ranking, Fashion & Beauty, K-Movie, Analysis. Fully
  server-rendered; the only live islands are `DDayBadge` and `PredictionStatusBadge`.

### Step 2 (2026-06): People in focus

- New `src/components/ArtistCard.tsx`: a person card (name, optional Korean name, role,
  agency, photo-set count) extracted from the `/artists` index so the hub and the home
  page share one card. The `/artists` grid renders through it too.
- New `getArtistsInFocus()` in `src/lib/data.ts`: a pillar-spread selector that
  round-robins across the four pillars (de-duping cross-pillar names) so the set is not
  all K-Pop, with each person's credited photo-set count attached.
- A 6-card "People in focus" grid added after the K-Drama band: the first artists on the
  front page, and a fresh set of links into the per-person hubs (deeper dwell).
- Result: the home page order is now Hero, Schedule rail, K-Pop band + ranking, Fan
  Forecast, K-Drama band + ranking, People in focus, Fashion & Beauty, K-Movie,
  Analysis. Still fully server-rendered; no new client islands.

### Step 3 (2026-06): Live social rails and a deeper catalog

- New `src/components/LiveEmbed.tsx` (the first non-trivial client island): a facade-first
  embed that upgrades to a real player on view/click. YouTube is a no-cookie lite-embed
  (thumbnail to iframe on click, no autoplay-on-scroll); Instagram is the official
  blockquote + `embed.js` (loaded once via the singleton in `src/lib/embeds.ts`), hydrated
  in-view. Both degrade to the link-out facade with JS off or on error, so nothing breaks.
- New `Clip` model (`src/lib/types.ts`) + `clips` seed array: standalone short-form posts
  with no detail page, kept out of the photo archive. Accessors `getReels()` / `getShorts()`
  / `getClips()` / `getClipsByArtist()` in `src/lib/data.ts`. Every clip is a real, verified
  permalink (YouTube oEmbed-verified; Instagram official-account posts), credited and dated.
- New `src/components/ClipCard.tsx` + two horizontal rails: "On the feed" (Instagram, after
  the K-Pop band) and "In motion" (YouTube, after the K-Drama band), cloning the Schedule
  rail pattern.
- Denser bands (K-Pop 8 to 12, K-Drama 6 to 10, Fashion 3 to 8, K-Movie 2 to 6), topped up
  by `pillarFillEmbeds()` (official-account tiles) so a thin band never shows empty columns.
  New galleries were added for the sparse Fashion and K-Movie pillars.
- Result order: Hero, Schedule rail, K-Pop band + ranking, On the feed (Reels), Fan
  Forecast, K-Drama band + ranking, In motion (Shorts), People in focus, Fashion & Beauty,
  K-Movie, Analysis. Roughly 3x the home page's visual items.

### Step 4 (2026-07): Analysis interleaved and the Fan Forecast split

- Both former quick wins, shipped together. The Analysis block no longer sits in one
  lump at the bottom: each pillar chapter now carries a thin light interlude of its own
  newest articles (`AnalysisInterlude` + `planHomeArticles` in `page.tsx`, cap 3 per
  pillar). K-Pop's sits right after its ranking, K-Drama's after the In motion rail,
  Fashion & Beauty's and K-Movie's right after their bands. A pillar with no articles
  renders no band, and no article ever appears twice on the page.
- The closing Analysis band stays but slims down to the site-wide standards pieces plus
  any overflow past the interlude caps, keeping the page's single "All analysis" link.
- Fan Forecast split 3 + 3: the three soonest-closing questions stay after the K-Pop
  chapter and the next three close the K-Drama chapter, with twin "Fan Forecast"
  headers. Cards print their own pillar kickers, so a mixed second cluster reads fine.
- Result: the home page order is now Hero, Schedule rail, K-Pop band + ranking, K-Pop
  analysis, On the feed (Reels), Fan Forecast (first three), K-Drama band + ranking,
  In motion (Shorts), K-Drama analysis, Fan Forecast (next three), Fashion & Beauty
  band + analysis, K-Movie band + analysis, Analysis closer. (People in focus was
  retired separately with the People tab.) Still fully server-rendered; no new client
  islands.

## Next: Step 5 candidates

Pick one; they are independent. (Step 4 interleaved Analysis and split the Forecast.)

### A. Forecast payoff loop (completes the engagement loop)

Step 1 added the hook (open countdowns). The payoff (did my pick win?) is what pulls
people back. Surface recently resolved predictions ("Called it") next to the open ones.

- Reuse: `PredictionCard` already renders the resolved state. Add a
  `getResolvedPredictions()` helper mirroring `getOpenPredictions()` in `src/lib/data.ts`.
- Caveat: only 1 prediction is resolved today, so this needs a steady drip of resolved
  questions to have volume. It pairs with the recurring Fan Forecast refresh task
  (`docs/forecast-playbook.md`).

### B. Rankings movers (cheap, live-ish)

The ranking rows already carry rank deltas. A compact "biggest movers" strip reads as
"what changed" and updates period over period.

- Data: `getRankings()` in `src/lib/data.ts`; rows have `change` / `isNew`. Keep
  `RankingTable.tsx` for the full view; add a small movers component.

## Guardrails

- No infinite scroll or "Load more": still deliberately deferred. Step 3 grew the catalog
  with curated embeds, but the inventory is finite and would still loop or run dry; a
  paginated feed waits for a real CMS.
- House style (`docs/style-guide.md`): no em or en dashes; italicize work titles with
  `*asterisks*` via `renderEmphasis()`. Run `node scripts/check-dashes.mjs <files>` on
  anything carrying new copy.
- Server-first: keep `page.tsx` a server component. Client islands are the live countdown
  chips and now `LiveEmbed` (the social players); the latter stays cheap via facade-first,
  in-view hydration. Avoid adding client JS without a clear reason.
- Determinism: the site freezes "now" at `NOW` in `src/lib/seed.ts` for SSR and
  reconciles to the real clock client-side. Reuse that pattern; do not read the live
  clock during server render.
- This is a customized Next.js: read `node_modules/next/dist/docs/` before any new
  data-fetching or routing pattern.

## Verification

1. `npm run check:style` and `node scripts/check-dashes.mjs <new files>`.
2. `npm run check:fresh` (embed freshness and true-date gates; see docs/roster-playbook.md).
3. `npm run lint` and `npx tsc --noEmit`.
4. Preview the home page: confirm the section order and the new module, check for
   console/hydration warnings, verify colors by inspecting elements (not screenshots),
   and do a mobile-width pass.
