import type { EditionBand } from "../domain/editions";
import { type ContentFeedFormat } from "./constraints";
import { hash32 } from "./deterministic";
import type { ChunkSpec } from "./engine-internal";
import { EVENT_RAIL_SIZE } from "./inventory";

function appendFormats(
  history: readonly ContentFeedFormat[],
  format: ContentFeedFormat,
  count: number,
): ContentFeedFormat[] | undefined {
  const next = [...history];
  for (let index = 0; index < count; index++) {
    next.push(format);
    if (next.length >= 12 && new Set(next.slice(-12)).size < 4) return undefined;
  }
  return next.slice(-11);
}

export function scheduleChunks(
  hero: ChunkSpec,
  rest: readonly ChunkSpec[],
  editionId: string,
): ChunkSpec[][] {
  const specBySignature = new Map<string, ChunkSpec>();
  const countBySignature = new Map<string, number>();
  for (const spec of rest) {
    specBySignature.set(spec.signature, spec);
    countBySignature.set(spec.signature, (countBySignature.get(spec.signature) ?? 0) + 1);
  }
  const signatures = [...countBySignature.keys()].sort();
  const prefix: ChunkSpec[] = [hero];
  const reserve = (
    format: ContentFeedFormat,
    kind: EditionBand["kind"],
    size: number,
  ): ChunkSpec | undefined => {
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
