import Link from "next/link";
import LogoLockup from "./LogoLockup";
import { IconShield, IconBolt, IconGlobe } from "./icons";

const SIGNALS = [
  { icon: IconShield, text: "Every photo credited + linked" },
  { icon: IconBolt, text: "AVIF galleries · fast on mobile" },
  { icon: IconGlobe, text: "English now · multilingual-ready" },
];

const FOOTER_LINKS = [
  { label: "Photos", href: "/photos" },
  { label: "Artists", href: "/artists" },
  { label: "News", href: "/news" },
  { label: "Editorial standards", href: "/about/editorial-standards" },
  { label: "DMCA / takedown", href: "/legal/dmca" },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-line mt-20">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-wrap gap-x-8 gap-y-3 mb-8">
          {SIGNALS.map(({ icon: Icon, text }) => (
            <span key={text} className="label flex items-center gap-2">
              <Icon size={15} className="text-crimson" />
              {text}
            </span>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-t border-line pt-8">
          <div>
            <LogoLockup className="h-7 w-auto" />
            <p className="text-sm text-muted mt-3 max-w-md leading-relaxed">
              The world&apos;s photo-first K-Culture newspaper and magazine. Photos are
              aggregated and embedded from their original sources, always credited and
              linked. Rights-holders can request removal anytime.
            </p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 label text-muted">
            {FOOTER_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-bone transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <p className="text-xs text-muted mt-8">
          © 2026 MyKStars. Trademarks and photographs are the property of their respective owners.
        </p>
      </div>
    </footer>
  );
}
