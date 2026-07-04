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
    <>
      {/* Masthead: centered logo + tagline, scrolls away with the page. */}
      <header>
        <div className="mx-auto max-w-6xl px-5 py-6 sm:py-8 flex flex-col items-center text-center">
          <LogoLockup className="h-14 sm:h-20 w-auto" />
          <p className="label mt-2 sm:mt-3">K-stars, in focus</p>
        </div>
      </header>

      {/* Nav strip: pins to the viewport top. Sibling of the masthead on
          purpose: sticky is clamped to its containing block, so nesting it in
          the masthead header would cap its sticky range at masthead height.
          Each list is w-max mx-auto: centered while the links fit, a normal
          left-anchored scroll row when they overflow (Safari has no safe
          center, so justify-center-safe would clip there). */}
      <div className="sticky top-0 z-40 border-y border-line bg-ink/95 backdrop-blur">
        <nav aria-label="Primary" className="overflow-x-auto no-scrollbar">
          <ul className="flex w-max mx-auto gap-6 sm:gap-8 px-5 pt-3 pb-2 label text-bone">
            {PILLAR_NAV.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  className="whitespace-nowrap hover:text-crimson transition-colors"
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Sections" className="overflow-x-auto no-scrollbar">
          <ul className="flex w-max mx-auto gap-5 sm:gap-7 px-5 pb-3 label text-muted">
            {UTILITY_NAV.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  className="whitespace-nowrap hover:text-bone transition-colors"
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
