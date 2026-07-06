# Analysis playbook ("Takes with receipts")

This is the standing brief for **any session that writes or edits Analysis articles** (the
`articles` array in [`src/lib/seed.ts`](../src/lib/seed.ts); the schema is `Article` in
[`src/lib/types.ts`](../src/lib/types.ts)). Pieces with `status: "analysis"` render under the
muted "Context" flag and interleave through the home page by `pillar`. Read this before writing
or refreshing any article.

**Cadence:** every periodic publishing run: roughly **monthly**, riding the same NOW-bump ritual
as [`docs/roster-playbook.md`](roster-playbook.md), plus reactive runs when big news breaks.
Every run adds **at least 10** analysis articles; scale up when the K-culture news cycle is
heavy (the sizing heuristic is Mechanics step 1).

## The goal

The photo pages prove the site is live; Analysis proves it thinks. Every piece hands the reader
a position worth arguing with: one thesis, the latest data, a clear side, and a dated checkpoint
where we will be proven right or wrong. Opinionated and checkable beats neutral and vague, and
that combination (not volume) is what separates this section from a fan feed.

## The fourteen rules

1. **Earn the analysis label.** Every piece tells the reader something the wire headline and the
   photos cannot: a mechanism, a comparison, a consequence, a call. If it only restates events,
   it is not Analysis; sharpen it or cut it.
2. **One falsifiable thesis per piece.** State a single claim early that a named future event
   could prove wrong, and write the piece to defend it. If nothing could contradict it, it is
   not a thesis yet.
3. **Steelman before you swing.** Give the strongest opposing reading one honest paragraph in a
   flagship (one clause in a standard piece), then answer it on the merits. A take that has
   never met its counterargument is fan-feed material.
4. **Latest data, named and dated.** Every load-bearing claim carries a named source and a date,
   preferring the canonical table below, and gets web-verified before writing
   (roster-playbook rule 2 applies to article subjects too). **Never** publish a figure you
   cannot trace to a dated public source, and **never** attribute one to "industry insiders".
5. **Take a side.** Every piece is clearly bullish or bearish on its subject; hedged both-sides
   filler is a red flag, and every run ships positive and negative calls (see the quota table).
   A bearish call is a service to readers, not an attack.
6. **Mix the scopes.** A run covers individual artists, companies and agencies, and the industry
   as a whole; the quota table sets the floor. Company and industry pieces are where the section
   earns authority that artist coverage alone cannot.
7. **Two depths, on purpose.** Standard pieces run 120-250 words with at least one dated data
   point. Each run also carries 2-3 flagships at 300-500 words with the full treatment: thesis,
   steelman, and watch-next closer.
8. **Close on what to watch.** End every piece on a concrete, dated checkpoint (a chart week, an
   earnings call, a tour leg, a premiere) so the thesis has a scoreboard and the reader has a
   reason to come back.
9. **Never the negation tells.** **Never** the negative-parallelism clause ("It's not X, it's
   Y") and **never** the stacked reveal ("Not X. Not Y. Just Z."). State the positive claim
   directly; a positive-first trailing contrast ("a floor, not a ceiling") stays legal.
   Style-guide Rule 3.
10. **No AI-tell phrases, no dashes.** The banned-phrase list in style-guide Rule 4 ("delve",
    "testament to", "remains to be seen"...) and the em/en dash ban (Rule 1) apply to every
    article field, title through body.
11. **Titles intrigue, then pay off.** Assertive and specific beats clever and vague, and the
    dek delivers what the title promises. **Never** bait the body cannot cash, and **never** a
    question-mark headline (the Betteridge ban: if the answer fits in a word, write the answer).
12. **The byline is MyKStars.** Exactly `"MyKStars"`, always. **Never** an invented reporter
    name; authorship is disclosed on `/about/editorial-standards`, and the publication stands
    behind every take.
13. **Ten pieces minimum, scale with the news.** Every publishing run adds at least 10 analysis
    articles, more when the cycle is heavy (Mechanics step 1). Verification still gates
    quantity: a piece that cannot meet rule 4 gets replaced with one that can, never padded
    through.
14. **The ethics floor holds.** Professional outcomes and public business facts only. **Never**
    private lives, dating, health, appearance, or rumor (the forecast playbook's sensitivity
    rule, verbatim). A bearish take criticizes strategy, output and results, never people, and
    an artist in a painful moment gets confirmed-facts-only treatment (roster playbook red
    flags).

## Canonical data sources

| Claim type                     | Cite (always with a date)                          |
|--------------------------------|----------------------------------------------------|
| Album / physical sales         | Circle Chart, Hanteo (chart week)                  |
| Streaming / global consumption | Luminate, IFPI Global Music Report (edition year)  |
| Chart positions                | Billboard, Circle (chart + week)                   |
| Industry size / exports        | KOCCA quarterly content-industry reports           |
| Company financials             | HYBE / SM / JYP / YG IR filings (quarter)          |
| Film admissions                | KOBIS · Korean Film Council                        |
| TV / streaming viewership      | Nielsen Korea, Netflix global Top 10               |
| Brand / campaign               | Official house announcement; Vogue Korea / WWD     |

Add a `Source` const in `seed.ts` if none fits; keep `kind` honest (`official`/`wire`/`press`/
`magazine`). In body prose, name the source and date inline for any figure a reader should be
able to check: "2.31 million first-week copies (Hanteo, June 2026)".

## Per-run coverage quotas

Floors for a 10-piece run; scale proportionally when the run is bigger.

| Quota                     | Floor                                                        |
|---------------------------|--------------------------------------------------------------|
| Artist-scope pieces       | at least 3                                                   |
| Company / agency scope    | at least 2                                                   |
| Industry-wide scope       | at least 3                                                   |
| Pillars                   | all four covered, at least 1 piece each                      |
| Bullish / bearish         | at least 3 each                                              |
| Same subject              | at most 2 pieces                                             |
| Opposing-takes pair       | exactly 1 (opposite sides of one question, cross-linked via `related`) |
| Flagships (300-500 words) | 2-3                                                          |

## Red flags → reframe or drop

`private life` · `dating` · `rumor` · `undated figure` · `"industry insiders say"` ·
`unfalsifiable thesis` · `both-sides hedge` · `relative-time copy` ("this week", "just dropped") ·
`a number from a search snippet` · `a third piece on one subject`
→ Find the dated primary source, pick a side, anchor copy to dates, reframe to professional
outcomes, or drop the piece. A run with 10 clean pieces beats a run with 14 and a rumor.

## Mechanics: how a publishing run works

1. **Size the run.** Baseline 10. Count the pillar-defining stories since the last run (an award
   night, a record comeback week, a major festival premiere, an agency earnings or M&A shock, a
   global #1). More than about 5 such stories adds roughly one piece per extra story, with a
   soft ceiling around 16 so rule 4 verification holds.
2. **Web-verify first.** Every subject's current status and every figure against the canonical
   table; capture each figure's source name and date while researching, before drafting.
3. **Draft to quota.** Sketch the run against the quota table before writing; assign scopes,
   pillars, sides, and the opposing pair up front.
4. **Write to schema.** `status: "analysis"`, `pillar` set (only site-standards pieces go
   pillar-less), one paragraph per `body` string, `source` as the outlet-level credit, and
   `related.artistSlugs` / `gallerySlugs` for every covered subject the site hosts (a dangling
   slug fails `check:articles`).
5. **Date on the clock.** Bump `NOW` first (the roster ritual), then date the batch on or before
   `NOW`, KST, staggered times. **Never** in the site's future.
6. **Titles and deks last.** Write them against rule 11 once the piece exists; byline
   `"MyKStars"`.
7. **Run the checks, then a preview pass** of `/`, `/analysis`, and at least one new article
   page (the pillar interludes and the closer band re-shuffle as articles land).

## Check commands (run after every seed edit)

- `npm run check:style` (house style: em/en dashes, negation-reveal constructions, AI-tell
  phrases in content strings; docs/style-guide.md)
- `npm run check:articles` (this playbook's mechanical floor: bylines, article dates vs `NOW`,
  question-mark titles, dangling `related` slugs, duplicate slugs; scripts/check-articles.mjs)
- `npm run check:fresh` (embed freshness; docs/roster-playbook.md)
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build` before shipping

## Enforcement

`check:articles` machine-checks what a script can see: every article's byline is exactly
`"MyKStars"`, every `date` parses and does not sit past `NOW` (1 day of slack), no title ends in
a question mark, every `related` slug resolves to a real artist or gallery, and article slugs
are unique. It warns (without failing) when fewer than 10 analysis pieces are dated within 45
days of `NOW`, the sign that the latest run came in under the floor. `check:style` fails on the
banned constructions and phrases anywhere in seed content strings; its `BANNED_PHRASES` constant
is the canonical list.

Everything else in this playbook is editorial judgment a script cannot make: whether a thesis is
falsifiable, whether the steelman is honest, whether a figure is the latest available, scope and
side balance, title payoff, and the ethics floor. That is exactly why rule 4 (verify with dated
sources before writing) is mandatory rather than advisory.
