# MyKStars house style

Two standing rules for every caption, title, dek, article, ranking, prediction and
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

## Enforcement

`npm run check:style` scans the string literals in `src/lib/seed.ts` and fails on
any em/en dash. It is comment-aware, so developer comments are not flagged. Run it
after editing seed content — it is the same surface the Fan Forecast refresh
touches. The italics and quote/roman distinctions are editorial judgment and are
not machine-checked.
