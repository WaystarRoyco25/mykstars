"use server";

import { consoleTakedownSink } from "@/lib/takedown/console-sink";
import {
  submitTakedownRequest,
  type TakedownResult,
} from "@/lib/takedown/service";

export type { TakedownResult } from "@/lib/takedown/service";

// Takedown intake. A tracked ticket and DMCA-agent notification remain a
// separate feature; this action retains the existing logging sink.
export async function submitTakedown(formData: FormData): Promise<TakedownResult> {
  return submitTakedownRequest(formData, consoleTakedownSink);
}
