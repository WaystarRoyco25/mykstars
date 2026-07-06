#!/usr/bin/env node
// House-style guard (see docs/style-guide.md): MyKStars content strings carry NO
// em (—) or en (–) dashes (Rule 1), no negation-reveal constructions like
// "It's not X, it's Y" or "Not X. Not Y. Just Z." (Rule 3), and no AI-tell
// phrases like "delve" or "remains to be seen" (Rule 4; the BANNED_PHRASES
// constant below is the canonical banned list).
//
// It is comment-aware: it walks each file character by character and only flags
// content that sits INSIDE a string literal ('...', "...", or `...`). Comments
// are ignored on purpose — the rules govern published copy, not the developer
// prose in comments. This is the surface the recurring Fan Forecast and
// Analysis refreshes touch, so the guard runs against seed.ts by default.
//
// Usage:  node scripts/check-style.mjs [file ...]   (defaults to src/lib/seed.ts)

import { readFileSync } from "node:fs";

const BANNED_DASHES = new Map([
  ["—", "em dash (—)"],
  ["–", "en dash (–)"],
]);

// Rule 3: negation-reveal constructions. Tight on purpose — a positive-first
// trailing contrast ("a floor, not a ceiling") must never match, and a negation
// split from its reveal by a period ("It is not sold out yet. It is close.")
// passes: the comma/semicolon splice IS the tell's cadence.
const CONSTRUCTIONS = [
  {
    // A negated clause spliced by a comma/semicolon onto a pronoun+copula
    // reveal: "that's not adjacent to K-pop; it's a pillar of it".
    re: /(?:\bnot\b|n['’]t\b)[^.;!?]{0,60}?[;,]\s*(?:it|that|this|they|he|she)(?:['’]s|['’]re|\s+(?:is|are|was|were))\s/gi,
    kind: "negation reveal (not X, it's Y)",
  },
  {
    // The "not about X. It's about Y" echo — the repeated "about" is the tell,
    // so this one may cross a period.
    re: /\bnot\s+(?:just\s+|only\s+)?about\b[^.;!?]{1,60}[.;,]\s*(?:it|that|this|they)(?:['’]s|['’]re|\s+(?:is|are))\s+(?:just\s+|simply\s+|really\s+)?about\b/gi,
    kind: "negation reveal (not about X, it's about Y)",
  },
  {
    // Stacked-negation reveal: "Not X. Not Y. Just Z." Sentence-initial, so
    // case-sensitive; "No. 1" is safe (the negation must be followed by a space).
    re: /\b(?:Not?|Never)\s[^.!?]{1,50}\.\s+(?:Not?|Never)\s[^.!?]{1,50}\.\s+(?:Just|Only|Simply|It['’]s|That['’]s)\s/g,
    kind: "stacked-negation reveal (Not X. Not Y. Just Z.)",
  },
];

// Rule 4: AI-tell phrases. This is the canonical banned list — grow it here
// when a new tell shows up, and mirror the change in docs/style-guide.md.
// Deliberate exclusions: bare "landscape" (a real orientation value in seed
// data) and native fashion-desk vocabulary ("iconic", "elevated").
const BANNED_PHRASES = [
  [/\bdelv(?:e|es|ed|ing)\b/gi, '"delve"'],
  [/\btestament to\b/gi, '"testament to"'],
  [/\bever-evolving\b/gi, '"ever-evolving"'],
  [/\bever-changing\b/gi, '"ever-changing"'],
  [/\bremains to be seen\b/gi, '"remains to be seen"'],
  [/\bonly time will tell\b/gi, '"only time will tell"'],
  [/\brich tapestry\b/gi, '"rich tapestry"'],
  [/\btapestry of\b/gi, '"tapestry of"'],
  [/\bin the world of\b/gi, '"in the world of"'],
  [/\bcan(?:not|['’]t) be overstated\b/gi, '"cannot be overstated"'],
  [/\bworth noting\b/gi, '"worth noting"'],
  [/\bdeep dive\b/gi, '"deep dive"'],
  [/\bgame[- ]chang(?:er|ers|ing)\b/gi, '"game-changer"'],
  [/\bin conclusion\b/gi, '"in conclusion"'],
  [/\bat the end of the day\b/gi, '"at the end of the day"'],
];

// Returns a list of { line, col, kind, snippet } for violations inside strings.
function scanFile(file) {
  const src = readFileSync(file, "utf8");
  const hits = [];
  let line = 1;
  let col = 0;
  // ctx: "code" | "line" (//) | "block" (/* */) | "sq" (') | "dq" (") | "tmpl" (`)
  let ctx = "code";
  // Template-literal ${ } expressions drop back into code; track brace depth so a
  // nested quote/backtick inside the expression doesn't desync the scanner.
  let inTmplExpr = false;
  let braceDepth = 0;
  // The current string literal's text plus each character's source position, so
  // construction/phrase matches can be reported at their exact line:col. Dashes
  // are flagged per character; runs are checked when the literal closes.
  let run = null; // { text: string[], pos: { line, col }[] }

  const flushRun = () => {
    if (!run || run.text.length === 0) {
      run = null;
      return;
    }
    const text = run.text.join("");
    const report = (idx, matched, kind) => {
      const at = run.pos[idx];
      const snippet = (text.slice(Math.max(0, idx - 20), idx) + matched)
        .replace(/\s+/g, " ")
        .trim()
        .slice(-72);
      hits.push({ line: at.line, col: at.col, kind, snippet });
    };
    for (const { re, kind } of CONSTRUCTIONS) {
      for (const m of text.matchAll(re)) report(m.index, m[0], kind);
    }
    for (const [re, label] of BANNED_PHRASES) {
      for (const m of text.matchAll(re)) report(m.index, m[0], `AI-tell phrase (${label})`);
    }
    run = null;
  };

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    const next = src[i + 1];
    if (c === "\n") {
      line++;
      col = 0;
    } else {
      col++;
    }

    if (ctx === "line") {
      if (c === "\n") ctx = "code";
      continue;
    }
    if (ctx === "block") {
      if (c === "*" && next === "/") {
        i++;
        col++;
        ctx = "code";
      }
      continue;
    }

    if (ctx === "sq" || ctx === "dq" || ctx === "tmpl") {
      if (c === "\\") {
        // Keep the escaped character so words stay contiguous for the regexes.
        if (i + 1 < src.length) {
          run.text.push(src[i + 1]);
          run.pos.push({ line, col });
        }
        i++;
        col++;
        continue;
      }
      if ((ctx === "sq" && c === "'") || (ctx === "dq" && c === '"') || (ctx === "tmpl" && c === "`")) {
        flushRun();
        ctx = "code";
        continue;
      }
      if (ctx === "tmpl" && c === "$" && next === "{") {
        flushRun(); // check each template segment on its own
        i++;
        col++;
        ctx = "code";
        inTmplExpr = true;
        braceDepth = 1;
        continue;
      }
      if (BANNED_DASHES.has(c)) {
        hits.push({
          line,
          col,
          kind: BANNED_DASHES.get(c),
          snippet: src.slice(Math.max(0, i - 32), i + 12).replace(/\s+/g, " ").trim(),
        });
      }
      run.text.push(c);
      run.pos.push({ line, col });
      continue;
    }

    // ctx === "code"
    if (c === "/" && next === "/") {
      ctx = "line";
      i++;
      col++;
      continue;
    }
    if (c === "/" && next === "*") {
      ctx = "block";
      i++;
      col++;
      continue;
    }
    if (c === "'") {
      ctx = "sq";
      run = { text: [], pos: [] };
      continue;
    }
    if (c === '"') {
      ctx = "dq";
      run = { text: [], pos: [] };
      continue;
    }
    if (c === "`") {
      ctx = "tmpl";
      run = { text: [], pos: [] };
      continue;
    }
    if (inTmplExpr) {
      if (c === "{") braceDepth++;
      else if (c === "}") {
        braceDepth--;
        if (braceDepth === 0) {
          inTmplExpr = false;
          ctx = "tmpl"; // back into the template literal
          run = { text: [], pos: [] };
        }
      }
    }
  }
  flushRun(); // unterminated-string safety
  hits.sort((a, b) => a.line - b.line || a.col - b.col);
  return hits;
}

const targets = process.argv.slice(2);
const files = targets.length ? targets : ["src/lib/seed.ts"];

let total = 0;
for (const file of files) {
  for (const hit of scanFile(file)) {
    total++;
    console.error(`${file}:${hit.line}:${hit.col}  ${hit.kind}  …${hit.snippet}…`);
  }
}

if (total > 0) {
  console.error(
    `\n✖ Found ${total} house-style violation${total > 1 ? "s" : ""} in content strings. ` +
      `Recast per docs/style-guide.md (dashes: Rule 1; negation reveals: Rule 3; ` +
      `AI-tell phrases: Rule 4).`,
  );
  process.exit(1);
}
console.log(`✓ No house-style violations in content strings (${files.join(", ")}).`);
