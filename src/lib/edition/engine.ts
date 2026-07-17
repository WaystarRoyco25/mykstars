import type {
  Artist,
  ClipGenre,
  EditionBand,
  EditionPlan,
  FeedItem,
  Pillar,
} from "../types";
import { isPromotedArtist } from "../editorial-policy";
import {
  CELEBRITY_CAP_RATIO,
  EditionConstraintError,
  MAX_EDITION_ITEMS,
  MIN_EDITION_ITEMS,
  assertNoViolations,
  flattenEdition,
  itemKey,
  type ContentFeedFormat,
} from "./constraints";
import { clipRailPresentation } from "./descriptors";
import {
  EDITORIAL_TARGET_ITEMS,
  EVENT_RAIL_SIZE,
  MAX_ARTICLES,
  MIN_ARTICLES,
  MIN_CLIPS,
  MIN_FORECASTS,
  MIN_PULSES,
  MIN_RANKINGS,
  activeRosterSnapshot,
  assertUniqueInventory,
  buildInventoryFacts,
  isInventoryFactEligible,
  parseEditionDate,
  type EditionInventoryInput,
} from "./inventory";
import { validateEditionSemantics } from "./semantic";

export interface EditionEngineInput extends EditionInventoryInput {
  publishedAt: string;
  trailingEditions: readonly EditionPlan[];
}

interface Candidate {
  item: FeedItem;
  key: string;
  format: ContentFeedFormat;
  artistSlugs: string[];
  pillar?: Pillar;
  dateMs: number;
  tie: number;
  clipGenre?: ClipGenre;
}

type CandidateDraft = Omit<Candidate, "tie">;

interface ChunkSpec {
  signature: string;
  format: ContentFeedFormat;
  kind: EditionBand["kind"];
  size: number;
  fixedPillar?: Pillar;
  fixedKey?: string;
}

interface AssignedBand {
  spec: ChunkSpec;
  candidates: Candidate[];
  pillar?: Pillar;
  band: EditionBand;
}

type FormatCounts = Record<ContentFeedFormat, number>;

function hash32(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function attachTies(drafts: CandidateDraft[], editionId: string): Candidate[] {
  const random = mulberry32(hash32(editionId));
  const ties = new Map<string, number>();
  for (const key of drafts.map((draft) => draft.key).sort()) ties.set(key, random());
  return drafts.map((draft) => ({ ...draft, tie: ties.get(draft.key) ?? 0 }));
}

function byFormat(candidates: readonly Candidate[]): Record<ContentFeedFormat, Candidate[]> {
  const groups: Record<ContentFeedFormat, Candidate[]> = {
    pulse: [], gallery: [], clip: [], event: [], forecast: [], ranking: [], article: [],
  };
  for (const candidate of candidates) groups[candidate.format].push(candidate);
  return groups;
}

function inventoryMinimums(groups: Record<ContentFeedFormat, Candidate[]>): void {
  const requirements: Array<[ContentFeedFormat, number, string]> = [
    ["pulse", MIN_PULSES, "the monthly Pulse share"],
    ["clip", MIN_CLIPS, "the official-video floor"],
    ["event", EVENT_RAIL_SIZE, "one eight-item event rail"],
    ["forecast", MIN_FORECASTS, "two three-item forecast rails"],
    ["ranking", MIN_RANKINGS, "format diversity"],
    ["article", MIN_ARTICLES, "the Analysis floor"],
  ];
  for (const [format, minimum, reason] of requirements) {
    if (groups[format].length < minimum) {
      throw new EditionConstraintError(
        `${format}-inventory`,
        `${groups[format].length} eligible ${format} item${groups[format].length === 1 ? "" : "s"}; need at least ${minimum} for ${reason}`,
      );
    }
  }
}

function contentCoverage(
  edition: EditionPlan,
  candidateByKey: ReadonlyMap<string, Candidate>,
): Set<string> {
  const covered = new Set<string>();
  for (const item of flattenEdition(edition)) {
    for (const slug of candidateByKey.get(itemKey(item))?.artistSlugs ?? []) covered.add(slug);
  }
  return covered;
}

function allocateCore(
  total: number,
  secondary: number,
  groups: Record<ContentFeedFormat, Candidate[]>,
): Pick<FormatCounts, "pulse" | "gallery" | "clip">[] {
  const remaining = total - secondary;
  const photoTarget = Math.floor(total * 0.25);
  const pulseTarget = Math.round(total * 0.30);
  const options: Array<Pick<FormatCounts, "pulse" | "gallery" | "clip"> & { score: number }> = [];
  for (let gallery = 0; gallery <= Math.min(groups.gallery.length, photoTarget, remaining); gallery++) {
    for (let clip = MIN_CLIPS; clip <= Math.min(groups.clip.length, remaining - gallery); clip++) {
      const pulse = remaining - gallery - clip;
      if (pulse < MIN_PULSES || pulse > groups.pulse.length || !canPartition(pulse, 4, 6)) continue;
      const expectedGallery = Math.min(groups.gallery.length, photoTarget);
      const clipTarget = Math.round(total * 0.25) + (photoTarget - gallery);
      const substitutedPulseTarget = pulseTarget + Math.max(0, clipTarget - groups.clip.length);
      const score = Math.abs(gallery - expectedGallery) * 20 + Math.abs(clip - clipTarget) * 4 + Math.abs(pulse - substitutedPulseTarget) * 3;
      options.push({ pulse, gallery, clip, score });
    }
  }
  return options
    .sort((a, b) => a.score - b.score || b.gallery - a.gallery || b.clip - a.clip || b.pulse - a.pulse)
    .map((option) => ({ pulse: option.pulse, gallery: option.gallery, clip: option.clip }));
}

function secondaryOptions(total: number, groups: Record<ContentFeedFormat, Candidate[]>): Array<Pick<FormatCounts, "event" | "forecast" | "ranking" | "article">> {
  const options: Array<Pick<FormatCounts, "event" | "forecast" | "ranking" | "article"> & { score: number }> = [];
  const forecastMax = Math.min(12, groups.forecast.length - (groups.forecast.length % 3));
  for (let forecast = MIN_FORECASTS; forecast <= forecastMax; forecast += 3) {
    for (let ranking = MIN_RANKINGS; ranking <= Math.min(2, groups.ranking.length); ranking++) {
      for (let article = MIN_ARTICLES; article <= Math.min(MAX_ARTICLES, groups.article.length); article++) {
        const count = EVENT_RAIL_SIZE + forecast + ranking + article;
        options.push({
          event: EVENT_RAIL_SIZE,
          forecast,
          ranking,
          article,
          score: Math.abs(count / total - 0.20) * 100 - forecast * 0.03 - ranking * 0.02 - article * 0.01,
        });
      }
    }
  }
  // The rolling four-format rule is hard, while the combined secondary share
  // is an editorial target. Long event and forecast rails need enough distinct
  // one-item band boundaries around them to make that rolling rule feasible,
  // so search the richest boundary plans first and use distance from the
  // approved 20 percent share to rank plans with equal scheduling flexibility.
  const boundaryCount = (option: Pick<FormatCounts, "forecast" | "ranking" | "article">) =>
    option.forecast / 3 + option.ranking + option.article;
  return options.sort((a, b) =>
    boundaryCount(b) - boundaryCount(a) || a.score - b.score ||
    a.forecast - b.forecast || a.ranking - b.ranking || a.article - b.article,
  ).map((option) => ({
    event: option.event,
    forecast: option.forecast,
    ranking: option.ranking,
    article: option.article,
  }));
}

function selectCandidates(
  groups: Record<ContentFeedFormat, Candidate[]>,
  counts: FormatCounts,
  active: ReadonlySet<string>,
  unseen: ReadonlySet<string>,
  required: ReadonlySet<string>,
  total: number,
  editionId: string,
  attempt: number,
): Candidate[] | undefined {
  const cap = Math.floor(total * CELEBRITY_CAP_RATIO);
  const remaining: FormatCounts = { ...counts };
  const selected: Candidate[] = [];
  const selectedKeys = new Set<string>();
  const selectedArtists = new Set<string>();
  const artistCounts = new Map<string, number>();

  while (selected.length < total) {
    const choices = Object.values(groups).flat().filter((candidate) => {
      if (selectedKeys.has(candidate.key) || remaining[candidate.format] <= 0) return false;
      return candidate.artistSlugs.every((slug) => (artistCounts.get(slug) ?? 0) < cap);
    });
    if (choices.length === 0) return undefined;
    choices.sort((a, b) => {
      const requiredA = a.artistSlugs.filter((slug) => required.has(slug) && !selectedArtists.has(slug)).length;
      const requiredB = b.artistSlugs.filter((slug) => required.has(slug) && !selectedArtists.has(slug)).length;
      if (requiredA !== requiredB) return requiredB - requiredA;
      const unseenA = a.artistSlugs.filter((slug) => unseen.has(slug) && !selectedArtists.has(slug)).length;
      const unseenB = b.artistSlugs.filter((slug) => unseen.has(slug) && !selectedArtists.has(slug)).length;
      if (unseenA !== unseenB) return unseenB - unseenA;
      const newA = a.artistSlugs.filter((slug) => active.has(slug) && !selectedArtists.has(slug)).length;
      const newB = b.artistSlugs.filter((slug) => active.has(slug) && !selectedArtists.has(slug)).length;
      if (newA !== newB) return newB - newA;
      const urgencyA = remaining[a.format] / Math.max(1, groups[a.format].filter((candidate) => !selectedKeys.has(candidate.key)).length);
      const urgencyB = remaining[b.format] / Math.max(1, groups[b.format].filter((candidate) => !selectedKeys.has(candidate.key)).length);
      if (urgencyA !== urgencyB) return urgencyB - urgencyA;
      if (a.format === b.format && a.dateMs !== b.dateMs) {
        return a.format === "event" ? a.dateMs - b.dateMs : b.dateMs - a.dateMs;
      }
      return hash32(`${editionId}:${attempt}:${a.key}`) - hash32(`${editionId}:${attempt}:${b.key}`) || a.tie - b.tie;
    });
    const choice = choices[0];
    selected.push(choice);
    selectedKeys.add(choice.key);
    remaining[choice.format]--;
    for (const slug of choice.artistSlugs) {
      selectedArtists.add(slug);
      artistCounts.set(slug, (artistCounts.get(slug) ?? 0) + 1);
    }
  }
  if (Object.values(remaining).some((count) => count !== 0)) return undefined;
  if ([...required].some((slug) => !selectedArtists.has(slug))) return undefined;
  return selected;
}

function canPartition(total: number, minimum: number, maximum: number): boolean {
  if (total === 0) return true;
  for (let parts = 1; parts <= total; parts++) {
    if (parts * minimum <= total && parts * maximum >= total) return true;
  }
  return false;
}

function partitionSizes(total: number, minimum: number, maximum: number): number[] {
  if (total === 0) return [];
  let parts = Math.ceil(total / maximum);
  while (parts > 0 && parts * minimum > total) parts--;
  if (parts * minimum > total || parts * maximum < total) {
    throw new EditionConstraintError("band-chunking", `cannot partition ${total} items into chunks of ${minimum} to ${maximum}`);
  }
  const sizes = Array.from({ length: parts }, () => minimum);
  let left = total - parts * minimum;
  for (let index = 0; left > 0; index = (index + 1) % sizes.length) {
    if (sizes[index] < maximum) {
      sizes[index]++;
      left--;
    }
  }
  return sizes.sort((a, b) => b - a);
}

function flexiblePartitionSizes(total: number, minimum: number, maximum: number): number[] {
  if (total === 0) return [];
  let parts = Math.floor(total / minimum);
  while (parts > 0 && parts * maximum < total) parts--;
  if (parts === 0 || parts * minimum > total) {
    throw new EditionConstraintError("band-chunking", `cannot flexibly partition ${total} items into chunks of ${minimum} to ${maximum}`);
  }
  const sizes = Array.from({ length: parts }, () => minimum);
  let left = total - parts * minimum;
  for (let index = 0; left > 0; index = (index + 1) % sizes.length) {
    if (sizes[index] < maximum) {
      sizes[index]++;
      left--;
    }
  }
  return sizes.sort((a, b) => b - a);
}

function makeSpec(format: ContentFeedFormat, kind: EditionBand["kind"], size: number, fixedPillar?: Pillar, fixedKey?: string): ChunkSpec {
  const signature = [kind, format, size, fixedPillar ?? "mixed", fixedKey ?? "open"].join("|");
  return { signature, format, kind, size, ...(fixedPillar ? { fixedPillar } : {}), ...(fixedKey ? { fixedKey } : {}) };
}

function makeChunkSpecs(selected: readonly Candidate[]): { hero: ChunkSpec; rest: ChunkSpec[] } {
  const groups = byFormat(selected);
  const heroPool = groups.gallery.length > 0 ? groups.gallery : groups.clip;
  const heroCandidate = [...heroPool].sort((a, b) => b.dateMs - a.dateMs || a.tie - b.tie)[0];
  if (!heroCandidate) throw new EditionConstraintError("hero", "no selected gallery or clip can anchor the edition");
  const restCandidates = selected.filter((candidate) => candidate.key !== heroCandidate.key);
  const restGroups = byFormat(restCandidates);
  const rest: ChunkSpec[] = [];

  for (const size of flexiblePartitionSizes(restGroups.pulse.length, 4, 6)) rest.push(makeSpec("pulse", "pulse-band", size));
  for (const size of flexiblePartitionSizes(restGroups.clip.length, 2, 4)) rest.push(makeSpec("clip", "clip-rail", size));
  for (const pillar of ["k-pop", "k-drama", "fashion-beauty", "k-movie"] as const) {
    const count = restGroups.gallery.filter((candidate) => candidate.pillar === pillar).length;
    for (const size of partitionSizes(count, 1, 4)) rest.push(makeSpec("gallery", "gallery-band", size, pillar));
  }
  if (restGroups.event.length !== EVENT_RAIL_SIZE) throw new EditionConstraintError("event-rail", `expected ${EVENT_RAIL_SIZE} selected events`);
  rest.push(makeSpec("event", "event-rail", EVENT_RAIL_SIZE));
  for (let index = 0; index < restGroups.forecast.length; index += 3) rest.push(makeSpec("forecast", "forecast-rail", 3));
  for (let index = 0; index < restGroups.ranking.length; index++) rest.push(makeSpec("ranking", "ranking", 1));
  for (let index = 0; index < restGroups.article.length; index++) rest.push(makeSpec("article", "analysis", 1));
  return { hero: makeSpec(heroCandidate.format, "hero", 1, undefined, heroCandidate.key), rest };
}

function appendFormats(history: readonly ContentFeedFormat[], format: ContentFeedFormat, count: number): ContentFeedFormat[] | undefined {
  const next = [...history];
  for (let index = 0; index < count; index++) {
    next.push(format);
    if (next.length >= 12 && new Set(next.slice(-12)).size < 4) return undefined;
  }
  return next.slice(-11);
}

function scheduleChunks(hero: ChunkSpec, rest: readonly ChunkSpec[], editionId: string): ChunkSpec[][] {
  const specBySignature = new Map<string, ChunkSpec>();
  const countBySignature = new Map<string, number>();
  for (const spec of rest) {
    specBySignature.set(spec.signature, spec);
    countBySignature.set(spec.signature, (countBySignature.get(spec.signature) ?? 0) + 1);
  }
  const signatures = [...countBySignature.keys()].sort();
  const prefix: ChunkSpec[] = [hero];
  const reserve = (format: ContentFeedFormat, kind: EditionBand["kind"], size: number): ChunkSpec | undefined => {
    const signature = signatures.find((candidateSignature) => {
      const spec = specBySignature.get(candidateSignature)!;
      return (countBySignature.get(candidateSignature) ?? 0) > 0 && spec.format === format && spec.kind === kind && spec.size === size;
    });
    if (!signature) return undefined;
    countBySignature.set(signature, (countBySignature.get(signature) ?? 0) - 1);
    return specBySignature.get(signature);
  };
  // The event rail's eight identical item formats make its boundary the only
  // structurally narrow part of the search. Reserve a proven diverse frame so
  // the remaining scheduler works on ordinary short rails.
  const eventFrame = [
    reserve("forecast", "forecast-rail", 3),
    reserve("article", "analysis", 1),
    reserve("ranking", "ranking", 1),
    reserve("event", "event-rail", EVENT_RAIL_SIZE),
    reserve("clip", "clip-rail", 2),
    reserve("article", "analysis", 1),
    reserve("pulse", "pulse-band", 4),
  ];
  if (eventFrame.some((spec) => !spec)) return [];
  prefix.push(...eventFrame.filter((spec): spec is ChunkSpec => Boolean(spec)));
  let startHistory: ContentFeedFormat[] = [];
  let startFormats: string[] = [];
  for (const spec of prefix) {
    const nextHistory = appendFormats(startHistory, spec.format, spec.size);
    if (!nextHistory) return [];
    startHistory = nextHistory;
    startFormats = [...startFormats, bandKindFormat(spec.kind)].slice(-2);
  }
  interface ScheduleState {
    counts: number[];
    history: ContentFeedFormat[];
    lastFormats: string[];
    path: ChunkSpec[];
    score: number;
  }
  let states: ScheduleState[] = [{
    counts: signatures.map((signature) => countBySignature.get(signature) ?? 0),
    history: startHistory,
    lastFormats: startFormats,
    path: prefix,
    score: 0,
  }];
  const totalChunks = rest.length - eventFrame.length;
  for (let depth = 0; depth < totalChunks; depth++) {
    const next = new Map<string, ScheduleState>();
    for (const state of states) {
      for (let signatureIndex = 0; signatureIndex < signatures.length; signatureIndex++) {
        if (state.counts[signatureIndex] === 0) continue;
        const spec = specBySignature.get(signatures[signatureIndex])!;
        const format = bandKindFormat(spec.kind);
        if (state.lastFormats.length >= 2 && state.lastFormats.at(-1) === format && state.lastFormats.at(-2) === format) continue;
        const history = appendFormats(state.history, spec.format, spec.size);
        if (!history) continue;
        const counts = [...state.counts];
        counts[signatureIndex]--;
        const lastFormats = [...state.lastFormats, format].slice(-2);
        const diversity = new Set(history).size;
        let longestRun = 0;
        let run = 0;
        let previous: ContentFeedFormat | undefined;
        for (const itemFormat of history) {
          run = itemFormat === previous ? run + 1 : 1;
          previous = itemFormat;
          longestRun = Math.max(longestRun, run);
        }
        const score = diversity * 100 - longestRun * 12 - spec.size + (hash32(`${editionId}:${depth}:${spec.signature}`) % 1000) / 100_000;
        const candidate: ScheduleState = { counts, history, lastFormats, path: [...state.path, spec], score };
        const key = `${counts.join(",")}|${history.join(",")}|${lastFormats.join(",")}`;
        const prior = next.get(key);
        if (!prior || candidate.score > prior.score) next.set(key, candidate);
      }
    }
    states = [...next.values()].sort((a, b) => b.score - a.score).slice(0, 12_000);
    if (states.length === 0) return [];
  }
  return states.length > 0 ? [states[0].path] : [];
}

function bandKindFormat(kind: EditionBand["kind"]): string {
  switch (kind) {
    case "gallery-band": return "gallery";
    case "clip-rail": return "clip";
    case "event-rail": return "event";
    case "forecast-rail": return "forecast";
    case "pulse-band": return "pulse";
    case "analysis": return "article";
    default: return kind;
  }
}

function overlap(a: readonly string[], b: readonly string[]): boolean {
  const right = new Set(b);
  return a.some((slug) => right.has(slug));
}

function commonPillar(candidates: readonly Candidate[]): Pillar | undefined {
  const pillars = new Set(candidates.map((candidate) => candidate.pillar).filter((pillar): pillar is Pillar => Boolean(pillar)));
  return pillars.size === 1 && candidates.every((candidate) => candidate.pillar) ? [...pillars][0] : undefined;
}

function bandPillar(spec: ChunkSpec, candidates: readonly Candidate[]): Pillar | undefined {
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

function renderBand(spec: ChunkSpec, candidates: Candidate[], pillar?: Pillar): EditionBand {
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

function assignBands(schedule: readonly ChunkSpec[], selected: readonly Candidate[], editionId: string): AssignedBand[] | undefined {
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

function makeSpotlight(activeArtists: readonly Artist[], unseen: ReadonlySet<string>, editionId: string): EditionPlan["spotlight"] {
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

export function buildEdition(input: EditionEngineInput, editionId: string): EditionPlan {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(editionId)) {
    throw new EditionConstraintError("edition-id", `"${editionId}" is not YYYY-MM`);
  }
  const publishedMs = parseEditionDate(input.publishedAt, "publishedAt");
  if (input.publishedAt.slice(0, 7) !== editionId) {
    throw new EditionConstraintError("published-month", `publishedAt ${input.publishedAt} does not fall in ${editionId}`);
  }

  const activeArtists = input.artists.filter(isPromotedArtist);
  const activeSlugs = activeRosterSnapshot(input.artists);
  const active = new Set(activeSlugs);
  if (active.size !== activeSlugs.length) throw new EditionConstraintError("active-roster", "active profile slugs are not unique");

  const inventory = buildInventoryFacts(input);
  assertUniqueInventory(inventory);
  const all = attachTies(inventory.map((fact) => ({
    item: fact.ref,
    key: fact.key,
    format: fact.format,
    artistSlugs: fact.artistSlugs,
    ...(fact.pillar ? { pillar: fact.pillar } : {}),
    dateMs: fact.dateMs,
    ...(fact.format === "clip" ? { clipGenre: fact.clipGenre } : {}),
  })), editionId);
  const candidateByKey = new Map(all.map((candidate) => [candidate.key, candidate]));
  const artistBySlug = new Map(input.artists.map((artist) => [artist.slug, artist]));
  const eligibleKeys = new Set(inventory
    .filter((fact) => isInventoryFactEligible(fact, {
      editionId,
      publishedAt: input.publishedAt,
      publishedMs,
      artistBySlug,
    }))
    .map((fact) => fact.key));
  const eligible = all.filter((candidate) => eligibleKeys.has(candidate.key));
  const groups = byFormat(eligible);
  inventoryMinimums(groups);

  const trailing = [...input.trailingEditions]
    .filter((edition) => edition.id < editionId)
    .sort((a, b) => a.id.localeCompare(b.id))
    .slice(-2);
  const trailingCoverage = trailing.map((edition) => contentCoverage(edition, candidateByKey));
  const unseen = new Set(activeSlugs.filter((slug) => trailingCoverage.every((coverage) => !coverage.has(slug))));
  const required = trailingCoverage.length < 2 ? new Set<string>() : unseen;
  for (const slug of required) {
    if (!eligible.some((candidate) => candidate.artistSlugs.includes(slug))) {
      throw new EditionConstraintError("quarterly-coverage", `${slug} missed the prior two editions and has no eligible item in ${editionId}`);
    }
  }

  // Seventy-five is the center of the approved 60 to 90 range and keeps the
  // monthly artifact substantial without turning surplus inventory into a
  // combinatorial mandate. Short months descend toward the 60-item floor.
  const maxTotal = Math.min(EDITORIAL_TARGET_ITEMS, MAX_EDITION_ITEMS, eligible.length);
  let lastFailure = "no size and mix allocation satisfied every constraint";
  for (let total = maxTotal; total >= MIN_EDITION_ITEMS; total--) {
    for (const secondary of secondaryOptions(total, groups)) {
      const secondaryCount = Object.values(secondary).reduce((sum, count) => sum + count, 0);
      for (const core of allocateCore(total, secondaryCount, groups)) {
        const counts: FormatCounts = { ...core, ...secondary };
        let cachedShape = "";
        let cachedScheduleTails: ChunkSpec[][] | undefined;
        selectionAttempts:
        for (let selectionAttempt = 0; selectionAttempt < 8; selectionAttempt++) {
          const selected = selectCandidates(groups, counts, active, unseen, required, total, editionId, selectionAttempt);
          if (!selected) {
            lastFailure = `selection could not fill ${total} items within the celebrity cap and quarterly priorities`;
            continue;
          }
          try {
            const { hero, rest } = makeChunkSpecs(selected);
            const shape = `${hero.format}|${rest.map((spec) => spec.signature).sort().join(",")}`;
            const schedules = cachedScheduleTails && cachedShape === shape
              ? cachedScheduleTails.map((tail) => [hero, ...tail])
              : scheduleChunks(hero, rest, editionId);
            if (!cachedScheduleTails || cachedShape !== shape) {
              cachedShape = shape;
              cachedScheduleTails = schedules.map((schedule) => schedule.slice(1));
            }
            if (schedules.length === 0) {
              lastFailure = `no band order for ${total} items satisfies four formats in every rolling 12`;
              break selectionAttempts;
            }
            for (const schedule of schedules) {
              const assigned = assignBands(schedule, selected, editionId);
              if (!assigned) {
                lastFailure = "item adjacency or the band pillar streak made the candidate band order unsatisfiable";
                continue;
              }
              const bands = assigned.map((entry) => entry.band);
              const spotlightIndex = Math.max(1, Math.floor(bands.length / 2));
              bands.splice(spotlightIndex, 0, { kind: "spotlight-strip" });
              const edition: EditionPlan = {
                id: editionId,
                publishedAt: input.publishedAt,
                bands,
                spotlight: makeSpotlight(activeArtists, unseen, editionId),
              };
              assertNoViolations(validateEditionSemantics({
                edition,
                inventory,
                inventorySource: input,
                activeArtistSlugs: activeSlugs,
                expectedId: editionId,
              }).violations);
              return edition;
            }
          } catch (error) {
            lastFailure = error instanceof Error ? error.message : String(error);
          }
        }
      }
    }
  }
  throw new EditionConstraintError(
    "assembly",
    `${lastFailure}. Eligible inventory: ${Object.entries(groups).map(([format, items]) => `${items.length} ${format}`).join(", ")}`,
  );
}
