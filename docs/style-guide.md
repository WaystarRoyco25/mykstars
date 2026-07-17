# MyKStars house style

Four standing rules for every caption, title, dek, article, ranking, prediction and
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

Content is stored as plain strings in `src/lib/seed.ts` and rendered as text, so
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

## Enforcement

`npm run check:style` (`scripts/check-style.ts`) scans the string literals in
`src/lib/seed.ts` and fails on any em/en dash (Rule 1), negation-reveal construction
(Rule 3), or banned phrase (Rule 4). It is comment-aware, so developer comments are
not flagged. Run it after editing seed content — it is the same surface the Fan
Forecast and Analysis refreshes touch. The italics and quote/roman distinctions
(Rule 2) are editorial judgment and are not machine-checked.
