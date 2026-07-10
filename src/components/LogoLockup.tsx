import Link from "next/link";
import { LOCKUP_INNER, LOCKUP_VIEWBOX } from "@/lib/brand";

// The MyKStars masthead: the full icon + wordmark lockup, links home.
// Artwork (crimson glyph + bone wordmark) is generated into src/lib/brand.ts
// from /brand by scripts/generate-icons.mjs. Size it with `className`.
export default function LogoLockup({
  className,
}: {
  className: string;
}) {
  return (
    <Link href="/" aria-label="MyKStars home" className="inline-flex items-center">
      <svg
        viewBox={LOCKUP_VIEWBOX}
        className={className}
        aria-hidden="true"
        focusable="false"
        xmlns="http://www.w3.org/2000/svg"
        dangerouslySetInnerHTML={{ __html: LOCKUP_INNER }}
      />
    </Link>
  );
}
