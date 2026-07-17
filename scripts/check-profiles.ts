#!/usr/bin/env node
import { mediaAssets } from "../src/content/media-assets";
import { NOW } from "../src/content/now";
import { predictions } from "../src/content/predictions";
import { artists, authoredArtists } from "../src/content/profiles";
import { rankings } from "../src/content/rankings";
import { checkProfiles } from "../src/lib/checks/profiles";
import { formatIssue } from "../src/lib/checks/result";

const result = checkProfiles({
  artists,
  authoredArtists,
  mediaAssets,
  predictions,
  rankings,
  nowIso: NOW,
});

if (result.issues.length > 0) {
  for (const value of result.issues) console.error(formatIssue(value));
  console.error(
    `\n✖ Found ${result.issues.length} profile issue${result.issues.length === 1 ? "" : "s"}. ` +
      `Profiles carry valid stage/coverage/publication values, fresh verification ` +
      `dates, reciprocal relationships, and permitted heroes (see docs/roster-playbook.md).`,
  );
  process.exitCode = 1;
} else {
  const stageSummary = [...result.stageCounts].map(([name, count]) => `${count} ${name}`).join(", ");
  const coverageSummary = [...result.coverageCounts]
    .map(([name, count]) => `${count} ${name}`)
    .join(", ");
  console.log(
    `✓ Profiles OK (src/content/profiles.ts: ${result.profileCount} profiles: ${stageSummary}; ${coverageSummary}; ${result.draftCount} draft).`,
  );
}
