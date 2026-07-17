# MyKStars house style

Five standing rules for every caption, title, dek, article, ranking, prediction and
event line on MyKStars, plus the chrome around them (nav, taglines, meta/OG text).
They apply to all user-visible copy, going forward and to anything edited from now
on. Code comments are exempt: they are developer notes, not published copy.

## Rule 1 — No em or en dashes

Never use `—` (em dash) or `–` (en dash). They read as machine-written and they are
not the editorial-noir voice. Recast instead:

- **Comma**, for a light aside: `the airport set, often the first sighting,`
- **Colon**, to introduce or explain: `the moments ahead: awards, charts, comebacks`
- **Period**, to split two thoughts: `by the weekend. The discovery problem inverted.`
- **Parentheses**, for a true aside: `a cross-pillar cast (an idol, a film actor) is its own signal`
- **Middle dot** (`·`), for a title/brand separator in metadata: `Squid Game · MyKStars`

Do not fake a dash with a hyphen-minus or a spaced hyphen (` - `). The hyphen is
only for genuine compounds (`top-ten`, `K-pop`) and numeric ranges (`15-17`).

The single exception is the decorative, `aria-hidden` "no change" glyph in the
ranking tables (`src/components/RankingTable.tsx`): a typographic symbol, not prose.

## Rule 2 — Italicize the names of works

Set the titles of standalone works in italics; put small, contained pieces in
quotes. Standard newsroom style.

| Treatment    | Applies to                                                                                          | Example |
|--------------|-----------------------------------------------------------------------------------------------------|---------|
| *Italics*    | Books, TV series, films, albums/EPs, magazines & newspapers, video games, stage works (plays/musicals) | *Squid Game*, *No Other Choice*, *THIS & THAT*, *Vogue Korea* |
| 'Quotes'     | Songs/tracks, single episodes, article headlines, chapters                                           | 'Spring Day', 'Pilot' |
| Roman (none) | People, groups, brands/fashion houses, award shows, festivals, tours, venues                         | NewJeans, Louis Vuitton, MAMA Awards, Busan International Film Festival |

When a title appears in a credit byline (the `Source.name` attached to a photo or
ranking), leave it roman — that is a dateline, not prose. So a magazine is
*Vogue Korea* in a headline but "via Vogue Korea" in the credit line.

### How to write italics: the `*asterisk*` convention

Content is stored as plain strings in `src/content/*.ts` and rendered as text, so
italics are written with a markdown-style single-asterisk span:

```ts
question: "Did Park Chan-wook's *No Other Choice* top the box office?"
title: "Cha Eun-woo for *W Korea*"
```

`renderEmphasis()` in `src/lib/text.tsx` turns each `*...*` into an `<em>` when the
copy is displayed. In plain-text contexts (page `<title>`, OG/meta descriptions,
image `alt`, `aria-label`, JSON-LD, OG images) `stripEmphasis()` removes the markers
so no stray asterisk leaks out. Every field that can hold a title is already routed
through one of these, so just write the asterisks in the copy.

Notes:
- Single asterisks only. Songs and single episodes use plain `'straight quotes'`.
- A possessive after a title sits outside the markers: `*THIS & THAT*'s debut week`.
- Content carries no other asterisks, so there is nothing to escape.

## Rule 3 — No negation-reveal constructions

Never the negative-parallelism clause (`It's not X, it's Y` and its cousins: `that's
not X; it's Y`, `isn't just X; it's Y`), and never the stacked-negation reveal
(`Not X. Not Y. Just Z.`). Both read as machine-written cadence, the exact tell this
site's voice exists to avoid. Recast:

- **State the positive claim directly:** `that work is a pillar of K-pop coverage`
  (instead of `that's not adjacent to K-pop; it's a pillar of it`)
- **A positive-first trailing contrast stays legal:** `a floor, not a ceiling` ·
  `a promise, not a flourish` (the affirmative leads, so there is no reveal)
- **Split into plain statements:** `The tour is not sold out yet. It is close.`
  (the period form is fine; the comma splice is what reads as a reveal)

What the check flags mechanically: a negation (`not` / `n't`) joined by a comma or
semicolon to a reveal beginning with a pronoun and copula (`, it's` / `; they're` /
`, that is`), the `not about X. It's about Y` echo, and consecutive sentence-initial
`Not ...` fragments capped by a `Just` / `Only` reveal. A flagged sentence is usually
a comma splice on top of the cliché: recast with a period and it passes.

## Rule 4 — No AI-tell phrases

A short list of stock phrases is banned outright in content strings. They are filler
that substitutes for a specific claim, and they read as generated copy:

| Banned                                 | Write instead                                |
|----------------------------------------|----------------------------------------------|
| `delve` (any form)                     | say what the piece does: examine, trace, price |
| `testament to`                         | state the causal claim: X shows Y            |
| `ever-evolving`, `ever-changing`       | name the specific change and its date        |
| `remains to be seen`, `only time will tell` | name the checkpoint and when it lands   |
| `rich tapestry`, `tapestry of`         | name the actual components                   |
| `in the world of`                      | just name the domain: `in K-pop`             |
| `cannot be overstated`                 | state it, at its true size                   |
| `worth noting`                         | if it is worth noting, note it               |
| `deep dive`                            | `analysis`, `breakdown`, or nothing          |
| `game-changer`, `game changing`        | say what specifically changed                |
| `in conclusion`                        | just conclude                                |
| `at the end of the day`                | delete; the sentence survives                |

The canonical machine-checked list is the `BANNED_PHRASES` table in
`scripts/check-style.ts`; grow it there when a new tell shows up. Deliberate
exclusions, which stay legal: bare `landscape` (a real orientation value in seed
data) and native fashion-desk vocabulary like `iconic` or `elevated`. Hedges like
`arguably` are discouraged in Analysis (take a side) but not machine-banned.

## Rule 5 — Make the move, don't announce it

The playbooks tell a writer which moves to make: state a thesis, steelman the
counterargument, close on a dated checkpoint, take a bullish or bearish side. Those
nouns name the machinery. They are words for the brief, never words for the copy.
A reader does not need to be told an objection is arriving; the reader needs the
objection. Announcing a move instead of making it is the same failure as `in
conclusion` in Rule 4, and it is the most reliable way to make eight well-argued
pieces sound like one script.

| Announced                                | Write instead                                  |
|------------------------------------------|------------------------------------------------|
| `The strongest counterargument is X`     | let the objection speak: `Summer listeners may want release from humidity, not a reminder of it.` |
| `The strongest opposing case is X`       | same: the objection arrives unintroduced       |
| `X provides / sets / is the checkpoint`  | give the date and the number: `A top-30 finish for the week ending August 15, 2026 settles it.` |
| `The bullish call holds if X`            | state the condition: `Two of the three marks would confirm it.` |
| `This bearish call is overturned if X`   | state what breaks it: `A top 100 rank in week ten breaks the thesis.` |
| `A look at X` · `We trace how X` · `Here's what X` (deks) | make the claim the piece makes |

Words that belong to the brief and not the copy: `thesis`, `steelman`,
`counterargument`, `opposing case`, `checkpoint`, `bullish call`, `bearish call`,
`falsifiable`, `scope`. A piece shows its side by what it argues; it never labels
itself. The banned constructions above are in `BANNED_PHRASES`, but the list is the
floor, not the rule: a fresh synonym for an announced move (`The most serious
objection is`, `The obvious rebuttal is`) breaks this rule exactly as much as the
phrasings that happen to be caught mechanically today.

**Vary it across the run.** A fresh hinge repeated eight times is the same disease
as a stale one. Two pieces in one run must not open the same move the same way, and
no phrase should do the same job in three articles. `check:articles` fails on that;
the reasoning is analysis-playbook rule 15.

## Enforcement

`npm run check:style` (`scripts/check-style.ts`) parses every content file under
`src/content/` and scans its string literals, failing on any em/en dash (Rule 1),
negation-reveal construction (Rule 3), or banned phrase (Rule 4 and the announced
moves of Rule 5). It reads the TypeScript AST rather than raw text, so developer
comments and regex literals are structurally invisible to it and never flagged. Run
it after editing content: it is the same surface the Fan Forecast, roster and
Analysis refreshes touch.

`npm run check:articles` (`src/lib/checks/articles.ts`) carries the other half of
Rule 5: it compares Analysis articles against each other and fails when one phrase
does the same job in three or more of them. That is the guard against a future run
inventing a fresh formula, which a fixed phrase list cannot catch.

What stays editorial judgment: the italics and quote/roman distinctions (Rule 2),
and whether a move is announced in words nobody has banned yet (Rule 5). Both are
the writer's job.
