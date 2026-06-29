import type { ReactNode } from "react";

// House style (see docs/style-guide.md): the names of standalone works (books,
// TV series, films, albums, publications, games, stage works) are italicized in
// copy using a markdown-style *asterisk* span. Songs, tracks and single episodes
// take 'quotes' typed directly in the copy — no markup. Content carries no literal
// asterisks, so the marker is unambiguous.
//
// These two helpers are the ONLY place that convention is interpreted. Both are
// pure functions with no hooks or browser APIs, so they are safe in server and
// client components alike.
//
//   renderEmphasis("*Squid Game* returns")  → ["", <em>Squid Game</em>, " returns"]
//   stripEmphasis("*Squid Game* returns")   → "Squid Game returns"

// Balanced *...* pair. The capture group is kept by String.split, so the parts
// array alternates plain / emphasized / plain / emphasized ... A lone unmatched
// "*" never matches and stays literal.
const EMPHASIS = /\*([^*]+)\*/;

// For visible JSX: returns a ReactNode with each *...* span wrapped in <em>.
// `italic` is set explicitly so the emphasis renders regardless of CSS resets.
export function renderEmphasis(text: string): ReactNode {
  if (!text.includes("*")) return text;
  return text.split(EMPHASIS).map((part, i) =>
    // Odd indices are the captured (emphasized) runs; even indices are plain.
    i % 2 === 1 ? (
      <em key={i} className="italic">
        {part}
      </em>
    ) : (
      part
    ),
  );
}

// For plain-text contexts (metadata, <img alt>, aria-label, <title>, JSON-LD,
// OG images): drop the markers and return a bare string.
export function stripEmphasis(text: string): string {
  return text.replace(/\*([^*]+)\*/g, "$1");
}
