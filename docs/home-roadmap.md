# Home page roadmap

Working notes for the MyKStars home page (`src/app/page.tsx`). Goal: make the front
page a "doomscroll" surface so visitors stay and return, rather than clicking into the
top-nav categories.

## Principle

Bring time-urgent, *live* content to the front page and interleave it between the photo
bands for a varied, hard-to-stop scroll. The engine of return visits is live motion
(D-Day countdowns, vote tallies), not an endless feed.

The constraint that shapes everything: the catalog is finite and credited. The photo
library is small (about 16 galleries) and the home bands already render nearly all of
it, so "more photos" is not a lever. Schedule (about 25 events) and Forecast (about 12
predictions) carry the unsurfaced inventory and the only live elements.

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

## Next: Step 3 candidates

Pick one; they are independent. (Step 2 shipped People in focus.)

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

### Quick wins

- Split Fan Forecast into two smaller clusters (for example 3 after K-Pop, 3 after
  K-Drama) for more rhythm.
- Drop one article between two photo bands instead of all of them at the bottom.

## Guardrails

- No infinite scroll or "Load more": deliberately deferred. A finite catalog would loop
  or run dry and cheapen the brand. Revisit only when the photo library grows
  substantially.
- House style (`docs/style-guide.md`): no em or en dashes; italicize work titles with
  `*asterisks*` via `renderEmphasis()`. Run `node scripts/check-dashes.mjs <files>` on
  anything carrying new copy.
- Server-first: keep `page.tsx` a server component; the only client islands are the live
  countdown chips. Avoid adding client JS without a clear reason.
- Determinism: the site freezes "now" at `NOW` in `src/lib/seed.ts` for SSR and
  reconciles to the real clock client-side. Reuse that pattern; do not read the live
  clock during server render.
- This is a customized Next.js: read `node_modules/next/dist/docs/` before any new
  data-fetching or routing pattern.

## Verification

1. `npm run check:style` and `node scripts/check-dashes.mjs <new files>`.
2. `npm run lint` and `npx tsc --noEmit`.
3. Preview the home page: confirm the section order and the new module, check for
   console/hydration warnings, verify colors by inspecting elements (not screenshots),
   and do a mobile-width pass.
