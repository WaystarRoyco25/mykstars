# Fan Forecast — question playbook ("The Engagement Engine")

This is the standing brief for **any session that updates the Fan Forecast questions**. The
questions live in the `predictions` array in
[`src/content/predictions.ts`](../src/content/predictions.ts); the schema is `Prediction` in
[`src/lib/types.ts`](../src/lib/types.ts). Read this before writing or refreshing any question.

**Portfolio target:** 8 to 16 strong open questions at any time, spread across pillars and
fandoms. The old one-question-per-featured-artist rule is retired: a forced question is a weak
question, and weak questions cost more engagement than a missing one. Preview (pre-debut)
profiles are never forecast subjects (check-enforced; see the roster playbook's guardrail).

**Cadence:** roughly **monthly**, owner-initiated (not fixed — may also be triggered reactively when
big news breaks). Each refresh should bump the frozen site clock `NOW` and every `asOf` to that day.
Live question status still follows the real operation clock.

## The goal

Maximize fan attention and engagement — votes cast, return visits, shares — by making every
question feel **personal, urgent, and worth defending**. We want the room electric. We get there
through **stakes, identity, timing, and rivalry**, never through gossip. Gossip loses the fandom
(and invites legal risk); pride keeps them coming back.

## The ten rules

1. **One desperate hope per question.** Anchor to an outcome a fandom aches for — a Daesang, a
   #1, a record, a sold-out stadium, a long-awaited return. A *Yes* must feel like a win worth
   defending.
2. **Make it tribal.** Phrase so fans vote *as* their fandom (STAY, MY, BLINK, ARMY, ONCE,
   Bunnies, Uaena…). Identity drives turnout.
3. **Strike while it's hot.** Tie to something within weeks; let the D-Day countdown
   (`closesAt`) manufacture urgency. Rotate questions on the news cycle — stale questions kill
   repeat visits.
4. **Binary by default, drama in multi-way.** Yes/No for one-tap participation; reserve 3–5-option
   races for "who wins" awards, where rivalry energy peaks.
5. **Rivalry through official contests only.** Channel competition into real, resolvable races
   (MAMA Daesang, Billboard #1, box-office crown). **Never** "which group/member is
   better/prettier" — that starts fan wars, not engagement.
6. **Always resolvable, always dated.** Every question settles on one objective public source +
   a real `closesAt`. The resolution moment is its own engagement spike — fans return to see if
   they were right.
7. **Hope-frame, never odds.** The `framing` standfirst captures *what fans believe and hope*,
   not a betting line. We host sentiment, not a sportsbook.
8. **Sensitivity is non-negotiable.** Professional outcomes only. **Never** private life, dating,
   appearance, weight, military criticism, lawsuits, or member rankings. If an artist is in a
   painful moment (legal fight, hiatus, scandal, active service), switch to a *solidarity /
   anticipation* frame — or skip them this cycle. A question that hurts the fandom loses the
   fandom.
9. **Voice: hype within editorial-noir.** Big stakes, strong verbs ("sweep," "shatter," "reign,"
   "crown"), fandom vernacular — but keep the restrained, credible tone the site is built on. No
   clickbait lies, no manufactured outrage. Excitement, not tabloid.
10. **Curate the rhythm.** Always keep several **open** questions across all four pillars, at least
    one **closing soon** (urgency), and one **freshly resolved** (proof we call it honestly).
    Spread the love across the roster — don't let one fandom dominate.

## Settle-source cheat sheet

| Outcome type        | Resolve against                                              |
|---------------------|-------------------------------------------------------------|
| Awards / Daesang    | Official winners list (MAMA, Blue Dragon, Baeksang, MMA…)    |
| Sales / streams     | Circle, Hanteo, Billboard, Netflix global Top 10            |
| Film admissions     | KOBIS · Korean Film Council                                  |
| Brand / campaign    | Official house announcement; Vogue Korea / WWD              |
| New project / tour  | Agency / network / studio announcement; Weverse             |

Add a `Source` const in `src/content/predictions.ts` (or `sources.ts` when shared across files)
if none fits; keep `kind` honest (`official`/`wire`/`press`/`magazine`).

## Red flags → reframe or skip

`lawsuit` · `hiatus` · `scandal` · `military service` · `dating` · `body/appearance` ·
`member-vs-member ranking` · anything unconfirmed stated as fact.
→ Use anticipation/solidarity framing, or leave the artist out until there's celebratory news.

## Mechanics reminders (match the existing schema)

- `slug` kebab-case, unique, and **permanent once published** — live votes key on it. A "rename"
  is a retirement plus a new slug, and a resolved slug is never reused (see below).
- `tallyVisibleThreshold: 25` — keeps a cold-start "be the first" state (FOMO) until real votes
  arrive.
- Live lifecycle is **time-derived** from `closesAt` vs the real operation clock
  (`effectivePredictionStatus` in `src/lib/policy/forecasts.ts`); a stored `status: "resolved"` or
  a `resolution` record always wins. Keep at least one closed-awaiting and one resolved entry so
  all three UI states stay on display.
- Set every question's `asOf` and the site clock `NOW` (`src/content/now.ts`) to the day you
  refresh. `NOW` is the frozen editorial clock for rendered content and checks; it does not replace
  the real vote cutoff. After bumping it, spot-check the Events and Schedule pages.

## Retiring prediction slugs (votes are user data)

Votes live in the Supabase `votes` table (deduped by the `myk_voter` cookie); tallies are computed
live via the `prediction_tallies` view. Real reader votes are **never mass-reset**: no
whole-table truncate against a live site. When a refresh retires, replaces, or resolves-and-
removes questions, delete only those questions' rows in **Supabase → SQL Editor**:

```sql
delete from votes where prediction_slug in ('<retired-slug>', '<other-retired-slug>');
```

Replaced slugs orphan their vote rows; never leave them counting toward a different question. No
code or schema change — the table is managed in Supabase, not in a repo migration.

## Vote store security

The `votes` table and `prediction_tallies` view are service-role only, and two settings keep them
that way. Supabase's `security_definer_view` advisor flags the view if the first is missing:

- `prediction_tallies` is created `with (security_invoker = on)`, so it runs as the querying role,
  not the view owner (the Postgres default, which the linter reports as SECURITY DEFINER).
- `votes` has row level security enabled with no `anon` / `authenticated` policies. All app access is
  server-side via the service-role key (`SUPABASE_SERVICE_ROLE_KEY`), which bypasses RLS, so no
  public policy is needed.

If you ever recreate the view or table by hand, re-apply both. To set them on the existing schema,
run in **Supabase → SQL Editor**:

```sql
alter view  public.prediction_tallies set (security_invoker = on);
alter table public.votes enable row level security;
revoke select on public.prediction_tallies from anon, authenticated;
revoke select on public.votes              from anon, authenticated;
```
