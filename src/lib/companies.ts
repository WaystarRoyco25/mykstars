// Central registry of entertainment-company brand marks. Everywhere the site
// names a company (ranking tables, artist cards, artist pages) it looks the name
// up here and renders a logo chip; anything without an entry falls back to text.
// To add a company: drop its file in public/logos/companies and add one line.

interface CompanyBrand {
  /** Canonical name, used as the logo's alt text. */
  name: string;
  /** Public path to the logo asset (svg or png). */
  logo: string;
}

// Normalize for lookup so the seed's as-authored casing and spacing still match:
// "BIGHIT MUSIC", "Fantagio" and "tvN" resolve however they happen to be typed.
const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

const COMPANIES: CompanyBrand[] = [
  // K-pop agencies / labels
  { name: "ADOR", logo: "/logos/companies/ador.png" },
  { name: "YG Entertainment", logo: "/logos/companies/yg.svg" },
  { name: "BIGHIT MUSIC", logo: "/logos/companies/bighit.svg" },
  { name: "SM Entertainment", logo: "/logos/companies/sm.svg" },
  { name: "JYP Entertainment", logo: "/logos/companies/jyp.svg" },
  { name: "PLEDIS Entertainment", logo: "/logos/companies/pledis.svg" },
  { name: "Fantagio", logo: "/logos/companies/fantagio.svg" },
  { name: "Starship Entertainment", logo: "/logos/companies/starship.svg" },
  { name: "EDAM Entertainment", logo: "/logos/companies/edam.svg" },
  { name: "Source Music", logo: "/logos/companies/source-music.png" },
  // K-drama broadcast networks
  { name: "tvN", logo: "/logos/companies/tvn.svg" },
  { name: "SBS", logo: "/logos/companies/sbs.svg" },
  { name: "KBS2", logo: "/logos/companies/kbs2.svg" },
  { name: "JTBC", logo: "/logos/companies/jtbc.svg" },
  { name: "MBC", logo: "/logos/companies/mbc.svg" },
  { name: "OCN", logo: "/logos/companies/ocn.svg" },
  { name: "ENA", logo: "/logos/companies/ena.svg" },
];

const BY_NAME = new Map<string, CompanyBrand>(
  COMPANIES.map((c) => [normalize(c.name), c]),
);

/** Look up a company's brand mark by name (case and spacing insensitive). */
export function getCompany(name: string): CompanyBrand | undefined {
  return BY_NAME.get(normalize(name));
}

/**
 * A ranking row's `detail` may be a bare company ("ADOR") or a company followed
 * by other text ("tvN · Kim Tae-ri", network plus lead actor). Split on the
 * middle dot: if the first segment is a known company, return it plus the
 * remaining text; otherwise return the detail untouched so the caller renders
 * it exactly as before.
 */
export function splitCompanyDetail(detail: string): {
  company?: CompanyBrand;
  rest: string;
} {
  const parts = detail
    .split("·")
    .map((s) => s.trim())
    .filter(Boolean);
  const company = parts.length ? getCompany(parts[0]) : undefined;
  if (!company) return { rest: detail };
  return { company, rest: parts.slice(1).join(" · ") };
}
