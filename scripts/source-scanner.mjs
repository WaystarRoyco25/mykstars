export const CODE = 0;
const COMMENT = 1;
const STRING = 2;

// One pass over the source classifying every index as code, comment, or string,
// with string and template-expression awareness shared by the content guards.
export function contextMap(src) {
  const map = new Uint8Array(src.length);
  let ctx = "code";
  let inTmplExpr = false;
  let braceDepth = 0;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    const next = src[i + 1];
    if (ctx === "line") {
      map[i] = COMMENT;
      if (c === "\n") ctx = "code";
      continue;
    }
    if (ctx === "block") {
      map[i] = COMMENT;
      if (c === "*" && next === "/") {
        map[i + 1] = COMMENT;
        i++;
        ctx = "code";
      }
      continue;
    }
    if (ctx === "sq" || ctx === "dq" || ctx === "tmpl") {
      map[i] = STRING;
      if (c === "\\") {
        if (i + 1 < src.length) map[i + 1] = STRING;
        i++;
        continue;
      }
      if (ctx === "sq" && c === "'") ctx = "code";
      else if (ctx === "dq" && c === '"') ctx = "code";
      else if (ctx === "tmpl") {
        if (c === "`") ctx = "code";
        else if (c === "$" && next === "{") {
          map[i + 1] = CODE;
          i++;
          ctx = "code";
          inTmplExpr = true;
          braceDepth = 1;
        }
      }
      continue;
    }
    // ctx === "code"
    map[i] = CODE;
    if (c === "/" && next === "/") {
      map[i] = COMMENT;
      ctx = "line";
      continue;
    }
    if (c === "/" && next === "*") {
      map[i] = COMMENT;
      ctx = "block";
      continue;
    }
    if (c === "'") {
      map[i] = STRING;
      ctx = "sq";
      continue;
    }
    if (c === '"') {
      map[i] = STRING;
      ctx = "dq";
      continue;
    }
    if (c === "`") {
      map[i] = STRING;
      ctx = "tmpl";
      continue;
    }
    if (inTmplExpr) {
      if (c === "{") braceDepth++;
      else if (c === "}") {
        braceDepth--;
        if (braceDepth === 0) {
          inTmplExpr = false;
          map[i] = STRING;
          ctx = "tmpl";
        }
      }
    }
  }
  return map;
}

export function lineStarts(src) {
  const starts = [0];
  for (let i = 0; i < src.length; i++) if (src[i] === "\n") starts.push(i + 1);
  return starts;
}

export function lineAt(starts, idx) {
  let lo = 0;
  let hi = starts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (starts[mid] <= idx) lo = mid;
    else hi = mid - 1;
  }
  return lo + 1;
}

export function parseNow(file, src) {
  const match = /export const NOW = "([^"]+)"/.exec(src);
  if (!match) {
    console.error(`${file}: cannot find \`export const NOW = "..."\` — nothing to check against.`);
    process.exit(1);
  }
  const iso = match[1];
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) {
    console.error(`${file}: NOW ("${iso}") does not parse as a date.`);
    process.exit(1);
  }
  return { iso, ms };
}
