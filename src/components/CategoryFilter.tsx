import Link from "next/link";
import type { CategoryTag, Pillar } from "@/lib/types";
import { PILLAR_TAGS, TAG_LABELS, pillarSlug } from "@/lib/types";
import { IconClose } from "./icons";

// Typographic tag filter for a pillar landing page — a red active underline, no
// color-coded chips. Pure links (no client JS); the active state is driven by the
// page's ?tag param.
//
// There is no permanent "All" chip: the unfiltered grid is the default view, so a
// "Clear" reset only appears once a tag is actually selected. Pillar switching
// lives in the site header, not here.
type Props = { pillar: Pillar; activeTag?: CategoryTag | null };

export default function CategoryFilter({ pillar, activeTag }: Props) {
  const base = `/${pillarSlug(pillar)}`;

  return (
    <nav aria-label="Filter" className="flex items-center gap-5 sm:gap-7 overflow-x-auto">
      {PILLAR_TAGS[pillar].map((t) => {
        const isActive = activeTag === t;
        return (
          <Link
            key={t}
            href={`${base}?tag=${t}`}
            aria-current={isActive ? "page" : undefined}
            className={`label whitespace-nowrap pb-1.5 border-b-2 transition-colors ${
              isActive ? "text-bone border-crimson" : "border-transparent hover:text-bone"
            }`}
          >
            {TAG_LABELS[t]}
          </Link>
        );
      })}

      {activeTag && (
        <Link
          href={base}
          className="label whitespace-nowrap pb-1.5 border-b-2 border-transparent inline-flex items-center gap-1 hover:text-bone transition-colors"
        >
          <IconClose size={12} />
          Clear
        </Link>
      )}
    </nav>
  );
}
