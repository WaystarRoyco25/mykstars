import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { basename, join, relative } from "node:path";
import test from "node:test";

const STORE_INFRASTRUCTURE = new Set(["immutable.ts", "profile-timeline.ts"]);
const CONTENT_NAME_OVERRIDES: Readonly<Record<string, string>> = {
  artists: "profiles",
  forecasts: "predictions",
};

function typescriptFilesUnder(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return typescriptFilesUnder(path);
    return entry.isFile() && /\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

test("each domain store owns exactly one authored inventory import", () => {
  const root = join(process.cwd(), "src", "lib", "stores");
  for (const file of typescriptFilesUnder(root)) {
    const relativeFile = relative(root, file);
    if (STORE_INFRASTRUCTURE.has(relativeFile)) continue;

    const storeName = basename(file, ".ts");
    const expectedContentModule = CONTENT_NAME_OVERRIDES[storeName] ?? storeName;
    const source = readFileSync(file, "utf8");
    const contentModules = [
      ...source.matchAll(
        /from ["'](?:(?:\.\.\/)+content|@\/content)\/([^"']+)["']/g,
      ),
    ].map((match) => match[1]);
    assert.deepEqual(contentModules, [expectedContentModule], relativeFile);
  }
});

test("production modules do not import the compatibility repository", () => {
  const root = join(process.cwd(), "src");
  const compatibilityFile = join(root, "lib", "content-repository.ts");
  for (const file of typescriptFilesUnder(root)) {
    if (file === compatibilityFile) continue;
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(
      source,
      /(?:from\s+|import\s*\()["'][^"']*content-repository["']/,
      relative(root, file),
    );
  }
});
