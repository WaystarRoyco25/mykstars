import assert from "node:assert/strict";
import test from "node:test";

import {
  getArticle,
  getArticlePageData,
  getArticles,
  getArtist,
  getArtistCatalogPageData,
  getArtistsBySlugs,
  getClips,
  getEvents,
  getGalleriesForPillar,
  getGallery,
  getGalleryPageData,
  getMusicClips,
  getPulse,
  getPulsePageData,
  getPulses,
  getRanking,
  getStarsDirectory,
  getVarietyClips,
} from "../../src/lib/data/catalog";

test("catalog selectors retain ordering and filters", async () => {
  const directory = await getStarsDirectory();
  assert.deepEqual(
    directory.slice(0, 8).map((artist) => artist.slug),
    [
      "aespa",
      "ahn-hyo-seop",
      "allday-project",
      "ateez",
      "babymonster",
      "blackpink",
      "bong-joon-ho",
      "boynextdoor",
    ],
  );
  assert.deepEqual(
    directory.map((artist) => artist.name),
    directory.map((artist) => artist.name).toSorted((left, right) => left.localeCompare(right)),
  );
  assert.deepEqual(
    (await getStarsDirectory({ q: "kim" })).map((artist) => artist.slug),
    ["kim-min-ha", "kim-seon-ho", "kim-tae-ri"],
  );
  assert.deepEqual(
    (
      await getStarsDirectory({
        pillar: "k-drama",
        type: "individual",
        coverage: "active",
      })
    ).map((artist) => artist.slug),
    [
      "ahn-hyo-seop",
      "byeon-woo-seok",
      "choo-young-woo",
      "han-so-hee",
      "jung-hoyeon",
      "kim-min-ha",
      "kim-seon-ho",
      "kim-tae-ri",
      "lee-chae-min",
      "lee-min-ho",
      "nam-joo-hyuk",
      "park-eun-bin",
      "park-ji-hu",
      "roh-yoon-seo",
    ],
  );

  assert.deepEqual(
    (await getArticles()).slice(0, 4).map((article) => article.slug),
    [
      "sunmi-forever-july-monsoon-pop",
      "yg-concert-accessibility-standard",
      "webtoon-tv-creator-transparency",
      "korean-cinema-southeast-asia-local-leadership",
    ],
  );
  assert.deepEqual(
    (await getPulses({ artist: "bts", limit: 1 })).map((pulse) => pulse.slug),
    ["2026-07-bts-british-museum-gallery-trail"],
  );
});

test("catalog media and schedule selectors retain exact filtering", async () => {
  assert.deepEqual(
    (await getMusicClips(3)).map((clip) => clip.id),
    [
      "clip-yt-seventeen-v8-singasong",
      "clip-yt-enhypen-well-be-fine",
      "clip-yt-twice-what-is-love-tokyo-dome",
    ],
  );
  assert.deepEqual(
    (await getVarietyClips(3)).map((clip) => clip.id),
    [
      "clip-tv-roh-yoon-seo-nam-joo-hyuk-asianfeed",
      "clip-tv-kim-min-ha-jtbc-news",
      "clip-tv-choo-young-woo-pickcon",
    ],
  );
  assert.deepEqual(
    (await getClips({ genre: "variety", artist: "bts" })).map((clip) => clip.id),
    ["clip-tv-bts-run-bts"],
  );
  assert.deepEqual(
    (
      await getEvents({
        region: "korea",
        type: "concert",
        upcomingFrom: "2026-07-18T20:00:00+09:00",
      })
    ).map((event) => event.slug),
    [
      "cortis-put-your-phone-down-incheon",
      "stray-kids-world-tour-seoul",
      "stray-kids-world-tour-seoul-jul-29",
      "stray-kids-world-tour-seoul-aug-1-2",
    ],
  );
});

test("catalog lookup boundaries retain archived detail records and missing values", async () => {
  assert.deepEqual(await Promise.all([
    getGalleriesForPillar("k-pop"),
    getGalleriesForPillar("k-drama"),
    getGalleriesForPillar("k-movie"),
    getGalleriesForPillar("fashion-beauty"),
  ]), [[], [], [], []]);

  const archived = await getGallery("blackpink-incheon-airport");
  assert.equal(archived?.publicationState, "archived");
  assert.deepEqual(
    (await getArtistsBySlugs(["bts", "missing", "aespa"])).map((artist) => artist.slug),
    ["bts", "aespa"],
  );
  assert.equal(await getArtist("missing"), undefined);
  assert.equal(await getGallery("missing"), undefined);
  assert.equal(await getArticle("missing"), undefined);
  assert.equal(await getPulse("missing"), undefined);
  assert.equal(await getRanking("missing"), undefined);
  assert.equal(await getArtistCatalogPageData("missing"), undefined);
  assert.equal(await getArticlePageData("missing"), undefined);
  assert.equal(await getGalleryPageData("missing"), undefined);
  assert.equal(await getPulsePageData("missing"), undefined);
});

test("catalog page DTOs retain relationship hydration and ordering", async () => {
  const artist = await getArtistCatalogPageData("bts");
  assert.ok(artist);
  assert.deepEqual(artist.galleries, []);
  assert.deepEqual(
    artist.timeline.map((entry) => {
      switch (entry.format) {
        case "gallery":
          return `gallery:${entry.gallery.slug}`;
        case "clip":
          return `clip:${entry.clip.id}`;
        case "article":
          return `article:${entry.article.slug}`;
        case "pulse":
          return `pulse:${entry.pulse.slug}`;
        case "event":
          return `event:${entry.event.slug}`;
      }
    }),
    [
      "event:bts-arirang-los-angeles-sep-5-6",
      "event:bts-arirang-los-angeles",
      "event:bts-arirang-paris",
      "pulse:2026-07-bts-british-museum-gallery-trail",
      "pulse:2026-07-bts-london-return",
      "event:bts-arirang-london",
      "article:arirang-numbers-reading",
      "clip:clip-tv-bts-run-bts",
      "clip:clip-yt-bts-swim",
    ],
  );
  assert.deepEqual(artist.fillEmbeds.map((item) => item.id), [
    "clip-tv-bts-run-bts",
    "clip-yt-bts-swim",
  ]);
  assert.deepEqual(artist.fillGalleries, []);
  assert.equal(artist.groupProfile, undefined);
  assert.deepEqual(artist.memberProfiles, []);

  const article = await getArticlePageData("arirang-numbers-reading");
  assert.ok(article);
  assert.deepEqual(article.relatedArtists.map((item) => item.slug), ["bts"]);
  assert.deepEqual(article.relatedGalleries.map((item) => item.slug), [
    "bts-gwanghwamun-comeback",
    "bts-the-city-london",
  ]);

  const gallery = await getGalleryPageData("blackpink-incheon-airport");
  assert.ok(gallery);
  assert.deepEqual(gallery.artists.map((item) => item.slug), ["blackpink"]);

  const pulse = await getPulsePageData("2026-07-bts-london-return");
  assert.ok(pulse);
  assert.deepEqual(pulse.artists.map((item) => item.slug), ["bts"]);
});
