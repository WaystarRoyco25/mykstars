import type { Clip, Pillar, Source } from "@/lib/types";

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
  hybeLabels: { name: "HYBE LABELS", url: "https://www.youtube.com/@HYBELABELS", kind: "embed" },
  blackpink: { name: "BLACKPINK", url: "https://www.youtube.com/@BLACKPINK", kind: "embed" },
  smtown: { name: "SMTOWN", url: "https://www.youtube.com/@SMTOWN", kind: "embed" },
  starship: { name: "STARSHIP", url: "https://www.youtube.com/@STARSHIP_official", kind: "embed" },
  babymonster: { name: "BABYMONSTER", url: "https://www.youtube.com/@BABYMONSTER", kind: "embed" },
  jype: { name: "JYP Entertainment", url: "https://www.youtube.com/@JYPEntertainment", kind: "embed" },
  twice: { name: "TWICE", url: "https://www.youtube.com/@TWICE", kind: "embed" },
  twiceJapan: { name: "TWICE JAPAN OFFICIAL YouTube Channel", url: "https://www.youtube.com/@twicejapan_official", kind: "embed" },
  theBlackLabel: { name: "THEBLACKLABEL", url: "https://www.youtube.com/@THEBLACKLABEL", kind: "embed" },
  kq: { name: "KQ ENTERTAINMENT", url: "https://www.youtube.com/@KQENT", kind: "embed" },
} satisfies Record<string, Source>;

// Official program / broadcaster / publisher channels for the On air rail (tv()
// clips). Names match the channel's oEmbed author_name exactly, verified at
// authoring time; a roster artist must actually appear in any video credited here.
const PROGRAM_CHANNEL = {
  ddeunddeun: { name: "뜬뜬 DdeunDdeun", url: "https://www.youtube.com/@ddeunddeun", kind: "embed" },
  mmtg: { name: "MMTG 문명특급", url: "https://www.youtube.com/@mmtg_official", kind: "embed" },
  tvnJoy: { name: "tvN Joy", url: "https://www.youtube.com/@tvNJoy_official", kind: "embed" },
  dailyShow: { name: "The Daily Show", url: "https://www.youtube.com/@TheDailyShow", kind: "embed" },
  gkids: { name: "GKIDS Films", url: "https://www.youtube.com/@GKIDStv", kind: "embed" },
  netflixKorea: { name: "Netflix Korea 넷플릭스 코리아", url: "https://www.youtube.com/@NetflixKorea", kind: "embed" },
  bangtantv: { name: "BANGTANTV", url: "https://www.youtube.com/@BTS", kind: "embed" },
  muply: { name: "MUPLY 뮤플리", url: "https://www.youtube.com/@muply", kind: "embed" },
  strayKids: { name: "Stray Kids", url: "https://www.youtube.com/@StrayKids", kind: "embed" },
  aespa: { name: "aespa", url: "https://www.youtube.com/@aespa", kind: "embed" },
  hearts2hearts: { name: "Hearts2Hearts", url: "https://www.youtube.com/@hearts2hearts.official", kind: "embed" },
  seventeen: { name: "SEVENTEEN", url: "https://www.youtube.com/@pledis17", kind: "embed" },
  asianFeed: { name: "AsianFeed", url: "https://www.youtube.com/@asianfeed", kind: "embed" },
  baeksang: { name: "백상예술대상", url: "https://www.youtube.com/@Baeksang", kind: "embed" },
  pickcon: { name: "PICKCON / 픽콘", url: "https://www.youtube.com/@THESTAR", kind: "embed" },
  jtbcNews: { name: "JTBC News", url: "https://www.youtube.com/@jtbc_news", kind: "embed" },
  bazaarKorea: { name: "Harper's BAZAAR Korea", url: "https://www.youtube.com/@HarpersBAZAARKorea", kind: "embed" },
  fairyJaehyung: { name: "요정재형", url: "https://www.youtube.com/@fairyjaehyung", kind: "embed" },
  myGeumhee: { name: "이금희 '마이금희'", url: "https://www.youtube.com/@mygummy_2020", kind: "embed" },
} satisfies Record<string, Source>;

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
  // --- Music: official music videos and clips (oEmbed re-verified through 2026-07-14) ---
  yt("clip-yt-seventeen-v8-singasong", "pBpr9TnhhkE", ["seventeen"], "2026-06-29T18:00:00+09:00", "V8, SEVENTEEN's new unit, drop 'singasong'", YT_CHANNEL.hybeLabels),
  yt("clip-yt-enhypen-well-be-fine", "n2bzA-ksXZI", ["enhypen"], "2026-06-29T00:00:07+09:00", "ENHYPEN, the 'We'll Be Fine' music video", YT_CHANNEL.hybeLabels),
  yt("clip-yt-twice-what-is-love-tokyo-dome", "M83nVWOlQ0k", ["twice"], "2026-06-28T18:00:07+09:00", "TWICE bring 'What is Love?' to Tokyo Dome", YT_CHANNEL.twiceJapan),
  yt("clip-yt-ateez-bad", "-q_S27LbNKU", ["ateez"], "2026-06-26T13:00:00+09:00", "ATEEZ, the 'BAD' music video", YT_CHANNEL.kq),
  yt("clip-yt-stray-kids-run-it", "Q7IFjVUUb_E", ["stray-kids"], "2026-06-24T13:00:00+09:00", "Stray Kids, the 'RUN IT' music video", YT_CHANNEL.jype),
  yt("clip-yt-riize-do-your-dance", "HDGCTtuW-Yo", ["riize"], "2026-06-15T18:00:04+09:00", "RIIZE, the 'Do your dance' music video", YT_CHANNEL.smtown),
  yt("clip-yt-boynextdoor-viral", "zGsj0fDHB_s", ["boynextdoor"], "2026-06-08T17:59:06+09:00", "BOYNEXTDOOR, the 'VIRAL' music video", YT_CHANNEL.hybeLabels),
  yt("clip-yt-meovv-ddi-ro-ri", "aHM2RKeMaeM", ["meovv"], "2026-06-01T18:47:30+09:00", "MEOVV, the 'DDI RO RI' music video", YT_CHANNEL.theBlackLabel),
  yt("clip-yt-le-sserafim-boompala", "V1Lr-_AxeR8", ["le-sserafim"], "2026-05-22T13:00:00+09:00", "LE SSERAFIM, the 'BOOMPALA' music video", YT_CHANNEL.hybeLabels),
  yt("clip-yt-nmixx-heavy-serenade", "6Ycn9qZK09I", ["nmixx"], "2026-05-11T18:00:04+09:00", "NMIXX, the 'Heavy Serenade' music video", YT_CHANNEL.jype),
  yt("clip-yt-aespa-wda", "iTJSbJtS8MU", ["aespa"], "2026-05-11T18:00:00+09:00", "aespa link up with G-Dragon for 'WDA'", YT_CHANNEL.smtown),
  yt("clip-yt-cortis-tnt", "kRpaqR5sbf0", ["cortis"], "2026-05-04T18:00:00+09:00", "CORTIS, the 'TNT' music video", YT_CHANNEL.hybeLabels),
  yt("clip-yt-babymonster-choom", "x3eqqoZPV_E", ["babymonster"], "2026-05-04T18:00:00+09:00", "BABYMONSTER, the 'CHOOM' music video", YT_CHANNEL.babymonster),
  yt("clip-yt-illit-its-me", "bMhDJ0S0OBA", ["illit"], "2026-04-30T17:58:06+09:00", "ILLIT, the 'It's Me' music video", YT_CHANNEL.hybeLabels),
  yt("clip-yt-tws-you-you", "MiO16KlMPaU", ["tws"], "2026-04-27T17:58:06+09:00", "TWS, the 'You, You' music video", YT_CHANNEL.hybeLabels),
  yt("clip-yt-katseye-pinky-up", "7F1ET2XHQfk", ["katseye"], "2026-04-10T00:59:07+09:00", "KATSEYE, the 'PINKY UP' music video", YT_CHANNEL.hybeLabels),
  yt("clip-yt-bts-swim", "b4iVv91Z6lY", ["bts"], "2026-03-20T13:00:00+09:00", "BTS, the 'SWIM' music video", YT_CHANNEL.hybeLabels),
  yt("clip-yt-allday-project-pubg", "LHUMzyMq084", ["allday-project"], "2026-03-09T18:40:00+09:00", "ALLDAY PROJECT and PUBG meet in the branded 'I DON'T BARGAIN' video", YT_CHANNEL.theBlackLabel),
  yt("clip-yt-blackpink-go", "2GJfWMYCWY0", ["blackpink"], "2026-02-27T13:30:00+09:00", "BLACKPINK return with 'GO'", YT_CHANNEL.blackpink),
  yt("clip-yt-ive-blackhole", "1Lmy7qwmSMc", ["ive"], "2026-02-23T18:00:00+09:00", "IVE, the 'BLACKHOLE' music video", YT_CHANNEL.starship),
  yt("clip-yt-hearts2hearts-rude", "F7sGJVUrkjQ", ["hearts2hearts"], "2026-02-20T18:00:00+09:00", "Hearts2Hearts, the 'RUDE!' music video", YT_CHANNEL.smtown),

  // --- Variety: comedy / variety / talk appearances on official program channels
  //     (On air rail; oEmbed-verified through 2026-07-14, upload dates from watch-page
  //     metadata cross-checked against dated press). Honest gaps this pass:
  //     Lee Min-ho had no qualifying in-window appearance, and NewJeans are skipped
  //     under the red-flag rule. Park Ji-hu and Han So-hee had no qualifying clips
  //     that stay fresh through August. Bong Joon-ho's only fresh upload was an
  //     archival 2019 conversation, so the rail keeps an honest gap. ---
  tv("clip-tv-roh-yoon-seo-nam-joo-hyuk-asianfeed", "wjbXh6SYzqQ", ["roh-yoon-seo", "nam-joo-hyuk"], "k-drama", "2026-07-14T00:00:19+09:00", "Roh Yoon-seo and Nam Joo-hyuk compare notes on *The East Palace*", PROGRAM_CHANNEL.asianFeed),
  tv("clip-tv-kim-min-ha-jtbc-news", "1AXUSVWnlQE", ["kim-min-ha"], "k-drama", "2026-07-12T21:22:55+09:00", "Kim Min-ha sits for a career interview with JTBC News", PROGRAM_CHANNEL.jtbcNews),
  tv("clip-tv-choo-young-woo-pickcon", "2EuB3v-bCkQ", ["choo-young-woo"], "k-drama", "2026-07-07T12:31:50+09:00", "Choo Young-woo turns a Blue Dragon handprinting session into ensemble comedy", PROGRAM_CHANNEL.pickcon),
  tv("clip-tv-jung-hoyeon-pinggyego", "vXiBTHJI1SY", ["jung-hoyeon"], "k-movie", "2026-07-04T09:00:00+09:00", "Jung Ho-yeon joins the *Hope* cast on Yoo Jae-suk's *Pinggyego*", PROGRAM_CHANNEL.ddeunddeun),
  tv("clip-tv-aespa-aesparty", "yZlQYtzAjPc", ["aespa"], "k-pop", "2026-06-26T20:00:00+09:00", "aespa reopen *aesParty* with the 'Dopamine Party' special", PROGRAM_CHANNEL.aespa),
  tv("clip-tv-lee-chae-min-baeksang", "RPASzIlOTVc", ["lee-chae-min"], "k-drama", "2026-06-19T18:00:37+09:00", "Lee Chae-min reviews his Baeksang rookie win in an AI interview", PROGRAM_CHANNEL.baeksang),
  tv("clip-tv-park-eun-bin-mmtg", "B0xsyiT5Du4", ["park-eun-bin"], "k-drama", "2026-05-21T18:30:00+09:00", "Park Eun-bin fields JaeJae's rapid questions on *MMTG*, honors degree included", PROGRAM_CHANNEL.mmtg),
  tv("clip-tv-cha-eunwoo-wonderfools", "4bFm34ojMfQ", ["cha-eunwoo", "park-eun-bin"], "k-drama", "2026-05-18T18:00:00+09:00", "Cha Eun-woo and Park Eun-bin react to *The Wonderfools* highlights for Netflix Korea", PROGRAM_CHANNEL.netflixKorea),
  tv("clip-tv-park-chan-wook-mygeumhee", "CoWLvgNOiM8", ["park-chan-wook"], "k-movie", "2026-05-01T19:00:15+09:00", "Park Chan-wook joins Lee Geum-hee for a long conversation on filmmaking", PROGRAM_CHANNEL.myGeumhee),
  tv("clip-tv-cortis-muply", "IAS8BhLdpZc", ["cortis"], "k-pop", "2026-04-30T20:00:00+09:00", "CORTIS fight the giggles through *Silence of the Idols* pajama drills", PROGRAM_CHANNEL.muply),
  tv("clip-tv-ahn-hyo-seop-fairy-jaehyung", "cbGvG2uMZeo", ["ahn-hyo-seop"], "k-drama", "2026-04-26T17:00:25+09:00", "Ahn Hyo-seop settles in for a full talk with Jung Jae-hyung", PROGRAM_CHANNEL.fairyJaehyung),
  tv("clip-tv-bts-run-bts", "wu6bA3zK_us", ["bts"], "k-pop", "2026-04-23T21:00:00+09:00", "BTS reopen *Run BTS* 2.0 with a full-group trip special", PROGRAM_CHANNEL.bangtantv),
  tv("clip-tv-byeon-woo-seok-iu-pinggyego", "UV1P4a8_dz4", ["byeon-woo-seok", "iu"], "k-drama", "2026-04-04T09:00:00+09:00", "Byeon Woo-seok makes his *Pinggyego* debut alongside IU, ten years after *Moon Lovers*", PROGRAM_CHANNEL.ddeunddeun),
  tv("clip-tv-kim-seon-ho-bazaar", "lJRnup3XfhI", ["kim-seon-ho"], "k-drama", "2026-03-31T17:00:00+09:00", "Kim Seon-ho answers *Harper's BAZAAR Korea* in a remote interview", PROGRAM_CHANNEL.bazaarKorea),
  tv("clip-tv-stray-kids-skz-code", "uB-XPe1K7SU", ["stray-kids"], "k-pop", "2026-03-12T19:59:00+09:00", "Stray Kids open a community center class on *SKZ CODE*", PROGRAM_CHANNEL.strayKids),
  tv("clip-tv-seventeen-going", "TJWUc875kpU", ["seventeen"], "k-pop", "2026-03-11T21:00:00+09:00", "SEVENTEEN set the 2026 *Going Seventeen* agenda in an emergency meeting", PROGRAM_CHANNEL.seventeen),
  tv("clip-tv-hearts2hearts-chase", "rQjzc2FMov4", ["hearts2hearts"], "k-pop", "2026-03-02T20:01:00+09:00", "Hearts2Hearts turn sauna day into a comedy battle on *Hearts Chase*", PROGRAM_CHANNEL.hearts2hearts),
  tv("clip-tv-kim-tae-ri-taerissaem", "1ZMfNReuu-U", ["kim-tae-ri"], "k-drama", "2026-02-11T10:00:00+09:00", "Kim Tae-ri turns rookie teacher in *After School Taeri-ssaem*, her first fixed variety show", PROGRAM_CHANNEL.tvnJoy),
];
