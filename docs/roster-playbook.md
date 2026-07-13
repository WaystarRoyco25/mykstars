# Roster & freshness playbook ("Who we cover, and how current it reads")

This is the standing brief for **any session that touches the roster** (the `artists` array in
[`src/content/profiles.ts`](../src/content/profiles.ts)) **or any dated/embedded content** (clips,
gallery embeds, events, rankings, forecast premises). The schema lives in
[`src/lib/types.ts`](../src/lib/types.ts); the coverage predicates live in
[`src/lib/data.ts`](../src/lib/data.ts) (`isPromoted`). Read this before adding, benching, or
promoting anyone, and before touching the `clips` array.

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
   place (`check:profiles` enforces this; the original 2026-07 roster of 21 is allowlisted until
   permitted media lands). Pre-debut candidates additionally follow the guardrail below.

## The pre-debut guardrail (preview profiles)

`careerStage: "preview"` is allowed only for **agency-announced lineups with a dated official
source**, capped at 10 public preview profiles, re-verified every 120 days. Coverage is
**activity-only**: official clips and (in wave 1b) Pulse items. A preview profile never appears
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
     Stars directory's active view, and clip fill (see `isPromoted()` in `data.ts`).
   - Reactivate: set `coverageLevel: "active"` the moment rule 1 passes again. Catalog profiles
     are re-verified at least every six months (`lastVerified`; check-enforced at 190 days).
   - Every flip carries a one-line dated justification comment in `profiles.ts` citing the
     source, and refreshes `lastVerified`. No silent flips.
   - Retire a catalog artist's open forecast questions in the same refresh (the
     `getOpenPredictions` filter is only a safety net).
6. **The embed rules.** (Embeds are YouTube-only since July 2026: Instagram and X embeds were
   retired. The official IG/X handles stay on each `Artist.social` as verification records and
   never render.)
   - **180-day rule:** every clip must be at most 180 days old vs `NOW`.
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
7. **Verification methods that work here** (no logins, no paid APIs):
   - YouTube: `https://www.youtube.com/oembed?url=<watch-url>&format=json` proves existence and
     the exact channel name. Reject anything not on the named official channel.
   - The true upload date comes from the watch page's own metadata (`datePublished` /
     `uploadDate`) or a dated press article that corroborates it; never from a search snippet
     alone (see Red flags).
8. **Run the checks before calling a refresh done** (see Check commands below).

## Roster reference (as of 2026-07-05)

| Coverage | Artists |
|---|---|
| Active (21) | NewJeans, BLACKPINK, IU, Stray Kids, aespa, Cha Eun-woo, TWICE, BTS, SEVENTEEN, IVE, CORTIS, Hearts2Hearts, BABYMONSTER, LE SSERAFIM, Lee Min-ho, Park Eun-bin, Kim Tae-ri, Byeon Woo-seok, Park Chan-wook, Bong Joon-ho, Jung Ho-yeon |
| Catalog (0) | (empty; the 2026-07-05 verification pass found every member active under rule 1: e.g. Bong Joon-ho confirmed *Ally* at Cannes in May 2026, Jung Ho-yeon walked the Met Gala and Cannes in May 2026, Lee Min-ho has *Assassins* filming) |

When moving someone to catalog, add them to this table with: catalog-since date, last verified
major activity, reason, and the reactivation trigger to watch.

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
- `npm run check:fresh` (this playbook's 180-day + true-date gates; scripts/check-freshness.mjs)
- `npm run check:profiles` (this playbook's profile fields, verification cadence, relationships,
  hero requirement and pre-debut guardrails; scripts/check-profiles.mjs)
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
