import type { Artist } from "../domain/artists";
import { issue, type CheckIssue } from "./result";

export function validateProfileRelationships(
  artists: readonly Artist[],
  bySlug: ReadonlyMap<string, Artist>,
  file: string,
): CheckIssue[] {
  const issues: CheckIssue[] = [];

  for (const artist of artists) {
    if (artist.memberOf) {
      const group = bySlug.get(artist.memberOf);
      if (!group) {
        issues.push(
          issue(
            file,
            "dangling memberOf",
            `${artist.slug}: memberOf "${artist.memberOf}" matches no profile`,
          ),
        );
      } else if (!(group.members ?? []).includes(artist.slug)) {
        issues.push(
          issue(
            file,
            "one-way relationship",
            `${artist.slug}: memberOf "${artist.memberOf}", but that profile's members list does not name ${artist.slug} back`,
          ),
        );
      }
    }

    for (const memberSlug of artist.members ?? []) {
      const member = bySlug.get(memberSlug);
      if (!member) {
        issues.push(
          issue(
            file,
            "dangling member",
            `${artist.slug}: members entry "${memberSlug}" matches no profile`,
          ),
        );
      } else if (member.memberOf !== artist.slug) {
        issues.push(
          issue(
            file,
            "one-way relationship",
            `${artist.slug}: lists member "${memberSlug}", but that profile's memberOf does not point back`,
          ),
        );
      }
    }
  }

  return issues;
}
