import type {
  Article,
  Artist,
  Gallery,
  MediaItem,
  Orientation,
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
export const NOW = "2026-06-21T20:00:00+09:00";

// --- sources (every media item links back to one of these) ---
const OSEN: Source = { name: "OSEN", url: "https://osen.mt.co.kr", kind: "press" };
const NEWSEN: Source = { name: "Newsen", url: "https://www.newsen.com", kind: "press" };
const STAR_NEWS: Source = { name: "Star News", url: "https://www.starnewskorea.com/en", kind: "press" };
const NEWS1: Source = { name: "News1", url: "https://www.news1.kr", kind: "wire" };
const W_KOREA: Source = { name: "W Korea", url: "https://www.wkorea.com", kind: "magazine" };
const VOGUE_KOREA: Source = { name: "Vogue Korea", url: "https://www.vogue.co.kr", kind: "magazine" };
const STUDIO: Source = { name: "Studio press kit", url: "https://www.cjenm.com", kind: "official" };
const FESTIVAL: Source = { name: "Festival photo pool", url: "https://www.biff.kr", kind: "press" };

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
    place(`${prefix}-${i + 1}`, `${baseAlt} — frame ${i + 1}`, credit, i % 4, orientation),
  );
}

// A portrait-leaning mixed set with ~1 landscape every 4 frames — the realistic
// case (selca/full-body portrait, the occasional wide group/stage frame).
function placeMixed(
  prefix: string,
  baseAlt: string,
  credit: Source,
  n: number,
): MediaItem[] {
  return Array.from({ length: n }, (_, i) => {
    const orientation: Orientation = i % 4 === 2 ? "landscape" : "portrait";
    return place(`${prefix}-${i + 1}`, `${baseAlt} — frame ${i + 1}`, credit, i % 4, orientation);
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
  },
  {
    slug: "park-eun-bin",
    name: "Park Eun-bin",
    koreanName: "박은빈",
    type: "individual",
    disciplines: ["actor"],
    pillars: ["k-drama"],
    bio: "Television actor whose awards and press-event appearances draw heavy coverage.",
  },
  {
    slug: "kim-tae-ri",
    name: "Kim Tae-ri",
    koreanName: "김태리",
    type: "individual",
    disciplines: ["actor"],
    pillars: ["k-drama", "k-movie"],
    bio: "Actor working across film and television, a regular presence on the festival and press circuit.",
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
  },
];

// ---------------------------------------------------------------------------
// GALLERIES
// ---------------------------------------------------------------------------
export const galleries: Gallery[] = [
  // ===================== K-POP =====================
  {
    slug: "newjeans-comeback-showcase",
    title: "NewJeans return, shot in monochrome",
    pillar: "k-pop",
    category: "comeback",
    artistSlugs: ["newjeans"],
    event: "2026 comeback showcase",
    date: "2026-06-21T19:22:00+09:00",
    source: NEWSEN,
    excerpt:
      "Concept frames from the comeback showcase, presented as a single black-and-white set.",
    cover: place("newjeans-cover", "NewJeans comeback showcase — key visual", NEWSEN, 2),
    media: [
      place("newjeans-1", "NewJeans on the showcase stage", NEWSEN, 2),
      {
        id: "newjeans-embed-1",
        kind: "embed",
        platform: "instagram",
        embedUrl: "https://www.instagram.com/p/EXAMPLE/",
        alt: "Official showcase clip shared on Instagram",
        credit: { name: "@newjeans_official", url: "https://www.instagram.com/", kind: "embed" },
      },
      ...placeMixed("newjeans", "NewJeans comeback showcase", NEWSEN, 6),
    ],
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
    title: "IU on the Baeksang red carpet",
    pillar: "k-pop",
    category: "red-carpet",
    tags: ["pictorial"],
    artistSlugs: ["iu"],
    event: "Baeksang Arts Awards",
    date: "2026-06-21T14:00:00+09:00",
    source: STAR_NEWS,
    excerpt: "Arrival and pose frames from the awards red carpet.",
    cover: place("iu-cover", "IU on the Baeksang Arts Awards red carpet", STAR_NEWS, 2),
    media: placeSet("iu", "IU on the Baeksang red carpet", STAR_NEWS, 6),
  },
  {
    slug: "cha-eunwoo-w-korea",
    title: "Cha Eun-woo for W Korea",
    pillar: "k-pop",
    category: "pictorial",
    artistSlugs: ["cha-eunwoo"],
    event: "W Korea pictorial",
    date: "2026-06-21T12:00:00+09:00",
    source: W_KOREA,
    excerpt: "A licensed pictorial preview — the buy-the-issue funnel attaches here.",
    cover: place("eunwoo-cover", "Cha Eun-woo W Korea pictorial — cover look", W_KOREA, 3),
    media: placeSet("eunwoo", "Cha Eun-woo W Korea pictorial", W_KOREA, 6),
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
    title: "Jung Ho-yeon, a Vogue Korea editorial",
    pillar: "fashion-beauty",
    category: "pictorial",
    artistSlugs: ["jung-hoyeon"],
    event: "Vogue Korea editorial",
    date: "2026-06-21T09:30:00+09:00",
    source: VOGUE_KOREA,
    excerpt: "A licensed editorial preview — full-length portrait styling.",
    cover: place("vogue-cover", "Jung Ho-yeon Vogue Korea editorial — cover look", VOGUE_KOREA, 3),
    media: placeSet("vogue", "Jung Ho-yeon Vogue Korea editorial", VOGUE_KOREA, 6),
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
];

// ---------------------------------------------------------------------------
// ARTICLES
// ---------------------------------------------------------------------------
export const articles: Article[] = [
  {
    slug: "monochrome-concept-photos-2026",
    title: "Why monochrome concept photos are dominating 2026 comebacks",
    dek: "Black-and-white sets read as 'premium' and travel well across platforms — a look at why agencies keep reaching for them.",
    status: "analysis",
    pillar: "k-pop",
    author: "Min-seo Park",
    date: "2026-06-21T13:00:00+09:00",
    body: [
      "Strip the color out of a concept set and two things happen at once: the styling reads as more expensive, and the images survive the journey through dozens of feeds, reposts and compression passes without falling apart. That durability matters when a comeback lives or dies in the first six hours of sharing.",
      "Monochrome also sidesteps the seasonal-palette problem. A set shot in black and white doesn't date the way a hyper-specific color story does, which is useful when the same images will anchor an artist hub for months.",
      "The risk is sameness. When everyone reaches for the same restraint, the differentiation moves back to where it always lived — styling, casting of the photographer, and the strength of a single hero frame.",
    ],
    source: NEWSEN,
    related: { artistSlugs: ["newjeans", "stray-kids"], gallerySlugs: ["newjeans-comeback-showcase"] },
  },
  {
    slug: "the-airport-runway",
    title: "The airport runway: how a 5 a.m. departure became fashion theater",
    dek: "Incheon's press line is now a styled event in its own right. We trace how 'airport fashion' became a genre.",
    status: "analysis",
    pillar: "k-pop",
    author: "Daniel Cho",
    date: "2026-06-21T10:30:00+09:00",
    body: [
      "There is nothing accidental about an airport look. Outfits are planned, sometimes pulled from a brand the artist represents, and timed to a press line that everyone in the room knows is coming.",
      "For global fans, the airport set is often the first high-resolution sighting of an artist between official schedules — which is exactly why organized, credited airport galleries are one of the most-searched things in the fandom and one of the least well served in English.",
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
    author: "Hae-won Lim",
    date: "2026-06-21T08:00:00+09:00",
    body: [
      "A decade ago, finding a Korean drama with reliable English subtitles took effort. Now a new title can open simultaneously in dozens of countries and sit on a global top-ten chart by the weekend — the discovery problem has inverted from scarcity to overload.",
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
    author: "Hae-won Lim",
    date: "2026-06-20T12:00:00+09:00",
    body: [
      "The character-portrait drop that accompanies a casting confirmation is a genre of its own: styled, lit, and released on a schedule designed to seed months of anticipation before a single scene airs.",
      "Read the lineup and you can usually read the budget, the target audience, and the tone. A cross-pillar cast — an idol stepping into a lead, a film actor taking a television role — is its own signal, and one worth following across the rest of the site.",
    ],
    source: STUDIO,
    related: { artistSlugs: ["lee-min-ho", "park-eun-bin"], gallerySlugs: ["drama-casting-ensemble"] },
  },
  {
    slug: "idol-ambassador-economy",
    title: "The idol-as-ambassador economy",
    dek: "Pictorials and house campaigns aren't a side hustle anymore — for many artists they're the main visual output. A look at the loop.",
    status: "analysis",
    pillar: "fashion-beauty",
    author: "Soo-ah Yun",
    date: "2026-06-21T07:00:00+09:00",
    body: [
      "Between comebacks, the steady drumbeat of an artist's visual presence is increasingly fashion and beauty work: a magazine cover, a house campaign, a front-row appearance. For a photo-first publication, that's not adjacent to K-pop — it's a pillar of it.",
      "The mechanics are a loop. A campaign produces editorial imagery; the imagery travels through fan accounts; the reach justifies the next ambassadorship. Crediting the photographer, stylist and glam team isn't just courtesy here — it's the part of the story everyone else leaves out.",
    ],
    source: VOGUE_KOREA,
    related: { artistSlugs: ["jung-hoyeon", "cha-eunwoo"], gallerySlugs: ["vogue-korea-editorial"] },
  },
  {
    slug: "festival-circuit-explained",
    title: "The festival circuit, explained",
    dek: "Busan, Cannes, Berlin — why the photocall still matters in a streaming-first world, and what it signals for Korean film.",
    status: "analysis",
    pillar: "k-movie",
    author: "Jae-ho Seo",
    date: "2026-06-20T19:00:00+09:00",
    body: [
      "Theatrical admissions have softened, but the festival photocall has, if anything, grown in importance: it's the moment a film's images enter the global conversation, and where a director's standing is publicly recognized.",
      "For Korean cinema specifically, the circuit is a prestige engine that feeds back into everything else — the auteur whose film premieres at Busan is the same name a drama production wants attached, and the same face a fashion house wants in the front row.",
    ],
    source: FESTIVAL,
    related: { artistSlugs: ["park-chan-wook", "bong-joon-ho"], gallerySlugs: ["busan-opening-photocall"] },
  },
  {
    slug: "what-confirmed-means",
    title: "Confirmed: what this label means on MyKStars",
    dek: "We attach 'Confirmed' only to facts an official source has stated on the record — and we link that source every time.",
    status: "confirmed",
    author: "MyKStars Desk",
    date: "2026-06-20T17:00:00+09:00",
    body: [
      "A 'Confirmed' label is a promise, not a flourish. We apply it only when a primary source — an agency notice, an official account, a venue, or the artist — has stated something on the record, and we link directly to that source so you can check it yourself.",
      "If a detail is reported by other outlets but not confirmed at the source, it does not get this label. That discipline is the whole point: the label has to mean something for it to be worth showing.",
    ],
    related: {},
  },
  {
    slug: "how-we-handle-rumors",
    title: "Unverified: a report is circulating — here's what we will and won't publish",
    dek: "When an unconfirmed personal claim spreads, our default is restraint. We explain the standard rather than amplify the rumor.",
    status: "unverified",
    author: "MyKStars Desk",
    date: "2026-06-20T16:00:00+09:00",
    body: [
      "Unverified reports — especially about anyone's private life — travel faster than the facts behind them. Our policy is simple: we do not repeat an unconfirmed personal claim as if it were established, and we never build a gallery whose only purpose is to capitalize on one.",
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
    slug: "idol-brand-reputation",
    title: "Idol Brand Reputation",
    pillar: "k-pop",
    metricLabel: "Brand index",
    period: "June 2026",
    asOf: "2026-06-15T00:00:00+09:00",
    source: SAMPLE_DATA,
    sample: true,
    blurb: "Monthly idol & group brand-reputation index by big-data volume.",
    rows: [
      { rank: 1, name: "NewJeans", detail: "ADOR", value: "8,742,153", change: 2, artistSlug: "newjeans" },
      { rank: 2, name: "BLACKPINK", detail: "YG Entertainment", value: "8,201,884", change: -1, artistSlug: "blackpink" },
      { rank: 3, name: "IU", detail: "EDAM Entertainment", value: "7,884,402", change: 1, artistSlug: "iu" },
      { rank: 4, name: "BTS", detail: "BIGHIT MUSIC", value: "7,540,119", change: -2 },
      { rank: 5, name: "aespa", detail: "SM Entertainment", value: "6,932,571", change: 3, artistSlug: "aespa" },
      { rank: 6, name: "Stray Kids", detail: "JYP Entertainment", value: "6,415,260", change: 0, artistSlug: "stray-kids" },
      { rank: 7, name: "SEVENTEEN", detail: "PLEDIS Entertainment", value: "6,008,344", change: -1 },
      { rank: 8, name: "Cha Eun-woo", detail: "Fantagio", value: "5,772,090", change: 4, artistSlug: "cha-eunwoo" },
      { rank: 9, name: "IVE", detail: "Starship Entertainment", value: "5,310,778", isNew: true },
      { rank: 10, name: "TWICE", detail: "JYP Entertainment", value: "5,002,615", change: -3, artistSlug: "twice" },
    ],
  },
  {
    slug: "drama-viewership",
    title: "Drama Viewership",
    pillar: "k-drama",
    metricLabel: "Rating",
    period: "Week of June 15, 2026",
    asOf: "2026-06-21T00:00:00+09:00",
    source: SAMPLE_DATA,
    sample: true,
    blurb: "Nationwide average audience share for scripted series.",
    rows: [
      { rank: 1, name: "The Crown Physician", detail: "tvN · Kim Tae-ri", value: "14.7%", change: 1, artistSlug: "kim-tae-ri" },
      { rank: 2, name: "Glass Tower", detail: "SBS · Lee Min-ho", value: "12.3%", change: -1, artistSlug: "lee-min-ho" },
      { rank: 3, name: "Court Lady Hong", detail: "KBS2 · Park Eun-bin", value: "10.9%", change: 2, artistSlug: "park-eun-bin" },
      { rank: 4, name: "Midnight Dispatch", detail: "JTBC", value: "9.5%", change: -1 },
      { rank: 5, name: "The Last Semester", detail: "tvN", value: "8.8%", change: 3 },
      { rank: 6, name: "Harbor Lights", detail: "MBC", value: "7.6%", isNew: true },
      { rank: 7, name: "Seoul, 1999", detail: "OCN", value: "6.9%", change: -2 },
      { rank: 8, name: "The Understudy", detail: "ENA", value: "5.4%", change: 0 },
    ],
  },
];

// ---------------------------------------------------------------------------
// EVENTS — D-Day schedule of officially-announced concerts and fan meetings.
// ---------------------------------------------------------------------------
// Unlike the sample rankings above, these are REAL announced dates, compiled
// from official tour pages and reputable trade/fan press as of June 2026. Each
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
const SONGKICK: Source = { name: "Songkick", url: "https://www.songkick.com/artists/10151159-cha-eun-woo", kind: "press" };

export const events: StarEvent[] = [
  // --- North America ---
  {
    slug: "enhypen-blood-saga-oakland",
    headliner: "ENHYPEN",
    type: "concert",
    tour: "BLOOD SAGA World Tour",
    date: "2026-07-28",
    city: "Oakland",
    country: "United States",
    region: "north-america",
    source: BILLBOARD,
  },
  {
    slug: "ive-show-what-i-am-newark",
    headliner: "IVE",
    type: "concert",
    tour: "SHOW WHAT I AM World Tour",
    date: "2026-07-25",
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
    city: "Los Angeles",
    country: "United States",
    region: "north-america",
    source: BILLBOARD,
  },
  {
    slug: "bts-arirang-los-angeles",
    headliner: "BTS",
    type: "concert",
    tour: "ARIRANG World Tour",
    date: "2026-09-01",
    city: "Los Angeles",
    country: "United States",
    region: "north-america",
    source: BILLBOARD,
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
    city: "New York",
    country: "United States",
    region: "north-america",
    source: BILLBOARD,
  },
  {
    slug: "katseye-wildworld-new-york",
    headliner: "KATSEYE",
    type: "concert",
    tour: "Wildworld Arena Tour",
    date: "2026-10-24",
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
    tour: "Las Vegas residency",
    date: "2026-11-13",
    venue: "The Colosseum at Caesars Palace",
    city: "Las Vegas",
    country: "United States",
    region: "north-america",
    source: BILLBOARD,
    note: "Billed as the first solo Las Vegas residency by a K-pop artist.",
  },
  {
    slug: "xg-the-core-newark",
    headliner: "XG",
    type: "concert",
    tour: "THE CORE World Tour",
    date: "2026-11-14",
    city: "Newark",
    country: "United States",
    region: "north-america",
    source: BILLBOARD,
  },

  // --- Europe ---
  {
    slug: "bts-arirang-london",
    headliner: "BTS",
    type: "concert",
    tour: "ARIRANG World Tour",
    date: "2026-07-06",
    city: "London",
    country: "United Kingdom",
    region: "europe",
    source: BILLBOARD,
  },
  {
    slug: "bts-arirang-paris",
    headliner: "BTS",
    type: "concert",
    tour: "ARIRANG World Tour",
    date: "2026-07-17",
    city: "Paris",
    country: "France",
    region: "europe",
    source: BILLBOARD,
  },
  {
    slug: "itzy-tunnel-vision-london",
    headliner: "ITZY",
    type: "concert",
    tour: "TUNNEL VISION World Tour",
    date: "2026-09-11",
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
    tour: "EXO PLANET #6 — EXhOrizon",
    date: "2026-07-11",
    city: "Tokyo",
    country: "Japan",
    region: "asia",
    source: SOOMPI,
  },
  {
    slug: "cha-eunwoo-the-royal-tokyo",
    headliner: "Cha Eun-woo",
    artistSlugs: ["cha-eunwoo"],
    type: "fan-meeting",
    tour: "THE ROYAL",
    date: "2026-07-15",
    venue: "Ariake Arena",
    city: "Tokyo",
    country: "Japan",
    region: "asia",
    source: SONGKICK,
  },
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
    date: "2026-08-29",
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
    date: "2026-09-25",
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
    city: "Seoul",
    country: "South Korea",
    region: "korea",
    source: TWICE_TOUR,
    ticketUrl: "https://twicetours.com",
  },
  {
    slug: "stray-kids-world-tour-seoul",
    headliner: "Stray Kids",
    artistSlugs: ["stray-kids"],
    type: "concert",
    date: "2026-07-25",
    city: "Seoul",
    country: "South Korea",
    region: "korea",
    source: STRAY_KIDS_TOUR,
    ticketUrl: "https://straykidstour.org",
  },
];

// ---------------------------------------------------------------------------
// PREDICTIONS — the "Fan Forecast".
// ---------------------------------------------------------------------------
// A curated handful of vote-only questions on PROFESSIONAL outcomes (awards,
// charts, comebacks, box office, tours, campaigns) — never private lives. Each
// resolves against an objective, public, dated source. Vote tallies are now LIVE
// from Supabase (see data.ts); the per-option `sampleVotes` below are legacy and
// no longer read — real counts start at zero. The set is anchored to NOW
// (2026-06-21) so it spans every lifecycle state: open questions, one fresh, one
// closed-awaiting-result, and one already resolved.
const MAMA_AWARDS: Source = { name: "MAMA Awards", url: "https://www.mnetplus.world", kind: "official" };
const CIRCLE_CHART: Source = { name: "Circle Chart", url: "https://circlechart.kr", kind: "official" };
const HANTEO: Source = { name: "Hanteo Chart", url: "https://www.hanteochart.com", kind: "official" };
const KOBIS: Source = { name: "KOBIS · Korean Film Council", url: "https://www.kobis.or.kr", kind: "official" };
const YONHAP: Source = { name: "Yonhap News", url: "https://en.yna.co.kr", kind: "wire" };
const WEVERSE: Source = { name: "Weverse (official)", url: "https://weverse.io", kind: "official" };

export const predictions: Prediction[] = [
  // ===================== K-POP =====================
  {
    slug: "aespa-daesang-mama-2026",
    pillar: "k-pop",
    category: "award",
    question: "Will aespa win a Daesang (Grand Prize) at the 2026 MAMA Awards?",
    framing: "Where fan confidence sits as awards season approaches — hope, not a forecast.",
    opensAt: "2026-06-01T00:00:00+09:00",
    closesAt: "2026-11-25T00:00:00+09:00",
    status: "open",
    options: [
      { id: "yes", label: "Yes — at least one Daesang", artistSlug: "aespa", sampleVotes: 612 },
      { id: "no", label: "No Daesang this year", sampleVotes: 388 },
    ],
    resolutionSourceLabel: "Resolves on the official 2026 MAMA Awards winners announcement.",
    resolutionSource: MAMA_AWARDS,
    tallyVisibleThreshold: 25,
    asOf: "2026-06-21T00:00:00+09:00",
  },
  {
    slug: "newjeans-next-single-circle-no1",
    pillar: "k-pop",
    category: "chart",
    question: "Will NewJeans' next single debut at #1 on the Circle Digital Chart?",
    framing: "The fandom's read on comeback momentum, expressed as a pick.",
    opensAt: "2026-06-10T00:00:00+09:00",
    closesAt: "2026-08-31T00:00:00+09:00",
    status: "open",
    options: [
      { id: "yes", label: "Yes — #1 debut", artistSlug: "newjeans", sampleVotes: 845 },
      { id: "no", label: "No — outside #1", sampleVotes: 402 },
    ],
    resolutionSourceLabel: "Resolves on the weekly Circle Digital Chart covering the release week.",
    resolutionSource: CIRCLE_CHART,
    tallyVisibleThreshold: 25,
    asOf: "2026-06-21T00:00:00+09:00",
  },
  {
    slug: "bts-arirang-2027-legs",
    pillar: "k-pop",
    category: "tour",
    question: "Will BTS announce additional 2027 ARIRANG World Tour dates before year-end?",
    framing: "A fresh question — be the first to call it.",
    opensAt: "2026-06-20T00:00:00+09:00",
    closesAt: "2026-12-31T00:00:00+09:00",
    status: "open",
    options: [
      { id: "yes", label: "Yes — new 2027 legs", sampleVotes: 0 },
      { id: "no", label: "No new dates this year", sampleVotes: 0 },
    ],
    resolutionSourceLabel: "Resolves on official tour announcements via Weverse / BIGHIT MUSIC.",
    resolutionSource: WEVERSE,
    tallyVisibleThreshold: 25,
    asOf: "2026-06-21T00:00:00+09:00",
  },
  {
    slug: "seventeen-summer-comeback-first-week",
    pillar: "k-pop",
    category: "comeback",
    question: "Will SEVENTEEN's summer comeback top 2 million first-week sales?",
    framing: "Voting has closed — the official count will settle it.",
    opensAt: "2026-05-20T00:00:00+09:00",
    closesAt: "2026-06-20T23:59:00+09:00",
    status: "open",
    options: [
      { id: "yes", label: "Yes — 2M+ in week one", sampleVotes: 1043 },
      { id: "no", label: "No — under 2M", sampleVotes: 506 },
    ],
    resolutionSourceLabel: "Resolves on Hanteo Chart first-week (initial) sales for the release.",
    resolutionSource: HANTEO,
    tallyVisibleThreshold: 25,
    asOf: "2026-06-21T00:00:00+09:00",
  },

  // ===================== K-DRAMA =====================
  {
    slug: "blue-dragon-series-daesang-2026",
    pillar: "k-drama",
    category: "award",
    question: "Who will take the Daesang at the 2026 Blue Dragon Series Awards?",
    framing: "Fan favourites going into the ceremony — sentiment, not prediction.",
    opensAt: "2026-06-15T00:00:00+09:00",
    closesAt: "2026-11-21T00:00:00+09:00",
    status: "open",
    options: [
      { id: "kim-tae-ri", label: "Kim Tae-ri", artistSlug: "kim-tae-ri", sampleVotes: 421 },
      { id: "park-eun-bin", label: "Park Eun-bin", artistSlug: "park-eun-bin", sampleVotes: 388 },
      { id: "lee-min-ho", label: "Lee Min-ho", artistSlug: "lee-min-ho", sampleVotes: 244 },
      { id: "other", label: "Someone else", sampleVotes: 197 },
    ],
    resolutionSourceLabel: "Resolves on the official 2026 Blue Dragon Series Awards results.",
    resolutionSource: YONHAP,
    tallyVisibleThreshold: 25,
    asOf: "2026-06-21T00:00:00+09:00",
  },

  // ===================== K-MOVIE =====================
  {
    slug: "park-chan-wook-opening-3m",
    pillar: "k-movie",
    category: "box-office",
    question: "Did Park Chan-wook's new film cross 3 million admissions in its first 10 days?",
    framing: "Resolved — here's how the fan call landed against the box office.",
    opensAt: "2026-05-15T00:00:00+09:00",
    closesAt: "2026-06-05T00:00:00+09:00",
    status: "resolved",
    options: [
      { id: "yes", label: "Yes — 3M+ in 10 days", artistSlug: "park-chan-wook", sampleVotes: 734 },
      { id: "no", label: "No — under 3M", sampleVotes: 415 },
    ],
    resolutionSourceLabel: "Resolved on KOBIS cumulative admissions (first 10 days).",
    resolutionSource: KOBIS,
    resolution: {
      winningOptionId: "yes",
      resolvedAt: "2026-06-15T00:00:00+09:00",
      source: KOBIS,
      note: "Crossed 3 million admissions on day 9 per KOBIS daily tallies.",
    },
    tallyVisibleThreshold: 25,
    asOf: "2026-06-21T00:00:00+09:00",
  },

  // ===================== FASHION & BEAUTY =====================
  {
    slug: "jung-hoyeon-luxury-ambassador-2026",
    pillar: "fashion-beauty",
    category: "campaign",
    question: "Will Jung Ho-yeon be named a global house ambassador for a Fall 2026 campaign?",
    framing: "Front-row buzz, turned into a pick.",
    opensAt: "2026-06-12T00:00:00+09:00",
    closesAt: "2026-12-15T00:00:00+09:00",
    status: "open",
    options: [
      { id: "yes", label: "Yes — a global ambassadorship", artistSlug: "jung-hoyeon", sampleVotes: 559 },
      { id: "no", label: "Not this season", sampleVotes: 318 },
    ],
    resolutionSourceLabel: "Resolves on an official house announcement (reported via Vogue Korea).",
    resolutionSource: VOGUE_KOREA,
    tallyVisibleThreshold: 25,
    asOf: "2026-06-21T00:00:00+09:00",
  },
];
