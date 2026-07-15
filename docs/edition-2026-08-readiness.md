# August 2026 edition readiness

Status date: July 14, 2026.

This branch is in the truthful preparatory state required by the timing gate. The repository clock remains July 5. August Pulse entries and the generated edition remain empty because no completed August facts or real August publication timestamp exist yet.

## Completed preparation

- Verified all 21 existing profiles. All remain active.
- Added the 19 owner-approved profiles with real July 14 verification dates.
- Added 15 official YouTube embed heroes and four CC BY image heroes.
- Uploaded all four licensed originals to the public `media` bucket and confirmed every public URL returns HTTP 200.
- Recorded the Commons source, attribution, acquisition date, review date, dimensions, checksum and Storage path for every image.
- Corrected the NewJeans member-count claim and removed IVE's stale brand-ranking claim.
- Replaced TWICE's expired evergreen music clip and Park Chan-wook's aging On air clip.
- Added current official music clips for the ten new music profiles.
- Added qualifying On air interviews for Roh Yoon-seo, Nam Joo-hyuk, Lee Chae-min, Choo Young-woo, Kim Min-ha, Kim Seon-ho and Ahn Hyo-seop.
- Left honest On air gaps for Park Ji-hu and Han So-hee. No qualifying clips stay fresh through August.
- Removed Bong Joon-ho's aging On air entry. The only fresh upload found was explicitly archival footage from 2019.
- Resolved the TWICE finale, SEVENTEEN *V8* and Jung Ho-yeon Louis Vuitton forecasts without changing their slugs or vote option IDs.
- Corrected event venues, tour labels and sources, and split every discontinuous date range into truthful contiguous runs.
- Drafted four Analysis pieces with mixed scope and direction in `docs/edition-2026-08-analysis-drafts.md`.

## Confirmed August checkpoints

These are research anchors. Each Pulse can publish only after the underlying August fact occurs and a dated source confirms it.

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

The final Pulse run needs roughly 20 to 27 real entries, with at least 18 eligible entries for the generator. The checkpoints above provide a starting calendar, but they do not supply completed Pulse facts. The final run still needs at least eight additional real August developments and dated public sources.

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

The generated edition, final `NOW` bump, Pulse inventory, commit, push and draft pull request must wait for these facts.
