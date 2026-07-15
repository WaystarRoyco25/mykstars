import type { Pulse } from "../../lib/types";
import { pulses202607 } from "./2026-07";
import { pulses202608 } from "./2026-08";

export const pulses: Pulse[] = [...pulses202607, ...pulses202608];
