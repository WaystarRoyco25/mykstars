import type { Ranking, Source } from "@/lib/types";

// ---------------------------------------------------------------------------
// RANKINGS
// ---------------------------------------------------------------------------
// Illustrative placeholder figures (sample: true) — the same stand-in approach
// as the placeholder photos. The numbers below are NOT measured data; they exist
// so the tables render end-to-end. A real index/ratings feed + its attribution
// replaces this later, at which point sample is dropped. Rows link to an artist
// hub via artistSlug where we cover that person/group.
const SAMPLE_DATA: Source = {
  name: "MyKStars sample data",
  url: "/about/editorial-standards",
  kind: "press",
};

export const rankings: Ranking[] = [
  {
    // Order mirrors the real June 2026 group brand-reputation announcement
    // (verified 2026-07-05); index values remain illustrative (sample: true).
    slug: "idol-brand-reputation",
    title: "Idol Group Brand Reputation",
    pillar: "k-pop",
    metricLabel: "Brand index",
    period: "June 2026",
    asOf: "2026-06-17T00:00:00+09:00",
    source: SAMPLE_DATA,
    sample: true,
    blurb: "Monthly idol-group brand-reputation index by big-data volume.",
    rows: [
      { rank: 1, name: "BTS", detail: "BIGHIT MUSIC", value: "8,912,442", artistSlug: "bts" },
      { rank: 2, name: "CORTIS", detail: "BIGHIT MUSIC", value: "8,204,315", artistSlug: "cortis" },
      { rank: 3, name: "IVE", detail: "Starship Entertainment", value: "7,981,207", artistSlug: "ive" },
      { rank: 4, name: "RESCENE", detail: "THE MUZE Entertainment", value: "7,410,556" },
      { rank: 5, name: "BLACKPINK", detail: "YG Entertainment", value: "7,102,388", artistSlug: "blackpink" },
      { rank: 6, name: "SEVENTEEN", detail: "PLEDIS Entertainment", value: "6,845,910", artistSlug: "seventeen" },
      { rank: 7, name: "LE SSERAFIM", detail: "Source Music", value: "6,512,473", artistSlug: "le-sserafim" },
      { rank: 8, name: "TWICE", detail: "JYP Entertainment", value: "6,208,114", artistSlug: "twice" },
      { rank: 9, name: "ILLIT", detail: "BELIFT LAB", value: "5,921,660" },
      { rank: 10, name: "SHINee", detail: "SM Entertainment", value: "5,644,905" },
    ],
  },
  {
    // Real series airing in the week of June 29, 2026 (web-verified 2026-07-05:
    // Nielsen figures via trade press). Kept sample: true until a live ratings
    // feed replaces the hand-compiled table.
    slug: "drama-viewership",
    title: "Drama Viewership",
    pillar: "k-drama",
    metricLabel: "Rating",
    period: "Week of June 29, 2026",
    asOf: "2026-07-05T00:00:00+09:00",
    source: SAMPLE_DATA,
    sample: true,
    blurb: "Nationwide audience share for scripted series on air this week.",
    rows: [
      { rank: 1, name: "*Agent Kim Reactivated*", detail: "SBS · So Ji-sub", value: "18.8%" },
      { rank: 2, name: "*Reborn Rookie*", detail: "JTBC · Lee Jun-young", value: "9.5%" },
      { rank: 3, name: "*Fifties Professionals*", detail: "MBC · Shin Ha-kyun", value: "6.0%" },
      { rank: 4, name: "*See You at Work Tomorrow!*", detail: "tvN · Seo In-guk", value: "4.8%" },
    ],
  },
];
