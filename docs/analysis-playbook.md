# Analysis playbook ("Takes with receipts")

This is the standing brief for **any session that writes or edits Analysis articles** (the
`articles` array in [`src/content/articles.ts`](../src/content/articles.ts); the schema is
`Article` in [`src/lib/types.ts`](../src/lib/types.ts)). Pieces with `status: "analysis"` render
under the muted "Context" flag and interleave through the home page by `pillar`. Read this
before writing or refreshing any article.

**Cadence:** analysis ships inside the monthly edition
([`docs/edition-playbook.md`](edition-playbook.md)), riding the same NOW-bump ritual as
[`docs/roster-playbook.md`](roster-playbook.md), plus reactive pieces when big news breaks.
Every edition carries **at least 4** analysis articles inside its mix (Pulse carries volume;
analysis carries authority); scale up when the K-culture news cycle is heavy (the sizing
heuristic is Mechanics step 1).

## The goal

The photo pages prove the site is live; Analysis proves it thinks. Every piece hands the reader
a position worth arguing with: one thesis, the latest data, a clear side, and a dated mark where
we will be proven right or wrong. Opinionated and checkable beats neutral and vague, and that
combination (not volume) is what separates this section from a fan feed.

> **This document's vocabulary is not the copy's vocabulary.** The words below name the moves so
> you know which to make: *thesis*, *steelman*, *counterargument*, *checkpoint*, *bullish call*,
> *bearish call*, *falsifiable*, *scope*. None of them belong in a published sentence. Writing
> "The strongest counterargument is X" or "Circle Chart results provide the checkpoint" is
> transcribing this brief instead of doing what it asks, and it is why the July 2026 run shipped
> eight pieces that argued well and sounded identical. Make the move; never announce it.
> House-style Rule 5, and rule 15 below.

## The fifteen rules

1. **Earn the analysis label.** Every piece tells the reader something the wire headline and the
   photos cannot: a mechanism, a comparison, a consequence, a call. If it only restates events,
   it is not Analysis; sharpen it or cut it.
2. **One falsifiable thesis per piece.** State a single claim early that a named future event
   could prove wrong, and write the piece to defend it. If nothing could contradict it, it is
   not a thesis yet.
3. **Steelman before you swing.** The best case against the thesis gets real space (a full
   paragraph in a flagship, at least a clause in a standard piece) and an honest answer on the
   merits. A take that has never met its opposition is fan-feed material. Two constraints on how
   it lands. **Never announce it:** the objection arrives in its own voice, never behind "The
   strongest counterargument is" or any fresh synonym for it (house-style Rule 5). **Never a
   fixed slot:** it can open the piece and get turned, ride inside the evidence paragraph as the
   limit of that evidence, become the thing the closing threshold answers, or hold its own
   paragraph. Pick per piece. If two pieces in one run put it in the same place behind the same
   hinge, one of them is wrong.
4. **Latest data, named and dated.** Every load-bearing claim carries a named source and a date,
   preferring the canonical table below, and gets web-verified before writing
   (roster-playbook rule 2 applies to article subjects too). **Never** publish a figure you
   cannot trace to a dated public source, and **never** attribute one to "industry insiders".
5. **Take a side.** Every piece is clearly bullish or bearish on its subject; hedged both-sides
   filler is a red flag, and every run ships positive and negative calls (see the quota table).
   A bearish call is a service to readers, not an attack. "Bullish" and "bearish" are how this
   brief and the quota table label the two sides. They are not how the copy talks: a piece shows
   its side by what it argues, never by calling itself "the bullish call" (house-style Rule 5).
6. **Mix the scopes.** A run covers individual artists, companies and agencies, and the industry
   as a whole; the quota table sets the floor. Company and industry pieces are where the section
   earns authority that artist coverage alone cannot.
7. **Two depths, on purpose.** Standard pieces run 120-250 words with at least one dated data
   point. Each run also carries 2-3 flagships at 300-500 words with the full treatment: thesis,
   steelman, and a dated closing threshold. Depth is a word count and a level of evidence, not a
   paragraph template. Two flagships in one run should not be the same seven paragraphs in the
   same order (rule 15).
8. **Close on a date and a number.** End every piece where it can be proven wrong: a named event
   with a date and a threshold (a chart week, an earnings call, a tour leg, a premiere), so the
   thesis has a scoreboard and the reader has a reason to come back. Write the condition, never
   the label. "A top-30 finish for the week ending August 15, 2026 settles it" does the job;
   "Circle Digital Chart results provide the checkpoint. The bullish call holds if..." announces
   it, and ships the brief's filing vocabulary to a reader who never asked for it. The word
   *checkpoint* is for this document. It does not appear in an article.
9. **Never the negation tells.** **Never** the negative-parallelism clause ("It's not X, it's
   Y") and **never** the stacked reveal ("Not X. Not Y. Just Z."). State the positive claim
   directly; a positive-first trailing contrast ("a floor, not a ceiling") stays legal.
   Style-guide Rule 3.
10. **No AI-tell phrases, no dashes, no announced moves.** The banned-phrase list in style-guide
    Rule 4 ("delve", "testament to", "remains to be seen"...), the em/en dash ban (Rule 1) and
    the announced-move ban (Rule 5) apply to every article field, title through body.
11. **Titles intrigue, then pay off.** Assertive and specific beats clever and vague, and the
    dek delivers what the title promises. **Never** bait the body cannot cash, and **never** a
    question-mark headline (the Betteridge ban: if the answer fits in a word, write the answer).
12. **The byline is MyKStars.** Exactly `"MyKStars"`, always. **Never** an invented reporter
    name; authorship is disclosed on `/about/editorial-standards`, and the publication stands
    behind every take.
13. **Four pieces minimum per edition, scale with the news.** Every monthly edition carries at
    least 4 analysis articles, more when the cycle is heavy (Mechanics step 1). Verification
    still gates quantity: a piece that cannot meet rule 4 gets replaced with one that can,
    never padded through.
14. **The ethics floor holds.** Professional outcomes and public business facts only. **Never**
    private lives, dating, health, appearance, or rumor (the forecast playbook's sensitivity
    rule, verbatim). A bearish take criticizes strategy, output and results, never people, and
    an artist in a painful moment gets confirmed-facts-only treatment (roster playbook red
    flags).
15. **Vary the cadence across the run.** The rules above name moves every piece makes. That
    shared skeleton must not become a shared sound. Inside one run, no two pieces open a
    paragraph the same way, seat the steelman in the same slot, or close on the same
    construction, and no phrase does the same job in three or more articles. This is the rule
    that no single piece can violate on its own, so it is invisible while you draft and obvious
    to a reader scrolling `/analysis`. Write the run's pieces knowing the others exist, then
    read them back to back before shipping. `check:articles` fails on cross-article phrase
    repetition, but it is a tripwire for the literal case, not a substitute for that read.

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

Add a `Source` const in `src/content/articles.ts` (or `sources.ts` when shared across files) if
none fits; keep `kind` honest (`official`/`wire`/`press`/`magazine`). In body prose, name the
source and date inline for any figure a reader should be able to check: "2.31 million first-week
copies (Hanteo, June 2026)".

## Per-edition coverage quotas

Floors for a 4-piece edition contribution; scale proportionally when the edition carries more
analysis. Quotas marked *quarterly* are measured across the trailing three editions, since a
4-piece month cannot carry them all at once.

| Quota                     | Floor                                                        |
|---------------------------|--------------------------------------------------------------|
| Artist-scope pieces       | at least 1                                                   |
| Company / agency scope    | at least 1                                                   |
| Industry-wide scope       | at least 1                                                   |
| Pillars                   | all four covered *quarterly*; no pillar dark two editions running |
| Bullish / bearish         | at least 1 each                                              |
| Same subject              | at most 2 pieces per edition                                 |
| Opposing-takes pair       | at least 1 *quarterly* (opposite sides of one question, cross-linked via `related`) |
| Flagships (300-500 words) | 1-2                                                          |

## Red flags → reframe or drop

`private life` · `dating` · `rumor` · `undated figure` · `"industry insiders say"` ·
`unfalsifiable thesis` · `both-sides hedge` · `relative-time copy` ("this week", "just dropped") ·
`a number from a search snippet` · `a third piece on one subject` · `an announced move`
("The strongest counterargument is", "X provides the checkpoint", "the bullish call holds if") ·
`two pieces that open the same way`
→ Find the dated primary source, pick a side, anchor copy to dates, reframe to professional
outcomes, let the objection speak for itself, or drop the piece. A run with 10 clean pieces beats
a run with 14 and a rumor.

## Mechanics: how a publishing run works

1. **Size the run.** Baseline 4 pieces inside the edition (roughly its 20% "other formats"
   share alongside events, forecasts and rankings). Count the pillar-defining stories since the
   last edition (an award night, a record comeback week, a major festival premiere, an agency
   earnings or M&A shock, a global #1) and add roughly one piece per such story. The edition
   engine seats at most 8 analysis articles (`MAX_ARTICLES` in `src/lib/edition/inventory.ts`),
   so that is the working ceiling; anything past it publishes on `/analysis` without a
   home-page seat until the next edition.
2. **Web-verify first.** Every subject's current status and every figure against the canonical
   table; capture each figure's source name and date while researching, before drafting.
3. **Draft to quota, and to cadence.** Sketch the run against the quota table before writing;
   assign scopes, pillars, sides, and the opposing pair up front. Assign cadence in the same
   pass (rule 15): where each piece seats its steelman, and how each one closes. Two pieces
   drawing the same pair are a conflict to resolve on the sketch, which costs a line, rather
   than in the copy, which costs a rewrite.
4. **Write to schema.** `status: "analysis"`, `pillar` set (only site-standards pieces go
   pillar-less), one paragraph per `body` string, `source` as the outlet-level credit, and
   `related.artistSlugs` / `gallerySlugs` for every covered subject the site hosts (a dangling
   slug fails `check:articles`). Attach `media` when a permitted thumbnail exists:
   `{ kind: "image", assetId, alt }`, resolved from the `MediaAsset` registry (`check:media`
   guards the reference). Alt text is plain prose, no `*asterisk*` markup, and `check:style`
   scans it like any content string; the row pattern lives in `docs/design-conventions.md`.
   The text-only row is a designed fallback, so a piece with no clean permitted image ships
   without one.
5. **Date on the clock.** Bump `NOW` first (the roster ritual), then date the batch on or before
   `NOW`, KST, staggered times. **Never** in the site's future.
6. **Titles and deks last.** Write them against rule 11 once the piece exists; byline
   `"MyKStars"`.
7. **Run the checks, then a preview pass** of `/`, `/analysis`, and at least one new article
   page (the pillar interludes and the closer band re-shuffle as articles land).

## Check commands (run after every content edit)

- `npm run check:style` (house style: em/en dashes, negation-reveal constructions, AI-tell
  phrases, announced moves in content strings; docs/style-guide.md)
- `npm run check:articles` (this playbook's mechanical floor: bylines, article dates vs `NOW`,
  question-mark titles, dangling `related` slugs, duplicate slugs, cross-article phrase
  repetition; scripts/check-articles.ts)
- `npm run check:fresh` (embed freshness; docs/roster-playbook.md)
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build` before shipping

## Enforcement

`check:articles` machine-checks what a script can see: every article's byline is exactly
`"MyKStars"`, every `date` parses and does not sit past `NOW` (1 day of slack), no title ends in
a question mark, every `related` slug resolves to a real artist or gallery, and article slugs
are unique. It also fails when one phrase does the same job in three or more articles (rule 15),
comparing the run against itself rather than against a list. It warns (without failing) when
fewer than 4 analysis pieces are dated within 45 days of `NOW`, the sign that the latest edition
came in under the floor. `check:style` fails on the banned constructions and phrases anywhere in
content strings; its `BANNED_PHRASES` constant is the canonical list.

The two voice checks catch different things and neither is sufficient. `BANNED_PHRASES` knows
the exact phrasings that have already gone wrong, so it stops a repeat and nothing else; the
repetition check knows convergence when it sees it, but only once three articles have converged.
A run of two pieces sharing a freshly-invented announced move passes both and is still wrong.

Everything else in this playbook is editorial judgment a script cannot make: whether a thesis is
falsifiable, whether the steelman is honest and honestly placed, whether a figure is the latest
available, scope and side balance, title payoff, whether the run sounds like one writer with one
move, and the ethics floor. That is exactly why rule 4 (verify with dated sources before
writing) and rule 15's read-back are mandatory rather than advisory.
