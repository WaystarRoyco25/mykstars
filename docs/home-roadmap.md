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

## Next: Step 2 candidates

Pick one; they are independent.

### A. People in focus (highest new surface)

Artists are the one content type absent from the home page. A People rail or section
linking to `/artists/{slug}` adds a new content type and more internal links (deeper
dwell).

- Data: `getArtists()` / `getArtistsByPillar()` in `src/lib/data.ts` (13 artists: name,
  agency, bio, official socials).
- Reuse: check `src/app/artists/page.tsx` for an existing card; otherwise build a
  compact card modeled on `EventCard`.
- Decide: rail vs grid; ordering (alphabetical, by pillar, or "currently active" tied to
  upcoming events); placement in the page order.

### B. Forecast payoff loop (completes the engagement loop)

Step 1 added the hook (open countdowns). The payoff (did my pick win?) is what pulls
people back. Surface recently resolved predictions ("Called it") next to the open ones.

- Reuse: `PredictionCard` already renders the resolved state. Add a
  `getResolvedPredictions()` helper mirroring `getOpenPredictions()` in `src/lib/data.ts`.
- Caveat: only 1 prediction is resolved today, so this needs a steady drip of resolved
  questions to have volume. It pairs with the recurring Fan Forecast refresh task
  (`docs/forecast-playbook.md`).

### C. Rankings movers (cheap, live-ish)

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
