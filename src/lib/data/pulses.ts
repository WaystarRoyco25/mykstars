import "server-only";

import { cache } from "react";

import type { Pulse } from "../domain/stories";
import { pulseStore } from "../stores/pulses";

export async function getPulses(opts?: {
  artist?: string;
  limit?: number;
}): Promise<Pulse[]> {
  let list = opts?.artist
    ? [...(pulseStore.byArtist.get(opts.artist) ?? [])]
    : [...pulseStore.newest];
  if (opts?.limit !== undefined) list = list.slice(0, Math.max(0, opts.limit));
  return list;
}

const readPulse = cache(async (slug: string): Promise<Pulse | undefined> =>
  pulseStore.bySlug.get(slug),
);

export async function getPulse(slug: string): Promise<Pulse | undefined> {
  return readPulse(slug);
}

export function allPulseSlugs(): string[] {
  return pulseStore.all.map((pulse) => pulse.slug);
}
