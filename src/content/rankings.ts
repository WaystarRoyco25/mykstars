import type { Ranking, Source } from "@/lib/types";

// ---------------------------------------------------------------------------
// RANKINGS
// ---------------------------------------------------------------------------
// Real, web-verified figures (verified 2026-07-15). Each table cites the body
// that produces the numbers, and rank movement is measured against the previous
// published period. Rows link to an artist hub via artistSlug where we cover
// that group. Refresh both tables each edition (see docs/edition-playbook.md).

// Monthly idol-group brand-reputation index from the Korean Business Research
// Institute (한국기업평판연구소). July 2026 edition announced 2026-07-14, big-data
// window June 15 to July 15, 2026; index values as reported by Soompi.
const KBRI: Source = {
  name: "Korean Business Research Institute",
  url: "https://www.soompi.com/article/1854729wpp/july-idol-group-brand-reputation-rankings-announced-4",
  kind: "press",
};

// Nationwide drama ratings from Nielsen Korea (AGB), week of July 6 to 12, 2026.
// Compiled and cross-checked 2026-07-15: danmee's weekly ranking for the figures,
// koari for the prior week's ranks (movement), Agent Kim's 22.3% via cineplay and
// 결혼의 완성 via tvreport/etoday.
const NIELSEN_KOREA: Source = {
  name: "Nielsen Korea",
  url: "https://www.nielsenkorea.co.kr/",
  kind: "press",
};

export const rankings: Ranking[] = [
  {
    // July 2026 overall idol-group brand reputation (boy and girl groups). The
    // institute publishes index values for the top five; movement is versus the
    // June order (BTS, CORTIS, IVE, RESCENE, BLACKPINK, SEVENTEEN, LE SSERAFIM,
    // TWICE, ILLIT, SHINee). TWICE climbed three. I.O.I re-entered the top ranks
    // on their 10th-anniversary comeback, outside the June top 10, so New.
    slug: "idol-brand-reputation",
    title: "Idol Group Brand Reputation",
    pillar: "k-pop",
    metricLabel: "Brand index",
    period: "July 2026",
    asOf: "2026-07-15T00:00:00+09:00",
    source: KBRI,
    blurb: "Monthly idol-group brand-reputation index by big-data volume.",
    rows: [
      { rank: 1, name: "BTS", detail: "BIGHIT MUSIC", value: "6,518,675", artistSlug: "bts" },
      { rank: 2, name: "CORTIS", detail: "BIGHIT MUSIC", value: "5,409,892", artistSlug: "cortis" },
      { rank: 3, name: "I.O.I", detail: "Project group", value: "5,214,323", isNew: true },
      { rank: 4, name: "RESCENE", detail: "THE MUZE Entertainment", value: "5,014,734" },
      { rank: 5, name: "TWICE", detail: "JYP Entertainment", value: "3,866,983", change: 3, artistSlug: "twice" },
    ],
  },
  {
    // Nielsen Korea nationwide ratings, week of July 6 to 12, 2026. Agent Kim
    // Reactivated held No. 1 with a self-best 22.3% (SBS all-time No. 2). Ranks 1
    // to 5 were unchanged versus the prior week; 결혼의 완성 climbed one as The
    // First Man dropped out. The three KBS daily dramas are not confirmed to a
    // KBS1/KBS2 channel, so they read plain "KBS" (no logo chip) rather than risk
    // a wrong mark.
    slug: "drama-viewership",
    title: "Drama Viewership",
    pillar: "k-drama",
    metricLabel: "Rating",
    period: "Week of July 6, 2026",
    asOf: "2026-07-15T00:00:00+09:00",
    source: NIELSEN_KOREA,
    blurb: "Nationwide audience share for scripted series on air this week.",
    rows: [
      { rank: 1, name: "*Agent Kim Reactivated*", detail: "SBS · So Ji-sub", value: "22.3%" },
      { rank: 2, name: "*Love Prescription*", detail: "KBS", value: "15.5%" },
      { rank: 3, name: "*Rookie Chairman Kang*", detail: "JTBC · Son Hyun-joo", value: "13.6%" },
      { rank: 4, name: "*Our Happy Days*", detail: "KBS", value: "11.2%" },
      { rank: 5, name: "*Red Pearl*", detail: "KBS", value: "7.8%" },
      { rank: 6, name: "*Marriage's Conclusion*", detail: "KBS2 · Namkoong Min", value: "6.4%", change: 1 },
    ],
  },
];
