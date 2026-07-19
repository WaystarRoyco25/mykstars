import "server-only";

import type { TakedownSink } from "./service";

export const consoleTakedownSink: TakedownSink = {
  record({ rightsHolder, url }) {
    console.info("[takedown] received", { rightsHolder, url });
  },
};
