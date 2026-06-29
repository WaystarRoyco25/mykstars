<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# House style

Every caption, title, dek, article, ranking, prediction and event line on MyKStars, plus the chrome around them (nav, taglines, meta/OG), follows two standing rules, going forward and whenever you edit existing copy. Full guide: [`docs/style-guide.md`](docs/style-guide.md).

1. **No em or en dashes** (`—` `–`). Recast with a comma, colon, period, or parentheses; for a title/brand separator use a middle dot (`%s · MyKStars`). Never fake a dash with a hyphen. The only exception is the decorative `aria-hidden` glyph in `src/components/RankingTable.tsx`. Run `npm run check:style` after editing `src/lib/seed.ts` — it fails on any em/en dash in content strings (comments are exempt).
2. **Italicize the names of works** — books, TV, films, albums, publications, games, stage works — with a markdown-style `*asterisk*` span (e.g. `"Cha Eun-woo for *W Korea*"`); songs and single episodes take `'quotes'`; people, groups, brands and credit bylines stay roman. `renderEmphasis()` / `stripEmphasis()` in `src/lib/text.tsx` handle display vs. plain-text contexts, and every title-bearing field is already routed through them.

# Fan Forecast questions

When updating the Fan Forecast (the `predictions` array in `src/lib/seed.ts`), follow the standing brief in [`docs/forecast-playbook.md`](docs/forecast-playbook.md): maximize engagement through stakes, identity, timing, and rivalry (never private lives), and keep every question resolvable against a dated public source. Verify each artist's current status by web search before writing (the site carries an explicit `NOW` date), and reset test votes with `truncate table votes;` in Supabase. Question copy also follows the [house style](docs/style-guide.md) above: no em/en dashes, and italicize work titles with `*asterisks*`.
