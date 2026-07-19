# Roster & freshness playbook ("Who we cover, and how current it reads")

This is the standing brief for **any session that touches the roster** (the `artists` array in
[`src/content/profiles.ts`](../src/content/profiles.ts)) **or any dated/embedded content** (clips,
gallery embeds, events, rankings, forecast premises). The profile schema lives in
[`src/lib/domain/artists.ts`](../src/lib/domain/artists.ts); the coverage predicates live in
[`src/lib/policy/artists.ts`](../src/lib/policy/artists.ts) (`isPromotedArtist`). Read this before
adding, benching, or promoting anyone, and before touching the `clips` array.

Every profile carries four standing fields: `careerStage` (`preview | rookie | rising |
established | icon`), `coverageLevel` (`active | catalog`), `publicationState` (`draft |
published | archived`) and `lastVerified` (the ISO date of its last full verification pass).
`npm run check:profiles` enforces the mechanics: valid values, verification cadence (active 60
days, preview 120, catalog 190), reciprocal `memberOf`/`members` links, the permitted-hero rule
for new profiles, and the pre-debut guardrails.

**Cadence:** every content refresh (roughly monthly, same ritual as
[`docs/forecast-playbook.md`](forecast-playbook.md)), and reactively when big news breaks.

## The goal

MyKStars sells one thing: the feeling that the site is *live*. A roster missing the biggest acts of
the moment, or a feed surfacing a nine-month-old post as if it were today's, kills that feeling
faster than any design flaw. Two disciplines protect it: cover the people who are verifiably
iconic **right now**, and never let an embed's date be stale or, worse, a lie.

## Admitting a new profile

Roster growth is gated on human approval, in this order:

1. **Candidate dossier.** Before writing a profile, assemble a sourced dossier: who they are,
   pillar and discipline, agency, debut, the dated public evidence of current activity, proposed
   `careerStage`, and the hero plan (which permitted rights basis: openly licensed photography,
   an agency press kit, or the official-embed fallback). Dossiers go to the owner for admission
   approval; nothing is written into the content files before that approval.
2. **Draft first.** An approved profile enters `src/content/profiles.ts` as
   `publicationState: "draft"` (no route, no listing). Drafts carry everything a published
   profile does, verified per rule 2 below.
3. **Publish with a hero.** A new profile flips to `"published"` only with a permitted hero in
   place; `check:profiles` enforces this for every published profile (the last of the original
   2026-07 roster gained heroes on 2026-07-18, retiring the legacy allowlist). Pre-debut
   candidates additionally follow the guardrail below.

## The pre-debut guardrail (preview profiles)

`careerStage: "preview"` is allowed only for **agency-announced lineups with a dated official
source**, capped at 10 public preview profiles, re-verified every 120 days. Coverage is
**activity-only**: official clips and Pulse items. A preview profile never appears
as a Fan Forecast subject and never carries a ranking-row link — both are check-enforced. Treat
pre-debut people, who are often minors, with the forecast playbook's sensitivity rule doubled:
professional facts from official announcements only.

## The roster rules

1. **The iconicity bar.** A featured artist needs *verified major activity within the last 12
   months* (a release, a tour, a leading role, a major campaign or award moment) **or** verified
   standing cultural weight (a legacy act or director whose name still moves coverage). Judge each
   person by their own pillar: a fashion figure's Met Gala is activity; a director's festival
   premiere is activity. **Military service is not cold** while releases, agency-confirmed plans,
   or filmed content keep landing (see Cha Eun-woo, enlisted with a May 2026 Netflix release).
2. **Verify before you write, every artist, every surface.** Web-search each artist's current
   status before writing anything about them: records, bios, gallery anchors, clip captions,
   ranking rows, events, forecast premises. Model training data is always stale here and this
   repo's own history proves the failure mode (a "comeback showcase" that never happened; clip
   dates shifted forward a year). If a claim cannot be verified with a dated public source, do not
   publish it. Generic, clearly-illustrative placeholder sets are fine; specific false claims are not.
3. **Pillar balance and the pillar floor.** Additions should keep all four pillars staffed.
   A bench move must never leave a pillar with fewer than 2 featured people; if it would, the
   artist stays featured until a replacement lands in the same refresh.
4. **Rookie graduation.** A new act earns a roster slot on any of: a major Rookie of the Year
   award (Golden Disc, MAMA, Seoul Music Awards), a brand-reputation top-10 placement, or
   first-week sales at rookie-record scale (2025-26 reference points: 200k+ first-day marks a
   serious debut; CORTIS scaled 436k to 2.31M first-week by EP 2, Hearts2Hearts 231k first-day to
   592k first-week). Sustained scaling beats a single spike.
5. **Catalog and reactivate on every refresh, never delete.**
   - Catalog (the old "bench"): set `coverageLevel: "catalog"` when rule 1 fails. Their
     `/artists/[slug]` hub, galleries, analysis links and sitemap entries stay live; they drop
     off the home hero/bands/rails, pillar People strips, ranking links, the Fan Forecast, the
     Stars directory's active view, and clip fill (see `isPromotedArtist()` in
     `src/lib/policy/artists.ts`).
   - Reactivate: set `coverageLevel: "active"` the moment rule 1 passes again. Catalog profiles
     are re-verified at least every six months (`lastVerified`; check-enforced at 190 days).
   - Every flip carries a one-line dated justification comment in `profiles.ts` citing the
     source, and refreshes `lastVerified`. No silent flips.
   - Retire a catalog artist's open forecast questions in the same refresh (the
     `getOpenPredictions` filter is only a safety net).
6. **The embed rules.** (Video embeds are YouTube since July 2026, TikTok reserved. Instagram
   was briefly reinstated that month as click-to-reveal photo embeds and retired again on
   2026-07-16: photography now comes from the permitted `MediaAsset` registry instead, so no
   third-party photo embed exists. Instagram and X are both retired, their handles kept on
   `Artist.social` as verification records that never render; the account link-out tiles
   (`artistEmbeds`) cover only YouTube/TikTok.)
   - **180-day rule:** every clip must be at most 180 days old vs `NOW`. Gallery- and
     Pulse-embedded media is archival: a real official permalink and TRUE upload date are
     required, but it is not age-gated by the 180-day rule.
   - **True-date integrity:** a clip's `date` is the video's real upload date, verified at
     authoring time. Never edit a date to make an old post look current; find a genuinely new
     post or ship fewer clips. Fewer verified embeds always beat more plausible ones.
   - **Official channels only.** A music clip (`yt()`, the In motion rail) comes from the
     artist's or label's verified channel. A variety clip (`tv()`, the On air rail) comes from
     the program's, broadcaster's or publisher's official channel (the show's own channel, a
     network's entertainment/clip channel, a magazine's interview channel), and the roster
     artist must actually appear in the video. Never fan accounts, never reuploads, never
     scraping. Two look-alike traps caught in July 2026: a "BLACKHOLE" MV reupload and
     fan-account tour posts styled as official.
   - **The On air rail re-picks on every refresh.** Per featured artist, find the most
     sensational current comedy / variety / talk-show appearance on YouTube, Korean or
     international, whichever is hotter right now. One clip per artist where a qualifying fresh
     appearance exists; skip artists with none, and replace rather than re-date what aged out.
   - `evergreenUntil` is a dated, reviewable exemption for a canonical era anchor (e.g. a tour's
     title track through the finale). Set a real, near expiry; never use it to keep stale
     content, and avoid it on the On air rail entirely (that rail is a currency surface).
   - Gallery-embedded media (`kind: "embed"`) is archival and not age-gated, but must carry its
     true `date`, and that date can never sit in the site's future.
7. **Sourcing permitted photography.** Photos come from Wikimedia Commons, re-hosted once to the
   Supabase media bucket with a `MediaAsset` rights record. Run `node scripts/find-photos.mjs`
   (no arguments sweeps every active artist with no asset yet; pass slugs to target; `--all`
   re-checks the covered ones).
   - **Rank the hunt first.** `node scripts/naver-leads.mjs` (same slug arguments) pulls each
     artist's latest NAVER news items, flags photo-op and agency-provided coverage, and prints a
     priority ranking, so the sourcing pass starts where the heat is and knows which events to
     search on Commons. NAVER is discovery only: the photos its results carry are the outlets'
     copyrighted work and never publish here, and nothing it returns is written into content
     files. Keys live in `.env.local` (`NAVER_API_KEY_ID` / `NAVER_API_KEY`).
   - **Search both names.** The finder queries the English `name` and the hangul `koreanName`
     and unions the results, because Korean outlets (티비텐 TV10, Ten Asia, K-POPIT) publish to
     YouTube under CC BY and those frames reach Commons under Korean-titled filenames. Measured
     2026-07-16: RIIZE 10 usable files under English, 49 with Korean added; NMIXX 41 to 70. The
     deeper reason is romanization drift, Commons files Roh Yoon-seo under "Noh", so only
     `intitle:노윤서` finds her. Every artist therefore carries a `koreanName`.
   - **Permitted bases only:** `cc-by`, `cc-by-sa`, `public-domain`, `agency-press-kit`. NC is
     refused as non-commercial. ND is refused too, despite allowing commercial reuse: Commons
     will not host it, and `PhotoMedia` crops every photo `object-cover` into a fixed aspect box,
     which is a CC adaptation. (The `next/image` re-encode alone would be fine, CC 4.0 §2(a)(4)
     exempts technical and format changes.)
   - **In practice the working source is Commons CC/PD.** Genuine idol agency press kits are
     effectively unavailable, and paid stock (Getty/AP) is banned by the no-paid-photography
     policy. Never relabel an image from an agency site or Instagram as `agency-press-kit`.
   - **Before concluding an artist has no usable photo, run the bilingual finder.** The one
     Instagram-embed retry (2026-07-16) happened because a "no licensed photo yet" note was
     simply stale; the finder turned up dozens of permitted candidates the same day.
   - **The finder prints leads, never clearances.** Commons full-text matches any page mentioning
     a name, so a human confirms each pick on its Commons page and by looking at the image.
     Known traps, all hit in the 2026-07-16 pass: namesakes (the actor Lee Min-ho vs Stray Kids'
     Lee Know; the actor Kim Seon-ho vs the Defense Minister and a footballer), fan photographs
     of photocards or album art whose uploader's CC tag cannot clear the agency's underlying
     copyright, AI-upscaled screengrabs (check the wikitext for `{{AI upscaled}}`), files under
     an open deletion request for license laundering, and single-member crops standing in for a
     group. Prefer files with a passed `{{LicenseReview}}`.
   - **Re-host verbatim.** Download the original, sha256 it, upload those exact bytes, and read
     back to confirm the stored object matches. `sourceUrl` and `credit.url` are the Commons
     **File:** page (the licence trail), never `upload.wikimedia.org`. Give a replacement image a
     new `assetId`: URLs are content-addressed and cached for ~31 days.
   - Commons throttles bursts with HTTP 429 on `upload.wikimedia.org`. Pace the downloads; a
     throttle is not a missing file.
8. **Verification methods that work here** (no logins, no paid APIs):
   - YouTube: `https://www.youtube.com/oembed?url=<watch-url>&format=json` proves existence and
     the exact channel name. Reject anything not on the named official channel.
   - The true upload date comes from the watch page's own metadata (`datePublished` /
     `uploadDate`) or a dated press article that corroborates it; never from a search snippet
     alone (see Red flags).
9. **Run the checks before calling a refresh done** (see Check commands below).

## Roster reference

[`src/content/profiles.ts`](../src/content/profiles.ts) is the single source of truth; this
playbook stopped mirroring it after the mirrored table went stale within two weeks. As of
2026-07-18 it holds 40 published profiles, all `coverageLevel: "active"`, spanning all four
pillars. When moving someone to catalog, the flip comment in `profiles.ts` (rule 5) carries
the catalog-since date, the last verified major activity, the reason, and the reactivation
trigger to watch.

## Red flags: reframe, hold, or verify twice

- **An artist in an active lawsuit, contract dispute, or unresolved member departure** (the
  NewJeans/ADOR situation) gets confirmed-facts-only treatment: state what a court or agency has
  said on the record, label the rest unverified, and keep forecast framing on solidarity rather
  than hype. Never build coverage on an outcome that has not happened.
- **A date that arrives from a search snippet without a primary source.** July 2026 examples:
  "SEVENTEEN at KSPO Dome in July" was search contamination from Stray Kids' RUN IT run; a
  "2026-07-15 Cha Eun-woo fan meeting" was his 2025 farewell, exactly one year off. When two
  sources disagree on a date, keep digging or leave it out.
- **A post that looks official but isn't.** Check the account, not the caption.
- **Relative-time copy** ("this week", "just dropped") anywhere in seed strings: it goes stale
  silently. Anchor copy to dates or events instead.

## Mechanics: the NOW-bump ritual

1. Set `NOW` (`src/content/now.ts`) to the refresh date, KST evening (`T20:00:00+09:00`).
2. Bump every `Prediction.asOf` and `Ranking.asOf`; re-verify ranking rows against the current
   month's real charts (names and order real; figures stay `sample: true` until a live feed exists).
3. Re-run every open forecast question through `docs/forecast-playbook.md`: resolve, reframe, or
   retire anything stale, and keep the portfolio target of 8 to 16 strong open questions.
   Refresh `lastVerified` on every profile the pass re-verified.
4. Re-check every `StarEvent`: anything now past drops off `/schedule` automatically (multi-night
   runs live until `endDate`), but verify nothing upcoming silently changed dates or venues.
5. Audit clips against the 180-day rule (the check below does this), replace what expired, and
   re-pick the On air rail per rule 6 (the most sensational current variety/talk appearance per
   featured artist).
6. Run the check commands, then a preview pass (home order, both video rails render and play,
   artist hubs).

## Check commands (run after every content edit)

- `npm run check:style` (house style: no em/en dashes, negation-reveal constructions, or AI-tell
  phrases in content strings; docs/style-guide.md)
- `npm run check:articles` (analysis bylines, article dates vs `NOW`, related slugs;
  docs/analysis-playbook.md)
- `npm run check:fresh` (this playbook's 180-day + true-date gates; scripts/check-freshness.ts)
- `npm run check:profiles` (this playbook's profile fields, verification cadence, relationships,
  hero requirement and pre-debut guardrails; scripts/check-profiles.ts)
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build` before shipping a roster change (catches dangling slugs that nothing else does)

## Retiring prediction slugs (votes are user data)

Live reader votes are never mass-reset. A published prediction slug is permanent: a "rename" is
a retirement plus a new slug, and a resolved slug is never reused. When a refresh retires or
replaces questions, delete only those rows in the Supabase SQL editor:
`delete from votes where prediction_slug in ('<retired-slug>', ...);` (see
forecast-playbook.md). Replaced slugs orphan their vote rows; never leave them counting toward
a different question, and never run a whole-table truncate against live votes.

## Enforcement

`check:fresh` machine-checks what a script can see: every clip's age vs `NOW` (180 days),
missing or future dates on embeds, malformed clip entries, expired or garbage
`evergreenUntil` values, and it warns when `NOW` drifts more than 14 days from the real clock.
It reads the `yt()`/`tv()` factory calls positionally, so a new clip factory (TikTok, say)
needs a matching entry in the script's `FACTORIES` map and its `callRe` regex.

Everything else in this playbook is editorial judgment a script cannot make: the iconicity bar,
pillar balance, rookie graduation, account-authenticity checks, and premise verification. That is
exactly why rule 2 (verify before you write, with dated sources) is mandatory rather than advisory.
