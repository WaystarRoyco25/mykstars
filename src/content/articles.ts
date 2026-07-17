import { resolveImageRef } from "@/lib/media-assets";
import type { Article, ImageRef, Source } from "@/lib/types";
import { FESTIVAL, NEWS1, NEWSEN, OSEN, STAR_NEWS, STUDIO, VOGUE_KOREA } from "./sources";

const ATEEZ_BILLBOARD_WEEK_TWO: Source = {
  name: "Star News · Billboard 200 week two",
  url: "https://www.starnewskorea.com/music/2026/07/15/2026071509182154700",
  kind: "press",
};
const KATSEYE_WILD_CAMPAIGN: Source = {
  name: "Universal Music Japan · KATSEYE",
  url: "https://www.universal-music.co.jp/katseye/news/2026-05-27/",
  kind: "official",
};
const JYP_FY26_Q1: Source = {
  name: "JYP Entertainment · FY26 Q1 Earnings Note",
  url: "https://www.jype.com/Board/Detail?gubun=irdata&jbst_sq=6985",
  kind: "official",
};
const KOBIS_2026_YEARLY: Source = {
  name: "KOBIS · 2026 yearly box office",
  url: "https://www.koreanfilm.or.kr/eng/news/boxOffice_Yearly.jsp?mode=BOXOFFICE_YEAR&selectDt=2026",
  kind: "official",
};
const SUNMI_FOREVER_JULY: Source = {
  name: "The Korea Times · Sunmi 'Forever July'",
  url: "https://www.koreatimes.co.kr/entertainment/k-pop/20260715/sunmi-returns-with-rainy-summer-single-forever-july",
  kind: "press",
};
const YG_CONCERT_ACCESSIBILITY: Source = {
  name: "YG Entertainment · 2026 Sustainable Concert Report",
  url: "https://ygfamily.com/contents/attachments/2026/06/YG_Entertainment_2026_%2BSustainable%2BConcert%2BReport_ENG.pdf",
  kind: "official",
};
const KOCCA_2025_WEBTOON_SURVEY: Source = {
  name: "KOCCA · 2025 Webtoon Industry Survey, public edition",
  url: "https://welcon.kocca.kr/ko/info/report/1956900",
  kind: "official",
};
const KOFIC_SOUTHEAST_ASIA_STRATEGY: Source = {
  name: "KOFIC · Southeast Asia co-production strategy",
  url: "https://magazine.kofic.or.kr/webzine/web2/2833/pdsView.do",
  kind: "official",
};

// ---------------------------------------------------------------------------
// ARTICLES
// ---------------------------------------------------------------------------
type AuthoredArticle = Omit<Article, "media"> & {
  media?: ImageRef; // stored photos only, resolved against the rights registry
};

export const authoredArticles: AuthoredArticle[] = [
  // 2026-07-16 reactive Analysis run
  {
    slug: "sunmi-forever-july-monsoon-pop",
    title: "Sunmi makes the monsoon a summer-pop advantage",
    dek: "Rain, humidity and uncertainty, treated as the real texture of a Korean summer rather than the thing a summer song escapes. The chart will price the bet by September.",
    status: "analysis",
    pillar: "k-pop",
    author: "MyKStars",
    date: "2026-07-16T14:30:00+09:00",
    body: [
      "Nobody wants to be reminded of the humidity. 'Forever July' opens on monsoon rain, wet air and emotional uncertainty, which asks listeners to sit inside the exact weather a Korean July is spent escaping, and it arrives as a digital single with none of the physical-sales engine, collectible versions or concentrated fandom purchases that carry most current K-pop chart debuts. Sunmi is betting the discomfort is the whole appeal.",
      "The bet is legible in the credits. 'Forever July' landed eight months after her first full-length album, *Heart Maid*, and Abyss Company described it as a love story shaped by a sudden downpour (*The Korea Times*, July 15, 2026). A UK garage rhythm carries the track. Sunmi took part in both writing and composing it. Concept, sound and authorship all point one way, which is rarer than it sounds for a seasonal single.",
      "Her earlier summer records give the idea a credible base. The same July 15 report noted that 'pporappippam' reached the Circle Digital Chart top 10 in 2020 and identified 'Heart Burn' as another seasonal hit in 2022. Both favored mood over the crowded beach-party formula. 'Forever July' pushes that preference to its limit by making unstable weather the central image instead of the backdrop.",
      "That weather is the argument. Korea's rainy season changes commutes, clothing, street light and the pace of daily life. Pop usually turns summer into a universal postcard of blue sky and escape; this keeps it local and unsettled, and the damp visual world gives the song a language for attraction that feels exciting and difficult at once. The wager is that specificity travels further than the postcard, because it hands a listener a complete point of view rather than a generic one.",
      "Her career stage is what makes the risk worth carrying. She has less reason than a younger group to chase release volume, and a seasonal record built on her own writing and composing credits can deepen a recognizable catalogue and return every July once the public adopts it. That recurring value outlives one crowded week of promotional clips. The strategy works when authorship, image and listening occasion reinforce one another, as they do here.",
      "Circle Digital Chart settles it. A top-30 finish by the chart week ending August 15, 2026, then a hold inside the top 100 for the week ending September 5, and the monsoon read the season right. Missing both marks would leave 'Forever July' a memorable campaign wrapped around a song nobody replays.",
    ],
    source: SUNMI_FOREVER_JULY,
    media: {
      kind: "image",
      assetId: "sunmi-2025-miss-sixty",
      alt: "Sunmi at the Miss Sixty and KNWLS event in November 2025",
    },
    related: {},
  },
  {
    slug: "yg-concert-accessibility-standard",
    title: "YG's accessibility work can reset the concert standard",
    dek: "Captioning, sensory bags and trained support staff, moved out of goodwill and into concert operations. The 2027 report either counts every Korean show or admits it was a pilot.",
    status: "analysis",
    pillar: "k-pop",
    author: "MyKStars",
    date: "2026-07-16T13:00:00+09:00",
    body: [
      "Concert culture asks fans to prove devotion through endurance: long queues, dense crowds, bright light, loud sound, unfamiliar routes. YG Entertainment has started designing that requirement out. Its 2026 Sustainable Concert Report, dated May 2026, treats captions, navigation, sensory support and staff training as production work rather than goodwill. Carried across every show, that changes what a Korean concert owes the people in the room. Carried at selected ones, it is a brochure.",
      "The work began with an audit it did not control. Six people with disabilities reviewed AKMU's 10th-anniversary 10VE concert in June 2024, assessing the journey from ticket booking through the end of the show. They found gaps in screen-reader support, alternative text, keyboard navigation and accessibility inquiry channels. They also asked for clear venue information on drop-off zones, accessible routes, elevators, braille and large-print materials, and evacuation procedures.",
      "YG changed the journey. It added pre-concert information for visually impaired users, a way to request accessibility staff and links in booking confirmation messages. It trained support staff and expanded accessibility maps. Real-time captioning was offered at 10VE. Sensory bags arrived for sensory-sensitive guests at BLACKPINK WORLD TOUR DEADLINE IN GOYANG in July 2025. More than 80.9 percent of surveyed fans rated BLACKPINK's Seoul accessibility guide video positively, according to YG's 2024 sustainability report. Accessible information gives people control before they arrive; captions and sensory support widen a shared performance once it starts. A concert is larger when more people can enter it on equal terms.",
      "The evidence is thinner than the design work. YG reports on itself and highlights a small number of shows. The documents do not say how many guests used each service, what share of concerts received the full package, how many accessible seats existed, or how accessibility complaints were resolved. A well-made guide at one flagship event is an achievement, and it is not yet an agency-wide standard. What the record establishes is serious design and incomplete accountability.",
      "Scaling it is an operations problem, which is the good news. Accessibility requirements can live in venue contracts, production checklists, ticketing pages and tour briefs, where they stop depending on one artist or one local promoter and start giving vendors a stable specification to improve against. YG has already connected user testing to concrete changes, and that is the hardest part of the cycle to start.",
      "YG's own roadmap dates the answer. The 2024 roadmap set a 2027 milestone for all concerts in Korea and selected overseas shows, and the 2026 report extends the framework to every YG concert at home and abroad by 2030. The report due by June 30, 2027, should carry a concert-by-concert coverage table listing services, gaps and usage. If every Korean YG show staged in the first half of 2027 appears there with accessible booking information, trained support, route guides, captioning and sensory support, the standard holds. Another report built around selected examples would say the opposite.",
    ],
    source: YG_CONCERT_ACCESSIBILITY,
    media: {
      kind: "image",
      assetId: "blackpink-2025-deadline-milan",
      alt: "BLACKPINK on the Deadline world tour in 2025",
    },
    related: { artistSlugs: ["blackpink"] },
  },
  {
    slug: "webtoon-tv-creator-transparency",
    title: "Webtoon television wins are outrunning creator transparency",
    dek: "*Agent Kim Reactivated* and *Teach You a Lesson* became global television hits. The people who drew them are the hardest part of the business to see in the numbers.",
    status: "analysis",
    pillar: "k-drama",
    author: "MyKStars",
    date: "2026-07-16T11:30:00+09:00",
    body: [
      "Korean webtoons have become television's most efficient story laboratory, and the people running the experiments are the hardest part of the business to see. Another year of global screen hits will widen that gap unless official statistics start isolating what an adaptation actually pays a creator, and whether it keeps paying.",
      "The hits are not in doubt. *Agent Kim Reactivated*, adapted from *Manager Kim*, led Netflix's non-English television list with 10.5 million views for June 29 through July 5, 2026. *Teach You a Lesson*, another webtoon adaptation, took 21.1 million views in a single week, ranked first in 46 countries and reached the top 10 in 91, per Netflix on June 17. Both arrived with proven characters, visual grammar and an audience already assembled.",
      "The creator-side numbers are blunter. KOCCA's public edition of the 2025 Webtoon Industry Survey, registered January 2, 2026, put 2024 industry revenue at KRW 2.286 trillion, up 4.4 percent, with Japan taking 49.5 percent of exports and North America 21.0 percent. Against that, creators who serialized throughout 2024 reported a KRW 42 million median annual income, averaging 9.4 hours per creative day across 5.8 creative days a week. KOCCA warned that new industry methods and a changed creator sample limit comparisons with earlier surveys.",
      "The pipeline's appeal is easy to explain. A serialized webtoon tests characters and pacing in public before a producer commits a television budget. Panels already provide a visual development record. Episode endings supply a map for streaming structure. Existing readership lowers the cost of explaining a new title, and each hit can send viewers back to the original work and open games, merchandise or foreign remake rights. That is what makes the measurement gap self-harming rather than merely unfair. Artists and writers working inside a distinctly Korean digital reading form are the supply; credit is the minimum, and visible economic participation is what buys them time to make the next one.",
      "The survey is not silent on contracts. Among businesses that secured secondary-work rights during serialization agreements, 57.9 percent used a license, 17.8 percent a transfer and 9.2 percent shared rights. Deal-level disclosure could weaken negotiations or expose personal income, and anonymized reporting is the standard protection against exactly that. The gap left over is narrow and specific: the public tables show how businesses secure secondary rights and which legal forms they use, while creator-level adaptation income and continuing financial participation stay unmeasured.",
      "Which makes KOCCA's next annual survey the place that gap closes or hardens. By December 31, 2026, the report should isolate creator income from screen adaptations and other secondary rights, plus the share of screen deals carrying continuing financial participation. Publish both creator-level measures, define the sample, and separate television from film, games and merchandise, and the complaint here expires. Repeat only the business-side rights structures, and another record year for Korean webtoon television passes with the creators' half of it unmeasured.",
    ],
    source: KOCCA_2025_WEBTOON_SURVEY,
    media: {
      kind: "image",
      assetId: "kang-full-2018-webtoon-lecture",
      alt: "Webtoon author Kang Full speaking at a webtoon program lecture in 2018",
    },
    related: {},
  },
  {
    slug: "korean-cinema-southeast-asia-local-leadership",
    title: "Korean cinema grows abroad when local creators lead",
    dek: "*Mansion of Mr. Hua* topped Vietnam's box office with a Vietnamese creative team and Korean financing behind it. The export was the relationship, not the format.",
    status: "analysis",
    pillar: "k-movie",
    author: "MyKStars",
    date: "2026-07-16T10:00:00+09:00",
    body: [
      "A found-footage horror film about a haunted Ho Chi Minh City mansion reached No. 1 at the Vietnamese box office six days after release, and the most interesting thing about it is what the Korean partner did not do. Korean cinema's strongest route into Southeast Asia hands local creators the story and supplies expertise as infrastructure underneath it, and *Mansion of Mr. Hua* is the case for that being a repeatable model rather than a lucky June.",
      "Runup Vietnam and Korea's Hive Media Corp. co-produced the film, which drew its premise from a real mansion and local ghost stories (KOFIC's *Korean Film* magazine, July 13, 2026). Vietnamese filmmakers led story development, production, direction, acting and marketing. Hive Media supplied planning experience, production support and financing. Local knowledge shaped the fear, the space and the folklore, while Korean capital and production systems carried the project to market scale. The partnership needed no Korean characters on screen and no borrowed Korean plot to work.",
      "A second version is forming in Indonesia. KOFIC cited *Ghost in the Cell*, co-produced by Korea's Barunson E&A with Indonesian director Joko Anwar's Come and See Pictures, with Barunson also handling international sales. The film drew 3.36 million admissions in Indonesia and premiered at the 2026 Berlin International Film Festival. Both cases treat relationships and skills as the thing being exported, and leave the finished film rooted in its own culture.",
      "Credits are a weak place to look for power. Financing, sales access and intellectual-property contracts can hand the Korean partner more control than the billing suggests, and a locally cast film can reproduce extraction behind the camera. Fast expansion can flatten distinct Southeast Asian cultures into a single market category. The evidence here is also early: one Vietnamese box-office leader and one Indonesian festival selection are two data points, not a regional system.",
      "KOFIC's policy response is where that gets tested at scale. Its 2026 International Co-production Pilot Program offers up to KRW 500 million per selected project; the first-half call drew 19 applications, 11 of them involving Southeast Asian partners, and a development-support program is planned for 2027. Public money can require what contracts otherwise obscure: clear creative leadership, shared rights, transparent local spending. Those terms are how respect becomes a production structure instead of a press-release adjective.",
      "Results through June 30, 2027 will show which it was. Two or more pilot-backed Southeast Asian co-productions reaching production with local writers and directors, disclosed shared-IP terms, and either a top-five local box-office finish or official selection at Berlin, Cannes or Venice, and the model is real. A program that mainly finances Korean remakes, or leaves ownership undisclosed, makes *Mansion of Mr. Hua* an exception that flattered everyone involved.",
    ],
    source: KOFIC_SOUTHEAST_ASIA_STRATEGY,
    media: {
      kind: "image",
      assetId: "joko-anwar-2015-ffi-best-director",
      alt: "Director Joko Anwar receiving the Best Director award at the 2015 Festival Film Indonesia",
    },
    related: {},
  },
  // --- 2026-07-15 Analysis run: two artist calls, one company and one industry flagship ---
  {
    slug: "katseye-wild-catalogue-win",
    title: "KATSEYE can turn *WILD* into a catalogue win",
    dek: "*BEAUTIFUL CHAOS* opened at No. 4 and was still on the Billboard 200 nineteen weeks later. *WILD* arrives with a far bigger campaign and has to beat both numbers.",
    status: "analysis",
    pillar: "k-pop",
    author: "MyKStars",
    date: "2026-07-15T13:30:00+09:00",
    body: [
      "KATSEYE's last EP proved the harder half. *BEAUTIFUL CHAOS* opened at No. 4 and was still charting nineteen weeks on, which is the stretch most new groups never reach. *WILD* arrives into a much larger campaign, and the useful question is whether that campaign raises the ceiling or only the opening week.",
      "The opening split is why the record lasted. *BEAUTIFUL CHAOS* took 44,000 album-equivalent units in its first week: 30,000 album sales against 14,000 streaming-equivalent units from 21.36 million on-demand streams (*Billboard Brasil*, July 6, 2025). Enough of that debut was listening rather than buying to keep the EP alive long after release week, and it still sat at No. 43 in its nineteenth Billboard 200 week on the chart dated November 15, 2025 (*Billboard Japan*).",
      "The campaign around *WILD* is a different size. KATSEYE won all three of its nominated American Music Award categories and sold out all 31 dates of THE WILDWORLD TOUR in under 48 hours (Universal Music Japan, May 27, 2026). Awards and arena sales measure attention and live demand, while preorder incentives can still pull album consumption into a single week and leave the hold exactly where it started.",
      "Two numbers decide it: *WILD* opening with 60,000 units or more and a top-three rank on the Billboard 200 dated August 29, then holding inside the top 50 in week four on September 19.",
    ],
    source: KATSEYE_WILD_CAMPAIGN,
    media: {
      kind: "image",
      assetId: "katseye-2025-wango-tango",
      alt: "KATSEYE on stage at Wango Tango in May 2025",
    },
    related: { artistSlugs: ["katseye"] },
  },
  {
    slug: "ateez-number-one-listening-test",
    title: "ATEEZ has mastered the No. 1 debut. The next test is listening",
    dek: "A record No. 1 built from 223,000 physical copies and 5,000 streaming units, then No. 19 seven days later. Week ten on the Billboard 200 is the number that matters.",
    status: "analysis",
    pillar: "k-pop",
    author: "MyKStars",
    date: "2026-07-15T12:00:00+09:00",
    body: [
      "Nine Billboard 200 top 10 releases is a record almost no group in K-pop can match, and *GOLDEN HOUR : Part.5* held No. 1 on World Albums and No. 2 on Top Album Sales into its second week (*Star News* chart report, July 15). ATEEZ has built the most dependable launch platform in the genre. It is also the reason the group's US ceiling is now a question about everything that happens after release week.",
      "The split shows why. The EP opened at 228,000 album-equivalent units for the chart dated July 11: 223,000 traditional sales against 5,000 streaming-equivalent units from 4.96 million on-demand streams (*Billboard Japan*, July 6, 2026). Hanteo first-week sales passed 1.88 million, another group record (Yonhap, July 3). Sales supplied 97.8 percent of the debut, and the EP fell from No. 1 to No. 19 the following week.",
      "Repeat purchasing is real demand, and it answers a different question than listening does. A collector buys once per edition; a listener comes back unprompted. Only one of those two keeps a record on the chart in month three, which makes multiweek Billboard 200 retention the honest measure of whether the US audience is growing or restocking.",
      "The Billboard 200 dated September 12 is the EP's tenth chart week. A top 100 rank there says the listening followed the buying. Below No. 100, or gone before it, says the collector base did all the work.",
    ],
    source: ATEEZ_BILLBOARD_WEEK_TWO,
    media: {
      kind: "image",
      assetId: "ateez-2025-in-your-fantasy",
      alt: "ATEEZ on the In Your Fantasy tour in 2025",
    },
    related: { artistSlugs: ["ateez"] },
  },
  {
    slug: "jyp-tour-shop-release-calendar",
    title: "JYP's tour shops are becoming a second release calendar",
    dek: "Revenue rose 32.1 percent in a quarter with no major artist album. Nine popup cities in Q2 will show whether that was a business or a delivery schedule.",
    status: "analysis",
    pillar: "k-pop",
    author: "MyKStars",
    date: "2026-07-15T10:30:00+09:00",
    body: [
      "A quarter with no major-artist album should have been a soft one for JYP Entertainment. Consolidated revenue rose 32.1 percent instead. Tour-linked city popups are turning into a second sales calendar that earns between comebacks, and the case for them is that Blue Garage holds a double-digit margin once delayed online-order recognition rolls off.",
      "The FY26 Q1 Earnings Note, published May 15, 2026, put consolidated revenue at KRW 186.0 billion and operating profit at KRW 33.4 billion, up 70.0 percent, for a 17.9 percent operating margin. Physical-recording revenue fell 15.1 percent to KRW 25.2 billion over the same three months, which is what makes the top line worth explaining.",
      "Touring commerce filled the gap. Merchandise revenue reached KRW 60.6 billion, up 85.2 percent; concert revenue reached KRW 40.9 billion, up 88.7 percent. Together they supplied KRW 101.5 billion, or 54.6 percent of consolidated revenue. Blue Garage lifted revenue 180.5 percent to KRW 40.9 billion at an 11.1 percent operating margin. JYP mapped TWICE-linked popups across five cities in late 2025 and seven in Q1, with nine more planned for Q2.",
      "That cadence gives a single tour several local sales windows and spreads product drops across months, attaching merchandise to a live event rather than to one album week. It keeps intellectual property earning while the recording slate is light, and Q1 says fans will follow the schedule from market to market.",
      "Recognition timing is doing some of this work. JYP said part of Q1 Blue Garage revenue came from online deliveries completed after Stray Kids' October 2025 encore and TWICE's tenth-anniversary popup, which puts a slice of the quarter's growth on events that happened before it. The FY25 Q3 Earnings Note of November 14, 2025 recorded a 20.5 percent merchandise decline to KRW 40.0 billion in a quarter without large project sales, with Blue Garage's cumulative operating margin then near 9 percent. Strip the timing out and the concentration remains: this is a quarter led by TWICE and Stray Kids.",
      "The FY26 Q2 Earnings Note, due by August 31, 2026, is where the timing explanation expires, because the nine planned popup cities land inside it. Merchandise revenue of KRW 50 billion or more, a Blue Garage operating margin of 10 percent or better, a consolidated operating margin of 17 percent or better: two of those three and the format repeats. Fewer, and Q1 was a delivery schedule wearing a strategy's clothes.",
    ],
    source: JYP_FY26_Q1,
    media: {
      kind: "image",
      assetId: "stray-kids-2026-golden-disc",
      alt: "Stray Kids on the red carpet at the 40th Golden Disc Awards",
    },
    related: { artistSlugs: ["twice", "stray-kids", "nmixx"] },
  },
  {
    slug: "korean-cinema-distributor-concentration",
    title: "Korean cinema's record quarter belongs to one distributor",
    dek: "Admissions hit a post-2020 Q1 high while Showbox took 55.4 percent of revenue. One distributor released all three of 2026's biggest Korean films.",
    status: "analysis",
    pillar: "k-movie",
    author: "MyKStars",
    date: "2026-07-15T09:00:00+09:00",
    body: [
      "Korean theatrical demand has come back. The industry may not have. Showbox released all three of the biggest Korean films of 2026, and until that changes, the rebound is one company's run rather than a market's.",
      "The base was weak enough to flatter anything that followed. The Korean Film Council's annual report, published February 27, 2026, put 2025 box-office revenue at KRW 1.047 trillion and admissions at 106.09 million, down 12.4 percent and 13.8 percent from 2024. Against that, the first quarter was a genuine result.",
      "KOFIC's April 29 report recorded KRW 318.0 billion in first-quarter revenue and 31.9 million admissions, the strongest Q1 since 2020, with Korean films taking 73.4 percent of revenue. Showbox releases generated KRW 176.3 billion of that, equal to 55.4 percent of the entire market. Second-place Disney Korea took KRW 43.1 billion and 13.6 percent. Demand returned around a concentrated slate.",
      "The live KOBIS yearly table on July 15 puts *The King's Warden*, *Colony* and *Salmokji* as 2026's three leading Korean releases at 16.91 million, 5.90 million and 3.24 million admissions. Showbox distributed all three. Romance, historical drama, horror and zombie action have all found audiences inside that run, which is a real argument that the appetite is broad rather than one-film luck. It is also an argument about genre, when the scarce thing is the ability to finance a film and put it in every theater in the country. Breadth of taste inside one slate leaves the pipeline as narrow as it was.",
      "The KOBIS yearly table on August 31, 2026 will name the five highest-grossing Korean films of the year. If at least two of them come from distributors other than Showbox, each above three million admissions, the rebound belongs to the market. Anything short of that, and it belongs to Showbox.",
    ],
    source: KOBIS_2026_YEARLY,
    related: {},
  },
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
    media: {
      kind: "image",
      assetId: "bts-2022-white-house",
      alt: "BTS at the White House in May 2022",
    },
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
    media: {
      kind: "image",
      assetId: "cortis-2026-golden-disc",
      alt: "CORTIS at the 40th Golden Disc Awards in January 2026",
    },
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
    media: {
      kind: "image",
      assetId: "ive-2026-golden-disc",
      alt: "IVE at the 40th Golden Disc Awards in January 2026",
    },
    related: {
      artistSlugs: ["ive", "blackpink", "le-sserafim"],
      gallerySlugs: ["ive-blackhole-comeback", "le-sserafim-boompala-comeback"],
    },
  },
  {
    slug: "monochrome-concept-photos-2026",
    title: "Why monochrome concept photos are dominating 2026 comebacks",
    dek: "Black-and-white sets read as 'premium' and travel well across platforms. Agencies keep reaching for them because color is the first thing compression destroys.",
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
    media: {
      kind: "image",
      assetId: "newjeans-2024-seoul-fashion-week",
      alt: "NewJeans at Seoul Fashion Week in September 2024",
    },
    related: { artistSlugs: ["newjeans", "stray-kids"] },
  },
  {
    slug: "the-airport-runway",
    title: "The airport runway: how a 5 a.m. departure became fashion theater",
    dek: "Incheon's press line is now a styled event in its own right, planned down to the brand. It is also the most-searched thing in the fandom that English coverage keeps missing.",
    status: "analysis",
    pillar: "k-pop",
    author: "MyKStars",
    date: "2026-06-21T10:30:00+09:00",
    body: [
      "There is nothing accidental about an airport look. Outfits are planned, sometimes pulled from a brand the artist represents, and timed to a press line that everyone in the room knows is coming.",
      "For global fans, the airport set is often the first high-resolution sighting of an artist between official schedules, which is exactly why organized, credited airport galleries are one of the most-searched things in the fandom and one of the least well served in English.",
    ],
    source: OSEN,
    media: {
      kind: "image",
      assetId: "twice-2024-las-vegas",
      alt: "TWICE performing in Las Vegas in 2024",
    },
    related: { artistSlugs: ["blackpink", "twice"], gallerySlugs: ["blackpink-incheon-airport"] },
  },
  {
    slug: "kdrama-global-default",
    title: "How global streaming made K-drama a default, not a niche",
    dek: "Korean series are now a standing fixture on the world's streaming charts. The discovery problem has inverted from scarcity to overload, and coverage has yet to catch up.",
    status: "analysis",
    pillar: "k-drama",
    author: "MyKStars",
    date: "2026-06-21T08:00:00+09:00",
    body: [
      "A decade ago, finding a Korean drama with reliable English subtitles took effort. Now a new title can open simultaneously in dozens of countries and sit on a global top-ten chart by the weekend. The discovery problem has inverted from scarcity to overload.",
      "That shift moves the coverage gap. The audience no longer needs to be told a show exists; it needs help deciding what to start, where to watch it without hunting across four services, and who is in it. Organized, credited stills and a clear where-to-watch line do more work than a recap ever did.",
    ],
    source: STUDIO,
    media: {
      kind: "image",
      assetId: "kim-tae-ri-2026-prada-beauty",
      alt: "Kim Tae-ri at a Prada beauty event in April 2026",
    },
    related: { artistSlugs: ["kim-tae-ri", "park-eun-bin"], gallerySlugs: ["drama-production-presentation"] },
  },
  {
    slug: "casting-season",
    title: "Casting season: how to read the tea leaves of a lineup",
    dek: "A casting announcement is the first marketing beat of a drama, styled and lit months before a scene airs. The lineup gives away the budget, the audience and the tone.",
    status: "analysis",
    pillar: "k-drama",
    author: "MyKStars",
    date: "2026-06-20T12:00:00+09:00",
    body: [
      "The character-portrait drop that accompanies a casting confirmation is a genre of its own: styled, lit, and released on a schedule designed to seed months of anticipation before a single scene airs.",
      "Read the lineup and you can usually read the budget, the target audience, and the tone. A cross-pillar cast (an idol stepping into a lead, a film actor taking a television role) is its own signal, and one worth following across the rest of the site.",
    ],
    source: STUDIO,
    media: {
      kind: "image",
      assetId: "lee-min-ho-2026-mise-en-scene-festival",
      alt: "Lee Min-ho at the Mise-en-scene Short Film Festival in June 2026",
    },
    related: { artistSlugs: ["lee-min-ho", "park-eun-bin"], gallerySlugs: ["drama-casting-ensemble"] },
  },
  {
    slug: "idol-ambassador-economy",
    title: "The idol-as-ambassador economy",
    dek: "Pictorials and house campaigns have become many artists' main visual output between comebacks. The campaign feeds the fan accounts, and the reach buys the next ambassadorship.",
    status: "analysis",
    pillar: "fashion-beauty",
    author: "MyKStars",
    date: "2026-06-21T07:00:00+09:00",
    body: [
      "Between comebacks, the steady drumbeat of an artist's visual presence is increasingly fashion and beauty work: a magazine cover, a house campaign, a front-row appearance. For a photo-first publication, that work is a pillar of K-pop coverage in its own right.",
      "The mechanics are a loop. A campaign produces editorial imagery; the imagery travels through fan accounts; the reach justifies the next ambassadorship. Crediting the photographer, stylist and glam team is the part of the story everyone else leaves out, and we treat that credit line as reporting.",
    ],
    source: VOGUE_KOREA,
    media: {
      kind: "image",
      assetId: "cha-eunwoo-2025-saint-laurent",
      alt: "Cha Eun-woo at a Saint Laurent store opening in March 2025",
    },
    related: { artistSlugs: ["jung-hoyeon", "cha-eunwoo"], gallerySlugs: ["vogue-korea-editorial"] },
  },
  {
    slug: "festival-circuit-explained",
    title: "The festival circuit, explained",
    dek: "Busan, Cannes, Berlin: theatrical admissions have softened, and the photocall has only grown in importance. It is where a director's standing gets recognized in public.",
    status: "analysis",
    pillar: "k-movie",
    author: "MyKStars",
    date: "2026-06-20T19:00:00+09:00",
    body: [
      "Theatrical admissions have softened, but the festival photocall has, if anything, grown in importance: it's the moment a film's images enter the global conversation, and where a director's standing is publicly recognized.",
      "For Korean cinema specifically, the circuit is a prestige engine that feeds back into everything else: the auteur whose film premieres at Busan is the same name a drama production wants attached, and the same face a fashion house wants in the front row.",
    ],
    source: FESTIVAL,
    media: {
      kind: "image",
      assetId: "park-chan-wook-2026-cannes",
      alt: "Park Chan-wook at the 2026 Cannes Film Festival",
    },
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
    dek: "When an unconfirmed personal claim spreads, our default is restraint. We say what is known, what is unconfirmed, and who would have to speak for the story to change.",
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

export const articles: Article[] = authoredArticles.map(
  ({ media, ...article }): Article =>
    media ? { ...article, media: resolveImageRef(media) } : article,
);
