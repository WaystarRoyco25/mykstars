import { readFileSync } from "node:fs";

import ts from "typescript";

export interface TypeScriptSource {
  file: string;
  text: string;
  sourceFile: ts.SourceFile;
}

export interface SourceStringToken {
  text: string;
  offsets: readonly number[];
}

export function readTypeScriptSource(file: string): TypeScriptSource {
  const text = readFileSync(file, "utf8");
  return {
    file,
    text,
    sourceFile: ts.createSourceFile(
      file,
      text,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    ),
  };
}

function tokenContentBounds(kind: ts.SyntaxKind, raw: string): [number, number] {
  switch (kind) {
    case ts.SyntaxKind.StringLiteral:
    case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
      return [1, Math.max(1, raw.length - 1)];
    case ts.SyntaxKind.TemplateHead:
      return [1, Math.max(1, raw.length - 2)];
    case ts.SyntaxKind.TemplateMiddle:
      return [1, Math.max(1, raw.length - 2)];
    case ts.SyntaxKind.TemplateTail:
      return [1, Math.max(1, raw.length - 1)];
    default:
      return [0, raw.length];
  }
}

function decodeSegment(
  raw: string,
  absoluteStart: number,
  from: number,
  to: number,
): SourceStringToken {
  let text = "";
  const offsets: number[] = [];
  const append = (value: string, offset: number) => {
    text += value;
    for (let index = 0; index < value.length; index++) offsets.push(offset);
  };

  for (let index = from; index < to; index++) {
    const char = raw[index];
    if (char !== "\\" || index + 1 >= to) {
      append(char, absoluteStart + index);
      continue;
    }

    const escapeOffset = absoluteStart + index;
    const next = raw[index + 1];
    if (next === "\n") {
      index += 1;
      continue;
    }
    if (next === "\r") {
      index += raw[index + 2] === "\n" ? 2 : 1;
      continue;
    }

    const simple: Record<string, string> = {
      "0": "\0",
      b: "\b",
      f: "\f",
      n: "\n",
      r: "\r",
      t: "\t",
      v: "\v",
    };
    if (simple[next] !== undefined) {
      append(simple[next], escapeOffset);
      index += 1;
      continue;
    }

    if (next === "x" && /^[0-9a-fA-F]{2}$/.test(raw.slice(index + 2, index + 4))) {
      append(String.fromCharCode(Number.parseInt(raw.slice(index + 2, index + 4), 16)), escapeOffset);
      index += 3;
      continue;
    }
    if (next === "u") {
      const braced = /^\{([0-9a-fA-F]+)\}/.exec(raw.slice(index + 2, to));
      if (braced) {
        append(String.fromCodePoint(Number.parseInt(braced[1], 16)), escapeOffset);
        index += braced[0].length + 1;
        continue;
      }
      const digits = raw.slice(index + 2, index + 6);
      if (/^[0-9a-fA-F]{4}$/.test(digits)) {
        append(String.fromCharCode(Number.parseInt(digits, 16)), escapeOffset);
        index += 5;
        continue;
      }
    }

    append(next, escapeOffset);
    index += 1;
  }
  return { text, offsets };
}

export function sourceStringTokens(source: TypeScriptSource): SourceStringToken[] {
  const tokens: SourceStringToken[] = [];
  const visit = (node: ts.Node) => {
    if (
      ts.isStringLiteralLike(node) ||
      node.kind === ts.SyntaxKind.TemplateHead ||
      node.kind === ts.SyntaxKind.TemplateMiddle ||
      node.kind === ts.SyntaxKind.TemplateTail
    ) {
      const tokenStart = node.getStart(source.sourceFile);
      const raw = source.text.slice(tokenStart, node.getEnd());
      const [from, to] = tokenContentBounds(node.kind, raw);
      tokens.push(decodeSegment(raw, tokenStart, from, to));
    }
    ts.forEachChild(node, visit);
  };
  visit(source.sourceFile);
  return tokens;
}

export function lineAndColumn(
  source: TypeScriptSource,
  offset: number,
): { line: number; column: number } {
  const position = source.sourceFile.getLineAndCharacterOfPosition(offset);
  return { line: position.line + 1, column: position.character + 1 };
}

export { ts };
