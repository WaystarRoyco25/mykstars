import {
  parseTakedownRequest,
  type TakedownRequest,
} from "./request";

export type TakedownResult = { ok: true } | { ok: false };

export interface TakedownSink {
  record(request: TakedownRequest): void | Promise<void>;
}

export async function submitTakedownRequest(
  formData: FormData,
  sink: TakedownSink,
): Promise<TakedownResult> {
  const request = parseTakedownRequest(formData);
  if (!request) return { ok: false };

  await sink.record(request);
  return { ok: true };
}
