#!/usr/bin/env node

import { contentFiles } from "./content-files";
import { pathToFileURL } from "node:url";
import {
  lineAndColumn,
  readTypeScriptSource,
  sourceStringTokens,
  type TypeScriptSource,
} from "./typescript-source";

const BANNED_DASHES = new Map([
  ["—", "em dash (—)"],
  ["–", "en dash (–)"],
]);

const CONSTRUCTIONS = [
  {
    re: /(?:\bnot\b|n['’]t\b)[^.;!?]{0,60}?[;,]\s*(?:it|that|this|they|he|she)(?:['’]s|['’]re|\s+(?:is|are|was|were))\s/gi,
    kind: "negation reveal (not X, it's Y)",
  },
  {
    re: /\bnot\s+(?:just\s+|only\s+)?about\b[^.;!?]{1,60}[.;,]\s*(?:it|that|this|they)(?:['’]s|['’]re|\s+(?:is|are))\s+(?:just\s+|simply\s+|really\s+)?about\b/gi,
    kind: "negation reveal (not about X, it's about Y)",
  },
  {
    re: /\b(?:Not?|Never)\s[^.!?]{1,50}\.\s+(?:Not?|Never)\s[^.!?]{1,50}\.\s+(?:Just|Only|Simply|It['’]s|That['’]s)\s/g,
    kind: "stacked-negation reveal (Not X. Not Y. Just Z.)",
  },
];

export const BANNED_PHRASES: ReadonlyArray<readonly [RegExp, string]> = [
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

/**
 * Style-guide Rule 5. The playbooks name their own machinery so a writer knows which
 * move to make; transcribing those names into the copy announces the move instead of
 * making it. Each pattern bans the presentative frame, never the bare noun: `checkpoint`,
 * `bullish` and `counterargument` all have honest uses, and a blanket ban would force
 * worse copy than it prevents.
 *
 * This list is the floor, not the rule. A fresh synonym for an announced move ("The most
 * damning rebuttal is") breaks Rule 5 whether or not it is caught here; the cross-article
 * repetition check in src/lib/checks/articles.ts is the backstop for the ones that are not.
 */
export const ANNOUNCED_MOVES: ReadonlyArray<readonly [RegExp, string]> = [
  // Analysis playbook rule 3: make the steelman, never introduce it.
  [
    /\b(?:the|a|its|one)\s+(?:strongest|best|biggest|most\s+(?:serious|compelling|obvious|significant|damning))\s+(?:counter\w*|opposing\s+\w+|objection|rebuttal)\b/gi,
    '"the strongest counterargument"',
  ],
  // Analysis playbook rule 8: name the dated event and the number, never the label.
  [
    /\b(?:is|are|provides?|sets?|offers?|marks?|supplies|gives?|becomes?|remains?|uses?)\s+the\s+checkpoint\b/gi,
    '"provides the checkpoint"',
  ],
  [/\bthe\s+checkpoint\s+(?:is|are|sits|comes|arrives|lands|uses|will)\b/gi, '"the checkpoint is"'],
  // Analysis playbook rule 5: a piece shows its side by arguing it, never by labelling itself.
  [/\b(?:the|this|that|a|our)\s+(?:bullish|bearish)\s+(?:\w+\s+)?call\b/gi, '"the bullish call"'],
];

export interface StyleViolation {
  line: number;
  column: number;
  kind: string;
  snippet: string;
}

export function scanHouseStyleSource(source: TypeScriptSource): StyleViolation[] {
  const violations: StyleViolation[] = [];
  for (const token of sourceStringTokens(source)) {
    const report = (index: number, matched: string, kind: string) => {
      const offset = token.offsets[index] ?? token.offsets[0] ?? 0;
      const { line, column } = lineAndColumn(source, offset);
      const snippet = (token.text.slice(Math.max(0, index - 20), index) + matched)
        .replace(/\s+/g, " ")
        .trim()
        .slice(-72);
      violations.push({ line, column, kind, snippet });
    };

    for (const [dash, kind] of BANNED_DASHES) {
      let index = token.text.indexOf(dash);
      while (index !== -1) {
        report(index, dash, kind);
        index = token.text.indexOf(dash, index + dash.length);
      }
    }
    for (const { re, kind } of CONSTRUCTIONS) {
      for (const match of token.text.matchAll(re)) {
        report(match.index, match[0], kind);
      }
    }
    for (const [re, label] of BANNED_PHRASES) {
      for (const match of token.text.matchAll(re)) {
        report(match.index, match[0], `AI-tell phrase (${label})`);
      }
    }
    for (const [re, label] of ANNOUNCED_MOVES) {
      for (const match of token.text.matchAll(re)) {
        report(match.index, match[0], `announced move (${label})`);
      }
    }
  }
  return violations.sort((left, right) =>
    left.line - right.line || left.column - right.column,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const targets = process.argv.slice(2);
  const files = targets.length > 0 ? targets : contentFiles();
  let total = 0;
  for (const file of files) {
    const source = readTypeScriptSource(file);
    for (const violation of scanHouseStyleSource(source)) {
      total += 1;
      console.error(
        `${file}:${violation.line}:${violation.column}  ${violation.kind}  …${violation.snippet}…`,
      );
    }
  }

  if (total > 0) {
    console.error(
      `\n✖ Found ${total} house-style violation${total > 1 ? "s" : ""} in content strings. ` +
        "Recast per docs/style-guide.md (dashes: Rule 1; negation reveals: Rule 3; " +
        "AI-tell phrases: Rule 4; announced moves: Rule 5).",
    );
    process.exitCode = 1;
  } else {
    console.log(
      `✓ No house-style violations in content strings (${files.length === 1 ? files[0] : `${files.length} content files`}).`,
    );
  }
}
