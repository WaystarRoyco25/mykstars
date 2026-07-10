import type { ArticleStatus } from "@/lib/types";
import { IconCheck, IconAlert } from "./icons";

// The rumor-vs-confirmed labeling system. On-palette: confirmed reads neutral and
// authoritative, unverified is flagged crimson, the analysis default reads muted (shown as "Context"). `on` adapts the
// neutral tones to a dark canvas or a light (bone) editorial band.
export default function StatusFlag({
  status,
  on = "dark",
}: {
  status: ArticleStatus;
  on?: "dark" | "light";
}) {
  const neutral = on === "light" ? "text-ink" : "text-bone";
  const muted = on === "light" ? "text-muted-2" : "text-muted";

  if (status === "confirmed") {
    return (
      <span className={`label ${neutral} inline-flex items-center gap-1.5`}>
        <IconCheck size={13} />
        Confirmed
      </span>
    );
  }
  if (status === "unverified") {
    return (
      <span className="label text-crimson inline-flex items-center gap-1.5">
        <IconAlert size={13} />
        Unverified
      </span>
    );
  }
  return <span className={`label ${muted}`}>Context</span>;
}
