import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const MONTHLY_MODULE = /^\d{4}-(0[1-9]|1[0-2])\.ts$/;

export interface GeneratedIndexTarget {
  file: string;
  expected: string;
}

export function monthlyModuleIds(directory: string): string[] {
  return readdirSync(directory)
    .filter((name) => MONTHLY_MODULE.test(name))
    .map((name) => name.slice(0, -3))
    .sort((left, right) => left.localeCompare(right));
}

function exportSuffix(id: string): string {
  return id.replace("-", "");
}

export function editionIndexSource(ids: readonly string[]): string {
  const imports = ids.map((id) => `import { edition${exportSuffix(id)} } from "./${id}";`);
  const entries = ids.map((id) => `  edition${exportSuffix(id)},`);
  return [
    `import type { FeedEdition } from "../../lib/types";`,
    ...imports,
    "",
    `export const editions: FeedEdition[] = [`,
    ...entries,
    `];`,
    "",
  ].join("\n");
}

export function pulseIndexSource(ids: readonly string[]): string {
  const imports = ids.map((id) => `import { pulses${exportSuffix(id)} } from "./${id}";`);
  const entries = ids.map((id) => `...pulses${exportSuffix(id)}`);
  return [
    `import type { Pulse } from "../../lib/types";`,
    ...imports,
    "",
    `export const pulses: Pulse[] = [${entries.join(", ")}];`,
    "",
  ].join("\n");
}

export function generatedIndexTargets(root = process.cwd()): GeneratedIndexTarget[] {
  const editionsDirectory = join(root, "src", "content", "editions");
  const pulsesDirectory = join(root, "src", "content", "pulses");
  return [
    {
      file: join(editionsDirectory, "index.ts"),
      expected: editionIndexSource(monthlyModuleIds(editionsDirectory)),
    },
    {
      file: join(pulsesDirectory, "index.ts"),
      expected: pulseIndexSource(monthlyModuleIds(pulsesDirectory)),
    },
  ];
}

export function generatedIndexDrift(root = process.cwd()): GeneratedIndexTarget[] {
  return generatedIndexTargets(root).filter(({ file, expected }) => readFileSync(file, "utf8") !== expected);
}

export function writeGeneratedIndexes(root = process.cwd()): void {
  for (const { file, expected } of generatedIndexTargets(root)) writeFileSync(file, expected, "utf8");
}
