# Edition playbook ("One approved issue a month")

This is the standing brief for **assembling and publishing a monthly edition**: the unit that
carries every content refresh under the broad-coverage model (owner-approved plan, 2026-07-13).
An edition is a **committed, human-approved artifact**: a `FeedEdition` file under
`src/content/editions/` whose ordered band list IS what the home page renders. Nothing about an
edition is computed at request time; the diff the owner approves is the page readers get.

**Tooling:** the edition engine lives at `src/lib/edition/` (public `engine.ts`, staged selection
and scheduling internals, constraints, inventory, provenance, semantic). `npm run gen:edition -- <YYYY-MM> <publishedAt>` writes
`src/content/editions/<id>.ts` plus the index barrel (`check:generated` guards that barrel),
and `check:edition` validates every committed edition against the content inventory and the
ordering constraints below; it also warns when items dated inside the edition's month postdate
`publishedAt` ("stale edition": regenerate, never hand-patch). The home page renders the
edition whose id matches `NOW`'s month and falls back to the permanent hand-built plan
(`resolveFallbackHome` in `src/lib/home/resolve-fallback.ts`, re-exported by the compatibility
`src/lib/home-model.ts`) when none matches.

## Cadence and gates

- **One edition per month**, id `YYYY-MM`, published through a draft PR with a Vercel preview.
  It merges only after owner approval; there is no auto-publish path.
- **Reactive updates** (major confirmed news between editions) are separately approved,
  single-item additions: a Pulse, clip or event lands in its content file and, when editions
  exist, joins the current edition's bands in a small follow-up PR.
- Every edition rides the **NOW-bump ritual** (docs/roster-playbook.md): bump
  `src/content/now.ts`, re-verify, refresh `lastVerified` on every profile the pass touched.

## Sizing and mix

- **60 to 90 items** per edition, counted over the flattened `FeedItem` view of the bands.
- Mix targets: roughly **30% Pulse**, **25% official video**, **up to 25% permitted
  photography**, **20% events, forecasts, rankings and analysis** (analysis floor: 4 pieces,
  docs/analysis-playbook.md). When permitted photography is short (it will be, early),
  substitute official video first, then Pulse. Log what was substituted in the PR description;
  a thin month stays honest instead of padded.
- **Coverage floor: every active profile appears at least once per quarter** (trailing three
  editions). The generator prioritizes profiles unseen in the prior two editions;
  `check:edition` warns at two consecutive misses and fails at three.

## Ordering constraints (generator-enforced, check-verified)

- No adjacent items centered on the same celebrity.
- No celebrity above 8% of the edition's items.
- No more than two consecutive bands of one format or pillar.
- At least four formats within every rolling 12-item window, where inventory permits.
- Deterministic: the generator's tiebreaks are seeded by the edition id, so regenerating over
  identical inventory is byte-stable and the committed order is reviewable.
- The engine seats 4 to 8 analysis articles per edition (`MIN_ARTICLES` / `MAX_ARTICLES` in
  `src/lib/edition/inventory.ts`). `ranking` and single-article `analysis` bands are the only
  size-1 band formats, and those spacers are what satisfy the four-formats window around the
  fixed event rail: removing single-article analysis bands makes `gen:edition` refuse ("no
  band order satisfies four formats in every rolling 12"). A future look that batches
  analysis into larger bands needs a new size-1 spacer format first.

## Spotlight

The month's `SpotlightSchedule` runs 24 simultaneous placements at full scale: **12 anchors**
hold the month, and **4 preapproved weekly cohorts** rotate the remaining active profiles
through the other 12 slots. Invariant (check-enforced): anchors and cohorts together cover every
active profile exactly once per month. Spotlight is a rotation guarantee, not a favorites list;
on the page it manifests as ranking weight and the existing kicker chips, never new UI.

## Assembly, step by step

1. **Inventory.** Gather the month's verified material per the standing playbooks: clips
   (roster playbook, 180-day rule, On air re-pick), forecasts (forecast playbook, 8-16 open),
   pulses (1-3 sentences, dated, sourced, house style), analysis (analysis playbook), events,
   rankings, permitted photography when it exists.
2. **Generate.** `npm run gen:edition` writes `src/content/editions/<YYYY-MM>.ts`. A refusal
   names the unsatisfiable constraint; fix inventory, never hand-edit around a violation.
3. **Verify.** `npm run verify` (the six content checks plus `check:generated`, `typecheck`,
   `lint` and `test:backend`), then `npm run build`.
4. **Preview.** Draft PR; walk the Vercel preview: home order matches the committed bands, every
   band kind renders, rails play, votes cast.
5. **Publish.** Owner approves, merges; Vercel deploys `main`.

## Home page guardrails (standing)

Carried over from the retired home-page roadmap; these apply to any change touching
`src/app/page.tsx` or the band stack.

- No infinite scroll and no "Load more": the inventory is finite and credited, and growth
  comes from the edition band stack, never auto-append.
- Server-first: `page.tsx` stays a server component. The client islands are the countdown
  chips and `LiveEmbed` (thumbnail-first, click-to-play); avoid adding client JS without a
  clear reason.
- Determinism: editorial dates and edition selection use frozen `NOW` (`src/content/now.ts`). Live
  forecast status and vote writes are the real-clock exception; keep that clock confined to the
  forecast data and action boundaries described in `docs/backend-architecture.md`.
- This is a customized Next.js: read `node_modules/next/dist/docs/` before any new
  data-fetching or routing pattern (dev quirks in `docs/engineering.md`).

## What an edition never does

- Repeat an item within itself, or fabricate inventory to hit a target.
- Re-date anything (true dates only, per the roster playbook).
- Reset live votes (stable slugs + targeted deletes, docs/forecast-playbook.md).
- Ship placeholder imagery back into listings (permitted media only,
  `check:media` and the hero rule in `check:profiles`).
