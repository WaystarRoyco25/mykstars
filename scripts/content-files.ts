import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

export const CONTENT_DIR = "src/content";

export function contentFiles(): string[] {
  const output: string[] = [];
  const walk = (directory: string) => {
    for (const name of readdirSync(directory).sort()) {
      const path = join(directory, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (name.endsWith(".ts")) output.push(path);
    }
  };
  walk(CONTENT_DIR);
  return output;
}
