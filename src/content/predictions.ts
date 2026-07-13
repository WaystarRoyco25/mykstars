import type { Prediction, Source } from "@/lib/types";
import { BILLBOARD, STAR_NEWS, STUDIO } from "./sources";

// ---------------------------------------------------------------------------
// PREDICTIONS — the "Fan Forecast".
// ---------------------------------------------------------------------------
// A curated set of vote-only questions on PROFESSIONAL outcomes (awards, charts,
// comebacks, box office, tours, campaigns) — never private lives. Each resolves
// against an objective, public, dated source. Vote tallies are LIVE from Supabase
// (see data.ts) and start at zero — real fan votes only. Broad roster coverage:
// one question per featured artist across all four pillars. Anchored to NOW
// (2026-07-05) and still spanning every lifecycle state — open questions and
// resolved ones (Park Chan-wook, Bong Joon-ho). Every premise below was
// web-verified on 2026-07-05 per docs/roster-playbook.md.
// Wording follows docs/forecast-playbook.md: hype within the editorial-noir voice.
const MAMA_AWARDS: Source = { name: "MAMA Awards", url: "https://www.mnetplus.world", kind: "official" };
const KOBIS: Source = { name: "KOBIS · Korean Film Council", url: "https://www.kobis.or.kr", kind: "official" };
const YONHAP: Source = { name: "Yonhap News", url: "https://en.yna.co.kr", kind: "wire" };
const NETFLIX: Source = { name: "Netflix Top 10", url: "https://www.netflix.com/tudum/top10", kind: "official" };
const LOUIS_VUITTON: Source = { name: "Louis Vuitton", url: "https://www.louisvuitton.com", kind: "official" };
const ADOR: Source = { name: "ADOR (official)", url: "https://weverse.io/newjeans", kind: "official" };
const FANTAGIO: Source = { name: "Fantagio (official)", url: "https://fantagio.kr", kind: "official" };
const HANTEO: Source = { name: "Hanteo Chart", url: "https://www.hanteochart.com", kind: "official" };
const CIRCLE: Source = { name: "Circle Chart", url: "https://circlechart.kr", kind: "official" };

export const predictions: Prediction[] = [
  // ===================== K-POP =====================
  {
    slug: "stray-kids-this-and-that-billboard-no1",
    pillar: "k-pop",
    category: "chart",
    question: "Will *THIS & THAT* hand Stray Kids their 9th straight Billboard 200 #1?",
    framing: "Eight #1s deep: STAY are daring the Billboard 200 to blink first.",
    opensAt: "2026-06-24T00:00:00+09:00",
    closesAt: "2026-08-07T00:00:00+09:00",
    status: "open",
    options: [
      { id: "yes", label: "Yes, a 9th straight #1", artistSlug: "stray-kids" },
      { id: "no", label: "No, the streak breaks" },
    ],
    resolutionSourceLabel: "Resolves on the Billboard 200 chart covering *THIS & THAT*'s debut week.",
    resolutionSource: BILLBOARD,
    tallyVisibleThreshold: 25,
    asOf: "2026-07-05T00:00:00+09:00",
  },
  {
    slug: "aespa-daesang-mama-2026",
    pillar: "k-pop",
    category: "award",
    question: "Will aespa take a Daesang at the 2026 MAMA Awards?",
    framing: "MY are walking into awards season expecting a coronation: hope, not a forecast.",
    opensAt: "2026-06-01T00:00:00+09:00",
    closesAt: "2026-11-19T00:00:00+09:00",
    status: "open",
    options: [
      { id: "yes", label: "Yes, at least one Daesang", artistSlug: "aespa" },
      { id: "no", label: "No Daesang this year" },
    ],
    resolutionSourceLabel: "Resolves on the official 2026 MAMA Awards winners announcement.",
    resolutionSource: MAMA_AWARDS,
    tallyVisibleThreshold: 25,
    asOf: "2026-07-05T00:00:00+09:00",
  },
  {
    slug: "blackpink-daesang-mama-2026",
    pillar: "k-pop",
    category: "award",
    question: "Will BLACKPINK win a Daesang at the 2026 MAMA Awards on the *Deadline* era?",
    framing: "After the record-shattering *Deadline* run, BLINKs want the Daesang to match.",
    opensAt: "2026-06-29T00:00:00+09:00",
    closesAt: "2026-11-19T00:00:00+09:00",
    status: "open",
    options: [
      { id: "yes", label: "Yes, a *Deadline*-era Daesang", artistSlug: "blackpink" },
      { id: "no", label: "No Daesang this year" },
    ],
    resolutionSourceLabel: "Resolves on the official 2026 MAMA Awards winners announcement.",
    resolutionSource: MAMA_AWARDS,
    tallyVisibleThreshold: 25,
    asOf: "2026-07-05T00:00:00+09:00",
  },
  {
    // 2026-07-05: replaced an anniversary-album question whose premise could not
    // be verified (no such release exists); test votes reset per the playbook.
    // The finale run is confirmed: three nights at KSPO Dome, July 10 to 12.
    slug: "twice-this-is-for-finale-sellout",
    pillar: "k-pop",
    category: "tour",
    question: "Will TWICE close the *This Is For* world tour with all three Seoul finale nights sold out?",
    framing: "Eighty-one shows come home to KSPO Dome. ONCE want the send-off standing-room only.",
    opensAt: "2026-07-05T00:00:00+09:00",
    closesAt: "2026-07-10T18:00:00+09:00",
    status: "open",
    options: [
      { id: "yes", label: "Yes, a triple sellout", artistSlug: "twice" },
      { id: "no", label: "No, seats remain" },
    ],
    resolutionSourceLabel: "Resolves on official JYP or ticketing confirmation for the three finale nights.",
    resolutionSource: STAR_NEWS,
    tallyVisibleThreshold: 25,
    asOf: "2026-07-05T00:00:00+09:00",
  },
  {
    // 2026-07-05: replaced an unverifiable Goyang Stadium question (her verified
    // 2026 dates are a North American run from July 15); test votes reset. IU has
    // said the album is largely done and pointed at late August.
    slug: "iu-new-album-august-2026",
    pillar: "k-pop",
    category: "comeback",
    question: "Will IU's new album arrive by August 31, as teased?",
    framing: "She calls the album mostly finished and points at late August. Uaena are counting the days out loud.",
    opensAt: "2026-07-05T00:00:00+09:00",
    closesAt: "2026-08-31T23:59:00+09:00",
    status: "open",
    options: [
      { id: "yes", label: "Yes, out by August 31", artistSlug: "iu" },
      { id: "no", label: "No, it slips past August" },
    ],
    resolutionSourceLabel: "Resolves on the official EDAM release announcement and the actual drop date.",
    resolutionSource: STAR_NEWS,
    tallyVisibleThreshold: 25,
    asOf: "2026-07-05T00:00:00+09:00",
  },
  {
    slug: "cha-eunwoo-post-service-comeback-2026",
    pillar: "k-pop",
    category: "comeback",
    question: "Will Fantagio confirm Cha Eun-woo's post-service comeback plans before 2026 ends?",
    framing: "Counting down with him: fans want the comeback news the moment service allows.",
    opensAt: "2026-06-29T00:00:00+09:00",
    closesAt: "2026-12-31T00:00:00+09:00",
    status: "open",
    options: [
      { id: "yes", label: "Yes, comeback news this year", artistSlug: "cha-eunwoo" },
      { id: "no", label: "No, not until after service" },
    ],
    resolutionSourceLabel: "Resolves on an official Fantagio announcement of post-service plans.",
    resolutionSource: FANTAGIO,
    tallyVisibleThreshold: 25,
    asOf: "2026-07-05T00:00:00+09:00",
  },
  {
    slug: "newjeans-return-official-word-2026",
    pillar: "k-pop",
    category: "comeback",
    question: "Will 2026 bring official word on NewJeans' return?",
    framing: "ADOR says the announcement will come 'at the best time.' Bunnies are holding the door open.",
    opensAt: "2026-06-29T00:00:00+09:00",
    closesAt: "2026-12-31T00:00:00+09:00",
    status: "open",
    options: [
      { id: "yes", label: "Yes, official word is coming", artistSlug: "newjeans" },
      { id: "no", label: "Not just yet" },
    ],
    resolutionSourceLabel: "Resolves on an official ADOR announcement about NewJeans' return.",
    resolutionSource: ADOR,
    tallyVisibleThreshold: 25,
    asOf: "2026-07-05T00:00:00+09:00",
  },

  // --- 2026-07-05 roster expansion: one question per new artist, premises
  // web-verified same day (see docs/roster-playbook.md) ---
  {
    slug: "bts-arirang-global-top10-summer",
    pillar: "k-pop",
    category: "chart",
    question: "Will an *Arirang* track re-enter the Billboard Global 200 top 10 during the summer stadium legs?",
    framing: "London, Paris, then SoFi: ARMY believe the tour can push 'SWIM' right back up the chart.",
    opensAt: "2026-07-05T00:00:00+09:00",
    closesAt: "2026-09-06T23:59:00+09:00",
    status: "open",
    options: [
      { id: "yes", label: "Yes, back in the top 10", artistSlug: "bts" },
      { id: "no", label: "No, the chart holds firm" },
    ],
    resolutionSourceLabel: "Resolves on Billboard Global 200 charts published through the Los Angeles nights.",
    resolutionSource: BILLBOARD,
    tallyVisibleThreshold: 25,
    asOf: "2026-07-05T00:00:00+09:00",
  },
  {
    slug: "seventeen-v8-600k-july",
    pillar: "k-pop",
    category: "chart",
    question: "Will V8's mini album pass 600,000 copies before July ends?",
    framing: "Vernon and The8's unit stood at 559,904 on July 1. CARAT math says this is already done.",
    opensAt: "2026-07-05T00:00:00+09:00",
    closesAt: "2026-07-31T23:59:00+09:00",
    status: "open",
    options: [
      { id: "yes", label: "Yes, 600k inside July", artistSlug: "seventeen" },
      { id: "no", label: "No, it lands in August" },
    ],
    resolutionSourceLabel: "Resolves on Hanteo and Circle cumulative sales through July 31.",
    resolutionSource: HANTEO,
    tallyVisibleThreshold: 25,
    asOf: "2026-07-05T00:00:00+09:00",
  },
  {
    slug: "ive-seventh-all-kill-tour-window",
    pillar: "k-pop",
    category: "chart",
    question: "Will IVE land a seventh perfect all-kill while the tour crosses North America?",
    framing: "'Bang Bang' made it six in February. DIVE want number seven before the Vancouver closer.",
    opensAt: "2026-07-05T00:00:00+09:00",
    closesAt: "2026-08-09T23:59:00+09:00",
    status: "open",
    options: [
      { id: "yes", label: "Yes, a seventh all-kill", artistSlug: "ive" },
      { id: "no", label: "Not on this leg" },
    ],
    resolutionSourceLabel: "Resolves on Korean chart trackers' perfect all-kill records through August 9.",
    resolutionSource: CIRCLE,
    tallyVisibleThreshold: 25,
    asOf: "2026-07-05T00:00:00+09:00",
  },
  {
    slug: "cortis-greengreen-ten-weeks-billboard",
    pillar: "k-pop",
    category: "chart",
    question: "Will *GREENGREEN* stretch its Billboard 200 run past ten weeks?",
    framing: "Seven weeks and counting for the rookie class leaders, with a first world tour about to add fuel.",
    opensAt: "2026-07-05T00:00:00+09:00",
    closesAt: "2026-09-08T23:59:00+09:00",
    status: "open",
    options: [
      { id: "yes", label: "Yes, past ten weeks", artistSlug: "cortis" },
      { id: "no", label: "No, it exits earlier" },
    ],
    resolutionSourceLabel: "Resolves on weekly Billboard 200 charts through early September.",
    resolutionSource: BILLBOARD,
    tallyVisibleThreshold: 25,
    asOf: "2026-07-05T00:00:00+09:00",
  },
  {
    slug: "hearts2hearts-lemon-tang-circle-top10-august",
    pillar: "k-pop",
    category: "chart",
    question: "Will a *Lemon Tang* track sit in a Circle weekly top 10 again before September?",
    framing: "Their best first week yet deserves a summer-long chart tail. The fandom says it holds.",
    opensAt: "2026-07-05T00:00:00+09:00",
    closesAt: "2026-08-31T23:59:00+09:00",
    status: "open",
    options: [
      { id: "yes", label: "Yes, back in the top 10", artistSlug: "hearts2hearts" },
      { id: "no", label: "No, the moment passes" },
    ],
    resolutionSourceLabel: "Resolves on Circle Chart weekly digital rankings through August.",
    resolutionSource: CIRCLE,
    tallyVisibleThreshold: 25,
    asOf: "2026-07-05T00:00:00+09:00",
  },
  {
    slug: "babymonster-choom-first-week-record-q3",
    pillar: "k-pop",
    category: "chart",
    question: "Will *Choom*'s 601,000 first week still lead the 2026 girl-group class at the end of September?",
    framing: "MONSTIEZ set the bar in May. Every comeback this summer takes a swing at it.",
    opensAt: "2026-07-05T00:00:00+09:00",
    closesAt: "2026-09-30T23:59:00+09:00",
    status: "open",
    options: [
      { id: "yes", label: "Yes, the record holds", artistSlug: "babymonster" },
      { id: "no", label: "No, someone clears it" },
    ],
    resolutionSourceLabel: "Resolves on Hanteo first-week tallies for 2026 girl-group releases through Q3.",
    resolutionSource: HANTEO,
    tallyVisibleThreshold: 25,
    asOf: "2026-07-05T00:00:00+09:00",
  },
  {
    slug: "le-sserafim-pureflow-incheon-sellout",
    pillar: "k-pop",
    category: "tour",
    question: "Will PUREFLOW's Incheon opener sell out both nights?",
    framing: "The 23-city run opens at home. FEARNOT want the first stamp to read full house.",
    opensAt: "2026-07-05T00:00:00+09:00",
    closesAt: "2026-07-11T18:00:00+09:00",
    status: "open",
    options: [
      { id: "yes", label: "Yes, both nights full", artistSlug: "le-sserafim" },
      { id: "no", label: "No, seats remain" },
    ],
    resolutionSourceLabel: "Resolves on official Source Music or ticketing confirmation for the opening nights.",
    resolutionSource: STAR_NEWS,
    tallyVisibleThreshold: 25,
    asOf: "2026-07-05T00:00:00+09:00",
  },

  // ===================== K-DRAMA =====================
  {
    slug: "park-eun-bin-spooky-in-love-netflix-top10",
    pillar: "k-drama",
    category: "comeback",
    question: "Will Park Eun-bin's *Spooky in Love* crack the Netflix global Top 10 in week one?",
    framing: "She owns the small screen, but can the new romance conquer the global chart too?",
    opensAt: "2026-06-25T00:00:00+09:00",
    closesAt: "2026-07-18T00:00:00+09:00",
    status: "open",
    options: [
      { id: "yes", label: "Yes, global Top 10", artistSlug: "park-eun-bin" },
      { id: "no", label: "No, just outside" },
    ],
    resolutionSourceLabel: "Resolves on Netflix's official global Top 10 for the premiere week.",
    resolutionSource: NETFLIX,
    tallyVisibleThreshold: 25,
    asOf: "2026-07-05T00:00:00+09:00",
  },
  {
    slug: "lee-min-ho-next-drama-confirmed-2026",
    pillar: "k-drama",
    category: "debut",
    question: "Will Lee Min-ho confirm his next drama before the end of 2026?",
    framing: "The wait for his next leading role is its own fandom event.",
    opensAt: "2026-06-29T00:00:00+09:00",
    closesAt: "2026-12-31T00:00:00+09:00",
    status: "open",
    options: [
      { id: "yes", label: "Yes, a new drama, confirmed", artistSlug: "lee-min-ho" },
      { id: "no", label: "No, still choosing" },
    ],
    resolutionSourceLabel: "Resolves on an official network or agency casting announcement.",
    resolutionSource: YONHAP,
    tallyVisibleThreshold: 25,
    asOf: "2026-07-05T00:00:00+09:00",
  },
  {
    slug: "kim-tae-ri-next-role-announced-2026",
    pillar: "k-drama",
    category: "debut",
    question: "Will Kim Tae-ri announce her next acting role in 2026?",
    framing: "Fresh off her variety detour, fans are hungry for her next great character.",
    opensAt: "2026-06-29T00:00:00+09:00",
    closesAt: "2026-12-31T00:00:00+09:00",
    status: "open",
    options: [
      { id: "yes", label: "Yes, a new role announced", artistSlug: "kim-tae-ri" },
      { id: "no", label: "No, not in 2026" },
    ],
    resolutionSourceLabel: "Resolves on an official agency announcement of her next role.",
    resolutionSource: YONHAP,
    tallyVisibleThreshold: 25,
    asOf: "2026-07-05T00:00:00+09:00",
  },
  {
    slug: "byeon-woo-seok-netflix-top10-july",
    pillar: "k-drama",
    category: "chart",
    question: "Will *Jae Seok's B&B Rules!* hold a Netflix Korea weekly top 10 spot through July?",
    framing: "His first fixed variety role became a chart fixture in May. Fans say it stays put all month.",
    opensAt: "2026-07-05T00:00:00+09:00",
    closesAt: "2026-07-31T23:59:00+09:00",
    status: "open",
    options: [
      { id: "yes", label: "Yes, top 10 all month", artistSlug: "byeon-woo-seok" },
      { id: "no", label: "No, it slips out" },
    ],
    resolutionSourceLabel: "Resolves on Netflix's official weekly Top 10 for South Korea covering July.",
    resolutionSource: NETFLIX,
    tallyVisibleThreshold: 25,
    asOf: "2026-07-05T00:00:00+09:00",
  },

  // ===================== K-MOVIE =====================
  {
    slug: "park-chan-wook-no-other-choice-2025-hit",
    pillar: "k-movie",
    category: "box-office",
    question: "Did Park Chan-wook's *No Other Choice* close as one of 2025's top-grossing Korean films?",
    framing: "Resolved: here's how the fan call landed against the box office.",
    opensAt: "2026-05-15T00:00:00+09:00",
    closesAt: "2026-06-05T00:00:00+09:00",
    status: "resolved",
    options: [
      { id: "yes", label: "Yes, a 2025 box-office hit", artistSlug: "park-chan-wook" },
      { id: "no", label: "No, it underperformed" },
    ],
    resolutionSourceLabel: "Resolved on KOBIS cumulative admissions for the theatrical run.",
    resolutionSource: KOBIS,
    resolution: {
      winningOptionId: "yes",
      resolvedAt: "2026-06-15T00:00:00+09:00",
      source: KOBIS,
      note: "Finished at ~2.94 million admissions, among 2025's biggest Korean releases, per KOBIS.",
    },
    tallyVisibleThreshold: 25,
    asOf: "2026-07-05T00:00:00+09:00",
  },
  {
    // 2026-07-05: resolved. Bong confirmed at Cannes in May that *Ally* is
    // tracking toward a 2027 worldwide release, settling the 2026 question.
    slug: "bong-joon-ho-ally-release-date-2026",
    pillar: "k-movie",
    category: "debut",
    question: "Will Bong Joon-ho's first animated film *Ally* land a confirmed 2026 release date?",
    framing: "Resolved: the director answered this one himself at Cannes.",
    opensAt: "2026-04-20T00:00:00+09:00",
    closesAt: "2026-06-30T00:00:00+09:00",
    status: "resolved",
    options: [
      { id: "yes", label: "Yes, dated for 2026", artistSlug: "bong-joon-ho" },
      { id: "no", label: "No, 2027 or later" },
    ],
    resolutionSourceLabel: "Resolved on the director's own release-window confirmation.",
    resolutionSource: STUDIO,
    resolution: {
      winningOptionId: "no",
      resolvedAt: "2026-05-22T00:00:00+09:00",
      source: STAR_NEWS,
      note: "At Cannes in May, Bong confirmed *Ally* is aiming for a 2027 worldwide release.",
    },
    tallyVisibleThreshold: 25,
    asOf: "2026-07-05T00:00:00+09:00",
  },

  // ===================== FASHION & BEAUTY =====================
  {
    slug: "jung-hoyeon-new-louis-vuitton-campaign-2026",
    pillar: "fashion-beauty",
    category: "campaign",
    question: "Will Jung Ho-yeon front a new Louis Vuitton campaign before the end of 2026?",
    framing: "Front-row fixture, house muse: fans expect another campaign to drop.",
    opensAt: "2026-06-12T00:00:00+09:00",
    closesAt: "2026-12-15T00:00:00+09:00",
    status: "open",
    options: [
      { id: "yes", label: "Yes, a new campaign", artistSlug: "jung-hoyeon" },
      { id: "no", label: "Not this year" },
    ],
    resolutionSourceLabel: "Resolves on an official Louis Vuitton campaign announcement.",
    resolutionSource: LOUIS_VUITTON,
    tallyVisibleThreshold: 25,
    asOf: "2026-07-05T00:00:00+09:00",
  },
];
