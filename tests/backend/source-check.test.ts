import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { scanHouseStyleSource } from "../../scripts/check-style";
import { readTypeScriptSource } from "../../scripts/typescript-source";

test("the TypeScript source helper ignores comments and regex literals", (t) => {
  const directory = mkdtempSync(join(tmpdir(), "mykstars-style-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const file = join(directory, "content.ts");
  writeFileSync(
    file,
    [
      "// delve — comments are exempt",
      "const pattern = /delve—here/;",
      'export const safe = "Specific sourced copy.";',
      "",
    ].join("\n"),
  );
  assert.deepEqual(scanHouseStyleSource(readTypeScriptSource(file)), []);
});

test("the source helper checks escaped strings and every template segment", (t) => {
  const directory = mkdtempSync(join(tmpdir(), "mykstars-style-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const file = join(directory, "content.ts");
  writeFileSync(
    file,
    [
      'const escaped = "A testament\\x20to weak copy";',
      "const nested = `Safe ${value ? `inner` : other} only time will tell`;",
      "",
    ].join("\n"),
  );
  const violations = scanHouseStyleSource(readTypeScriptSource(file));
  assert.deepEqual(
    violations.map((violation) => violation.kind),
    [
      'AI-tell phrase ("testament to")',
      'AI-tell phrase ("only time will tell")',
    ],
  );
  assert.deepEqual(
    violations.map((violation) => violation.line),
    [1, 2],
  );
});

test("malformed source still produces deterministic literal findings", (t) => {
  const directory = mkdtempSync(join(tmpdir(), "mykstars-style-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const file = join(directory, "content.ts");
  writeFileSync(file, 'export const broken = "delve"; }\n');
  const violations = scanHouseStyleSource(readTypeScriptSource(file));
  assert.equal(violations.length, 1);
  assert.equal(violations[0].line, 1);
});
