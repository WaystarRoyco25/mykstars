// Shared content-file discovery for the check scripts. Content lives in typed,
// versioned files under src/content (docs/roster-playbook.md); the site clock
// NOW lives in exactly one of them. Checkers glob the directory so new files
// (per-month pulses and editions) are covered the moment they exist.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { parseNow } from "./source-scanner.mjs";

export const CONTENT_DIR = "src/content";
export const NOW_FILE = join(CONTENT_DIR, "now.ts");

// Every TypeScript content file, recursively, in a stable sort so counts and
// failure output stay deterministic across runs.
export function contentFiles() {
  const out = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir).sort()) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (name.endsWith(".ts")) out.push(path);
    }
  };
  walk(CONTENT_DIR);
  return out;
}

// The site clock, from its single canonical location.
export function loadNow() {
  return parseNow(NOW_FILE, readFileSync(NOW_FILE, "utf8"));
}
