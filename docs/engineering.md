# Engineering notes ("The repo's sharp edges")

Standing dev-environment and tooling facts for any agent working in this repo. Editorial
policy lives in the playbooks; this file is the machinery around them.

## Dev server and Turbopack's stale cache

- Start the dev server through `.claude/launch.json` (`mykstars-dev`: `npm run dev`,
  port 3000).
- Turbopack's persistent cache in `.next` survives reloads AND restarts, and can serve stale
  compiled artifacts: an edited `globals.css` can keep serving the old stylesheet, and stale
  module exports can throw dev-only errors like `Export articles doesn't exist in target
  module` from a cached intermediate graph while `npm run build`, `tsc` and every check pass.
- Fix: stop the server, `rm -rf .next`, restart, reload. Trust the prod build over a dev-only
  error; for CSS, confirm the served rule actually changed before debugging the CSS itself.

## Next.js 16 facts (this repo)

This is a customized Next.js: read the relevant guide in `node_modules/next/dist/docs/`
before any new routing or data-fetching pattern. Verified project facts:

- The project runs the *Previous* caching model: `cacheComponents` is off, and `[pillar]`
  uses `dynamicParams = false`.
- `revalidateTag` needs the two-argument form: `revalidateTag(tag, "max")`.
- `connection()` replaces `unstable_noStore`.
- Middleware is `proxy.ts`, not `middleware.ts`.

## Checks and verification

`npm run verify` is the one-stop gate: it chains the seven content checks (the `prebuild`
suite), then `check:generated`, `typecheck`, `lint` and `test:backend`. `npm run build` runs
`prebuild` automatically. The inventory:

| Command | Guards |
|---|---|
| `check:style` | house style in `src/content/*.ts` strings: em/en dashes, negation-reveals, AI-tell phrases, announced moves (AST-based; comments exempt) |
| `check:articles` | bylines, article dates vs `NOW`, question-mark titles, `related` slugs, duplicate slugs, cross-article phrase repetition |
| `check:fresh` | the 180-day clip rule and true/non-future embed dates vs `NOW`; warns when `NOW` drifts more than 14 days from the wall clock |
| `check:profiles` | profile fields, verification cadence, `memberOf`/`members` reciprocity, the permitted-hero rule, pre-debut guardrails |
| `check:edition` | committed editions vs the content inventory and ordering constraints; warns when items dated in the edition's month postdate `publishedAt` ("stale edition": regenerate) |
| `check:media` | the `MediaAsset` rights registry vs every authored image reference (profiles, pulses, articles, galleries) |
| `check:home-dupes` | no photo or YouTube video renders twice on the home page at once (resolves the current edition, or the fallback plan; photos keyed by registry checksum, videos by YouTube id) |
| `check:generated` | drift in generated barrel/index files (e.g. the editions index that `gen:edition` writes) |

- `check:fresh` reads `yt()`/`tv()` calls positionally: a new clip factory needs a matching
  entry in the script's `FACTORIES` map and its `callRe` regex.
- `check:home-dupes` is the one check that resolves the live home page, so it imports the
  `"server-only"` resolvers and runs under the `--conditions=react-server` prefix (same as
  `test:backend`); it stubs vote tallies to zero, so it needs no Supabase. The identity logic
  is a pure function (`src/lib/checks/home-duplicates.ts`) the script feeds resolved bands into.
- `tests/backend/media.test.ts` carries two pins: `mediaAssetIndex.size` (the registry row
  count) and `GOLDEN_IMAGE_COUNT` / `GOLDEN_IMAGE_HASH` (a count and sha256 over the resolved
  artist-hero and Pulse image references, not the registry). Bump the size when the registry
  changes; recompute the golden pair whenever a hero or Pulse image reference changes.
- There is no component or frontend test runner; `test:backend` runs Node's built-in
  `node:test` over `tests/backend/*.test.ts`.

## Media pipeline (Supabase re-host)

Licensing policy, the byte-identical re-host ritual and the Commons traps are canonical in
`docs/roster-playbook.md` rule 7; do not fork them here. Tooling facts on top:

- Upload path: Supabase Storage REST (`POST /storage/v1/object/media/...`, `x-upsert: true`)
  with the service-role key from `.env.local`; bucket layout
  `profiles/{slug}/{yyyy}/{assetId}.{ext}` or `galleries/{gallerySlug}/{assetId}.{ext}`; the
  public base URL constant lives in `src/lib/media-assets.ts`. Verify an upload by
  re-downloading and comparing the sha256. A replacement image needs a NEW `assetId`: URLs are
  content-addressed and CDN-cached for about 31 days.
- `node scripts/naver-leads.mjs [slug...] [--days N] [--limit N]` ranks the photo hunt: latest
  NAVER news per artist (hangul + English queries unioned), photo-op/agency-provided flags, a
  priority ranking. Discovery only; NAVER results never publish here. Keys in `.env.local`:
  `NAVER_API_KEY_ID`, `NAVER_API_KEY` (NAVER Cloud Platform API Hub credentials; the search
  host is `naverapihub.apigw.ntruss.com`).
- `node scripts/rehost-media.mjs --commons "<File: page>" --asset-id <id> --storage-path <p>`
  runs the byte-identical ritual end to end: license gate (same exact-shape allowlist as
  find-photos), download with 429 handling, sha256, dimension probe from the bytes, refusal to
  overwrite a different object at the target path, upload, read-back compare, then prints the
  ready-to-paste `MediaAsset` literal (no `sourceUrl`, dates prefilled). For owner-approved
  press material use `--url` with `--rights-basis agency-press-kit --credit-name --credit-url`.
  Confirming the subject and license on the source page stays a prior human step.
- Non-roster subjects (the Sunmi / Kang Full / Joko Anwar precedent, 2026-07-18, for
  Analysis thumbnails): `find-photos.mjs` refuses non-roster slugs, so use a scratchpad
  variant of the same API and license logic; `storagePathMatches` only pattern-checks
  `profiles/{slug}/...`, so non-roster people re-host fine and the registry can hold
  subjects with no profile. The 700px width floor is informal: a 478px-wide Joko Anwar
  asset shipped owner-approved for thumb-only use (unusable as a hero).
- Attaching `media` to a Pulse the committed edition already references needs no engine run
  and no edition regen: `check:edition` verifies that the inventory-hash header is present;
  it never recomputes it.

## Commons and Wikimedia API gotchas

- `node scripts/find-photos.mjs` runs the bilingual (English + hangul) search: no arguments
  sweeps active artists with no asset yet, slugs target specific people, `--all` re-checks
  covered ones, `--min-width` defaults to 700.
- `upload.wikimedia.org` throttles bursts with HTTP 429 and `Retry-After: 600`; honor it. A
  short backoff just keeps the window open (the query API itself stays fine).
- System Python's `urllib` fails on SSL certificates in this environment; use `curl` or
  Node `fetch`.
- Flat `categorymembers` returns almost nothing (K-pop files live in year subcategories);
  use `generator=search`. But relevance ranking can bury an existing `Category:{Person}`
  under famous-namesake noise (Joko Anwar vs Joko Widodo), so probe `list=categorymembers`
  on the person's category before concluding nothing exists.
- Allowlist licenses by exact shape, never a prefix test: `"CC BY-NC-ND 4.0"` starts with
  `"CC BY"`.
- zsh trap: a loop variable named `path` clobbers `$PATH`; name it `p`.

## Data stores and secrets

- Supabase carries the `votes` table + `prediction_tallies` view (required security settings
  are in `docs/forecast-playbook.md`) and the public `media` storage bucket.
- Voting is anonymous and cookie-based: one pick per question, soft-deduped by an httpOnly
  `myk_voter` cookie. Accounts, reputation and leaderboards are deliberately deferred.
- The Supabase service-role key lives in the gitignored `.env.local` (mirrored in the Vercel
  env). Never print it and never commit it; key names are the only thing that belongs in
  docs.
