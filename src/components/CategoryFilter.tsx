import Link from "next/link";
import type { Category } from "@/lib/types";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/types";

// Typographic category filter — a red active underline, no color-coded chips.
// Pure links (no client JS); the active state is driven by the page's searchParam.
export default function CategoryFilter({
  active = null,
  basePath = "/photos",
}: {
  active?: Category | null;
  basePath?: string;
}) {
  const items: { label: string; href: string; isActive: boolean }[] = [
    { label: "All", href: basePath, isActive: !active },
    ...CATEGORY_ORDER.map((c) => ({
      label: CATEGORY_LABELS[c],
      href: `${basePath}?category=${c}`,
      isActive: active === c,
    })),
  ];

  return (
    <nav aria-label="Filter by category" className="flex gap-5 sm:gap-7 overflow-x-auto">
      {items.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          aria-current={it.isActive ? "page" : undefined}
          className={`label whitespace-nowrap pb-1.5 border-b-2 transition-colors ${
            it.isActive
              ? "text-bone border-crimson"
              : "border-transparent hover:text-bone"
          }`}
        >
          {it.label}
        </Link>
      ))}
    </nav>
  );
}
