import type { Artist } from "../domain/artists";
import type { AuthoredMediaItem, MediaAsset } from "../domain/media";
import {
  PROFILE_HERO_RIGHTS_BASES,
  isRightsBasisIn,
} from "../policy/media-rights";
import { issue, type CheckIssue } from "./result";

export interface AuthoredArtistForCheck extends Omit<Artist, "hero"> {
  hero?: AuthoredMediaItem;
}

export function validateProfileHeroRights(
  artist: Artist,
  label: string,
  authoredBySlug: ReadonlyMap<string, AuthoredArtistForCheck>,
  assetById: ReadonlyMap<string, MediaAsset>,
  file: string,
): CheckIssue[] {
  const authored = authoredBySlug.get(artist.slug);
  if (!authored) {
    return [
      issue(file, "missing authored profile", `${label}: no authored profile record resolves here`),
    ];
  }

  const hero = authored.hero;
  if (artist.publicationState === "published" && hero === undefined) {
    return [
      issue(
        file,
        "missing hero",
        `${label}: a published profile needs a permitted hero (or stays draft): docs/roster-playbook.md`,
      ),
    ];
  }
  if (hero?.kind === "placeholder") {
    return [issue(file, "placeholder hero", `${label}: a placeholder is never a permitted hero`)];
  }
  if (hero?.kind !== "image") return [];

  const asset = assetById.get(hero.assetId);
  if (!asset) {
    return [
      issue(
        file,
        "unregistered hero image",
        `${label}: assetId "${hero.assetId}" matches no media asset`,
      ),
    ];
  }
  if (!isRightsBasisIn(asset.rightsBasis, PROFILE_HERO_RIGHTS_BASES)) {
    return [
      issue(
        file,
        "disallowed hero basis",
        `${label}: asset "${hero.assetId}" has rightsBasis "${asset.rightsBasis}" (allowed: ${PROFILE_HERO_RIGHTS_BASES.join(", ")})`,
      ),
    ];
  }
  return [];
}
