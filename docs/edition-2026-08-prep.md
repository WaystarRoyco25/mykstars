# August 2026 edition prep

One working file for the next edition: current status, carried-over re-checks, the research
calendar, the publication gate, and the four staged Analysis drafts. It merges the former
`edition-2026-08-readiness.md` and `edition-2026-08-analysis-drafts.md` (2026-07-18).

## Status (2026-07-18)

- The repository clock (`NOW` in `src/content/now.ts`) is `2026-07-18T20:00:00+09:00`. The
  July 2026 edition is published (`src/content/editions/2026-07.ts`) and rendering the home
  page.
- All 40 profiles are verified and published, every one with a permitted hero; the
  `MediaAsset` registry holds 43 licensed images.
- `src/content/pulses/2026-08.ts` exists. August Pulse entries and the generated August
  edition stay empty until real August facts and a real publication timestamp exist; nothing
  gets backdated or pre-dated.

### The July 14 preparation pass (recorded; media counts since overtaken)

- Verified all 21 then-existing profiles; all remained active.
- Added the 19 owner-approved profiles with real July 14 verification dates.
- Added 15 official YouTube embed heroes and four CC BY image heroes (photography has since
  reached all 40 profiles).
- Corrected the NewJeans member-count claim and removed IVE's stale brand-ranking claim.
- Replaced TWICE's expired evergreen music clip and Park Chan-wook's aging On air clip; added
  current official music clips for the ten new music profiles.
- Added qualifying On air interviews for Roh Yoon-seo, Nam Joo-hyuk, Lee Chae-min,
  Choo Young-woo, Kim Min-ha, Kim Seon-ho and Ahn Hyo-seop.
- Resolved the TWICE finale, SEVENTEEN *V8* and Jung Ho-yeon Louis Vuitton forecasts without
  changing their slugs or vote option IDs.
- Corrected event venues, tour labels and sources, and split every discontinuous date range
  into truthful contiguous runs.

## Carried-over re-checks (next refresh)

- **Lee Min-ho:** no qualifying in-window On air appearance at the last pass; re-check.
- **NewJeans:** sits under the red-flag rule (confirmed facts only); re-check clip
  eligibility.
- **Park Ji-hu and Han So-hee:** deliberate On air gaps, since no qualifying clips stay fresh
  through August; re-check.
- **Bong Joon-ho:** On air entry removed because the only fresh upload was explicitly
  archival 2019 footage; re-check.
- **Feed rhythm:** the 2026-07-16 Pulse photo additions are all landscape group shots;
  consider sourcing portrait-orientation photos to vary the mix.
- **Parked home-page ideas** from the retired roadmap (parked, not decided against): a
  forecast payoff loop ("Called it": surface recently resolved predictions beside the open
  ones; `PredictionCard` already renders the resolved state, add a `getResolvedPredictions()`
  mirror; it needs a steady drip of resolved questions, and only one was resolved when this
  was parked) and a rankings-movers strip (ranking rows already carry `change` / `isNew`;
  keep `RankingTable.tsx` for the full view and add a small movers component).

## Confirmed August checkpoints

These are research anchors. Each Pulse can publish only after the underlying August fact
occurs and a dated source confirms it.

1. August 1: CORTIS at Lollapalooza Chicago.
2. August 1 and 2: Stray Kids close the Seoul RUN IT run at KSPO Dome.
3. August 4: TWS releases *SODA SODA*, subject to same-day official confirmation.
4. August 7: the Stray Kids *THIS & THAT* Billboard forecast closes, with resolution after the official chart lands.
5. August 9: the IVE perfect all-kill forecast window closes.
6. August 11: aespa plays Taipei Dome.
7. August 14: KATSEYE releases *WILD*, subject to same-day official confirmation.
8. August 25: MAMAMOO plays Crypto.com Arena in Los Angeles.
9. August 29 and 30: Stray Kids plays MUFG Stadium in Tokyo.
10. August 29: the first Billboard 200 checkpoint for KATSEYE's *WILD* Analysis thesis.
11. August 31: the announced window for IU's album and the close of the related forecast. Publish only what EDAM and the release record confirm.
12. August 31: the Hearts2Hearts Circle Chart forecast window closes.

The final Pulse run needs roughly 20 to 27 real entries, with at least 18 eligible entries
for the generator. The checkpoints above provide a starting calendar, but they do not supply
completed Pulse facts. The final run still needs at least eight additional real August
developments and dated public sources.

## Final publication gate

Before generation, obtain the intended August publication date from the owner. Then:

1. Set `NOW` to `<actual-date>T20:00:00+09:00`.
2. Reverify every touched profile and update `lastVerified` to the real pass date.
3. Add at least four final Analysis records to `src/content/articles.ts` with the actual publication date.
4. Create 20 to 27 genuine August Pulse entries, at least 18 generator-eligible.
5. Bump every prediction and ranking `asOf` value.
6. Resolve or preserve closed-awaiting forecasts from dated sources, then keep 8 to 16 strong open questions.
7. Rebuild ranking names and order from the current month's real charts.
8. Calculate the 180-day clip boundary against final `NOW`, then replace or remove every newly stale entry.
9. Re-pick the On air rail from the final date's current official appearances.
10. Run `npm run gen:edition -- 2026-08 <publishedAt>` and fix inventory if the generator refuses.
11. Run the full validation suite, build and browser QA before staging explicit paths.

The generated edition, final `NOW` bump, Pulse inventory, commit, push and draft pull request
must wait for these facts.

## Analysis drafts

Research cutoff: July 14, 2026. These four pieces are ready for a final fact pass and transfer to `src/content/articles.ts` once the owner supplies the real August publication date. Their `Article.date` fields stay unset here so the site does not publish a fabricated or backdated timestamp.

The slate covers two artists, one company and one industry subject. ATEEZ and Korean theatrical distribution take bearish positions. KATSEYE and JYP Entertainment take bullish positions. JYP and the theatrical market are the two flagship-length pieces.

Cadence assignment (playbook rule 15), fixed before drafting so the four do not converge:
ATEEZ seats its steelman concession-first, KATSEYE embeds it in the evidence paragraph, JYP
lets the closing threshold answer it, and the theatrical piece gives it its own paragraph.
None of them name the machinery: no "the strongest counterargument", no "the checkpoint", no
"the bullish call" (house-style Rule 5). `check:style` fails the build on all three phrasings,
so a transfer that reintroduces them will not ship.

### ATEEZ has mastered the No. 1 debut. The next test is listening

- Slug: `ateez-number-one-listening-test`
- Dek: *GOLDEN HOUR : Part.5* opened with 223,000 traditional sales and 5,000 streaming units. The split makes ATEEZ's third chart-topper a conversion test.
- Status: `analysis`
- Pillar: `k-pop`
- Author: `MyKStars`
- Related artist: `ateez`
- Side: bearish
- Steelman: concession-first

Thirty CD editions, five vinyl editions, signed versions, and a fan base that buys all of them: ATEEZ has built the most dependable launch platform in K-pop, and nine Billboard 200 top 10 releases since 2022 say the demand repeats on schedule. That is a real asset. It is also the reason the group's US ceiling is now a question about the weeks nobody preorders.

*GOLDEN HOUR : Part.5* gave ATEEZ its third Billboard 200 No. 1 with 228,000 album-equivalent units on the chart dated July 11. Billboard's figures, reported by *Billboard Japan* on July 6, divide that opening into 223,000 traditional album sales and 5,000 streaming-equivalent units from 4.96 million on-demand streams. Traditional sales supplied 97.8 percent of the total, career highs for both units and album sales.

Streaming-equivalent units supplied 2.2 percent of opening consumption, which leaves the record thin on support once the first physical-sales wave clears. A No. 1 debut establishes purchasing power. A long run would establish a listening habit, and only one of those two keeps an album on the chart in month three.

The Billboard 200 dated September 12 is the EP's tenth chart week. A top 100 rank there says the listening followed the buying. Below No. 100, or gone before it, says the collector base did all the work.

Sources:

- [ATEEZ official discography, June 26, 2026](https://ateez-official.jp/musics/20862)
- [*Billboard Japan*, July 6, 2026](https://www.billboard-japan.com/d_news/detail/163156/2)

### KATSEYE can turn *WILD* into a catalogue win

- Slug: `katseye-wild-catalogue-win`
- Dek: *BEAUTIFUL CHAOS* paired a No. 4 debut with months of chart life. The August 14 follow-up has the reach to raise both the opening and the hold.
- Status: `analysis`
- Pillar: `k-pop`
- Author: `MyKStars`
- Related artist: `katseye`
- Side: bullish
- Steelman: embedded in the evidence paragraph

KATSEYE's last EP proved the harder half. *BEAUTIFUL CHAOS* debuted at No. 4 on the Billboard 200 with 44,000 album-equivalent units, and it was still charting nineteen weeks later, which is the stretch most new groups never reach.

The opening split is why it lasted. Billboard's release-week figures, reported by *Billboard Brasil* on July 6, 2025, divide that total into 30,000 album sales and 14,000 streaming-equivalent units from 21.36 million on-demand streams. Streaming supplied 31.8 percent of the opening, and *Billboard Japan* recorded the EP at No. 43 in its nineteenth chart week on the Billboard 200 dated November 15, 2025. KATSEYE has already shown that its audience keeps listening after the first purchase.

The campaign around *WILD* is a different size. Universal Music Japan's April 16 announcement lists two Grammy nominations, three 2026 American Music Award nominations, a Coachella debut and a sold-out first tour, with confirmed festival dates at Head In The Clouds and Governors Ball carried into the new era. Awards and festival visibility expand recognition faster than paid consumption ever does, which is exactly why they prove less than they appear to: the predecessor's 44,000 units remain the commercial baseline, and attention has to convert twice, at release and through the weeks after it.

Two numbers decide it: *WILD* opening with 60,000 units or more and a top-three rank on the Billboard 200 dated August 29, then holding inside the top 50 in week four on September 19.

Sources:

- [Universal Music Japan, April 16, 2026](https://www.universal-music.co.jp/katseye/news/2026-04-16/)
- [*Billboard Brasil*, July 6, 2025](https://billboard.com.br/katseye-conquista-entre-albuns-populares-estados-unidos/)
- [*Billboard Japan*, chart dated November 15, 2025](https://www.billboard-japan.com/charts/detail?a=ubillboard200&day=15&month=11&year=2025)

### JYP's tour shops are becoming a second release calendar

- Slug: `jyp-tour-shop-release-calendar`
- Dek: Q1 revenue rose 32.1 percent without a major artist album. Merchandise and concerts supplied KRW 101.5 billion, giving JYP a growth engine between comebacks.
- Status: `analysis`
- Pillar: `k-pop`
- Author: `MyKStars`
- Related artists: `twice`, `stray-kids`, `nmixx`
- Side: bullish
- Weight: flagship
- Steelman: answered by the closing threshold

A quarter with no major-artist album should have been a soft one for JYP Entertainment. Consolidated revenue rose 32.1 percent instead, and the May 15 FY26 Q1 Earnings Note describes touring commerce carrying the release calendar in its place. Operating profit rose 70.0 percent to KRW 33.4 billion on KRW 186.0 billion of revenue, producing a 17.9 percent operating margin.

Merchandise and concerts supplied the center of that growth. Merchandise revenue reached KRW 60.6 billion, up 85.2 percent, while concert revenue reached KRW 40.9 billion, up 88.7 percent. Together they accounted for KRW 101.5 billion, or 54.6 percent of consolidated revenue.

The company is building a repeatable format around those fans. Blue Garage, JYP's merchandise operation, raised revenue 180.5 percent to KRW 40.9 billion and posted an 11.1 percent operating margin. JYP's investor presentation maps TWICE-linked popups across 21 cities: five during late 2025, seven in Q1 and nine planned for Q2. Each stop extends a tour market beyond the venue night and gives the company a local sales window between album releases.

This model turns touring into a second release calendar. A comeback concentrates demand into one week. A chain of city shops distributes product drops across months, attaches merchandise to a live event and lets the same intellectual property earn again in each market. The Q1 figures show that fans will follow that cadence even when the recorded-music slate is light.

The concentration is substantial and it is the whole risk. TWICE and Stray Kids remain the main commercial engines, and JYP's November 14, 2025 FY25 Q3 Earnings Note recorded a 20.5 percent fall in merchandise revenue to KRW 40.0 billion in a quarter without large project sales, with Blue Garage's cumulative operating margin then near 9 percent. Popups depend on tour timing, available product and the schedules of a small number of acts.

JYP's FY26 Q3 Earnings Note, expected by November 16, is where that objection gets settled, because the Q2 popup slate lands inside it. Quarterly merchandise revenue of KRW 50 billion, a Blue Garage cumulative operating margin of 10 percent and a consolidated operating margin of 17 percent: hit those and the model repeats. Miss two of the three and the current result was timing.

Sources:

- [JYP FY26 Q1 Earnings Note, May 15, 2026](https://www.jype.com/Board/Detail?gubun=irdata&jbst_sq=6985)
- [JYP FY25 Q3 Earnings Note, November 14, 2025](https://www.jype.com/Board/Detail?gubun=irdata&jbst_sq=1&media_author_id=79631395786&media_id=3818983333057983988_79631395786)

### Korean cinema's record quarter belongs to one distributor

- Slug: `korean-cinema-distributor-concentration`
- Dek: Admissions reached a post-2020 Q1 high, while Showbox captured 55.4 percent of box-office revenue. May kept the same concentration risk in view.
- Status: `analysis`
- Pillar: `k-movie`
- Author: `MyKStars`
- Side: bearish
- Weight: flagship
- Steelman: its own paragraph, entered without an announcement

Korean theatrical demand entered 2026 from a weak base. The Korean Film Council's February 27 annual report put 2025 box-office revenue at KRW 1.047 trillion and admissions at 106.09 million. Revenue fell 12.4 percent from 2024, while admissions fell 13.8 percent.

The first quarter produced a real rebound. KOFIC's April 29 report recorded KRW 318.0 billion in revenue and 31.9 million admissions, the strongest first-quarter results since 2020. Korean films captured 73.4 percent of revenue. Those figures show that audiences returned when the slate offered a large event film.

Distribution breadth stayed narrow. Three Showbox releases generated KRW 176.3 billion, equal to 55.4 percent of all first-quarter box-office revenue. Disney Korea ranked second with KRW 43.1 billion and a 13.6 percent share. One distributor therefore collected more revenue than the next several competitors combined.

*The King's Warden* became Korea's all-time box-office revenue leader, which gives the recovery genuine force. One exceptional title can also mask the depth of the slate behind it, and a healthy market needs several distributors turning several films into national events.

KOFIC's June 22 May report kept the compression in view. Monthly revenue reached KRW 112.6 billion, while four Showbox titles generated KRW 49.2 billion and a 43.7 percent distributor share. Audience demand held up. The title and distributor base did not widen.

KOBIS results through August 31 settle it. Showbox's year-to-date revenue share falling below 35 percent, with three or more Korean films released after April 1 by other distributors each crossing three million admissions, and the recovery belongs to the market rather than to one company.

Sources:

- [KOFIC 2025 annual results, February 27, 2026](https://www.kofic.or.kr/kofic/business/board/selectBoardDetail.do?boardNumber=181&boardSeqNumber=71604)
- [KOFIC Q1 2026 results, April 29, 2026](https://www.kofic.or.kr/kofic/business/board/selectBoardDetail.do?boardNumber=181&boardSeqNumber=72700)
- [KOFIC industry reports, including the May report dated June 22](https://www.kofic.or.kr/kofic/business/board/selectBoardList.do?boardNumber=2)
- [KOBIS live period box office](https://www.kobis.or.kr/kobis/business/stat/boxs/findPeriodBoxOfficeList.do)
