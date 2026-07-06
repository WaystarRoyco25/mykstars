import type {
  Article,
  Artist,
  Clip,
  Gallery,
  MediaItem,
  Orientation,
  Pillar,
  Prediction,
  Ranking,
  Source,
  StarEvent,
} from "./types";

// ---------------------------------------------------------------------------
// SAMPLE SEED DATA
// ---------------------------------------------------------------------------
// This stands in for the headless CMS during early development so the whole
// site runs end-to-end offline. Photo galleries use neutral, descriptive
// captions of generic public moments (airport arrivals, red carpets, press
// lines, festival photocalls); editorial pieces are analysis/explainers — no
// unverified claims about real people. Public figures are named factually with
// neutral descriptions only. Real licensed/embedded media + CMS content replace
// this later. "NOW" is a fixed reference so relative timestamps stay deterministic.
export const NOW = "2026-07-05T20:00:00+09:00";

// --- sources (every media item links back to one of these) ---
const OSEN: Source = { name: "OSEN", url: "https://osen.mt.co.kr", kind: "press" };
const NEWSEN: Source = { name: "Newsen", url: "https://www.newsen.com", kind: "press" };
const STAR_NEWS: Source = { name: "Star News", url: "https://www.starnewskorea.com/en", kind: "press" };
const NEWS1: Source = { name: "News1", url: "https://www.news1.kr", kind: "wire" };
const W_KOREA: Source = { name: "W Korea", url: "https://www.wkorea.com", kind: "magazine" };
const VOGUE_KOREA: Source = { name: "Vogue Korea", url: "https://www.vogue.co.kr", kind: "magazine" };
const STUDIO: Source = { name: "Studio press kit", url: "https://www.cjenm.com", kind: "official" };
const FESTIVAL: Source = { name: "Festival photo pool", url: "https://www.biff.kr", kind: "press" };
const ELLE_KOREA: Source = { name: "Elle Korea", url: "https://www.elle.co.kr", kind: "magazine" };
const ALLURE_KOREA: Source = { name: "Allure Korea", url: "https://www.allurekorea.com", kind: "magazine" };

function place(
  id: string,
  alt: string,
  credit: Source,
  tone = 0,
  orientation: Orientation = "portrait",
): MediaItem {
  return { id, kind: "placeholder", alt, credit, tone, orientation };
}

// A uniform set (all one orientation) — used where the format is consistent.
function placeSet(
  prefix: string,
  baseAlt: string,
  credit: Source,
  n: number,
  orientation: Orientation = "portrait",
): MediaItem[] {
  return Array.from({ length: n }, (_, i) =>
    place(`${prefix}-${i + 1}`, `${baseAlt}, frame ${i + 1}`, credit, i % 4, orientation),
  );
}

// A portrait-leaning mixed set with ~1 landscape every 3 frames — the realistic
// case (selca/full-body portrait, the recurring wide group/stage frame). The
// cadence keeps portrait dominant while breaking the single-column monotony.
function placeMixed(
  prefix: string,
  baseAlt: string,
  credit: Source,
  n: number,
): MediaItem[] {
  return Array.from({ length: n }, (_, i) => {
    const orientation: Orientation = i % 3 === 2 ? "landscape" : "portrait";
    return place(`${prefix}-${i + 1}`, `${baseAlt}, frame ${i + 1}`, credit, i % 4, orientation);
  });
}

// ---------------------------------------------------------------------------
// PEOPLE — idols, actors, directors and models. Cross-pillar people carry more
// than one pillar/discipline (an idol who acts; an actor who works in film too).
// ---------------------------------------------------------------------------
export const artists: Artist[] = [
  {
    slug: "newjeans",
    name: "NewJeans",
    koreanName: "뉴진스",
    type: "group",
    disciplines: ["idol"],
    pillars: ["k-pop"],
    agency: "ADOR",
    debutYear: 2022,
    bio: "Five-member group known for a clean, retro-leaning visual identity and a strong international following.",
    social: [
      { platform: "instagram", url: "https://www.instagram.com/newjeans_official/", handle: "@newjeans_official" },
      { platform: "x", url: "https://x.com/NewJeans_ADOR", handle: "@NewJeans_ADOR" },
    ],
  },
  {
    slug: "blackpink",
    name: "BLACKPINK",
    koreanName: "블랙핑크",
    type: "group",
    disciplines: ["idol"],
    pillars: ["k-pop"],
    agency: "YG Entertainment",
    debutYear: 2016,
    bio: "One of the most globally recognized K-pop groups, with a long record of fashion-house ambassadorships.",
    social: [
      { platform: "instagram", url: "https://www.instagram.com/blackpinkofficial/", handle: "@blackpinkofficial" },
      { platform: "x", url: "https://x.com/BLACKPINK", handle: "@BLACKPINK" },
    ],
  },
  {
    slug: "iu",
    name: "IU",
    koreanName: "아이유",
    type: "soloist",
    disciplines: ["idol", "actor"],
    pillars: ["k-pop", "k-drama"],
    agency: "EDAM Entertainment",
    debutYear: 2008,
    bio: "Singer-songwriter and actor whose red-carpet and award-show appearances are widely covered.",
    social: [
      { platform: "instagram", url: "https://www.instagram.com/dlwlrma/", handle: "@dlwlrma" },
      { platform: "x", url: "https://x.com/_IUofficial", handle: "@_IUofficial" },
    ],
  },
  {
    slug: "stray-kids",
    name: "Stray Kids",
    koreanName: "스트레이 키즈",
    type: "group",
    disciplines: ["idol"],
    pillars: ["k-pop"],
    agency: "JYP Entertainment",
    debutYear: 2018,
    bio: "Self-producing group with a high-energy performance style and frequent music-show appearances.",
    social: [
      { platform: "instagram", url: "https://www.instagram.com/realstraykids/", handle: "@realstraykids" },
    ],
  },
  {
    slug: "aespa",
    name: "aespa",
    koreanName: "에스파",
    type: "group",
    disciplines: ["idol"],
    pillars: ["k-pop", "fashion-beauty"],
    agency: "SM Entertainment",
    debutYear: 2020,
    bio: "Concept-driven group whose fan events, showcases and fashion-week appearances draw large audiences.",
    social: [
      { platform: "instagram", url: "https://www.instagram.com/aespa_official/", handle: "@aespa_official" },
      { platform: "x", url: "https://x.com/aespa_official", handle: "@aespa_official" },
    ],
  },
  {
    slug: "cha-eunwoo",
    name: "Cha Eun-woo",
    koreanName: "차은우",
    type: "soloist",
    disciplines: ["idol", "actor"],
    pillars: ["k-pop", "k-drama"],
    agency: "Fantagio",
    debutYear: 2016,
    bio: "Idol and actor, a recurring face of fashion and beauty pictorials.",
    social: [
      { platform: "instagram", url: "https://www.instagram.com/eunwo.o_c/", handle: "@eunwo.o_c" },
      { platform: "youtube", url: "https://www.youtube.com/@offclCHAEUNWOO", handle: "@offclCHAEUNWOO" },
    ],
  },
  {
    slug: "twice",
    name: "TWICE",
    koreanName: "트와이스",
    type: "group",
    disciplines: ["idol"],
    pillars: ["k-pop"],
    agency: "JYP Entertainment",
    debutYear: 2015,
    bio: "Long-running group with a steady touring schedule and heavy airport-fashion coverage.",
    social: [
      { platform: "instagram", url: "https://www.instagram.com/twicetagram/", handle: "@twicetagram" },
      { platform: "x", url: "https://x.com/JYPETWICE", handle: "@JYPETWICE" },
    ],
  },
  // --- K-Drama actors ---
  {
    slug: "lee-min-ho",
    name: "Lee Min-ho",
    koreanName: "이민호",
    type: "individual",
    disciplines: ["actor"],
    pillars: ["k-drama"],
    debutYear: 2006,
    bio: "Television actor with a large international following, widely covered at premieres and brand events.",
    social: [
      { platform: "instagram", url: "https://www.instagram.com/actorleeminho/", handle: "@actorleeminho" },
    ],
  },
  {
    slug: "park-eun-bin",
    name: "Park Eun-bin",
    koreanName: "박은빈",
    type: "individual",
    disciplines: ["actor"],
    pillars: ["k-drama"],
    bio: "Television actor whose awards and press-event appearances draw heavy coverage.",
    social: [
      { platform: "instagram", url: "https://www.instagram.com/eunbining0904/", handle: "@eunbining0904" },
    ],
  },
  {
    slug: "kim-tae-ri",
    name: "Kim Tae-ri",
    koreanName: "김태리",
    type: "individual",
    disciplines: ["actor"],
    pillars: ["k-drama", "k-movie"],
    bio: "Actor working across film and television, a regular presence on the festival and press circuit.",
    social: [
      { platform: "instagram", url: "https://www.instagram.com/kimtaeri_official/", handle: "@kimtaeri_official" },
    ],
  },
  // --- K-Movie directors ---
  {
    slug: "park-chan-wook",
    name: "Park Chan-wook",
    koreanName: "박찬욱",
    type: "individual",
    disciplines: ["director"],
    pillars: ["k-movie"],
    bio: "Film director and a recurring figure on the international festival circuit.",
  },
  {
    slug: "bong-joon-ho",
    name: "Bong Joon-ho",
    koreanName: "봉준호",
    type: "individual",
    disciplines: ["director"],
    pillars: ["k-movie"],
    bio: "Film director widely covered at international festivals and premieres.",
  },
  // --- Fashion & Beauty (model/actor) ---
  {
    slug: "jung-hoyeon",
    name: "Jung Ho-yeon",
    koreanName: "정호연",
    type: "individual",
    disciplines: ["model", "actor"],
    pillars: ["fashion-beauty", "k-drama"],
    bio: "Model and actor, a fixture of luxury-house campaigns and fashion-week front rows.",
    social: [
      { platform: "instagram", url: "https://www.instagram.com/hoooooyeony/", handle: "@hoooooyeony" },
    ],
  },

  // --- Added in the 2026-07-05 roster expansion (docs/roster-playbook.md). Every
  // profile fact, handle and era summary below was web-verified on 2026-07-05. ---
  {
    slug: "bts",
    name: "BTS",
    koreanName: "방탄소년단",
    type: "group",
    disciplines: ["idol"],
    pillars: ["k-pop"],
    agency: "BIGHIT MUSIC",
    debutYear: 2013,
    bio: "Seven members back at full strength after military service, with the 2026 album *Arirang* and a sold-out stadium world tour marking the reunion.",
    social: [
      { platform: "instagram", url: "https://www.instagram.com/bts.bighitofficial/", handle: "@bts.bighitofficial" },
      { platform: "x", url: "https://x.com/BTS_twt", handle: "@BTS_twt" },
    ],
  },
  {
    slug: "seventeen",
    name: "SEVENTEEN",
    koreanName: "세븐틴",
    type: "group",
    disciplines: ["idol"],
    pillars: ["k-pop"],
    agency: "PLEDIS Entertainment",
    debutYear: 2015,
    bio: "Thirteen-member self-producing group, fresh off a stadium world tour and a tenth-anniversary fan meeting, now rolling out unit releases.",
    social: [
      { platform: "instagram", url: "https://www.instagram.com/saythename_17/", handle: "@saythename_17" },
      { platform: "x", url: "https://x.com/pledis_17", handle: "@pledis_17" },
    ],
  },
  {
    slug: "ive",
    name: "IVE",
    koreanName: "아이브",
    type: "group",
    disciplines: ["idol"],
    pillars: ["k-pop"],
    agency: "Starship Entertainment",
    debutYear: 2021,
    bio: "Six members holding the top of the girl group brand rankings, taking the SHOW WHAT I AM world tour across North America.",
    social: [
      { platform: "instagram", url: "https://www.instagram.com/ivestarship/", handle: "@ivestarship" },
      { platform: "x", url: "https://x.com/IVEstarship", handle: "@IVEstarship" },
    ],
  },
  {
    // Rookie graduation case (playbook rule 4): Golden Disc Rookie of the Year,
    // brand reputation top 10, and a 2.3M first week on *GREENGREEN* (Hanteo).
    slug: "cortis",
    name: "CORTIS",
    koreanName: "코르티스",
    type: "group",
    disciplines: ["idol"],
    pillars: ["k-pop"],
    agency: "BIGHIT MUSIC",
    debutYear: 2025,
    bio: "Five-member Big Hit group leading the 2026 rookie class: a Golden Disc win, an NBA halftime stage, and a first world tour opening in Incheon.",
    social: [
      { platform: "instagram", url: "https://www.instagram.com/cortis/", handle: "@cortis" },
      { platform: "x", url: "https://x.com/cortis_bighit", handle: "@cortis_bighit" },
    ],
  },
  {
    slug: "hearts2hearts",
    name: "Hearts2Hearts",
    koreanName: "하츠투하츠",
    type: "group",
    disciplines: ["idol"],
    pillars: ["k-pop"],
    agency: "SM Entertainment",
    debutYear: 2025,
    bio: "Eight-member SM group whose 'RUDE!' and *Lemon Tang* releases turned a solid 2025 debut into breakout 2026 scale.",
    social: [
      { platform: "instagram", url: "https://www.instagram.com/hearts2hearts/", handle: "@hearts2hearts" },
      { platform: "x", url: "https://x.com/Hearts2Hearts", handle: "@Hearts2Hearts" },
    ],
  },
  {
    slug: "babymonster",
    name: "BABYMONSTER",
    koreanName: "베이비몬스터",
    type: "group",
    disciplines: ["idol"],
    pillars: ["k-pop"],
    agency: "YG Entertainment",
    debutYear: 2023,
    bio: "Seven-member YG group on a second world tour behind *Choom*, with their first Japanese dome dates booked for the fall.",
    social: [
      { platform: "instagram", url: "https://www.instagram.com/babymonster_ygofficial/", handle: "@babymonster_ygofficial" },
      { platform: "x", url: "https://x.com/ygbabymonster_", handle: "@ygbabymonster_" },
    ],
  },
  {
    slug: "le-sserafim",
    name: "LE SSERAFIM",
    koreanName: "르세라핌",
    type: "group",
    disciplines: ["idol"],
    pillars: ["k-pop"],
    agency: "Source Music",
    debutYear: 2022,
    bio: "Five-member Source Music group riding the Latin house single 'BOOMPALA' into PUREFLOW, their second world tour.",
    social: [
      { platform: "instagram", url: "https://www.instagram.com/le_sserafim/", handle: "@le_sserafim" },
      { platform: "x", url: "https://x.com/le_sserafim", handle: "@le_sserafim" },
    ],
  },
  // --- K-Drama (actor) ---
  {
    slug: "byeon-woo-seok",
    name: "Byeon Woo-seok",
    koreanName: "변우석",
    type: "individual",
    disciplines: ["actor"],
    pillars: ["k-drama"],
    agency: "VARO Entertainment",
    debutYear: 2016,
    bio: "Leading man of *Lovely Runner* and *Perfect Crown*, now adding a Netflix variety turn and an Asia fan meeting tour to the run.",
    social: [
      { platform: "instagram", url: "https://www.instagram.com/byeonwooseok/", handle: "@byeonwooseok" },
    ],
  },
];

// ---------------------------------------------------------------------------
// GALLERIES
// ---------------------------------------------------------------------------
export const galleries: Gallery[] = [
  // ===================== K-POP =====================
  {
    // 2026-07-05 correction: the prior "comeback showcase" set described an event
    // that never happened (and embedded a 2024 reel). Re-anchored to the verified
    // real moment: ADOR-confirmed pre-production sessions in Copenhagen, April
    // 13 to 17, 2026, with Haerin, Hyein and Hanni. See docs/roster-playbook.md.
    slug: "newjeans-copenhagen-sessions",
    title: "NewJeans regroup in Copenhagen",
    pillar: "k-pop",
    category: "event",
    artistSlugs: ["newjeans"],
    event: "ADOR pre-production sessions",
    date: "2026-04-17T18:00:00+09:00",
    source: NEWS1,
    excerpt:
      "The first confirmed NewJeans activity of 2026: pre-production sessions in Copenhagen, confirmed by ADOR, with three members at work.",
    cover: place("newjeans-cph-cover", "NewJeans members arriving for the Copenhagen sessions", NEWS1, 2),
    media: placeMixed("newjeans-cph", "NewJeans Copenhagen sessions", NEWS1, 8),
  },
  {
    slug: "blackpink-incheon-airport",
    title: "BLACKPINK at Incheon, ahead of a tour leg",
    pillar: "k-pop",
    category: "airport",
    tags: ["pictorial"],
    artistSlugs: ["blackpink"],
    event: "Incheon International Airport",
    date: "2026-06-21T18:00:00+09:00",
    source: OSEN,
    excerpt: "Departure looks captured in the Incheon airport press line.",
    cover: place("blackpink-cover", "BLACKPINK arriving at Incheon airport", OSEN, 0),
    media: placeSet("blackpink", "BLACKPINK at Incheon airport", OSEN, 8),
  },
  {
    slug: "stray-kids-music-show",
    title: "Stray Kids work the comeback stage",
    pillar: "k-pop",
    category: "comeback",
    artistSlugs: ["stray-kids"],
    event: "Music-show comeback stage",
    date: "2026-06-21T16:00:00+09:00",
    source: NEWSEN,
    excerpt: "Performance frames from the week's music-show comeback.",
    cover: place("skz-cover", "Stray Kids on the comeback stage", NEWSEN, 3, "landscape"),
    media: placeMixed("skz", "Stray Kids comeback stage", NEWSEN, 7),
  },
  {
    slug: "aespa-fan-meet",
    title: "aespa, up close at the fan meet",
    pillar: "k-pop",
    category: "event",
    artistSlugs: ["aespa"],
    event: "Fan meet",
    date: "2026-06-21T15:00:00+09:00",
    source: NEWS1,
    excerpt: "Stage and audience moments from the fan meet.",
    cover: place("aespa-cover", "aespa greeting fans at the fan meet", NEWS1, 1),
    media: placeMixed("aespa", "aespa fan meet", NEWS1, 6),
  },
  {
    slug: "iu-baeksang-red-carpet",
    title: "IU on an awards-night red carpet",
    pillar: "k-pop",
    category: "red-carpet",
    tags: ["pictorial"],
    artistSlugs: ["iu"],
    event: "Awards ceremony",
    date: "2026-06-21T14:00:00+09:00",
    source: STAR_NEWS,
    excerpt: "Arrival and pose frames from the awards red carpet.",
    cover: place("iu-cover", "IU on the Baeksang Arts Awards red carpet", STAR_NEWS, 2),
    media: placeSet("iu", "IU on the Baeksang red carpet", STAR_NEWS, 6),
  },
  {
    slug: "cha-eunwoo-w-korea",
    title: "Cha Eun-woo for *W Korea*",
    pillar: "k-pop",
    category: "pictorial",
    artistSlugs: ["cha-eunwoo"],
    event: "W Korea pictorial",
    date: "2026-06-21T12:00:00+09:00",
    source: W_KOREA,
    excerpt: "A licensed pictorial preview: the buy-the-issue funnel attaches here.",
    cover: place("eunwoo-cover", "Cha Eun-woo *W Korea* pictorial, cover look", W_KOREA, 3),
    media: placeSet("eunwoo", "Cha Eun-woo *W Korea* pictorial", W_KOREA, 6),
  },
  {
    slug: "twice-incheon-airport",
    title: "TWICE depart from Incheon",
    pillar: "k-pop",
    category: "airport",
    artistSlugs: ["twice"],
    event: "Incheon International Airport",
    date: "2026-06-21T11:00:00+09:00",
    source: OSEN,
    excerpt: "Airport-fashion frames from the morning departure.",
    cover: place("twice-cover", "TWICE departing from Incheon airport", OSEN, 0),
    media: placeSet("twice", "TWICE at Incheon airport", OSEN, 7),
  },

  // ===================== K-DRAMA =====================
  {
    slug: "drama-production-presentation",
    title: "A new series, unveiled at its production presentation",
    pillar: "k-drama",
    category: "stills",
    artistSlugs: ["kim-tae-ri", "park-eun-bin"],
    event: "Production presentation",
    date: "2026-06-21T17:30:00+09:00",
    source: STUDIO,
    excerpt: "First stills and cast frames from the production presentation of an upcoming drama.",
    cover: place("drama-pp-cover", "Cast at a drama production presentation", STUDIO, 1, "landscape"),
    media: placeMixed("drama-pp", "Drama production presentation", STUDIO, 7),
  },
  {
    slug: "lee-min-ho-press-tour",
    title: "Lee Min-ho on the drama press tour",
    pillar: "k-drama",
    category: "press",
    artistSlugs: ["lee-min-ho"],
    event: "Press conference",
    date: "2026-06-21T13:30:00+09:00",
    source: STAR_NEWS,
    excerpt: "Arrival and step-and-repeat frames from the drama's press conference.",
    cover: place("lmh-cover", "Lee Min-ho at a drama press conference", STAR_NEWS, 2),
    media: placeSet("lmh", "Lee Min-ho at the press conference", STAR_NEWS, 6),
  },
  {
    slug: "drama-awards-press-line",
    title: "Park Eun-bin on the drama awards press line",
    pillar: "k-drama",
    category: "press",
    tags: ["red-carpet"],
    artistSlugs: ["park-eun-bin"],
    event: "Drama awards",
    date: "2026-06-20T22:00:00+09:00",
    source: NEWS1,
    excerpt: "Press-line frames from the television drama awards.",
    cover: place("peb-cover", "Park Eun-bin on the drama awards press line", NEWS1, 3),
    media: placeSet("peb", "Park Eun-bin on the awards press line", NEWS1, 6),
  },
  {
    slug: "historical-series-stills",
    title: "Stills from a new historical series",
    pillar: "k-drama",
    category: "stills",
    artistSlugs: ["kim-tae-ri"],
    event: "Drama stills",
    date: "2026-06-20T15:00:00+09:00",
    source: STUDIO,
    excerpt: "Wide-format production stills from an upcoming historical drama.",
    cover: place("hist-cover", "Production still from a historical drama", STUDIO, 0, "landscape"),
    media: placeSet("hist", "Historical drama still", STUDIO, 6, "landscape"),
  },
  {
    slug: "drama-casting-ensemble",
    title: "Casting confirmed: the ensemble for an upcoming series",
    pillar: "k-drama",
    category: "casting",
    artistSlugs: ["lee-min-ho", "park-eun-bin"],
    event: "Casting announcement",
    date: "2026-06-20T11:00:00+09:00",
    source: STUDIO,
    excerpt: "Character portraits released with the casting announcement.",
    cover: place("cast-cover", "Character portrait from a casting announcement", STUDIO, 2),
    media: placeSet("cast", "Casting announcement portrait", STUDIO, 6),
  },

  // ===================== FASHION & BEAUTY =====================
  {
    slug: "vogue-korea-editorial",
    title: "Jung Ho-yeon, a *Vogue Korea* editorial",
    pillar: "fashion-beauty",
    category: "pictorial",
    artistSlugs: ["jung-hoyeon"],
    event: "Vogue Korea editorial",
    date: "2026-06-21T09:30:00+09:00",
    source: VOGUE_KOREA,
    excerpt: "A licensed editorial preview: full-length portrait styling.",
    cover: place("vogue-cover", "Jung Ho-yeon *Vogue Korea* editorial, cover look", VOGUE_KOREA, 3),
    media: placeSet("vogue", "Jung Ho-yeon *Vogue Korea* editorial", VOGUE_KOREA, 6),
  },
  {
    slug: "luxury-house-campaign",
    title: "A luxury-house campaign, shot in Seoul",
    pillar: "fashion-beauty",
    category: "campaign",
    artistSlugs: ["jung-hoyeon"],
    event: "Brand campaign",
    date: "2026-06-20T18:00:00+09:00",
    source: VOGUE_KOREA,
    excerpt: "Campaign imagery from a luxury-house ambassadorship.",
    cover: place("campaign-cover", "Luxury-house campaign key visual", VOGUE_KOREA, 1, "landscape"),
    media: placeMixed("campaign", "Luxury-house campaign", VOGUE_KOREA, 6),
  },
  {
    slug: "seoul-fashion-week-front-row",
    title: "Seoul Fashion Week: the front row",
    pillar: "fashion-beauty",
    category: "fashion-week",
    artistSlugs: ["aespa", "jung-hoyeon"],
    event: "Seoul Fashion Week",
    date: "2026-06-20T13:00:00+09:00",
    source: W_KOREA,
    excerpt: "Front-row arrivals and looks from Seoul Fashion Week.",
    cover: place("sfw-cover", "Front-row arrival at Seoul Fashion Week", W_KOREA, 2),
    media: placeMixed("sfw", "Seoul Fashion Week front row", W_KOREA, 7),
  },

  // ===================== K-MOVIE =====================
  {
    slug: "busan-opening-photocall",
    title: "Busan festival: the opening photocall",
    pillar: "k-movie",
    category: "festival",
    artistSlugs: ["park-chan-wook", "bong-joon-ho", "kim-tae-ri"],
    event: "Busan International Film Festival",
    date: "2026-06-21T11:30:00+09:00",
    source: FESTIVAL,
    excerpt: "Directors and cast at the festival's opening photocall.",
    cover: place("biff-cover", "Opening photocall at the Busan film festival", FESTIVAL, 0, "landscape"),
    media: placeMixed("biff", "Busan festival opening photocall", FESTIVAL, 7),
  },
  {
    slug: "director-in-focus",
    title: "Director in focus: a career retrospective",
    pillar: "k-movie",
    category: "director",
    artistSlugs: ["park-chan-wook"],
    event: "Retrospective",
    date: "2026-06-20T20:00:00+09:00",
    source: FESTIVAL,
    excerpt: "Portraits and on-stage frames from a director retrospective Q&A.",
    cover: place("retro-cover", "Director on stage for a retrospective Q&A", FESTIVAL, 3),
    media: placeMixed("retro", "Director retrospective", FESTIVAL, 6),
  },

  // ----- additional K-POP sets (depth for the home band + /k-pop) -----
  {
    slug: "twice-music-bank-comeback",
    title: "TWICE light up the comeback stage",
    pillar: "k-pop",
    category: "comeback",
    artistSlugs: ["twice"],
    event: "Music-show comeback stage",
    date: "2026-06-20T20:00:00+09:00",
    source: NEWSEN,
    excerpt: "Performance frames from the week's music-show comeback stage.",
    cover: place("twice-mb-cover", "TWICE on the comeback stage", NEWSEN, 1, "landscape"),
    media: placeMixed("twice-mb", "TWICE comeback stage", NEWSEN, 7),
  },
  {
    slug: "stray-kids-variety-appearance",
    title: "Stray Kids drop by a variety set",
    pillar: "k-pop",
    category: "event",
    artistSlugs: ["stray-kids"],
    event: "Variety show appearance",
    date: "2026-06-19T20:00:00+09:00",
    source: NEWS1,
    excerpt: "Behind-the-scenes frames from a variety-show guest spot.",
    cover: place("skz-var-cover", "Stray Kids on a variety set", NEWS1, 2, "landscape"),
    media: placeMixed("skz-var", "Stray Kids variety appearance", NEWS1, 6),
  },

  // ----- 2026-07-05 roster expansion: new K-POP subjects, each anchored to a
  // web-verified real moment (docs/roster-playbook.md rule 2) -----
  {
    slug: "bts-the-city-london",
    title: "BTS THE CITY takes over London",
    pillar: "k-pop",
    category: "event",
    artistSlugs: ["bts"],
    event: "BTS THE CITY, London",
    date: "2026-07-04T20:00:00+09:00",
    source: STAR_NEWS,
    excerpt:
      "The citywide fan activation opens ahead of the ARIRANG tour's Tottenham Hotspur Stadium nights.",
    cover: place("bts-city-cover", "BTS THE CITY signage lighting up central London", STAR_NEWS, 0),
    media: placeMixed("bts-city", "BTS THE CITY London activation", STAR_NEWS, 7),
  },
  {
    slug: "bts-gwanghwamun-comeback",
    title: "BTS pack Gwanghwamun for the comeback",
    pillar: "k-pop",
    category: "event",
    artistSlugs: ["bts"],
    event: "BTS THE COMEBACK LIVE, Gwanghwamun Square",
    date: "2026-03-21T20:00:00+09:00",
    source: NEWS1,
    excerpt:
      "Frames from the free outdoor show in central Seoul, the first full-group stage in nearly four years, one day after *Arirang* arrived.",
    cover: place("bts-gwang-cover", "BTS on the Gwanghwamun Square stage", NEWS1, 3, "landscape"),
    media: placeMixed("bts-gwang", "BTS comeback show at Gwanghwamun Square", NEWS1, 9),
  },
  {
    slug: "seventeen-carat-land",
    title: "SEVENTEEN scale CARAT LAND up to a stadium",
    pillar: "k-pop",
    category: "event",
    artistSlugs: ["seventeen"],
    event: "SEVENTEEN in CARAT LAND",
    date: "2026-06-20T19:00:00+09:00",
    source: OSEN,
    excerpt:
      "The tenth-anniversary fan meeting fills Incheon Asiad Main Stadium across two nights.",
    cover: place("svt-cl-cover", "SEVENTEEN greeting the crowd at CARAT LAND", OSEN, 1, "landscape"),
    media: placeMixed("svt-cl", "SEVENTEEN in CARAT LAND fan meeting", OSEN, 8),
  },
  {
    slug: "ive-blackhole-comeback",
    title: "IVE pull the room into 'BLACKHOLE'",
    pillar: "k-pop",
    category: "comeback",
    artistSlugs: ["ive"],
    event: "*REVIVE+* comeback week",
    date: "2026-02-23T19:00:00+09:00",
    source: NEWSEN,
    excerpt:
      "Comeback-week performance frames from the *REVIVE+* title track's first stages.",
    cover: place("ive-bh-cover", "IVE on the 'BLACKHOLE' comeback stage", NEWSEN, 2, "landscape"),
    media: placeMixed("ive-bh", "IVE 'BLACKHOLE' comeback stage", NEWSEN, 7),
  },
  {
    slug: "cortis-golden-disc-rookie",
    title: "CORTIS take Rookie of the Year in Taipei",
    pillar: "k-pop",
    category: "event",
    tags: ["red-carpet"],
    artistSlugs: ["cortis"],
    event: "40th Golden Disc Awards",
    date: "2026-01-10T21:00:00+09:00",
    source: STAR_NEWS,
    excerpt:
      "Red-carpet and acceptance frames from the Taipei Dome ceremony that crowned the rookie class.",
    cover: place("cortis-gda-cover", "CORTIS accepting Rookie of the Year", STAR_NEWS, 0),
    media: placeMixed("cortis-gda", "CORTIS at the Golden Disc Awards", STAR_NEWS, 8),
  },
  {
    slug: "cortis-nba-celebrity-game",
    title: "CORTIS bring K-pop to the NBA Celebrity Game",
    pillar: "k-pop",
    category: "event",
    artistSlugs: ["cortis"],
    event: "NBA All-Star Celebrity Game halftime",
    date: "2026-02-13T14:00:00+09:00",
    source: NEWS1,
    excerpt:
      "Halftime-stage frames from the Kia Forum, the first K-pop act to play the Celebrity Game.",
    cover: place("cortis-nba-cover", "CORTIS at halftime of the NBA Celebrity Game", NEWS1, 1, "landscape"),
    media: placeMixed("cortis-nba", "CORTIS NBA Celebrity Game halftime", NEWS1, 7),
  },
  {
    slug: "hearts2hearts-lemon-tang-week",
    title: "Hearts2Hearts squeeze summer into *Lemon Tang*",
    pillar: "k-pop",
    category: "comeback",
    artistSlugs: ["hearts2hearts"],
    event: "*Lemon Tang* comeback week",
    date: "2026-06-22T19:00:00+09:00",
    source: NEWSEN,
    excerpt:
      "Release-week stage and fan-event frames as the mini album posts the group's best first week yet.",
    cover: place("h2h-lt-cover", "Hearts2Hearts on the *Lemon Tang* comeback stage", NEWSEN, 2, "landscape"),
    media: placeMixed("h2h-lt", "Hearts2Hearts *Lemon Tang* comeback week", NEWSEN, 8),
  },
  {
    slug: "babymonster-choom-tour-opener",
    title: "BABYMONSTER open the *Choom* tour at home",
    pillar: "k-pop",
    category: "event",
    artistSlugs: ["babymonster"],
    event: "Choom World Tour, Seoul opener",
    date: "2026-06-26T20:00:00+09:00",
    source: OSEN,
    excerpt:
      "Opening-night frames from Jamsil as the second world tour gets moving.",
    cover: place("bm-choom-cover", "BABYMONSTER opening the Choom world tour in Seoul", OSEN, 3, "landscape"),
    media: placeMixed("bm-choom", "BABYMONSTER Choom tour opener", OSEN, 8),
  },
  {
    slug: "le-sserafim-boompala-comeback",
    title: "LE SSERAFIM go Latin house with 'BOOMPALA'",
    pillar: "k-pop",
    category: "comeback",
    artistSlugs: ["le-sserafim"],
    event: "*PUREFLOW pt.1* comeback week",
    date: "2026-05-22T19:00:00+09:00",
    source: NEWSEN,
    excerpt:
      "First-week performance frames from the single that set up the PUREFLOW tour.",
    cover: place("lsf-bp-cover", "LE SSERAFIM on the 'BOOMPALA' stage", NEWSEN, 1, "landscape"),
    media: placeMixed("lsf-bp", "LE SSERAFIM 'BOOMPALA' comeback stage", NEWSEN, 7),
  },

  // ----- additional K-DRAMA sets -----
  {
    slug: "drama-ost-release",
    title: "Park Eun-bin lends her voice to a new OST",
    pillar: "k-drama",
    category: "ost",
    artistSlugs: ["park-eun-bin"],
    event: "OST release",
    date: "2026-06-19T18:00:00+09:00",
    source: STUDIO,
    excerpt: "Recording-booth and release frames from a drama OST.",
    cover: place("ost-cover", "OST recording session still", STUDIO, 3),
    media: placeMixed("ost", "Drama OST release", STUDIO, 6),
  },
  {
    slug: "drama-review-screening",
    title: "Lee Min-ho at a drama review screening",
    pillar: "k-drama",
    category: "review",
    artistSlugs: ["lee-min-ho"],
    event: "Review screening",
    date: "2026-06-18T20:00:00+09:00",
    source: STAR_NEWS,
    excerpt: "Arrival and stage frames from a press review screening.",
    cover: place("review-cover", "Lee Min-ho at a review screening", STAR_NEWS, 1),
    media: placeSet("review", "Drama review screening", STAR_NEWS, 6),
  },
  {
    slug: "byeon-woo-seok-perfect-crown-press",
    title: "Byeon Woo-seok and IU present *Perfect Crown*",
    pillar: "k-drama",
    category: "press",
    artistSlugs: ["byeon-woo-seok", "iu"],
    event: "Production press conference",
    date: "2026-04-06T15:00:00+09:00",
    source: STAR_NEWS,
    excerpt:
      "Step-and-repeat and stage frames from the Seoul press conference, four days before the premiere.",
    cover: place("bws-pc-cover", "Byeon Woo-seok and IU at the Perfect Crown press conference", STAR_NEWS, 2, "landscape"),
    media: placeMixed("bws-pc", "Perfect Crown press conference", STAR_NEWS, 8),
  },
  {
    slug: "byeon-woo-seok-bnb-set",
    title: "Byeon Woo-seok checks into *Jae Seok's B&B Rules!*",
    pillar: "k-drama",
    category: "stills",
    artistSlugs: ["byeon-woo-seok"],
    event: "Variety set stills",
    date: "2026-05-26T12:00:00+09:00",
    source: STUDIO,
    excerpt:
      "Set stills from the actor's first fixed variety role, released with the premiere.",
    cover: place("bws-bnb-cover", "Byeon Woo-seok on the variety set", STUDIO, 0),
    media: placeMixed("bws-bnb", "Jae Seok's B&B Rules! set stills", STUDIO, 6),
  },

  // ----- additional FASHION & BEAUTY sets (the sparsest band) -----
  {
    slug: "cha-eunwoo-beauty-cover",
    title: "Cha Eun-woo, an *Allure Korea* beauty cover",
    pillar: "fashion-beauty",
    category: "beauty",
    artistSlugs: ["cha-eunwoo"],
    event: "Allure Korea beauty story",
    date: "2026-06-20T10:00:00+09:00",
    source: ALLURE_KOREA,
    excerpt: "A licensed beauty-cover preview: skin-first styling.",
    cover: place("eunwoo-beauty-cover", "Cha Eun-woo *Allure Korea* beauty cover", ALLURE_KOREA, 2),
    media: placeSet("eunwoo-beauty", "Cha Eun-woo *Allure Korea* beauty story", ALLURE_KOREA, 6),
  },
  {
    slug: "aespa-elle-korea-summer",
    title: "aespa cover *Elle Korea*'s summer issue",
    pillar: "fashion-beauty",
    category: "pictorial",
    artistSlugs: ["aespa"],
    event: "Elle Korea pictorial",
    date: "2026-06-19T10:00:00+09:00",
    source: ELLE_KOREA,
    excerpt: "A licensed editorial preview: full-group summer styling.",
    cover: place("aespa-elle-cover", "aespa *Elle Korea* summer cover", ELLE_KOREA, 3),
    media: placeSet("aespa-elle", "aespa *Elle Korea* summer editorial", ELLE_KOREA, 6),
  },
  {
    slug: "jung-hoyeon-milan-fashion-week",
    title: "Jung Ho-yeon at Milan Fashion Week",
    pillar: "fashion-beauty",
    category: "fashion-week",
    artistSlugs: ["jung-hoyeon"],
    event: "Milan Fashion Week",
    date: "2026-06-18T22:00:00+09:00",
    source: W_KOREA,
    excerpt: "Front-row arrivals and looks from the Milan shows.",
    cover: place("hoyeon-milan-cover", "Jung Ho-yeon at Milan Fashion Week", W_KOREA, 0),
    media: placeMixed("hoyeon-milan", "Milan Fashion Week front row", W_KOREA, 6),
  },
  {
    slug: "beauty-house-skincare-campaign",
    title: "A skincare house unveils its summer campaign",
    pillar: "fashion-beauty",
    category: "campaign",
    artistSlugs: ["jung-hoyeon"],
    event: "Brand campaign",
    date: "2026-06-17T12:00:00+09:00",
    source: ALLURE_KOREA,
    excerpt: "Campaign imagery from a beauty-house ambassadorship.",
    cover: place("skincare-cover", "Skincare campaign key visual", ALLURE_KOREA, 1, "landscape"),
    media: placeMixed("skincare", "Skincare campaign", ALLURE_KOREA, 6),
  },

  // ----- additional K-MOVIE sets (the other sparse band) -----
  {
    slug: "cannes-competition-photocall",
    title: "Cannes: the competition photocall",
    pillar: "k-movie",
    category: "festival",
    artistSlugs: ["park-chan-wook", "kim-tae-ri"],
    event: "Cannes Film Festival",
    date: "2026-06-20T18:00:00+09:00",
    source: FESTIVAL,
    excerpt: "Director and cast at the competition photocall.",
    cover: place("cannes-cover", "Competition photocall at Cannes", FESTIVAL, 2, "landscape"),
    media: placeMixed("cannes", "Cannes competition photocall", FESTIVAL, 7),
  },
  {
    slug: "bong-joon-ho-press-conference",
    title: "Bong Joon-ho fields the festival press",
    pillar: "k-movie",
    category: "review",
    artistSlugs: ["bong-joon-ho"],
    event: "Press conference",
    date: "2026-06-19T16:00:00+09:00",
    source: FESTIVAL,
    excerpt: "Stage and step-and-repeat frames from a festival press conference.",
    cover: place("bjh-press-cover", "Bong Joon-ho at a festival press conference", FESTIVAL, 0, "landscape"),
    media: placeSet("bjh-press", "Festival press conference", FESTIVAL, 6),
  },
  {
    slug: "director-masterclass",
    title: "A director's masterclass, in full",
    pillar: "k-movie",
    category: "director",
    artistSlugs: ["park-chan-wook"],
    event: "Masterclass",
    date: "2026-06-18T19:00:00+09:00",
    source: FESTIVAL,
    excerpt: "On-stage frames from a director masterclass and audience Q and A.",
    cover: place("masterclass-cover", "Director on stage for a masterclass", FESTIVAL, 3),
    media: placeMixed("masterclass", "Director masterclass", FESTIVAL, 6),
  },
  {
    slug: "kim-tae-ri-indie-spotlight",
    title: "Kim Tae-ri headlines an indie spotlight",
    pillar: "k-movie",
    category: "crossover",
    artistSlugs: ["kim-tae-ri"],
    event: "Indie showcase",
    date: "2026-06-17T19:00:00+09:00",
    source: FESTIVAL,
    excerpt: "Portraits and stage frames from an independent-film spotlight.",
    cover: place("indie-cover", "Kim Tae-ri at an indie film spotlight", FESTIVAL, 1),
    media: placeMixed("indie", "Indie film spotlight", FESTIVAL, 6),
  },
  // --- 2026-07-05 mosaic widening: landscape-led sets so the bands stop reading
  //     as a single portrait column (see docs/roster-playbook.md) ---
  {
    slug: "park-eun-bin-talk-show-taping",
    title: "Park Eun-bin, wide frames from a talk-show taping",
    pillar: "k-drama",
    category: "press",
    artistSlugs: ["park-eun-bin"],
    event: "Broadcast promo circuit",
    date: "2026-06-26T20:00:00+09:00",
    source: STUDIO,
    excerpt: "Studio wides from a broadcast taping stop on the promo circuit.",
    cover: place("peb-taping-cover", "Park Eun-bin on a talk-show set", STUDIO, 1, "landscape"),
    media: placeSet("peb-taping", "Park Eun-bin talk-show taping", STUDIO, 7, "landscape"),
  },
  {
    slug: "festival-main-stage-wides",
    title: "Festival season from the pit, shot wide",
    pillar: "k-pop",
    category: "event",
    artistSlugs: ["ive"],
    event: "University festival circuit",
    date: "2026-05-23T21:00:00+09:00",
    source: NEWSEN,
    excerpt: "Main-stage wides from the May festival run: full-stage frames with the crowd and lights in.",
    cover: place("fest-wides-cover", "IVE on a festival main stage", NEWSEN, 0, "landscape"),
    media: placeMixed("fest-wides", "Festival main stage", NEWSEN, 8),
  },
  {
    slug: "premiere-photocall-row",
    title: "The premiere photocall, in a row",
    pillar: "k-movie",
    category: "festival",
    artistSlugs: ["park-chan-wook"],
    event: "Summer premiere circuit",
    date: "2026-06-30T19:30:00+09:00",
    source: FESTIVAL,
    excerpt: "Director and cast line up for the photocall row, the classic wide of premiere season.",
    cover: place("premiere-row-cover", "Park Chan-wook at a premiere photocall", FESTIVAL, 2, "landscape"),
    media: placeSet("premiere-row", "Premiere photocall row", FESTIVAL, 6, "landscape"),
  },
];

// ---------------------------------------------------------------------------
// ARTICLES
// ---------------------------------------------------------------------------
export const articles: Article[] = [
  // --- 2026-07-05 roster expansion: multi-artist analysis for the new subjects ---
  {
    slug: "arirang-numbers-reading",
    title: "Reading the *Arirang* return: what the numbers actually say",
    dek: "A No. 1 debut, a free show at Gwanghwamun, a sold-out stadium run: BTS's comeback is best understood as three different records at once.",
    status: "analysis",
    pillar: "k-pop",
    author: "MyKStars",
    date: "2026-07-03T09:00:00+09:00",
    body: [
      "Comebacks after a service gap usually restart an engine. *Arirang* skipped the warmup: a Billboard 200 No. 1, the biggest Korean first week of the year, and a tour that sold through its London, Paris and Los Angeles stadium legs before the first night.",
      "The subtler number is the free one. The Gwanghwamun show in March cost nothing to attend and worked as a statement of scale: the group's first full stage in nearly four years, held as a public event in the middle of Seoul rather than behind a paywall.",
      "What to watch next is durability: whether the album's tracks re-enter the global charts as the European and American legs roll through the summer. That is the version of momentum that outlives a release week.",
    ],
    source: NEWS1,
    related: { artistSlugs: ["bts"], gallerySlugs: ["bts-gwanghwamun-comeback", "bts-the-city-london"] },
  },
  {
    slug: "rookie-class-2026-first-week-curve",
    title: "The 2026 rookie class is bending the first-week curve",
    dek: "CORTIS and Hearts2Hearts turned respectable debuts into record sophomore weeks. The old rookie math no longer holds.",
    status: "analysis",
    pillar: "k-pop",
    author: "MyKStars",
    date: "2026-07-02T09:00:00+09:00",
    body: [
      "For years the informal bar for a strong rookie debut sat around two hundred thousand first-week copies. The 2026 class made that a floor, not a ceiling: CORTIS moved over 2.3 million copies of *GREENGREEN* in a week, and Hearts2Hearts set a personal best just short of six hundred thousand with *Lemon Tang*.",
      "The pattern is the same in both cases: a solid debut, then a sophomore release that scales five to ten times. The machinery behind it (global pre-saves, day-one tour announcements, festival slots booked before the first anniversary) compresses what used to be a three-year build into eighteen months.",
      "The question that matters for the rest of the year is whether the third release holds the altitude. That, more than any award, is what separates a class from a cohort.",
    ],
    source: STAR_NEWS,
    related: {
      artistSlugs: ["cortis", "hearts2hearts", "babymonster"],
      gallerySlugs: ["cortis-golden-disc-rookie", "hearts2hearts-lemon-tang-week"],
    },
  },
  {
    slug: "girl-group-brand-race-2026",
    title: "The mid-2026 girl group brand race, in three moves",
    dek: "IVE hold the top, BLACKPINK surge on the *Deadline* era, and LE SSERAFIM turn a Macarena sample into a tour setup.",
    status: "analysis",
    pillar: "k-pop",
    author: "MyKStars",
    date: "2026-06-30T09:00:00+09:00",
    body: [
      "Brand reputation indexes are a blunt instrument, but they move on real events. IVE's hold on first place tracks a comeback cycle that never quite cooled; BLACKPINK's climb follows the *Deadline* records; LE SSERAFIM's rise maps almost exactly onto the week 'BOOMPALA' landed.",
      "What the index cannot see is the touring map underneath it. All three acts spend the second half of 2026 on the road, which means the next six months of this race will be decided in arenas, not on release calendars.",
    ],
    source: STAR_NEWS,
    related: {
      artistSlugs: ["ive", "blackpink", "le-sserafim"],
      gallerySlugs: ["ive-blackhole-comeback", "le-sserafim-boompala-comeback"],
    },
  },
  {
    slug: "monochrome-concept-photos-2026",
    title: "Why monochrome concept photos are dominating 2026 comebacks",
    dek: "Black-and-white sets read as 'premium' and travel well across platforms. A look at why agencies keep reaching for them.",
    status: "analysis",
    pillar: "k-pop",
    author: "MyKStars",
    date: "2026-06-21T13:00:00+09:00",
    body: [
      "Strip the color out of a concept set and two things happen at once: the styling reads as more expensive, and the images survive the journey through dozens of feeds, reposts and compression passes without falling apart. That durability matters when a comeback lives or dies in the first six hours of sharing.",
      "Monochrome also sidesteps the seasonal-palette problem. A set shot in black and white doesn't date the way a hyper-specific color story does, which is useful when the same images will anchor an artist hub for months.",
      "The risk is sameness. When everyone reaches for the same restraint, the differentiation moves back to where it always lived: styling, casting of the photographer, and the strength of a single hero frame.",
    ],
    source: NEWSEN,
    related: { artistSlugs: ["newjeans", "stray-kids"] },
  },
  {
    slug: "the-airport-runway",
    title: "The airport runway: how a 5 a.m. departure became fashion theater",
    dek: "Incheon's press line is now a styled event in its own right. We trace how 'airport fashion' became a genre.",
    status: "analysis",
    pillar: "k-pop",
    author: "MyKStars",
    date: "2026-06-21T10:30:00+09:00",
    body: [
      "There is nothing accidental about an airport look. Outfits are planned, sometimes pulled from a brand the artist represents, and timed to a press line that everyone in the room knows is coming.",
      "For global fans, the airport set is often the first high-resolution sighting of an artist between official schedules, which is exactly why organized, credited airport galleries are one of the most-searched things in the fandom and one of the least well served in English.",
    ],
    source: OSEN,
    related: { artistSlugs: ["blackpink", "twice"], gallerySlugs: ["blackpink-incheon-airport"] },
  },
  {
    slug: "kdrama-global-default",
    title: "How global streaming made K-drama a default, not a niche",
    dek: "Korean series are now a standing fixture on the world's streaming charts. We look at what that changes for how they're covered.",
    status: "analysis",
    pillar: "k-drama",
    author: "MyKStars",
    date: "2026-06-21T08:00:00+09:00",
    body: [
      "A decade ago, finding a Korean drama with reliable English subtitles took effort. Now a new title can open simultaneously in dozens of countries and sit on a global top-ten chart by the weekend. The discovery problem has inverted from scarcity to overload.",
      "That shift moves the coverage gap. The audience no longer needs to be told a show exists; it needs help deciding what to start, where to watch it without hunting across four services, and who is in it. Organized, credited stills and a clear where-to-watch line do more work than a recap ever did.",
    ],
    source: STUDIO,
    related: { artistSlugs: ["kim-tae-ri", "park-eun-bin"], gallerySlugs: ["drama-production-presentation"] },
  },
  {
    slug: "casting-season",
    title: "Casting season: how to read the tea leaves of a lineup",
    dek: "A casting announcement is the first marketing beat of a drama. Here's what the portrait drop is really telling you.",
    status: "analysis",
    pillar: "k-drama",
    author: "MyKStars",
    date: "2026-06-20T12:00:00+09:00",
    body: [
      "The character-portrait drop that accompanies a casting confirmation is a genre of its own: styled, lit, and released on a schedule designed to seed months of anticipation before a single scene airs.",
      "Read the lineup and you can usually read the budget, the target audience, and the tone. A cross-pillar cast (an idol stepping into a lead, a film actor taking a television role) is its own signal, and one worth following across the rest of the site.",
    ],
    source: STUDIO,
    related: { artistSlugs: ["lee-min-ho", "park-eun-bin"], gallerySlugs: ["drama-casting-ensemble"] },
  },
  {
    slug: "idol-ambassador-economy",
    title: "The idol-as-ambassador economy",
    dek: "Pictorials and house campaigns have become many artists' main visual output between comebacks. A look at the loop.",
    status: "analysis",
    pillar: "fashion-beauty",
    author: "MyKStars",
    date: "2026-06-21T07:00:00+09:00",
    body: [
      "Between comebacks, the steady drumbeat of an artist's visual presence is increasingly fashion and beauty work: a magazine cover, a house campaign, a front-row appearance. For a photo-first publication, that work is a pillar of K-pop coverage in its own right.",
      "The mechanics are a loop. A campaign produces editorial imagery; the imagery travels through fan accounts; the reach justifies the next ambassadorship. Crediting the photographer, stylist and glam team is the part of the story everyone else leaves out, and we treat that credit line as reporting.",
    ],
    source: VOGUE_KOREA,
    related: { artistSlugs: ["jung-hoyeon", "cha-eunwoo"], gallerySlugs: ["vogue-korea-editorial"] },
  },
  {
    slug: "festival-circuit-explained",
    title: "The festival circuit, explained",
    dek: "Busan, Cannes, Berlin: why the photocall still matters in a streaming-first world, and what it signals for Korean film.",
    status: "analysis",
    pillar: "k-movie",
    author: "MyKStars",
    date: "2026-06-20T19:00:00+09:00",
    body: [
      "Theatrical admissions have softened, but the festival photocall has, if anything, grown in importance: it's the moment a film's images enter the global conversation, and where a director's standing is publicly recognized.",
      "For Korean cinema specifically, the circuit is a prestige engine that feeds back into everything else: the auteur whose film premieres at Busan is the same name a drama production wants attached, and the same face a fashion house wants in the front row.",
    ],
    source: FESTIVAL,
    related: { artistSlugs: ["park-chan-wook", "bong-joon-ho"], gallerySlugs: ["busan-opening-photocall"] },
  },
  {
    slug: "what-confirmed-means",
    title: "Confirmed: what this label means on MyKStars",
    dek: "We attach 'Confirmed' only to facts an official source has stated on the record, and we link that source every time.",
    status: "confirmed",
    author: "MyKStars",
    date: "2026-06-20T17:00:00+09:00",
    body: [
      "A 'Confirmed' label is a promise, not a flourish. We apply it only when a primary source (an agency notice, an official account, a venue, or the artist) has stated something on the record, and we link directly to that source so you can check it yourself.",
      "If a detail is reported by other outlets but not confirmed at the source, it does not get this label. That discipline is the whole point: the label has to mean something for it to be worth showing.",
    ],
    related: {},
  },
  {
    slug: "how-we-handle-rumors",
    title: "Unverified: a report is circulating, and here's what we will and won't publish",
    dek: "When an unconfirmed personal claim spreads, our default is restraint. We explain the standard rather than amplify the rumor.",
    status: "unverified",
    author: "MyKStars",
    date: "2026-06-20T16:00:00+09:00",
    body: [
      "Unverified reports, especially about anyone's private life, travel faster than the facts behind them. Our policy is simple: we do not repeat an unconfirmed personal claim as if it were established, and we never build a gallery whose only purpose is to capitalize on one.",
      "When something is genuinely newsworthy but unconfirmed, we say plainly what is known, what is not, and who would have to confirm it for the story to change. The 'Unverified' label exists so that status is never ambiguous.",
    ],
    related: {},
  },
];

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

// ---------------------------------------------------------------------------
// EVENTS — D-Day schedule of officially-announced concerts and fan meetings.
// ---------------------------------------------------------------------------
// Unlike the sample rankings above, these are REAL announced dates, compiled
// from official tour pages and reputable trade/fan press as of July 5, 2026. Each
// event links back to its source. The set leans toward post-NOW dates outside
// Korea (the international audience) so the upcoming-only page stays populated;
// a couple of Korea dates exist so the region filter has content there too.
// Dates are venue-LOCAL calendar dates (date-only) — see format.ts for why.
// Tour names are omitted where they could not be confirmed.
const BILLBOARD: Source = { name: "Billboard", url: "https://www.billboard.com/culture/product-recommendations/current-k-pop-concerts-1236234463/", kind: "press" };
const SOOMPI: Source = { name: "Soompi", url: "https://www.soompi.com/article/1797016wpp/2026-k-pop-tour-masterlist-concerts-fan-meetings-and-more", kind: "press" };
const POLLSTAR: Source = { name: "Pollstar", url: "https://news.pollstar.com", kind: "press" };
const TICKETMASTER: Source = { name: "Ticketmaster", url: "https://www.ticketmaster.com", kind: "official" };
const STRAY_KIDS_TOUR: Source = { name: "Stray Kids official tour", url: "https://straykidstour.org", kind: "official" };
const TWICE_TOUR: Source = { name: "TWICE official tour", url: "https://twicetours.com", kind: "official" };
const IBIGHIT: Source = { name: "BIGHIT MUSIC", url: "https://ibighit.com/en/cortis/tour/", kind: "official" };
const WEVERSE: Source = { name: "Weverse notice", url: "https://weverse.io/lesserafim/notice/35577", kind: "official" };

export const events: StarEvent[] = [
  // --- North America ---
  {
    slug: "enhypen-blood-saga-oakland",
    headliner: "ENHYPEN",
    type: "concert",
    tour: "BLOOD SAGA World Tour",
    date: "2026-07-28",
    endDate: "2026-07-29",
    venue: "Oakland Arena",
    city: "Oakland",
    country: "United States",
    region: "north-america",
    source: BILLBOARD,
  },
  {
    slug: "ive-show-what-i-am-newark",
    headliner: "IVE",
    artistSlugs: ["ive"],
    type: "concert",
    tour: "SHOW WHAT I AM World Tour",
    date: "2026-07-25",
    venue: "Prudential Center",
    city: "Newark",
    country: "United States",
    region: "north-america",
    source: SOOMPI,
  },
  {
    slug: "mamamoo-reunion-los-angeles",
    headliner: "MAMAMOO",
    type: "concert",
    tour: "2026 Reunion Tour",
    date: "2026-08-25",
    venue: "Crypto.com Arena",
    city: "Los Angeles",
    country: "United States",
    region: "north-america",
    source: BILLBOARD,
  },
  {
    slug: "bts-arirang-los-angeles",
    headliner: "BTS",
    artistSlugs: ["bts"],
    type: "concert",
    tour: "ARIRANG World Tour",
    date: "2026-09-01",
    endDate: "2026-09-06",
    venue: "SoFi Stadium",
    city: "Los Angeles",
    country: "United States",
    region: "north-america",
    status: "sold-out",
    source: BILLBOARD,
    note: "Four nights: September 1, 2, 5 and 6.",
  },
  {
    slug: "cortis-lollapalooza-chicago",
    headliner: "CORTIS",
    artistSlugs: ["cortis"],
    type: "concert",
    date: "2026-08-01",
    venue: "Grant Park",
    city: "Chicago",
    country: "United States",
    region: "north-america",
    source: BILLBOARD,
    note: "Lollapalooza main-stage festival debut; official aftershow July 31 at House of Blues.",
  },
  {
    slug: "iu-world-tour-newark",
    headliner: "IU",
    artistSlugs: ["iu"],
    type: "concert",
    date: "2026-07-15",
    venue: "Prudential Center",
    city: "Newark",
    country: "United States",
    region: "north-america",
    source: TICKETMASTER,
    note: "Opening night of the 2026 North American run, ahead of the late-summer album.",
  },
  {
    slug: "aespa-synk-complexity-new-york",
    headliner: "aespa",
    artistSlugs: ["aespa"],
    type: "concert",
    tour: "SYNK : COMPLæXITY",
    date: "2026-09-18",
    venue: "UBS Arena",
    city: "Belmont Park, NY",
    country: "United States",
    region: "north-america",
    source: POLLSTAR,
  },
  {
    slug: "monsta-x-nexus-new-york",
    headliner: "MONSTA X",
    type: "concert",
    tour: "THE X : NEXUS World Tour",
    date: "2026-10-06",
    venue: "Infosys Theater at Madison Square Garden",
    city: "New York",
    country: "United States",
    region: "north-america",
    source: BILLBOARD,
  },
  {
    slug: "katseye-wildworld-new-york",
    headliner: "KATSEYE",
    type: "concert",
    tour: "THE WILDWORLD TOUR",
    date: "2026-10-24",
    endDate: "2026-10-25",
    venue: "UBS Arena",
    city: "Belmont Park, NY",
    country: "United States",
    region: "north-america",
    source: BILLBOARD,
  },
  {
    slug: "lisa-las-vegas-residency",
    headliner: "LISA",
    type: "concert",
    tour: "VIVA LA LISA",
    date: "2026-11-13",
    endDate: "2026-11-28",
    venue: "The Colosseum at Caesars Palace",
    city: "Las Vegas",
    country: "United States",
    region: "north-america",
    source: BILLBOARD,
    note: "First solo Las Vegas residency by a K-pop artist; four dates (November 13, 14, 27 and 28).",
  },
  {
    slug: "xg-the-core-newark",
    headliner: "XG",
    type: "concert",
    tour: "THE CORE World Tour",
    date: "2026-11-14",
    venue: "Prudential Center",
    city: "Newark",
    country: "United States",
    region: "north-america",
    source: BILLBOARD,
  },

  // --- Europe ---
  {
    slug: "bts-arirang-london",
    headliner: "BTS",
    artistSlugs: ["bts"],
    type: "concert",
    tour: "ARIRANG World Tour",
    date: "2026-07-06",
    endDate: "2026-07-07",
    venue: "Tottenham Hotspur Stadium",
    city: "London",
    country: "United Kingdom",
    region: "europe",
    status: "sold-out",
    source: BILLBOARD,
  },
  {
    slug: "bts-arirang-paris",
    headliner: "BTS",
    artistSlugs: ["bts"],
    type: "concert",
    tour: "ARIRANG World Tour",
    date: "2026-07-17",
    endDate: "2026-07-18",
    venue: "Stade de France",
    city: "Paris",
    country: "France",
    region: "europe",
    status: "sold-out",
    source: BILLBOARD,
  },
  {
    slug: "itzy-tunnel-vision-london",
    headliner: "ITZY",
    type: "concert",
    tour: "TUNNEL VISION World Tour",
    date: "2026-09-11",
    venue: "OVO Arena Wembley",
    city: "London",
    country: "United Kingdom",
    region: "europe",
    source: SOOMPI,
  },
  {
    slug: "itzy-tunnel-vision-paris",
    headliner: "ITZY",
    type: "concert",
    tour: "TUNNEL VISION World Tour",
    date: "2026-09-15",
    venue: "Zenith Paris, La Villette",
    city: "Paris",
    country: "France",
    region: "europe",
    source: SOOMPI,
  },

  // --- Asia ---
  {
    slug: "jaehyun-mono-bangkok",
    headliner: "Jaehyun",
    type: "fan-meeting",
    tour: "MONO Fan Concert",
    date: "2026-07-04",
    city: "Bangkok",
    country: "Thailand",
    region: "asia",
    source: SOOMPI,
  },
  {
    slug: "exo-exhorizon-tokyo",
    headliner: "EXO",
    type: "concert",
    tour: "EXO PLANET #6: EXhOrizon",
    date: "2026-07-11",
    endDate: "2026-07-12",
    venue: "LaLa arena TOKYO-BAY",
    city: "Funabashi",
    country: "Japan",
    region: "asia",
    source: SOOMPI,
    note: "Two nights at the Tokyo Bay arena.",
  },
  {
    slug: "babymonster-choom-kyocera-osaka",
    headliner: "BABYMONSTER",
    artistSlugs: ["babymonster"],
    type: "concert",
    tour: "Choom World Tour",
    date: "2026-09-22",
    endDate: "2026-09-23",
    venue: "Kyocera Dome Osaka",
    city: "Osaka",
    country: "Japan",
    region: "asia",
    source: SOOMPI,
    note: "The group's first solo dome dates.",
  },
  {
    slug: "byeon-woo-seok-secret-library-singapore",
    headliner: "Byeon Woo-seok",
    artistSlugs: ["byeon-woo-seok"],
    type: "fan-meeting",
    tour: "The Secret Library",
    date: "2026-09-18",
    venue: "The Star Theatre",
    city: "Singapore",
    country: "Singapore",
    region: "asia",
    source: SOOMPI,
  },
  // (2026-07-05: removed a "THE ROYAL" Tokyo fan meeting once listed here for
  // 2026-07-15 — verification showed it was his 2025-07-15 pre-enlistment
  // farewell, a year off; he is enlisted through early 2027.)
  {
    slug: "aespa-synk-complexity-taipei",
    headliner: "aespa",
    artistSlugs: ["aespa"],
    type: "concert",
    tour: "SYNK : COMPLæXITY",
    date: "2026-08-11",
    city: "Taipei",
    country: "Taiwan",
    region: "asia",
    source: SOOMPI,
  },
  {
    slug: "stray-kids-world-tour-tokyo",
    headliner: "Stray Kids",
    artistSlugs: ["stray-kids"],
    type: "concert",
    tour: "RUN IT World Tour",
    date: "2026-08-29",
    endDate: "2026-08-30",
    city: "Tokyo",
    country: "Japan",
    region: "asia",
    source: STRAY_KIDS_TOUR,
    ticketUrl: "https://straykidstour.org",
  },

  // --- Latin America ---
  {
    slug: "enhypen-blood-saga-mexico-city",
    headliner: "ENHYPEN",
    type: "concert",
    tour: "BLOOD SAGA World Tour",
    date: "2026-07-11",
    city: "Mexico City",
    country: "Mexico",
    region: "latin-america",
    source: BILLBOARD,
  },
  {
    slug: "aespa-synk-complexity-sao-paulo",
    headliner: "aespa",
    artistSlugs: ["aespa"],
    type: "concert",
    tour: "SYNK : COMPLæXITY",
    date: "2026-09-04",
    city: "São Paulo",
    country: "Brazil",
    region: "latin-america",
    source: POLLSTAR,
  },
  {
    slug: "stray-kids-world-tour-mexico-city",
    headliner: "Stray Kids",
    artistSlugs: ["stray-kids"],
    type: "concert",
    tour: "RUN IT World Tour",
    date: "2026-09-25",
    endDate: "2026-09-26",
    venue: "Estadio GNP Seguros",
    city: "Mexico City",
    country: "Mexico",
    region: "latin-america",
    source: TICKETMASTER,
    ticketUrl: "https://straykidstour.org",
  },

  // --- Korea (a couple of dates so the Korea filter has content) ---
  {
    slug: "twice-this-is-for-seoul",
    headliner: "TWICE",
    artistSlugs: ["twice"],
    type: "concert",
    tour: "THIS IS FOR World Tour",
    date: "2026-07-10",
    endDate: "2026-07-12",
    venue: "KSPO Dome",
    city: "Seoul",
    country: "South Korea",
    region: "korea",
    source: TWICE_TOUR,
    ticketUrl: "https://twicetours.com",
    note: "Three-night world tour finale.",
  },
  {
    slug: "stray-kids-world-tour-seoul",
    headliner: "Stray Kids",
    artistSlugs: ["stray-kids"],
    type: "concert",
    tour: "RUN IT World Tour",
    date: "2026-07-25",
    endDate: "2026-08-02",
    venue: "KSPO Dome",
    city: "Seoul",
    country: "South Korea",
    region: "korea",
    status: "sold-out",
    source: STRAY_KIDS_TOUR,
    ticketUrl: "https://straykidstour.org",
    note: "Five nights: July 25, 26, 29 and August 1, 2.",
  },
  {
    slug: "cortis-put-your-phone-down-incheon",
    headliner: "CORTIS",
    artistSlugs: ["cortis"],
    type: "concert",
    tour: "PUT YOUR PHONE DOWN",
    date: "2026-07-18",
    endDate: "2026-07-19",
    venue: "Inspire Arena",
    city: "Incheon",
    country: "South Korea",
    region: "korea",
    source: IBIGHIT,
    ticketUrl: "https://ibighit.com/en/cortis/tour/",
    note: "First world tour opens at home.",
  },
  {
    slug: "le-sserafim-pureflow-incheon",
    headliner: "LE SSERAFIM",
    artistSlugs: ["le-sserafim"],
    type: "concert",
    tour: "PUREFLOW",
    date: "2026-07-11",
    endDate: "2026-07-12",
    city: "Incheon",
    country: "South Korea",
    region: "korea",
    source: WEVERSE,
    note: "Second world tour opens its 23-city run.",
  },
];

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

// ---------------------------------------------------------------------------
// CLIPS — standalone official YouTube videos for the home rails (see types.ts).
// ---------------------------------------------------------------------------
// REAL, verified embeds, not placeholders, under the 180-day freshness rule
// (docs/roster-playbook.md, enforced by check:fresh). Every videoId is confirmed
// via the oEmbed endpoint on the named official channel at authoring time, and
// the date field is the video's TRUE upload date, not a label (look-alike
// reuploads get discarded in that check). Music clips come from the artist's or
// label's channel; variety clips come from the program's / broadcaster's
// official channel, and the roster artist must actually appear in the video.
// A date must never be edited to look fresh; replace the post instead.
// Captions follow house style: song titles in 'quotes', work titles in *asterisks*.
const YT_CHANNEL = {
  hybeLabels: { name: "HYBE LABELS", url: "https://www.youtube.com/@HYBELABELS", kind: "embed" } as Source,
  blackpink: { name: "BLACKPINK", url: "https://www.youtube.com/@BLACKPINK", kind: "embed" } as Source,
  smtown: { name: "SMTOWN", url: "https://www.youtube.com/@SMTOWN", kind: "embed" } as Source,
  starship: { name: "STARSHIP", url: "https://www.youtube.com/@STARSHIP_official", kind: "embed" } as Source,
  babymonster: { name: "BABYMONSTER", url: "https://www.youtube.com/@BABYMONSTER", kind: "embed" } as Source,
  jype: { name: "JYP Entertainment", url: "https://www.youtube.com/@JYPEntertainment", kind: "embed" } as Source,
  twice: { name: "TWICE", url: "https://www.youtube.com/@TWICE", kind: "embed" } as Source,
};

// Official program / broadcaster / publisher channels for the On air rail (tv()
// clips). Names match the channel's oEmbed author_name exactly, verified at
// authoring time; a roster artist must actually appear in any video credited here.
const PROGRAM_CHANNEL = {
  ddeunddeun: { name: "뜬뜬 DdeunDdeun", url: "https://www.youtube.com/@ddeunddeun", kind: "embed" } as Source,
  mmtg: { name: "MMTG 문명특급", url: "https://www.youtube.com/@mmtg_official", kind: "embed" } as Source,
  tvnJoy: { name: "tvN Joy", url: "https://www.youtube.com/@tvNJoy_official", kind: "embed" } as Source,
  dailyShow: { name: "The Daily Show", url: "https://www.youtube.com/@TheDailyShow", kind: "embed" } as Source,
  gkids: { name: "GKIDS Films", url: "https://www.youtube.com/@GKIDStv", kind: "embed" } as Source,
  netflixKorea: { name: "Netflix Korea 넷플릭스 코리아", url: "https://www.youtube.com/@NetflixKorea", kind: "embed" } as Source,
  bangtantv: { name: "BANGTANTV", url: "https://www.youtube.com/@BTS", kind: "embed" } as Source,
  muply: { name: "MUPLY 뮤플리", url: "https://www.youtube.com/@muply", kind: "embed" } as Source,
  strayKids: { name: "Stray Kids", url: "https://www.youtube.com/@StrayKids", kind: "embed" } as Source,
  aespa: { name: "aespa", url: "https://www.youtube.com/@aespa", kind: "embed" } as Source,
  hearts2hearts: { name: "Hearts2Hearts", url: "https://www.youtube.com/@hearts2hearts.official", kind: "embed" } as Source,
  seventeen: { name: "SEVENTEEN", url: "https://www.youtube.com/@pledis17", kind: "embed" } as Source,
};

// Music clip (landscape player, k-pop pillar). videoId was oEmbed-verified on the
// named artist/label channel. evergreenUntil (optional, ISO date): a dated
// exemption from the 180-day freshness gate (npm run check:fresh) — see
// docs/roster-playbook.md before using.
function yt(
  id: string,
  videoId: string,
  artistSlugs: string[],
  date: string,
  caption: string,
  credit: Source,
  evergreenUntil?: string,
): Clip {
  return {
    id,
    platform: "youtube",
    genre: "music",
    embedUrl: `https://www.youtube.com/watch?v=${videoId}`,
    pillar: "k-pop",
    artistSlugs,
    date,
    caption,
    credit,
    orientation: "landscape",
    ...(evergreenUntil ? { evergreenUntil } : {}),
  };
}

// Variety clip (landscape player): a comedy / variety / talk-show appearance on
// the program's or broadcaster's official channel. `pillar` is a parameter
// because the guests span the roster (actors → k-drama/k-movie, idols → k-pop).
// videoId was oEmbed-verified on the named channel, like yt().
function tv(
  id: string,
  videoId: string,
  artistSlugs: string[],
  pillar: Pillar,
  date: string,
  caption: string,
  credit: Source,
  evergreenUntil?: string,
): Clip {
  return {
    id,
    platform: "youtube",
    genre: "variety",
    embedUrl: `https://www.youtube.com/watch?v=${videoId}`,
    pillar,
    artistSlugs,
    date,
    caption,
    credit,
    orientation: "landscape",
    ...(evergreenUntil ? { evergreenUntil } : {}),
  };
}

export const clips: Clip[] = [
  // --- Music: official music videos and clips (oEmbed re-verified 2026-07-05) ---
  yt("clip-yt-seventeen-v8-singasong", "pBpr9TnhhkE", ["seventeen"], "2026-06-29T18:00:00+09:00", "V8, SEVENTEEN's new unit, drop 'singasong'", YT_CHANNEL.hybeLabels),
  yt("clip-yt-stray-kids-run-it", "Q7IFjVUUb_E", ["stray-kids"], "2026-06-24T13:00:00+09:00", "Stray Kids, the 'RUN IT' music video", YT_CHANNEL.jype),
  yt("clip-yt-le-sserafim-boompala", "V1Lr-_AxeR8", ["le-sserafim"], "2026-05-22T13:00:00+09:00", "LE SSERAFIM, the 'BOOMPALA' music video", YT_CHANNEL.hybeLabels),
  yt("clip-yt-aespa-wda", "iTJSbJtS8MU", ["aespa"], "2026-05-11T18:00:00+09:00", "aespa link up with G-Dragon for 'WDA'", YT_CHANNEL.smtown),
  yt("clip-yt-cortis-tnt", "kRpaqR5sbf0", ["cortis"], "2026-05-04T18:00:00+09:00", "CORTIS, the 'TNT' music video", YT_CHANNEL.hybeLabels),
  yt("clip-yt-babymonster-choom", "x3eqqoZPV_E", ["babymonster"], "2026-05-04T18:00:00+09:00", "BABYMONSTER, the 'CHOOM' music video", YT_CHANNEL.babymonster),
  yt("clip-yt-bts-swim", "b4iVv91Z6lY", ["bts"], "2026-03-20T13:00:00+09:00", "BTS, the 'SWIM' music video", YT_CHANNEL.hybeLabels),
  yt("clip-yt-blackpink-go", "2GJfWMYCWY0", ["blackpink"], "2026-02-27T13:30:00+09:00", "BLACKPINK return with 'GO'", YT_CHANNEL.blackpink),
  yt("clip-yt-ive-blackhole", "1Lmy7qwmSMc", ["ive"], "2026-02-23T18:00:00+09:00", "IVE, the 'BLACKHOLE' music video", YT_CHANNEL.starship),
  yt("clip-yt-hearts2hearts-rude", "F7sGJVUrkjQ", ["hearts2hearts"], "2026-02-20T18:00:00+09:00", "Hearts2Hearts, the 'RUDE!' music video", YT_CHANNEL.smtown),
  // Dated evergreen: the tour's title track anchors the THIS IS FOR finale run at
  // KSPO Dome and expires with it (July 12), forcing a fresh look next refresh.
  yt("clip-yt-twice-this-is-for", "eHHQaoEW30Q", ["twice"], "2025-07-11T18:00:00+09:00", "TWICE, the *This Is For* title track", YT_CHANNEL.twice, "2026-07-12T23:59:00+09:00"),

  // --- Variety: comedy / variety / talk appearances on official program channels
  //     (On air rail; oEmbed-verified 2026-07-05, upload dates from watch-page
  //     metadata cross-checked against dated press). Honest gaps this pass:
  //     Lee Min-ho had no qualifying in-window appearance (only 2026 re-cuts of a
  //     2024 You Quiz visit, which would fake freshness), and NewJeans are skipped
  //     under the red-flag rule. The Daily Show clip sits a day inside the 180-day
  //     window; the next NOW bump replaces it. ---
  tv("clip-tv-jung-hoyeon-pinggyego", "vXiBTHJI1SY", ["jung-hoyeon"], "k-movie", "2026-07-04T09:00:00+09:00", "Jung Ho-yeon joins the *Hope* cast on Yoo Jae-suk's *Pinggyego*", PROGRAM_CHANNEL.ddeunddeun),
  tv("clip-tv-aespa-aesparty", "yZlQYtzAjPc", ["aespa"], "k-pop", "2026-06-26T20:00:00+09:00", "aespa reopen *aesParty* with the 'Dopamine Party' special", PROGRAM_CHANNEL.aespa),
  tv("clip-tv-park-eun-bin-mmtg", "B0xsyiT5Du4", ["park-eun-bin"], "k-drama", "2026-05-21T18:30:00+09:00", "Park Eun-bin fields JaeJae's rapid questions on *MMTG*, honors degree included", PROGRAM_CHANNEL.mmtg),
  tv("clip-tv-cha-eunwoo-wonderfools", "4bFm34ojMfQ", ["cha-eunwoo", "park-eun-bin"], "k-drama", "2026-05-18T18:00:00+09:00", "Cha Eun-woo and Park Eun-bin react to *The Wonderfools* highlights for Netflix Korea", PROGRAM_CHANNEL.netflixKorea),
  tv("clip-tv-cortis-muply", "IAS8BhLdpZc", ["cortis"], "k-pop", "2026-04-30T20:00:00+09:00", "CORTIS fight the giggles through *Silence of the Idols* pajama drills", PROGRAM_CHANNEL.muply),
  tv("clip-tv-bts-run-bts", "wu6bA3zK_us", ["bts"], "k-pop", "2026-04-23T21:00:00+09:00", "BTS reopen *Run BTS* 2.0 with a full-group trip special", PROGRAM_CHANNEL.bangtantv),
  tv("clip-tv-byeon-woo-seok-iu-pinggyego", "UV1P4a8_dz4", ["byeon-woo-seok", "iu"], "k-drama", "2026-04-04T09:00:00+09:00", "Byeon Woo-seok makes his *Pinggyego* debut alongside IU, ten years after *Moon Lovers*", PROGRAM_CHANNEL.ddeunddeun),
  tv("clip-tv-stray-kids-skz-code", "uB-XPe1K7SU", ["stray-kids"], "k-pop", "2026-03-12T19:59:00+09:00", "Stray Kids open a community center class on *SKZ CODE*", PROGRAM_CHANNEL.strayKids),
  tv("clip-tv-seventeen-going", "TJWUc875kpU", ["seventeen"], "k-pop", "2026-03-11T21:00:00+09:00", "SEVENTEEN set the 2026 *Going Seventeen* agenda in an emergency meeting", PROGRAM_CHANNEL.seventeen),
  tv("clip-tv-hearts2hearts-chase", "rQjzc2FMov4", ["hearts2hearts"], "k-pop", "2026-03-02T20:01:00+09:00", "Hearts2Hearts turn sauna day into a comedy battle on *Hearts Chase*", PROGRAM_CHANNEL.hearts2hearts),
  tv("clip-tv-kim-tae-ri-taerissaem", "1ZMfNReuu-U", ["kim-tae-ri"], "k-drama", "2026-02-11T10:00:00+09:00", "Kim Tae-ri turns rookie teacher in *After School Taeri-ssaem*, her first fixed variety show", PROGRAM_CHANNEL.tvnJoy),
  tv("clip-tv-bong-joon-ho-gkids", "ehfEBUheNQI", ["bong-joon-ho"], "k-movie", "2026-01-14T04:00:00+09:00", "Bong Joon-ho sits with Lee Sang-il to champion *Kokuho* for GKIDS", PROGRAM_CHANNEL.gkids),
  tv("clip-tv-park-chan-wook-daily-show", "Jj0N63qglbI", ["park-chan-wook"], "k-movie", "2026-01-07T13:33:00+09:00", "Park Chan-wook takes *No Other Choice* to *The Daily Show* couch", PROGRAM_CHANNEL.dailyShow),
];
