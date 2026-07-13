# Edition playbook ("One approved issue a month")

This is the standing brief for **assembling and publishing a monthly edition**: the unit that
carries every content refresh under the broad-coverage model (owner-approved plan, 2026-07-13).
An edition is a **committed, human-approved artifact**: a `FeedEdition` file under
`src/content/editions/` whose ordered band list IS what the home page renders. Nothing about an
edition is computed at request time; the diff the owner approves is the page readers get.

**Tooling status:** the edition engine (`src/lib/edition/`), the generator
(`npm run gen:edition`), per-month `src/content/editions/*.ts` and `check:edition` land in wave
1b. Until the first edition file exists, the home page renders its standing hand-built plan
(the permanent fallback either way).

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
3. **Verify.** The full check suite (`check:style`, `check:articles`, `check:fresh`,
   `check:profiles`, `check:edition`, `check:media`), `npx tsc --noEmit`, `npm run lint`,
   `npm run build`.
4. **Preview.** Draft PR; walk the Vercel preview: home order matches the committed bands, every
   band kind renders, rails play, votes cast.
5. **Publish.** Owner approves, merges; Vercel deploys `main`.

## What an edition never does

- Repeat an item within itself, or fabricate inventory to hit a target.
- Re-date anything (true dates only, per the roster playbook).
- Reset live votes (stable slugs + targeted deletes, docs/forecast-playbook.md).
- Ship placeholder imagery back into listings (permitted media only,
  `check:media` and the hero rule in `check:profiles`).
