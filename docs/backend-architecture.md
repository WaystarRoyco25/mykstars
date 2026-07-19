# Backend architecture

## Scope

This is the routing guide for server data, domain contracts, policy, home assembly, edition
generation, checks, and mutations. Product behavior and editorial rules remain canonical in the
feature playbooks. Start here to open the smallest relevant files instead of tracing a broad
barrel.

## Dependency flow

```text
src/content/<feature>
  -> src/lib/stores/<feature>
  -> src/lib/data/<feature>
  -> server route or src/lib/home/*

src/lib/domain/* -> src/lib/policy/* -> data, checks, edition stages, use cases

Server Action -> injected use case -> persistence port -> Supabase or console adapter
scripts/edition-content.ts -> edition engine stages -> generated monthly artifact
```

Dependencies point from delivery toward contracts and from authored content toward read models.
One feature store imports one authored inventory. Cross-feature assembly belongs in
`stores/profile-timeline.ts`, `data/page-data.ts`, `home/*`, or the edition engine, not in a leaf
store.

## Route a change

Unless a path is prefixed, implementation paths below are under `src/lib/` and test files are
under `tests/backend/`.

| Feature | Preferred implementation files | Contract, persistence, or assembly | Characterization and gates |
|---|---|---|---|
| Artist directory and profiles | `data/artists.ts`, `data/page-data.ts` | `domain/artists.ts`, `policy/artists.ts`, `stores/artists.ts`, `stores/profile-timeline.ts` | `data-catalog.test.ts`, `content-repository.test.ts`, `check:profiles` |
| Galleries and media fill | `data/galleries.ts`, `data/home-fill.ts`, `data/page-data.ts` | `domain/media.ts`, `domain/stories.ts`, `policy/galleries.ts`, `policy/media-rights.ts`, `stores/galleries.ts` | `data-catalog.test.ts`, `media.test.ts`, `editorial-policy.test.ts`, `check:media`, `check:fresh` |
| Articles, Pulse, rankings | `data/articles.ts`, `data/pulses.ts`, `data/rankings.ts` | matching stores, `domain/stories.ts`, article and media checks | `data-catalog.test.ts`, `checks.test.ts`, `check:articles`, `check:media` |
| Clips and schedule | `data/clips.ts`, `data/events.ts` | `stores/clips.ts`, `stores/events.ts`, `policy/clips.ts`, `domain/events.ts` | `data-catalog.test.ts`, `editorial-policy.test.ts`, `check:fresh` |
| Forecast reads and tallies | `data/forecasts.ts`, `forecast/tally.ts` | `domain/forecasts.ts`, `policy/forecasts.ts`, `stores/forecasts.ts`, vote repository | `forecast-tally.test.ts`, `vote-repository.test.ts`, `supabase-vote-source.test.ts` |
| Vote mutation | `app/predictions/actions.ts`, `forecast/cast-vote.ts` | `vote-repository-core.ts`, `vote-repository.ts`, `supabase-vote-source.ts`, `voter-cookie.ts` | `forecast-action.test.ts`, vote and cookie tests |
| Home assembly | `home/resolve-edition.ts`, `home/resolve-fallback.ts` | `home/contract.ts`, exact data modules and stores | `home-model.test.ts` hashes, `store-boundaries.test.ts` |
| Monthly editions | public `edition/engine.ts`; change only the named solver stage | `inventory.ts`, `constraints.ts`, `semantic.ts`, `provenance.ts`, `artifact.ts`; `scripts/edition-content.ts` | `edition.test.ts`, `edition-artifact.test.ts`, `check:edition`, `check:generated` |
| Takedown mutation | `app/legal/dmca/actions.ts`, `takedown/request.ts`, `takedown/service.ts` | `takedown/console-sink.ts` implements the current sink | `takedown-action.test.ts` |
| Content validators | pure modules under `lib/checks/`; CLI wiring under `scripts/check-*.ts` | feature domain and policy modules | `checks.test.ts`, `source-check.test.ts`, the named `check:*` command |

The edition solver stages are `deterministic.ts`, `candidate-selection.ts`,
`chunk-construction.ts`, `chunk-scheduling.ts`, and `band-assignment.ts`. Shared private shapes live
in `engine-internal.ts`. Keep `engine.ts` as the public orchestration entry.

## Compatibility façades

Existing imports remain valid, but backend work should use the exact owner.

| Compatibility surface | Preferred exact import |
|---|---|
| `lib/types.ts` | `lib/domain/artists`, `editions`, `events`, `forecasts`, `media`, `stories`, or `taxonomy` |
| `lib/editorial-policy.ts` | the matching module under `lib/policy/` |
| `lib/data.ts` | `lib/data/<feature>` |
| `lib/data/catalog.ts` | the matching catalog feature module; page DTOs use `data/page-data` |
| `lib/home-model.ts` | `home/contract`, `home/resolve-edition`, or `home/resolve-fallback` |
| `lib/content-repository.ts` | one or more exact stores; timeline assembly uses `stores/profile-timeline` |
| `lib/content.ts` | `lib/site-clock` for `NOW`, or an exact store/data module for content |

`content-repository.ts` remains an eager integration and test façade. Production modules must not
import it; `store-boundaries.test.ts` scans `src/` recursively to enforce this. App and component
code may keep `types.ts`, but server reads should import an exact data module.

## Clocks

MyKStars has two intentional clocks:

- The frozen editorial clock is `NOW` in `src/content/now.ts`, imported by application code from
  `lib/site-clock.ts`. It controls published content dates, relative-time SSR, schedule cutoffs,
  current edition selection, freshness, and content validation. Do not replace it with
  `new Date()` in those paths.
- The real operation clock controls live forecast lifecycle and vote integrity.
  `data/forecasts.ts` derives current forecast status and ordering from the wall clock, and the
  vote Server Action injects `nowIso()` into `executeCastVote`. The existing rule is close-only:
  `closesAt` closes an otherwise open question, while `opensAt` is not a vote-write gate. Preserve
  that behavior unless the product contract changes.

Do not silently unify the clocks in either direction.

## Public data and mutation contracts

- `data/<feature>` is the async CMS/read seam. Preserve function signatures, ordering, filtering,
  `undefined` for missing singular records, route DTO shapes, and request-scoped `React.cache`
  wrappers. The broad data façades are compatibility exports, not new dependency hubs.
- `castVote(slug, optionId): Promise<VoteResult>` is the only public vote mutation.
  `executeCastVote` owns validation order and messages. The production adapter checks the
  repository before creating the voter cookie, writes the exact prediction/option/voter payload,
  and revalidates the detail route, `/predictions`, then `/` only after success. Published
  prediction slugs and reader votes are permanent data; retire with targeted deletes only.
- `submitTakedown(FormData): Promise<TakedownResult>` is the only public takedown mutation. Its
  stable form keys are `name`, `email`, `rightsHolder`, `url`, `details`, and `goodFaith`.
  Parsing trims and validates before the sink runs; the current console sink logs only
  `rightsHolder` and `url` under `[takedown] received`.
- `buildEdition(input, editionId)` is the public solver entry. Generated edition files are review
  artifacts: regenerate them through `npm run gen:edition`, never hand-edit them.

## Minimal verification

| Change | Minimum fast checks |
|---|---|
| Data, store, or home | `npm run typecheck`, focused ESLint, `npm run test:backend` |
| Forecast or takedown mutation | `npm run typecheck`, focused ESLint, `npm run test:backend` |
| Edition engine or artifact | `npm run check:edition`, `npm run check:generated`, `npm run test:backend` |
| Content or validator | the named `check:*` commands, then `npm run test:backend` |
| Documentation only | `git diff --check` |
| Final code handoff | `npm run verify` |

Run `npm run build` as well when a Next.js route, rendering boundary, or build behavior changed.
