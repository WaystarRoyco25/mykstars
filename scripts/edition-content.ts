import { articles } from "../src/content/articles";
import { clips } from "../src/content/clips";
import { editions } from "../src/content/editions";
import { events } from "../src/content/events";
import { galleries } from "../src/content/galleries";
import { NOW } from "../src/content/now";
import { predictions } from "../src/content/predictions";
import { artists } from "../src/content/profiles";
import { pulses } from "../src/content/pulses";
import { rankings } from "../src/content/rankings";
import type { EditionInventoryInput } from "../src/lib/edition/inventory";

export const currentEditionInventory = {
  artists,
  pulses,
  clips,
  galleries,
  predictions,
  events,
  rankings,
  articles,
} satisfies EditionInventoryInput;

export { editions, NOW };
