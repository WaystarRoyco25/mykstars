#!/usr/bin/env node
// House-style guard (see docs/style-guide.md): MyKStars content carries NO em (—)
// or en (–) dashes. This scans the string literals of the seed content for them.
//
// It is comment-aware: it walks each file character by character and only flags a
// dash that sits INSIDE a string literal ('...', "...", or `...`). Dashes in code
// comments are ignored on purpose — the rule governs published copy, not the
// developer prose in comments. This is the surface the recurring Fan Forecast
// update touches, so the guard runs against seed.ts by default.
//
// Usage:  node scripts/check-dashes.mjs [file ...]   (defaults to src/lib/seed.ts)

import { readFileSync } from "node:fs";

const BANNED = new Map([
  ["—", "em dash (—)"],
  ["–", "en dash (–)"],
]);

// Returns a list of { line, col, kind, snippet } for banned dashes inside strings.
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
      }
      if (c === "*" && next === "/") ctx = "code";
      continue;
    }

    if (ctx === "sq" || ctx === "dq" || ctx === "tmpl") {
      if (c === "\\") {
        i++;
        col++;
        continue; // skip the escaped character
      }
      if (BANNED.has(c)) {
        hits.push({
          line,
          col,
          kind: BANNED.get(c),
          snippet: src.slice(Math.max(0, i - 32), i + 12).replace(/\s+/g, " ").trim(),
        });
      }
      if (ctx === "sq" && c === "'") ctx = "code";
      else if (ctx === "dq" && c === '"') ctx = "code";
      else if (ctx === "tmpl") {
        if (c === "`") ctx = "code";
        else if (c === "$" && next === "{") {
          i++;
          col++;
          ctx = "code";
          inTmplExpr = true;
          braceDepth = 1;
        }
      }
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
      continue;
    }
    if (c === '"') {
      ctx = "dq";
      continue;
    }
    if (c === "`") {
      ctx = "tmpl";
      continue;
    }
    if (inTmplExpr) {
      if (c === "{") braceDepth++;
      else if (c === "}") {
        braceDepth--;
        if (braceDepth === 0) {
          inTmplExpr = false;
          ctx = "tmpl"; // back into the template literal
        }
      }
    }
  }
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
    `\n✖ Found ${total} em/en dash${total > 1 ? "es" : ""} in content strings. ` +
      `House style bans them — recast with a comma, colon, period, or parentheses ` +
      `(see docs/style-guide.md).`,
  );
  process.exit(1);
}
console.log(`✓ No em/en dashes in content strings (${files.join(", ")}).`);
