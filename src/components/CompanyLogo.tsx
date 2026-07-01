import { getCompany } from "@/lib/companies";

// A company's real logo on a small bone chip, so full-color, dark and light-ground
// marks all read cleanly against the near-black canvas. Returns null when the name
// has no registered logo, letting callers fall back to their own text rendering.
// The canonical name rides along as alt text, preserving what the text conveyed.
export default function CompanyLogo({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  const company = getCompany(name);
  if (!company) return null;
  return (
    <span
      className={`inline-flex items-center rounded-[6px] bg-bone px-1.5 py-[3px] align-middle ${className}`}
    >
      {/* Plain <img>, not next/image: tiny inline wordmarks of varying aspect
          ratio, where a fixed height with auto width avoids optimizer round-trips
          and layout-shift math. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={company.logo}
        alt={company.name}
        className="h-3.5 w-auto block"
        loading="lazy"
        decoding="async"
      />
    </span>
  );
}
