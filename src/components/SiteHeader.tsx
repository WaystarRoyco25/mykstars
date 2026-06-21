import Link from "next/link";
import Wordmark from "./Wordmark";
import { IconSearch } from "./icons";

const NAV = [
  { label: "Photos", href: "/photos" },
  { label: "Artists", href: "/artists" },
  { label: "News", href: "/news" },
  { label: "Magazine", href: "/photos?category=pictorial" },
];

export default function SiteHeader() {
  return (
    <header className="border-b border-line bg-ink/95 sticky top-0 z-40 backdrop-blur">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex items-end justify-between gap-4 py-4">
          <div>
            <Wordmark />
            <p className="label mt-1.5">K-stars, in focus</p>
          </div>

          <nav
            aria-label="Primary"
            className="flex items-center gap-5 sm:gap-7 text-bone"
          >
            <ul className="hidden sm:flex items-center gap-6 label text-bone">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className="hover:text-crimson transition-colors">
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/photos"
              aria-label="Search photos"
              className="text-bone hover:text-crimson transition-colors"
            >
              <IconSearch size={18} />
            </Link>
            <Link
              href="/artists"
              className="label text-bone border border-crimson rounded-sm px-3 py-1.5 hover:bg-crimson hover:text-white transition-colors"
            >
              Follow
            </Link>
          </nav>
        </div>

        <nav aria-label="Sections" className="sm:hidden flex gap-5 overflow-x-auto pb-3 label text-bone">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="whitespace-nowrap hover:text-crimson">
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
