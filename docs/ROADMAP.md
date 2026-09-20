# Hearth & Card development roadmap

[Open the interactive roadmap](https://erikburdett.github.io/theandril-hearth-and-card/updates/roadmap/) · [Development helper](https://erikburdett.github.io/theandril-hearth-and-card/updates/)

Reviewed 2026-09-19; gameplay baseline [841cd94](https://github.com/ErikBurdett/theandril-hearth-and-card/commit/841cd943c49ea136479fa8bc9f45411322c54c62). Pre-1.0, single player.

Generated from `src/development/roadmap.ts` with `npm run roadmap:build`. Edit that source, not this document.

**Completed** = the named behavior is implemented within its stated limits. **In progress** = a working part exists and the listed acceptance remains open; this is not a claim someone is actively working on it today. **Pending** = not implemented or not yet verified. Checkmarks count scoped checkpoints, not a release percentage or promised schedule.

## 01 · Next development priorities

Build on the working duel and tavern. The order below is the proposed sequence; there are no promised dates.

- [ ] **In progress — Finish the deeper duel rules** (battle-rules)
  - Current: Saved assisted/Full control priority, consecutive passes, payment previews, cleanup choices and drawn results are implemented. Combat still shares one attack destination and supports one blocker per attacker; some triggers resolve directly.
  - Acceptance still needed: Define and implement separate attacker destinations, multiple blockers and their damage order, and queued trigger timing. Preserve each decision through save/reload and verify both sides use the same rules.
  - Evidence: [src/sim/battle.ts](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/src/sim/battle.ts), [src/sim/battle.test.ts](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/src/sim/battle.test.ts), [docs/BATTLE_POLISH_PROPOSAL.md](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/docs/BATTLE_POLISH_PROPOSAL.md)

- [ ] **In progress — Give rivals distinct tactical decisions** (rival-decisions)
  - Current: Enemy responses and autoplay share legal public-information evaluation, and attacks avoid some losing trades. The roster still shares a simple pilot rather than individual strategic personalities.
  - Acceptance still needed: Add aggressive, defensive, reactive, recursive, evasive and Hero-focused profiles. Prove removal timing, defensive resource planning, protection, lethal attacks and useful blocks in scenario tests without reading hidden cards.
  - Evidence: [src/sim/battle.ts](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/src/sim/battle.ts), [src/sim/autoplay.ts](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/src/sim/autoplay.ts), [docs/BATTLE_POLISH_PROPOSAL.md](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/docs/BATTLE_POLISH_PROPOSAL.md)

- [ ] **Pending — Teach casting, responses and blocking** (duel-tutorials)
  - Current: First Chapters introduces a pack, a deck, a sale and a win. Authored tactical practice encounters are not implemented.
  - Acceptance still needed: Build replayable guided encounters for resource planning, instant responses, protection and blocking. Observe new players finishing these actions without coaching.
  - Evidence: [src/ui/KeeperJourney.tsx](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/src/ui/KeeperJourney.tsx), [docs/BATTLE_POLISH_PROPOSAL.md](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/docs/BATTLE_POLISH_PROPOSAL.md)

- [ ] **Pending — Make rematches tell a story** (rival-stories)
  - Current: Twenty named visitors include six first-victory recipe challenges. Persistent rival histories and explained turning points are not yet available.
  - Acceptance still needed: Save rematch history, show rewards and missing recipe copies together, and explain a visible turning point without exposing the opponent's hidden hand.
  - Evidence: [src/content/tavern.ts](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/src/content/tavern.ts), [src/sim/guest-recipes.test.ts](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/src/sim/guest-recipes.test.ts), [docs/BATTLE_POLISH_PROPOSAL.md](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/docs/BATTLE_POLISH_PROPOSAL.md)

- [ ] **In progress — Finish battle feedback and tavern atmosphere** (atmosphere)
  - Current: Card motion, public-event highlights, reduced motion and optional synthesized card/hearth sounds exist. A composed tavern soundscape and broader authored action animation remain open.
  - Acceptance still needed: Make payment, response, impact and outcome sequences legible; add reviewed ambience and sound controls. Fast/reduced motion and muted audio must preserve identical game outcomes.
  - Evidence: [src/ui/BattlePresentation.tsx](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/src/ui/BattlePresentation.tsx), [src/ui/motion-table.css](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/src/ui/motion-table.css), [docs/BATTLE_POLISH_PROPOSAL.md](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/docs/BATTLE_POLISH_PROPOSAL.md)

## 02 · Playable foundation

Checked items describe specific behavior available in the demo. They do not certify the whole game for 1.0.

- [ ] **In progress — Add The Quiet, a thirteenth 80-card volume** (the-quiet)
  - Current: Release 13 adds 80 Ember/Grove cards for RR 2311–2313 (Book chapter VII), each with an individually reviewed painting, plus two ordinary-card recipes and empty-shelf save migration: 13 sets, 1,040 cards and 28 prepared recipes. Every card's text passes a cached TypeSafe gate for lore boundaries, paintability and name confusion.
  - Acceptance still needed: Delivered: 80 individually reviewed paintings, cached text judgments, two collectable recipes and empty-shelf migration pass the rules, browser and production-path checks; the provenance archive is published as art-the-quiet-v1. Remaining: verify the Pages deployment of the merged revision. Human balance remains a separate release gate.
  - Evidence: [docs/THE_QUIET.md](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/main/docs/THE_QUIET.md), [src/content/the-quiet.ts](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/main/src/content/the-quiet.ts), [src/sim/the-quiet.test.ts](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/main/src/sim/the-quiet.test.ts), [scripts/card-judgments.ts](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/main/scripts/card-judgments.ts), [assets/art/judgments/the-quiet.json](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/main/assets/art/judgments/the-quiet.json), [docs/reports/the-quiet-balance.json](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/main/docs/reports/the-quiet-balance.json)

- [x] **Completed — Expand the Living Cultures to four complete 80-card sets** (living-cultures-full-sets)
  - Current: 224 additional cards and four ordinary-card recipes complete the four 80-card Living Cultures sets. All 960 paintings are individually reviewed and optimized. Every set has 33 common, 26 uncommon, 16 rare and five mythic cards.
  - Completion boundary: Delivered: the original 736 definitions, twenty-two recipes and saved receipts are preserved; 960 distinct paintings pass exact review; all 45 gameplay scenarios and four production-path checks pass. Broader human balance remains a separate release gate.
  - Evidence: [src/content/living-expansion.ts](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/53f750128d742a6edcf462fbf7441b81a9925e95/src/content/living-expansion.ts), [src/sim/full-living-sets.test.ts](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/53f750128d742a6edcf462fbf7441b81a9925e95/src/sim/full-living-sets.test.ts), [scripts/living-cultures-balance.ts](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/53f750128d742a6edcf462fbf7441b81a9925e95/scripts/living-cultures-balance.ts), [docs/development/LIVING_CULTURES_80_VERIFICATION.md](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/53f750128d742a6edcf462fbf7441b81a9925e95/docs/development/LIVING_CULTURES_80_VERIFICATION.md), [assets/art/reviews/living-cultures-80-review.json](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/53f750128d742a6edcf462fbf7441b81a9925e95/assets/art/reviews/living-cultures-80-review.json)

- [x] **Completed — Bring all twenty-four cultures to the card table** (living-cultures)
  - Current: Twelve additional cultures have six authored cards each in four 24-card folios, with individual paintings, four collection recipes and empty-shelf save migration. The original 640 card definitions and eighteen recipes are preserved.
  - Completion boundary: Delivered: all twelve added cultures, 96 exact-reviewed paintings, collection recipes, pack orders and old-save continuation pass rules, desktop/mobile and production-path checks. Long-term human balance remains a separate release gate.
  - Evidence: [docs/LIVING_CULTURES.md](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/b039bd3018bddcf4efd9ad4f6d0723ef38992515/docs/LIVING_CULTURES.md), [src/content/living-cultures.ts](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/b039bd3018bddcf4efd9ad4f6d0723ef38992515/src/content/living-cultures.ts), [src/sim/living-cultures.test.ts](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/b039bd3018bddcf4efd9ad4f6d0723ef38992515/src/sim/living-cultures.test.ts), [tests/browser/living-cultures.spec.ts](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/b039bd3018bddcf4efd9ad4f6d0723ef38992515/tests/browser/living-cultures.spec.ts), [docs/development/LIVING_CULTURES_VERIFICATION.md](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/b039bd3018bddcf4efd9ad4f6d0723ef38992515/docs/development/LIVING_CULTURES_VERIFICATION.md)

- [x] **Completed — Run the card shop** (shop-loop)
  - Current: Order wholesale stock, set pack prices, fill shelves and serve browsing visitors at checkout. Transactions earn crowns and renown; orders arrive after three open-shop bells.
  - Completion boundary: Delivered: paid orders, capacity checks, delivery, checkout and saved inventory follow authoritative simulation commands.
  - Evidence: [src/sim/game.ts](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/src/sim/game.ts), [src/sim/game.test.ts](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/src/sim/game.test.ts), [tests/browser/game.spec.ts](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/tests/browser/game.spec.ts)

- [x] **Completed — Open packs, collect and bind special editions** (collecting)
  - Current: Twelve 80-card sets contain 960 cards: eight historical expansions and four Living Cultures sets. Fourteen-card packs include a rare-or-mythic slot and a foil; bulk opening, haul receipts, spare sales and five-copy Illuminated crafting are playable.
  - Completion boundary: Delivered: seeded single/bulk equivalence, holdings conservation and saved receipts. Illuminated is a frame treatment, not a second illustration.
  - Evidence: [src/content/catalog.ts](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/53f750128d742a6edcf462fbf7441b81a9925e95/src/content/catalog.ts), [src/ui/BulkOpening.tsx](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/53f750128d742a6edcf462fbf7441b81a9925e95/src/ui/BulkOpening.tsx), [src/sim/game.test.ts](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/53f750128d742a6edcf462fbf7441b81a9925e95/src/sim/game.test.ts)

- [x] **Completed — Illustrate the complete card catalogue** (card-art)
  - Current: All 960 cards have individual reviewed 256×384 full-art exports, displayed as whole paintings in the binder, packs and duel.
  - Completion boundary: Delivered: distinct source/pixel hashes and exact approvals in the retained coverage report. Individual artwork does not mean every card has a unique mechanic or certified balance.
  - Evidence: [docs/reports/card-art-coverage.json](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/53f750128d742a6edcf462fbf7441b81a9925e95/docs/reports/card-art-coverage.json), [tests/card-art.test.ts](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/53f750128d742a6edcf462fbf7441b81a9925e95/tests/card-art.test.ts), [src/ui/CardView.tsx](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/53f750128d742a6edcf462fbf7441b81a9925e95/src/ui/CardView.tsx)

- [x] **Completed — Build decks and earn guest recipes** (deck-shelf)
  - Current: Construct 100-card decks, keep twelve named deck books and discover twenty-six prepared recipes. Six of twenty visitors teach a recipe on first victory; ownership still gates preparation.
  - Completion boundary: Delivered: deck validation, ownership checks, saved books and once-only challenge unlocks. Twenty visitors share fourteen reviewed visual families.
  - Evidence: [src/ui/DeckShelf.tsx](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/53f750128d742a6edcf462fbf7441b81a9925e95/src/ui/DeckShelf.tsx), [src/sim/guest-recipes.test.ts](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/53f750128d742a6edcf462fbf7441b81a9925e95/src/sim/guest-recipes.test.ts), [src/content/tavern.ts](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/53f750128d742a6edcf462fbf7441b81a9925e95/src/content/tavern.ts)

- [x] **Completed — Play a complete single-player duel** (duel-foundation)
  - Current: Colored resources, a spell stack, creatures, Heroes, attacks, blocks, a pausable decision clock and friendly AI form a playable 20-health duel. Confirmed targets and payment previews support deliberate casting.
  - Completion boundary: Delivered: supported rules and battle decisions round-trip through saves. Remaining combat and trigger simplifications are tracked separately above.
  - Evidence: [docs/CARD_RULES.md](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/docs/CARD_RULES.md), [src/sim/battle.test.ts](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/src/sim/battle.test.ts), [tests/browser/battle-experience.spec.ts](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/tests/browser/battle-experience.spec.ts)

- [x] **Completed — Watch a duel and take over** (autoplay)
  - Current: Erilian can autoplay at the tavern table while a movable watch window shows the battle. Take control or resume autoplay during the same duel.
  - Completion boundary: Delivered: legal decisions, save/stack continuity and once-only duel rewards. Autoplay is the current simple pilot, not an expert balance judge.
  - Evidence: [src/sim/autoplay.ts](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/src/sim/autoplay.ts), [src/sim/autoplay.test.ts](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/src/sim/autoplay.test.ts), [src/ui/AutoBattle.tsx](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/src/ui/AutoBattle.tsx)

- [x] **Completed — Expand the tavern, cook and brew** (hospitality)
  - Current: Unlock illustrated dining/bar wings and equipment, buy twelve ingredients, prepare fifteen recipes and learn six skills. Brewing advances overnight in the visible browser; guests buy completed servings.
  - Completion boundary: Delivered: upgrades, reserved capacity, production and serving transactions persist. The 38-bell day and 10-bell night support automatic hours; no offline progress is implemented.
  - Evidence: [src/content/hospitality.ts](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/src/content/hospitality.ts), [src/sim/hospitality.test.ts](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/src/sim/hospitality.test.ts), [tests/browser/hospitality.spec.ts](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/tests/browser/hospitality.spec.ts)

- [x] **Completed — Follow the keeper's chapters and missions** (keeper-progression)
  - Current: Four introductory chapters pay once-only rewards. Keeper XP, repeatable mission branches and artisan batch goals provide ongoing objectives.
  - Completion boundary: Delivered: progress follows completed simulation events; rewards and claimed chapters survive reload without duplicate payouts.
  - Evidence: [src/content/milestones.ts](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/src/content/milestones.ts), [src/sim/progression.test.ts](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/src/sim/progression.test.ts), [tests/browser/progression.spec.ts](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/tests/browser/progression.spec.ts)

- [x] **Completed — Protect the local ledger** (local-saves)
  - Current: Immediate transaction saves, periodic movement checkpoints, a previous-save recovery copy, stale-tab detection and JSON import/export protect browser progress.
  - Completion boundary: Delivered: recovery, blocked storage/export and competing-tab scenarios. Browser saves are local to this site and device, with no cloud synchronization or adversarial inventory protection.
  - Evidence: [src/sim/local-save.test.ts](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/src/sim/local-save.test.ts), [tests/browser/release-demo.spec.ts](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/tests/browser/release-demo.spec.ts), [src/ui/App.tsx](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/src/ui/App.tsx)

- [x] **Completed — Use the tavern on desktop and phone** (navigation)
  - Current: Pan/zoom the illustrated room, walk connected stairs, open stations from the dock or phone menu, read notices and use touch casting with button alternatives.
  - Completion boundary: Delivered within Chromium's desktop and emulated touch coverage. Physical-device and broader browser acceptance remain open below.
  - Evidence: [tests/browser/lore-camera.spec.ts](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/tests/browser/lore-camera.spec.ts), [tests/browser/release-demo.spec.ts](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/tests/browser/release-demo.spec.ts), [tests/browser/battle-experience.spec.ts](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/tests/browser/battle-experience.spec.ts)

- [x] **Completed — Read the sets and Theandril traditions** (lore-library)
  - Current: The grimoire includes eight era histories, four contemporary set accounts, twenty-four faction folios and card readings tied to the adopted Theandril lore snapshot. New tavern people and card adaptations are identified as additions.
  - Completion boundary: Delivered: in-game reading and linked content validation. All twenty-four registered cultures are adopted from Theandril f07024fe; proposed named biographies remain unconfirmed.
  - Evidence: [src/ui/SetLibrary.tsx](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/b039bd3018bddcf4efd9ad4f6d0723ef38992515/src/ui/SetLibrary.tsx), [src/content/lore.test.ts](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/b039bd3018bddcf4efd9ad4f6d0723ef38992515/src/content/lore.test.ts), [docs/WORLD_AND_SETS.md](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/b039bd3018bddcf4efd9ad4f6d0723ef38992515/docs/WORLD_AND_SETS.md)

- [x] **Completed — Follow development from one public ledger** (development-helper)
  - Current: This project-specific helper brings together the current playable state, checked roadmap, missing features, source-linked change history and contributor handoff.
  - Completion boundary: Delivered in this increment: static Pages entries, searchable statuses, shareable item links and a generated GitHub checklist from the same roadmap data. Reading the helper never loads or changes a game save.
  - Evidence: [src/development/roadmap.ts](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/main/src/development/roadmap.ts), [src/development/roadmap.test.ts](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/main/src/development/roadmap.test.ts), [tests/browser/development.spec.ts](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/main/tests/browser/development.spec.ts)

## 03 · Before calling it 1.0

Acceptance work for a polished single-player release. These checks remain open even when an individual feature works.

- [ ] **In progress — Tune decks and the long-term shop economy** (balance)
  - Current: Seeded pack checks, opening-hand samples and 540 diagnostic duels exist. Matchups are uneven; adjacent-deck samples and the simple pilot cannot establish competitive or human balance.
  - Acceptance still needed: Test both seating orders and a wider matchup matrix, tune six to eight archetypes and counterplay, and conduct long-session human shop playtests covering income, costs, storage and progression pacing.
  - Evidence: [docs/reports/balance.json](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/docs/reports/balance.json), [scripts/balance.ts](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/scripts/balance.ts), [docs/RELEASE_READINESS.md](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/docs/RELEASE_READINESS.md)

- [ ] **Pending — Verify real phones and supported browsers** (device-coverage)
  - Current: Chromium and browser-emulated touch checks cover narrow layouts. Physical touch hardware and non-Chromium release coverage remain unverified.
  - Acceptance still needed: Choose supported browsers/devices and inspect real touch casting, long press, focus, scrolling, dense boards, short landscape layouts, text scaling and save recovery on them. Record actual results.
  - Evidence: [docs/IMPLEMENTATION_STATUS.md](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/docs/IMPLEMENTATION_STATUS.md), [docs/RELEASE_READINESS.md](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/docs/RELEASE_READINESS.md)

- [ ] **In progress — Measure loading and long-session performance** (delivery-performance)
  - Current: Reviewed lossless WebP reduces the playable deployment to roughly 26 MiB; unused room wings load on demand. This is a build-size checkpoint, not a slow-network or physical-device performance signoff.
  - Acceptance still needed: Profile first play, all-set browsing and sustained duels on slower connections and devices. Measure memory, image delivery and frame behavior and resolve regressions before release acceptance.
  - Evidence: [docs/PERFORMANCE.md](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/docs/PERFORMANCE.md), [src/render/Tavern.tsx](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/src/render/Tavern.tsx), [src/content/runtime-assets.test.ts](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/src/content/runtime-assets.test.ts)

- [ ] **Pending — Agree the single-player 1.0 scope** (release-scope)
  - Current: A playable pre-1.0 demo is published. The final depth of shop products, staffing/market systems and progression has not been accepted as a fixed 1.0 scope.
  - Acceptance still needed: Record what is required, deferred or excluded, define player acceptance for the retained systems, and use those decisions to resolve the later ideas without expanding scope implicitly.
  - Evidence: [docs/RELEASE_READINESS.md](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/docs/RELEASE_READINESS.md), [docs/HOSTING.md](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/docs/HOSTING.md)

- [ ] **Pending — Complete an evidenced 1.0 review** (release-acceptance)
  - Current: Feature-specific tests and successful demo deployments exist. There is no complete 1.0 acceptance report.
  - Acceptance still needed: Close the agreed scope, balance, usability, compatibility and performance requirements with dated evidence and a known-issues review. A successful Pages deployment alone does not close this item.
  - Evidence: [docs/RELEASE_READINESS.md](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/docs/RELEASE_READINESS.md), [docs/IMPLEMENTATION_STATUS.md](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/docs/IMPLEMENTATION_STATUS.md)

## 04 · Later ideas and scope decisions

Proposed extensions, outside the current demo commitment. Pending here does not make an idea a required 1.0 feature.

- [ ] **Pending — Staff, rent and a changing marketplace** (staff-market)
  - Current: Ingredients use fixed prices; staff hiring, insolvency and broader market forecasting are not implemented.
  - Acceptance still needed: Decide whether these systems belong in 1.0 or a later expansion, then design their costs and failure/recovery loops before production.
  - Evidence: [docs/IMPLEMENTATION_STATUS.md](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/docs/IMPLEMENTATION_STATUS.md), [docs/PROJECT_ANALYSIS.md](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/docs/PROJECT_ANALYSIS.md)

- [ ] **Pending — Free furniture placement and a modeled tavern** (free-building)
  - Current: The room uses authored illustration stages and real aisle routes. Free construction, furniture collision meshes and a fully modeled building are not implemented.
  - Acceptance still needed: Choose the visual and building scope before replacing the illustrated expansion system; preserve navigation and existing saves if pursued.
  - Evidence: [docs/IMPLEMENTATION_STATUS.md](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/docs/IMPLEMENTATION_STATUS.md), [src/render/Tavern.tsx](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/src/render/Tavern.tsx)

- [ ] **Pending — Online play, trading and tournaments** (online-play)
  - Current: The game is single player with local inventory. There are no accounts, authoritative multiplayer rooms, trading network or tournaments.
  - Acceptance still needed: Treat online play as a separate product phase requiring servers, reconnect, identity, trusted inventory, matchmaking and operational support; no delivery date is committed.
  - Evidence: [docs/HOSTING.md](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/docs/HOSTING.md), [docs/BATTLE_POLISH_PROPOSAL.md](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/docs/BATTLE_POLISH_PROPOSAL.md)

- [ ] **Pending — Cloud saves and offline progression** (cloud-offline)
  - Current: JSON backups can move progress manually. No cloud sync or offline/hidden-tab economic catch-up exists.
  - Acceptance still needed: Define conflict resolution, recovery and progression rules before adding cross-device storage or offline time, and keep local export available.
  - Evidence: [src/sim/local-save.ts](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/src/sim/local-save.ts), [docs/IMPLEMENTATION_STATUS.md](https://github.com/ErikBurdett/theandril-hearth-and-card/blob/841cd943c49ea136479fa8bc9f45411322c54c62/docs/IMPLEMENTATION_STATUS.md)
