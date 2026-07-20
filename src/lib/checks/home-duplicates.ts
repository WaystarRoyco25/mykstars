// The home page must never render the same photograph or the same YouTube video
// twice in one pass. This checker walks the resolved home bands (whatever the
// current edition, or the fallback plan, actually paints) and flags any photo or
// video that surfaces more than once.
//
// Identity, not reference, is the point. The site's other uniqueness guards key
// on a content record's slug/id (a gallery slug, a Clip.id), so two different
// records carrying the SAME underlying media slip through them. Here:
//   - a photo is its registry checksum, so a byte-identical file re-hosted under
//     a second assetId counts as the same photograph (falling back to the assetId
//     when a checksum is somehow absent);
//   - a video is its YouTube id, so two Clip.ids pointing at the same upload count
//     as the same video (falling back to the raw embed URL).
//
// Pure and portable: types are erased, and the only runtime imports (the asset
// registry, the YouTube parser) carry no "server-only" marker, so this runs under
// a plain check script and a backend test alike. The server-only resolution lives
// in scripts/check-home-duplicates.ts, which hands the resolved bands in.

import { mediaAssets } from "../../content/media-assets";
import type { MediaItem } from "../domain/media";
import { youtubeId } from "../embeds";
import type { ResolvedHomeBand } from "../home/contract";
import { issue, type CheckIssue } from "./result";

// assetId -> checksum, so two ids for the same bytes collapse to one photograph.
const checksumByAssetId = new Map(
  mediaAssets.map((asset) => [asset.id, asset.checksum]),
);

interface RenderedMedia {
  /** Canonical key: same string means the same photo, or the same video. */
  identity: string;
  /** Human-readable name of the asset/video, for the error message. */
  label: string;
  /** Where on the home page it renders. */
  location: string;
}

export interface HomeDuplicatesResult {
  issues: CheckIssue[];
  /** Every photo/video slot examined, for the success line. */
  mediaCount: number;
}

export function checkHomeDuplicates(
  bands: ReadonlyArray<ResolvedHomeBand>,
): HomeDuplicatesResult {
  const rendered: RenderedMedia[] = [];

  const addPhoto = (assetId: string, location: string) => {
    const checksum = checksumByAssetId.get(assetId);
    rendered.push({ identity: `photo:${checksum ?? assetId}`, label: assetId, location });
  };
  const addVideo = (embedUrl: string, location: string) => {
    const id = youtubeId(embedUrl);
    rendered.push({ identity: `video:${id ?? embedUrl}`, label: id ?? embedUrl, location });
  };
  // A resolved MediaItem paints as a photo (image) or a video (embed); a
  // placeholder points at no real asset, so there is nothing to de-duplicate.
  const addMedia = (item: MediaItem, location: string) => {
    if (item.kind === "image") addPhoto(item.assetId, location);
    else if (item.kind === "embed") addVideo(item.embedUrl, location);
  };

  bands.forEach((band, i) => {
    switch (band.kind) {
      case "hero":
        if (band.hero.kind === "gallery") {
          addMedia(band.hero.gallery.cover, `band[${i}] hero gallery "${band.hero.gallery.slug}"`);
        } else {
          addVideo(band.hero.clip.embedUrl, `band[${i}] hero clip "${band.hero.clip.id}"`);
        }
        break;
      case "gallery-band":
        for (const gallery of band.galleries) {
          addMedia(gallery.cover, `band[${i}] gallery-band gallery "${gallery.slug}"`);
        }
        for (const fill of band.fillEmbeds) addMedia(fill, `band[${i}] gallery-band fill`);
        break;
      case "clip-rail":
        for (const clip of band.clips) {
          addVideo(clip.embedUrl, `band[${i}] clip-rail clip "${clip.id}"`);
        }
        break;
      case "analysis":
        for (const article of band.articles) {
          if (article.media) addMedia(article.media, `band[${i}] analysis article "${article.slug}"`);
        }
        break;
      case "pulse-band":
        for (const pulse of band.pulses) {
          if (pulse.media) addMedia(pulse.media, `band[${i}] pulse-band pulse "${pulse.slug}"`);
        }
        for (const fill of band.fillEmbeds) addMedia(fill, `band[${i}] pulse-band fill`);
        break;
      // event-rail, ranking, forecast-rail, spotlight-strip paint no media.
    }
  });

  const byIdentity = new Map<string, RenderedMedia[]>();
  for (const item of rendered) {
    const group = byIdentity.get(item.identity);
    if (group) group.push(item);
    else byIdentity.set(item.identity, [item]);
  }

  const issues: CheckIssue[] = [];
  for (const group of byIdentity.values()) {
    if (group.length < 2) continue;
    const isPhoto = group[0].identity.startsWith("photo:");
    const names = [...new Set(group.map((entry) => entry.label))].join(" / ");
    const where = group.map((entry) => entry.location).join(", ");
    issues.push(
      issue(
        "home",
        isPhoto ? "duplicate-photo" : "duplicate-video",
        `${isPhoto ? "photo" : "video"} ${names} renders ${group.length}x on the home page: ${where}`,
      ),
    );
  }
  issues.sort((a, b) => a.detail.localeCompare(b.detail));

  return { issues, mediaCount: rendered.length };
}
