import Link from "next/link";
import LogoLockup from "./LogoLockup";
import { PILLAR_LABELS, PILLAR_ORDER, pillarSlug } from "@/lib/types";

// Primary navigation = the four pillars.
const PILLAR_NAV = PILLAR_ORDER.map((p) => ({
  label: PILLAR_LABELS[p],
  href: `/${pillarSlug(p)}`,
}));

// Secondary / utility lenses.
const UTILITY_NAV = [
  { label: "Photos", href: "/photos" },
  { label: "Analysis", href: "/analysis" },
  { label: "Schedule", href: "/schedule" },
  { label: "Forecast", href: "/predictions" },
];

export default function SiteHeader() {
  return (
    <header className="border-b border-line bg-ink/95 sticky top-0 z-40 backdrop-blur">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex items-end justify-between gap-4 py-4">
          <div>
            <LogoLockup className="h-9 sm:h-10 w-auto" />
            <p className="label mt-1.5">K-stars, in focus</p>
          </div>

          <nav aria-label="Primary" className="text-bone">
            <ul className="hidden sm:flex items-center gap-6 label text-bone">
              {PILLAR_NAV.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className="hover:text-crimson transition-colors">
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Mobile: pillars scroll row */}
        <nav
          aria-label="Pillars"
          className="sm:hidden flex gap-5 overflow-x-auto pb-3 label text-bone"
        >
          {PILLAR_NAV.map((n) => (
            <Link key={n.href} href={n.href} className="whitespace-nowrap hover:text-crimson">
              {n.label}
            </Link>
          ))}
        </nav>

        {/* Secondary utility lenses (all viewports) */}
        <nav
          aria-label="Sections"
          className="flex gap-5 overflow-x-auto pb-3 sm:pt-1 label text-muted"
        >
          {UTILITY_NAV.map((n) => (
            <Link key={n.href} href={n.href} className="whitespace-nowrap hover:text-bone transition-colors">
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
