#!/usr/bin/env node

import { relative } from "node:path";

import { generatedIndexDrift } from "./generated-indexes";

const drift = generatedIndexDrift();
if (drift.length > 0) {
  for (const target of drift) {
    console.error(`${relative(process.cwd(), target.file)} is stale. Regenerate its stable monthly barrel index.`);
  }
  process.exitCode = 1;
} else {
  console.log("✓ Generated Pulse and edition indexes match their monthly files.");
}
