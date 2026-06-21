import type { Source } from "@/lib/types";
import { IconArrowUpRight } from "./icons";

// Attribution is product infrastructure, not decoration. Renders a credit that
// links back to the original source (rel="nofollow" — we credit, we don't pass
// link equity, and we open the source in a new tab). Inside a card that is
// itself a link, pass asLink={false} to avoid nested anchors.
export default function AttributionBadge({
  source,
  asLink = true,
  className = "",
}: {
  source: Source;
  asLink?: boolean;
  className?: string;
}) {
  const cls = `label inline-flex items-center gap-1 ${className}`;

  if (!asLink) {
    return <span className={cls}>via {source.name}</span>;
  }

  return (
    <a
      href={source.url}
      target="_blank"
      rel="nofollow noopener noreferrer"
      className={`${cls} hover:text-bone transition-colors`}
    >
      via {source.name}
      <IconArrowUpRight size={12} />
    </a>
  );
}
