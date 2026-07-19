import type { Artist } from "../domain/artists";
import type { EditionBand, EditionPlan } from "../domain/editions";
import type { Pillar } from "../domain/taxonomy";
import { EditionConstraintError } from "./constraints";
import { clipRailPresentation } from "./descriptors";
import { hash32 } from "./deterministic";
import type {
  AssignedBand,
  Candidate,
  ChunkSpec,
} from "./engine-internal";

function overlap(a: readonly string[], b: readonly string[]): boolean {
  const right = new Set(b);
  return a.some((slug) => right.has(slug));
}

function commonPillar(candidates: readonly Candidate[]): Pillar | undefined {
  const pillars = new Set(candidates.map((candidate) => candidate.pillar).filter((pillar): pillar is Pillar => Boolean(pillar)));
  return pillars.size === 1 && candidates.every((candidate) => candidate.pillar) ? [...pillars][0] : undefined;
}

function bandPillar(
  spec: ChunkSpec,
  candidates: readonly Candidate[],
): Pillar | undefined {
  if (spec.kind === "gallery-band") return spec.fixedPillar;
  if (spec.kind === "analysis" || spec.kind === "ranking") return commonPillar(candidates);
  return undefined;
}

function slug(candidate: Candidate): string {
  if ("slug" in candidate.item) return candidate.item.slug;
  throw new EditionConstraintError("band-rendering", `${candidate.key} has no slug`);
}

function clipId(candidate: Candidate): string {
  if (candidate.item.format === "clip") return candidate.item.id;
  throw new EditionConstraintError("band-rendering", `${candidate.key} has no clip id`);
}

function renderBand(
  spec: ChunkSpec,
  candidates: Candidate[],
  pillar?: Pillar,
): EditionBand {
  switch (spec.kind) {
    case "hero": {
      const candidate = candidates[0];
      if (candidate.format === "gallery") return { kind: "hero", gallerySlug: slug(candidate) };
      return { kind: "hero", clipId: clipId(candidate) };
    }
    case "event-rail": return { kind: "event-rail", eventSlugs: candidates.map(slug) };
    case "gallery-band": {
      if (!spec.fixedPillar) throw new EditionConstraintError("gallery-band", "a gallery band has no pillar");
      return { kind: "gallery-band", pillar: spec.fixedPillar, gallerySlugs: candidates.map(slug) };
    }
    case "clip-rail": {
      const presentation = clipRailPresentation(
        candidates.map((candidate) => candidate.clipGenre),
      );
      return { kind: "clip-rail", presentation, clipIds: candidates.map(clipId) };
    }
    case "ranking": return { kind: "ranking", slug: slug(candidates[0]) };
    case "analysis": return { kind: "analysis", ...(pillar ? { pillar } : {}), articleSlugs: candidates.map(slug) };
    case "pulse-band": return { kind: "pulse-band", pulseSlugs: candidates.map(slug) };
    case "forecast-rail": return { kind: "forecast-rail", predictionSlugs: candidates.map(slug) };
    case "spotlight-strip": return { kind: "spotlight-strip" };
  }
}

function bandOptions(
  spec: ChunkSpec,
  pool: readonly Candidate[],
  previousArtists: readonly string[],
  editionId: string,
): Candidate[][] {
  const eligible = pool.filter((candidate) =>
    (!spec.fixedKey || candidate.key === spec.fixedKey) &&
    (!spec.fixedPillar || candidate.pillar === spec.fixedPillar),
  );
  const options: Candidate[][] = [];
  const used = new Set<string>();
  const path: Candidate[] = [];
  const visit = (lastArtists: readonly string[]) => {
    if (options.length >= 48) return;
    if (path.length === spec.size) {
      options.push([...path]);
      return;
    }
    const choices = eligible
      .filter((candidate) => !used.has(candidate.key) && !overlap(lastArtists, candidate.artistSlugs))
      .sort((a, b) => {
        const pillars = new Set(path.map((candidate) => candidate.pillar));
        const newA = a.pillar && !pillars.has(a.pillar) ? 1 : 0;
        const newB = b.pillar && !pillars.has(b.pillar) ? 1 : 0;
        return newB - newA || b.dateMs - a.dateMs || hash32(`${editionId}:${a.key}`) - hash32(`${editionId}:${b.key}`);
      });
    for (const candidate of choices) {
      used.add(candidate.key);
      path.push(candidate);
      visit(candidate.artistSlugs);
      path.pop();
      used.delete(candidate.key);
      if (options.length >= 48) return;
    }
  };
  visit(previousArtists);
  return options.sort((a, b) => Number(Boolean(commonPillar(a))) - Number(Boolean(commonPillar(b))));
}

export function assignBands(
  schedule: readonly ChunkSpec[],
  selected: readonly Candidate[],
  editionId: string,
): AssignedBand[] | undefined {
  const selectedByKey = new Map(selected.map((candidate) => [candidate.key, candidate]));
  for (let attempt = 0; attempt < 128; attempt++) {
    const remaining = new Set(selected.map((candidate) => candidate.key));
    const assigned: AssignedBand[] = [];
    let previousArtists: string[] = [];
    let lastPillars: Array<Pillar | undefined> = [];
    let failed = false;
    for (let index = 0; index < schedule.length; index++) {
      const spec = schedule[index];
      const pool = [...remaining].map((key) => selectedByKey.get(key)!).filter((candidate) => candidate.format === spec.format);
      const options = bandOptions(spec, pool, previousArtists, `${editionId}:${attempt}:${index}`)
        .filter((candidates) => {
          const pillar = bandPillar(spec, candidates);
          return !(pillar && lastPillars.length >= 2 && lastPillars.at(-1) === pillar && lastPillars.at(-2) === pillar);
        });
      if (options.length === 0) {
        failed = true;
        break;
      }
      const candidates = options[hash32(`${editionId}:${attempt}:${index}`) % Math.min(options.length, 8)];
      const pillar = bandPillar(spec, candidates);
      for (const candidate of candidates) remaining.delete(candidate.key);
      assigned.push({ spec, candidates, ...(pillar ? { pillar } : {}), band: renderBand(spec, candidates, pillar) });
      previousArtists = candidates.at(-1)?.artistSlugs ?? [];
      lastPillars = [...lastPillars, pillar].slice(-2);
    }
    if (!failed && remaining.size === 0) return assigned;
  }
  return undefined;
}

export function makeSpotlight(
  activeArtists: readonly Artist[],
  unseen: ReadonlySet<string>,
  editionId: string,
): EditionPlan["spotlight"] {
  const ordered = [...activeArtists].sort((a, b) => {
    const unseenDifference = Number(unseen.has(b.slug)) - Number(unseen.has(a.slug));
    return unseenDifference || hash32(`${editionId}:spotlight:${a.slug}`) - hash32(`${editionId}:spotlight:${b.slug}`);
  });
  const anchorCount = Math.min(12, ordered.length);
  const anchors = ordered.slice(0, anchorCount).map((artist) => artist.slug);
  const weeks: string[][] = [[], [], [], []];
  ordered.slice(anchorCount).forEach((artist, index) => weeks[index % 4].push(artist.slug));
  return { anchors, weeks };
}
