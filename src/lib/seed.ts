import type { Article, Artist, Gallery, MediaItem, Source } from "./types";

// ---------------------------------------------------------------------------
// SAMPLE SEED DATA
// ---------------------------------------------------------------------------
// This stands in for the headless CMS during early development so the whole
// site runs end-to-end offline. Photo galleries use neutral, descriptive
// captions of generic public moments (airport arrivals, red carpets, etc.);
// editorial pieces are analysis/explainers — no unverified claims about real
// people. Real licensed/embedded media + CMS content replace this later.
// "Reference" reference time so relative timestamps stay deterministic.
export const NOW = "2026-06-21T20:00:00+09:00";

// --- sources (every media item links back to one of these) ---
const OSEN: Source = { name: "OSEN", url: "https://osen.mt.co.kr", kind: "press" };
const NEWSEN: Source = { name: "Newsen", url: "https://www.newsen.com", kind: "press" };
const STAR_NEWS: Source = { name: "Star News", url: "https://www.starnewskorea.com/en", kind: "press" };
const NEWS1: Source = { name: "News1", url: "https://www.news1.kr", kind: "wire" };
const W_KOREA: Source = { name: "W Korea", url: "https://www.wkorea.com", kind: "magazine" };

function place(id: string, alt: string, credit: Source, tone = 0): MediaItem {
  return { id, kind: "placeholder", alt, credit, tone };
}

function placeSet(prefix: string, baseAlt: string, credit: Source, n: number): MediaItem[] {
  return Array.from({ length: n }, (_, i) =>
    place(`${prefix}-${i + 1}`, `${baseAlt} — frame ${i + 1}`, credit, i % 4),
  );
}

// ---------------------------------------------------------------------------
export const artists: Artist[] = [
  {
    slug: "newjeans",
    name: "NewJeans",
    koreanName: "뉴진스",
    type: "group",
    agency: "ADOR",
    debutYear: 2022,
    bio: "Five-member group known for a clean, retro-leaning visual identity and a strong international following.",
  },
  {
    slug: "blackpink",
    name: "BLACKPINK",
    koreanName: "블랙핑크",
    type: "group",
    agency: "YG Entertainment",
    debutYear: 2016,
    bio: "One of the most globally recognized K-pop groups, with a long record of fashion-house ambassadorships.",
  },
  {
    slug: "iu",
    name: "IU",
    koreanName: "아이유",
    type: "soloist",
    agency: "EDAM Entertainment",
    debutYear: 2008,
    bio: "Singer-songwriter and actor whose red-carpet and award-show appearances are widely covered.",
  },
  {
    slug: "stray-kids",
    name: "Stray Kids",
    koreanName: "스트레이 키즈",
    type: "group",
    agency: "JYP Entertainment",
    debutYear: 2018,
    bio: "Self-producing group with a high-energy performance style and frequent music-show appearances.",
  },
  {
    slug: "aespa",
    name: "aespa",
    koreanName: "에스파",
    type: "group",
    agency: "SM Entertainment",
    debutYear: 2020,
    bio: "Concept-driven group whose fan events and showcases draw large in-person and online audiences.",
  },
  {
    slug: "cha-eunwoo",
    name: "Cha Eun-woo",
    koreanName: "차은우",
    type: "soloist",
    agency: "Fantagio",
    debutYear: 2016,
    bio: "Idol and actor, a recurring face of fashion and beauty pictorials.",
  },
  {
    slug: "twice",
    name: "TWICE",
    koreanName: "트와이스",
    type: "group",
    agency: "JYP Entertainment",
    debutYear: 2015,
    bio: "Long-running group with a steady touring schedule and heavy airport-fashion coverage.",
  },
];

// ---------------------------------------------------------------------------
export const galleries: Gallery[] = [
  {
    slug: "newjeans-comeback-showcase",
    title: "NewJeans return, shot in monochrome",
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
      ...placeSet("newjeans", "NewJeans comeback showcase", NEWSEN, 6),
    ],
  },
  {
    slug: "blackpink-incheon-airport",
    title: "BLACKPINK at Incheon, ahead of a tour leg",
    category: "airport",
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
    category: "comeback",
    artistSlugs: ["stray-kids"],
    event: "Music-show comeback stage",
    date: "2026-06-21T16:00:00+09:00",
    source: NEWSEN,
    excerpt: "Performance frames from the week's music-show comeback.",
    cover: place("skz-cover", "Stray Kids on the comeback stage", NEWSEN, 3),
    media: placeSet("skz", "Stray Kids comeback stage", NEWSEN, 7),
  },
  {
    slug: "aespa-fan-meet",
    title: "aespa, up close at the fan meet",
    category: "event",
    artistSlugs: ["aespa"],
    event: "Fan meet",
    date: "2026-06-21T15:00:00+09:00",
    source: NEWS1,
    excerpt: "Stage and audience moments from the fan meet.",
    cover: place("aespa-cover", "aespa greeting fans at the fan meet", NEWS1, 1),
    media: placeSet("aespa", "aespa fan meet", NEWS1, 6),
  },
  {
    slug: "iu-baeksang-red-carpet",
    title: "IU on the Baeksang red carpet",
    category: "red-carpet",
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
    category: "airport",
    artistSlugs: ["twice"],
    event: "Incheon International Airport",
    date: "2026-06-21T11:00:00+09:00",
    source: OSEN,
    excerpt: "Airport-fashion frames from the morning departure.",
    cover: place("twice-cover", "TWICE departing from Incheon airport", OSEN, 0),
    media: placeSet("twice", "TWICE at Incheon airport", OSEN, 7),
  },
];

// ---------------------------------------------------------------------------
export const articles: Article[] = [
  {
    slug: "monochrome-concept-photos-2026",
    title: "Why monochrome concept photos are dominating 2026 comebacks",
    dek: "Black-and-white sets read as 'premium' and travel well across platforms — a look at why agencies keep reaching for them.",
    status: "analysis",
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
