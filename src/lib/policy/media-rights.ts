import type { RightsBasis } from "../domain/media";

export const ALL_RIGHTS_BASES = Object.freeze([
  "cc-by",
  "cc-by-sa",
  "public-domain",
  "agency-press-kit",
  "official-embed",
  "licensed",
  "owner-supplied",
] as const satisfies readonly RightsBasis[]);

export const STORED_IMAGE_RIGHTS_BASES = Object.freeze([
  "cc-by",
  "cc-by-sa",
  "public-domain",
  "agency-press-kit",
] as const satisfies readonly RightsBasis[]);

export const PROFILE_HERO_RIGHTS_BASES = Object.freeze([
  ...STORED_IMAGE_RIGHTS_BASES,
  "official-embed",
] as const satisfies readonly RightsBasis[]);

export const COMMONS_DISCOVERY_RIGHTS_BASES = Object.freeze([
  "cc-by",
  "cc-by-sa",
  "public-domain",
] as const satisfies readonly RightsBasis[]);

export function isRightsBasisIn(
  basis: RightsBasis,
  allowed: readonly RightsBasis[],
): boolean {
  return allowed.includes(basis);
}
