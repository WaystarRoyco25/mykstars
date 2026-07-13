// Shared object-literal lexing for the content checkers (check-articles,
// check-profiles). Same philosophy as source-scanner.mjs: hand-rolled,
// code-context-aware, and loud about anything it cannot parse — never a
// silent skip.

import { CODE } from "./source-scanner.mjs";

// Find `export const <name>: <Type>[] = [` and return the content span of the
// array literal (exclusive of its brackets). A missing anchor is a hard fail.
export function arrayRange(file, src, map, name) {
  const re = new RegExp(`export const ${name}\\s*:\\s*\\w+\\[\\]\\s*=\\s*\\[`);
  const m = re.exec(src);
  if (!m) {
    console.error(`${file}: cannot find \`export const ${name}: ...[] = [\` — nothing to check.`);
    process.exit(1);
  }
  const open = m.index + m[0].length - 1;
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (map[i] !== CODE) continue;
    const c = src[i];
    if (c === "[") depth++;
    else if (c === "]") {
      depth--;
      if (depth === 0) return { from: open + 1, to: i };
    }
  }
  console.error(`${file}: the ${name} array literal never closes.`);
  process.exit(1);
}

// Top-level `{ ... }` object literal spans within [from, to), code-context only.
export function topLevelObjects(src, map, from, to) {
  const objects = [];
  for (let i = from; i < to; i++) {
    if (map[i] !== CODE || src[i] !== "{") continue;
    let depth = 0;
    let close = -1;
    for (let j = i; j < to; j++) {
      if (map[j] !== CODE) continue;
      if (src[j] === "{") depth++;
      else if (src[j] === "}") {
        depth--;
        if (depth === 0) {
          close = j;
          break;
        }
      }
    }
    if (close === -1) return { objects, malformedAt: i };
    objects.push({ open: i, close });
    i = close;
  }
  return { objects, malformedAt: -1 };
}

// Read the first `key: "..."` string value inside a span, code-context keys only
// (so prose inside body strings can never masquerade as a field).
export function keyString(src, map, from, to, key) {
  const re = new RegExp(`\\b${key}\\s*:\\s*"`, "g");
  const slice = src.slice(from, to);
  let m;
  while ((m = re.exec(slice)) !== null) {
    const keyIdx = from + m.index;
    if (map[keyIdx] !== CODE) continue;
    const quote = from + m.index + m[0].length - 1;
    let j = quote + 1;
    let value = "";
    while (j < to) {
      if (src[j] === "\\") {
        value += src[j + 1] ?? "";
        j += 2;
        continue;
      }
      if (src[j] === '"') return { value, idx: keyIdx };
      value += src[j];
      j++;
    }
    return null; // unterminated — let the caller fail loudly
  }
  return null;
}

// Collect the string items of `key: [ "...", ... ]` inside a span, if present.
// Returns [] when the key is absent, null when the list never closes.
export function keyStringList(src, map, from, to, key) {
  const re = new RegExp(`\\b${key}\\s*:\\s*\\[`, "g");
  const slice = src.slice(from, to);
  let m;
  while ((m = re.exec(slice)) !== null) {
    const keyIdx = from + m.index;
    if (map[keyIdx] !== CODE) continue;
    const open = from + m.index + m[0].length - 1;
    let depth = 0;
    let close = -1;
    for (let i = open; i < to; i++) {
      if (map[i] !== CODE) continue;
      if (src[i] === "[") depth++;
      else if (src[i] === "]") {
        depth--;
        if (depth === 0) {
          close = i;
          break;
        }
      }
    }
    if (close === -1) return null;
    const items = [];
    const listSlice = src.slice(open + 1, close);
    for (const s of listSlice.matchAll(/"((?:[^"\\]|\\.)*)"/g)) items.push(s[1]);
    return items;
  }
  return []; // key absent — nothing to check
}

// Span of the nested object literal that follows `key: {` inside [from, to).
// Returns { open, close }, null when the literal never closes, or undefined
// when the key is absent.
export function keyObject(src, map, from, to, key) {
  const re = new RegExp(`\\b${key}\\s*:\\s*\\{`, "g");
  const slice = src.slice(from, to);
  let m;
  while ((m = re.exec(slice)) !== null) {
    const keyIdx = from + m.index;
    if (map[keyIdx] !== CODE) continue;
    const open = from + m.index + m[0].length - 1;
    let depth = 0;
    for (let i = open; i < to; i++) {
      if (map[i] !== CODE) continue;
      if (src[i] === "{") depth++;
      else if (src[i] === "}") {
        depth--;
        if (depth === 0) return { open, close: i };
      }
    }
    return null; // never closes — caller fails loudly
  }
  return undefined;
}
