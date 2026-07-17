#!/usr/bin/env node
import { mediaAssets } from "../src/content/media-assets";
import { NOW } from "../src/content/now";
import { authoredArtists } from "../src/content/profiles";
import { authoredPulses202607 } from "../src/content/pulses/2026-07";
import {
  checkMedia,
  type AuthoredImageUse,
} from "../src/lib/checks/media";
import { formatIssue } from "../src/lib/checks/result";

const imageUses: AuthoredImageUse[] = [];
for (const artist of authoredArtists) {
  if (artist.hero?.kind === "image") {
    imageUses.push({
      file: "src/content/profiles.ts",
      owner: `${artist.slug} hero`,
      image: artist.hero,
    });
  }
}
for (const pulse of authoredPulses202607) {
  if (pulse.media?.kind === "image") {
    imageUses.push({
      file: "src/content/pulses/2026-07.ts",
      owner: `${pulse.slug} media`,
      image: pulse.media,
    });
  }
}

const result = checkMedia({ assets: mediaAssets, imageUses, nowIso: NOW });
if (result.issues.length > 0) {
  for (const value of result.issues) console.error(formatIssue(value));
  console.error(
    `\n✖ Found ${result.issues.length} media issue${result.issues.length === 1 ? "" : "s"}. Stored images need permitted, current rights records and authored references.`,
  );
  process.exitCode = 1;
} else {
  console.log(
    `✓ Media rights OK (${result.assetCount} assets; ${result.imageCount} authored image references; ${result.usedAssetCount} assets used).`,
  );
}
