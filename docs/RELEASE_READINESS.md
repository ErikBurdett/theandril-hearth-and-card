# Theandril: Hearth & Card release readiness

Status: **pre-1.0**. The current [roadmap checklist](ROADMAP.md) and [interactive roadmap](https://erikburdett.github.io/theandril-hearth-and-card/updates/roadmap/) are the maintained view of completed behavior, partial systems and pending acceptance. Every item states its evidence and remaining work. The [development helper](development/README.md) explains how to keep the public site and GitHub checklist synchronized.

Current open release work: archetype tuning from the matchup matrix and long-session economy balance, real phones and supported browsers, slow-network and sustained-session performance, agreed single-player scope, and an evidenced final acceptance review. Queued trigger timing and broader tactical tutorials remain development priorities; rival personalities are delivered. Staff/market systems, free building, multiplayer and cloud/offline progression remain proposals or scope decisions, not silently accepted 1.0 obligations.

## October 29 autoplay styles and the acceptance record

A free practice duel borrows any recipe against any guest with no reward or record, autoplay pilots each recipe in the style its cards suggest, the performance report pages through the whole binder (thirteen pages of eighty paintings load in about 2.1 s unthrottled, 175 requests and 6.05 MiB, with the JS heap at 23.6 MiB and 1,527 DOM nodes at the last page), and `docs/RELEASE_ACCEPTANCE.md` records dated evidence per scope area with known issues. The matrix rerun with the style-aware autoplay confirms the spread sits in the recipes (fast Ember 10–22%, recursion 57–63% for the keeper); tuning remains open. Validation: **163 unit/content/art tests across 27 files**, **63 Chromium gameplay scenarios**, build, formatting and roadmap checks pass. Nothing has been published.

## October 29 rival voices and delivery budget

Each guest's guestbook entry now carries an original line chosen by the record and a plain explanation of their tactics and the keeper's counterplay. `scripts/performance.ts --check` records a proposed delivery budget and fails when the production build breaches it. WebKit coverage is blocked on this workstation (missing Ubuntu-built libraries). Validation: **160 unit/content/art tests across 26 files**, **62 Chromium gameplay scenarios**, build, formatting and roadmap checks pass. Reviewed [desktop guestbook](screenshots/rival-voice-1366.png) and [phone guestbook](screenshots/rival-voice-390.png). Nothing has been published.

## October 29 rival personalities and deeper combat

Twenty guests now pilot their recipes with six public personalities (aggressive, defensive, reactive, recursive, evasive, Hero-minded) that change casting priority, removal timing, held response mana, protection, counter thresholds, attack risk, blocks, gang blocks, Hero abilities and attack destinations. Combat supports per-attacker destinations, several blockers per attacker with attacker-ordered damage, Overrun spill through every blocker, and toggled block assignment. The guest who lost the previous meeting opens the next duel. Older saves keep their single-blocker declarations and the steady pilot for unrecognized duels.

Limits: personalities are heuristics over the public table, not search; they do not bluff and do not weigh every instant-speed trick. Automatic triggers still resolve directly. The 1,680-duel matrix shows an even 50% split between two steady pilots, a three-point advantage for the opening seat, personalities winning 51–82% against the steady autoplay, recursion recipes over-performing (The Thornbound Path 63%/83%) and fast Ember recipes under-performing (Cinder March Vanguard 8%/38%); archetype tuning from these spreads remains open. The performance report is browser-emulated (headless Chromium, CDP throttling, software GL): 1.08 MiB and about 2.5 s to an interactive tavern on fast 3G, 8.8 s on slow 3G, 60 fps across a 60-second autoplay duel. Playwright's Firefox build passes 51 scenarios and skips 11 for stated environment reasons (no WebGL in headless Firefox; Chromium-only drag and CDP automation); Safari/WebKit and physical devices remain unverified. Human balance, an agreed first-play budget, physical devices and owner acceptance of the proposed scope in docs/RELEASE_SCOPE.md remain open.

Validation: **159 unit/content/art tests across 26 files**, **62 Chromium gameplay scenarios**, production build, formatting, roadmap and diff checks pass. Reviewed [desktop gang block](screenshots/gang-block-1366.png) and [phone gang block](screenshots/gang-block-390.png). Nothing has been published.

## October 28 targeted protection practice

The fourth lesson, **Save a companion**, covers target choice, temporary toughness, spell order and turn-end cleanup. Choosing the other companion or passing lets the threatened companion fall; correct targeting preserves it through three damage, then clears marked damage and +3/+3 together before completion. The displayed stack identifies its targets, and board cards label incoming damage and temporary bonuses. Existing three-lesson saves retain their checkpoints and checkmarks without being granted the fourth.

The lesson uses the existing simulation commands and released cards, with no collection, currency, XP, RNG or rival reward changes. This completes the previously missing protection encounter; broader free-choice practice, first-time-player comprehension and physical devices remain unverified. The tutorial roadmap stays **In progress**. No artwork or authored card text changed, and nothing has been published.

Validation: **143 unit/content/art tests across 24 files**, **59 Chromium gameplay scenarios**, **four production-subpath checks**, production build, formatting, roadmap and diff checks pass. Both protection browser scenarios also pass the explicit documentation-image refresh. Unit cases verify the two failure paths, payment, survival, cleanup and three-lesson save continuity; the shared four-lesson replay test verifies every checkpoint and exact non-practice state conservation. Browser flows verify target labels, pending-stack reload, applied-bonus JSON export/import, no premature checkmark, readable board stats, keyboard guidance focus and a 44px action target.

Reviewed [desktop board](screenshots/practice-protection-board-1366.png), [phone board](screenshots/practice-protection-board-390.png), [desktop completion](screenshots/practice-protection-complete-1366.png) and [phone completion](screenshots/practice-protection-complete-390.png). All 1,040 existing paintings remain unchanged. This work is local and uncommitted.

## October 28 guided practice

Three replayable borrowed-card lessons now teach resource payment, counterspell responses and blocking. Actual battle commands determine payment, resolution, damage, failures and lesson completion. The separate saved checkpoint supports reload, JSON backup, replay and exit, with unique completion checkmarks and no normal duel rewards. Legacy saves receive empty practice state; active rival duels and practice positions cannot coexist. The tavern clock continues normally.

Desktop/phone review includes failure/replay, keyboard guidance focus, card-reader focus return, active-stack reload, assigned-blocker backup/import, no horizontal overflow and 44px action heights. A discovered hover-lift oscillation after replay was corrected with stationary practice action hit areas. This remains a guided three-position introduction; protection/combat tricks, broader independent decisions, human newcomer acceptance and physical-device coverage are still open. The roadmap records the tutorial milestone as **In progress**. No cards or artwork changed, and no release was published.

Validation passes **140 unit/content/art tests in 24 files**, **57 Chromium gameplay scenarios**, **four production-subpath checks**, build, formatting, roadmap and diff checks. The explicit screenshot-refresh run passes both new scenarios. Exact non-practice state conservation is tested across every successful command, replay and exit; browser checks confirm unchanged collection, deck, crowns, RNG, wins, rival history and progression. Archived save fixtures are unchanged; their assertions account for the deliberate empty practice default.

Reviewed [desktop response](screenshots/practice-response-1366.png), [phone response](screenshots/practice-response-390.png), [desktop completion](screenshots/practice-blocking-1366.png), [phone completion](screenshots/practice-blocking-390.png), [desktop board](screenshots/practice-board-1366.png) and [phone board](screenshots/practice-board-390.png). These use existing reviewed paintings; catalog coverage remains 1,040 approved cards. The changes remain local and uncommitted.

## October 27 public duel moments

The result and rival guestbook now retain up to five public exchanges with meaningful observed consequences. Combat is recorded after simultaneous damage and state-based effects; resolved spells and Hero abilities describe health, shield, table departures and devotion changes, including counters and invalid targets. Failed draws explicitly identify an empty library. New observations are saved by the existing settlement gate and survive rematches, concessions, autoplay transitions, reload and JSON export/import. Old battles/receipts receive empty moment lists without changing holdings or replaying rewards.

The recap reads no hidden hands or draw-pile identities. It is a bounded account of observed outcomes, not a full replay or strategic ranking. Passive upkeep and activation costs are not separately summarized. `rival-stories` remains **In progress** for richer dialogue and broader tactical explanation; release balance, physical-device/browser coverage, performance and scope acceptance remain open. No art or authored card text changed, and this increment is local and unpublished.

Validation: **134 unit/content/art tests across 23 files**, **55 Chromium gameplay scenarios**, **four local production-subpath scenarios**, the production build, formatting, roadmap and diff checks pass. Eight new simulation cases cover shield-aware lethal combat, simultaneous mourning draws, counters, removed targets, Hero effects/devotion, private-card independence, deterministic stack continuation, bounded history, old-save defaults, invalid saves, rejection conservation, concessions and autoplay settlement. Desktop and phone flows resolve combat through the actual control, read the recap, rematch, export/import a JSON backup and reload without duplicating the victory.

Reviewed evidence: [desktop key moments](screenshots/battle-moments-1366.png) and [phone key moments](screenshots/battle-moments-390.png). The explicit documentation-refresh run passes both scenarios. The disclosure has a 44px minimum target; the panel has no horizontal overflow and the result's final outcome can be scrolled into view. The catalog remains at 1,040 approved paintings.

## October 27 rival guestbook

A saved guestbook now records wins, losses, draws, concessions and the latest reward/recipe receipt for each of the twenty duelists. The table shows exact missing recipe copies and an ownership-gated Prepare action, and rematch selection retains the prior guest. The rematch action precedes the longer recap record, and phone battle notifications no longer stretch across the screen. Autoplay records the completed duel before advancing. Existing saves retain their totals and gain empty per-guest records; no past results or rewards are reconstructed.

Validation: **126 unit/content/art tests**, **53 Chromium gameplay scenarios in the final full run**, **four local production-subpath scenarios**, builds, formatting and roadmap checks pass. Tests verify deterministic one-time outcomes, legacy defaults, guest separation, autoplay, rejected-save validation and actual export/import/prepare controls. Reviewed [desktop](screenshots/rival-guestbook-1366.png) and [phone](screenshots/rival-guestbook-390.png) guestbook views and the [phone result](screenshots/rival-result-390.png) are retained. Art coverage remains 1,040 approved paintings with no new or changed artwork.

This completes the record-and-recipe portion of `rival-stories`. The roadmap remains **In progress** because tactical turning-point explanations and richer rivalry dialogue are not implemented. Collection, combat rules, reward values and reviewed artwork are unchanged; this is a local increment, not a 1.0 declaration or deployment.

## October 27 local release hardening

**DH-017:** Phone station controls have their own sticky strip; scrolled set headings clear it. Card inspection keeps a 44×44 close target above the reading area and restores focus to the opener after Close or Escape. Six station headings are checked at 360px, 390px and 1366px; the set history and reader are checked at 360×740 and 390×844. Active battle controls retain their compact padding.

**DH-016:** Ordinary browser runs write named screenshots to per-test `test-results/` folders. Documentation updates require the explicit `test:screenshots` command and visual review. A hash comparison across all 68 existing documentation images confirmed that an ordinary full browser run did not change any image.

Validation passes **121 unit/content/art tests**, **51 Chromium gameplay scenarios** and **four local production-subpath scenarios**, plus normal/Pages-path builds, formatting and roadmap checks. The final heading/focus regression passes again with explicit top-aligned scrolling. Art coverage remains **1,040/1,040 approved**. Desktop and phone images were inspected after explicit refresh: [desktop station](screenshots/station-hospitality-1366.png), [phone station](screenshots/station-hospitality-390.png), [scrolled set heading](screenshots/the-quiet-history-390.png), [reader](screenshots/the-quiet-reader-390.png). The first browser run exposed a battle-padding regression and lost reader focus; both were fixed before the passing full run.

These are local fixes, not a deployment or final 1.0 acceptance. The open scope, balance, real-device/browser and sustained-performance gates above remain unchanged.

## Historical feature acceptance

The table and dated verification notes below retain earlier increment results. A completed row certifies only its named behavior at that checkpoint. Current gameplay totals are **1,040 cards, 24 cultures, 28 prepared recipes and 20 visitors using 14 visual families**, including release 13, [The Quiet](THE_QUIET.md). Its 80 cards completed individual art review, rules, browser and production-path checks; broader human balance remains open. The 224-card full-set expansion has completed individual art review, rules, browser and production-path checks; its delivery evidence is tracked in [the expansion verification record](development/LIVING_CULTURES_80_VERIFICATION.md). Earlier counts below are historical, not the current catalogue or a 1.0 release announcement.

The Living Cultures increment is completed within its stated scope: 96 distinct paintings, four new sets, twelve added cultures, four collection recipes and preserved saves. [Its verification record](development/LIVING_CULTURES_VERIFICATION.md) records 108 unit/content/art tests, 41 Chromium gameplay scenarios and four production-subpath scenarios, all passing. The 288-game diagnostic completed every match but shows uneven deck performance; broader human balance remains open. The following table retains earlier scoped checkpoints.

| Requested outcome | Acceptance evidence | Status |
|---|---|---|
| Full-art card presentation | Whole paintings contained in art areas, no crossing inner arches; binder, packs, inspection, hands, battlefield and hover preview | Complete |
| Direct battle interaction | Reversible spell/Hero targeting, drag or click then Confirm; floating animated actions; direct combat and shared simulation legality | Complete |
| Autoplay and takeover | Table arrival, deterministic public-state pilot, save/stack continuity, one-time rewards, draggable desktop/mobile watch window and takeover/resume | Complete |
| Motion and editions | Reduced-motion support, tavern/card/pack feedback, 5% Illuminated frames, finish ownership and save/sale validation | Complete |
| Laptop battle layout | 1366×768 crowded rows fit without board scrolling; resources beneath companions; enlarged hover preview and fallen-card inspector | Complete |
| Prepared decks and guest variety | Twelve recipes with ownership locks, fourteen visually distinct guests, phase-aware dialogue; UI unlock and content tests | Complete |
| Faster duel format and wording | New duels start at 20 health; nine combat skills and Hero devotion; existing saved health retained | Complete |
| Complete custom set artwork | 640 distinct sources and decoded images; 80 exact-hash approvals in each of eight sets; zero missing, stale or shared entries | Complete |
| Bulk booster opening and duplicate crafting | Eight-set seeded equivalence, inventory/finish conservation, 5-to-1 crafting, saved receipt, desktop/mobile haul actions | Complete |
| Automatic tavern hours and day/night | Dawn/night boundaries, manual override, reload and real browser clock checks | Complete |
| Skills, meals, brewing and visible growth | Six skills, six upgrades (three equipment refits), twelve ingredients, fifteen recipes; transactional tests, overnight output, meal sales, exact-reviewed expansion art and desktop/mobile flow | Complete |
| Twelve-culture lore integration | Source snapshot, faction/card references, eight era notes, 32 marginal notes, desktop/mobile reading | Complete |
| Connected expansions and camera | Reviewed stair plates, preserved saved routes, pan/zoom/reset, transformed click and mobile browser checks | Complete |
| Saved deck loadouts | Twelve named recipes; save/update/load/delete; ownership rechecked; reload/import and rejection conservation tested | Complete |
| Guided first-day progression | Four journal chapters with once-only crown rewards; readiness, persistence and repeat-claim rejection tested | Complete |
| Playable shop/battle loop | Twenty Chromium scenarios cover checkout, deliveries, packs, collection, decks, mana, stack, Heroes, drag-to-play and clock | Verified playable slice |
| Walnut and parchment UI | Two generated, factory-reviewed material textures; desktop/mobile workshop, binder and crowded-table screenshots | Complete |
| Artisan progression and recipe shopping | Fourth endless mission branch; completed-batch counters, exact missing-ingredient purchases, filters and save migration | Complete |
| 1.0 balance and usability | Human playtests, physical-device coverage, image-delivery profiling and long-term shop progression | Pending |

Final verification: **91 unit/content/art tests**, **33 Chromium gameplay scenarios**, production build and formatting check pass. The browser suite visits every set and loads all 640 card images. The exact coverage record is [card-art-coverage.json](reports/card-art-coverage.json).

Built-in image generation supplied one retained composition per card. Exact prompts and lore-linked briefs are in `assets/art/card-briefs/`; originals in `assets/art/source/cards/`; reviewed game exports in `public/art/cards/`. Five forager images were replaced after subject review; rejected originals and review evidence remain available. No new Aseprite or Pixel Snapper run is claimed.

Reviewed integration evidence in `docs/screenshots/` includes the full-art reader on desktop/phone, card binder, set history shelf, pack opening, battle table, named deck shelf and keeper journal. Existing saves gain empty deck-book and claimed-journal fields without losing cards, crowns, stock or battle progress.

Before labeling this 1.0: tune uneven deck matchups and repetitive effect patterns, test long sessions and physical touch devices, profile image delivery on slower connections, and define the release scope for shop upgrades/product depth and progression. Other current simplifications remain documented in `IMPLEMENTATION_STATUS.md` and `CARD_RULES.md`.

This increment appends 64 paintings while retaining the earlier 576 reviewed sources. The new diagnostic completed all 360 games (twelve matchups, 30 seeds each), averaging 16.8 alternating turns; uneven matchups and the simple pilot remain limits. See `reports/balance.json`.

Hospitality progression is now playable. Remaining 1.0 work includes long-session economy tuning, staff/market scope decisions and physical touch testing. The current clock advances only while the browser is visible; no offline progress is claimed. Expansion stages retain the illustrated room renderer.

Contribution and deployment tooling are ready for the pre-1.0 demo; the separately licensed content and future commerce boundary are documented in ASSET_LICENSE.md and HOSTING.md. The optimized deployment is approximately 26 MiB.


### Demo retention and guest challenges

This increment adds recoverable local checkpoints and stale-tab detection, six victory-earned challenge recipes (18 total lists), six additional named visitors (20 total, 14 reviewed visual families), persistent notices and phone station dialogs. Current saves are preserved. New automated evidence covers local recovery, unavailable storage/export, competing tabs, unlock/reload/ownership rules and 360px station navigation. These changes do not add cloud saves or new NPC paintings.

Validation for this increment: **91 unit/content/art tests**, **33 Chromium gameplay scenarios**, production build and formatting pass. All **540** diagnostic games completed across eighteen sampled matchups, averaging **17.1 alternating turns**; the simple pilot and uneven matchups remain balance limitations. Reviewed phone evidence: `screenshots/mobile-station-menu.png`, `screenshots/mobile-notices.png`, and `screenshots/expansion-combat-mobile.png`.
