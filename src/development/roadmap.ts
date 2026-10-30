export const repository =
  "https://github.com/ErikBurdett/theandril-hearth-and-card";
export const reviewedOn = "2026-10-29";
export const baseline = "841cd943c49ea136479fa8bc9f45411322c54c62";
export const statuses = ["completed", "in-progress", "pending"] as const;
export type Status = (typeof statuses)[number];
export const statusLabel: Record<Status, string> = {
  completed: "Completed",
  "in-progress": "In progress",
  pending: "Pending",
};
export const phases = [
  {
    id: "next",
    title: "01 · Next development priorities",
    description:
      "Build on the working duel and tavern. The order below is the proposed sequence; there are no promised dates.",
  },
  {
    id: "foundation",
    title: "02 · Playable foundation",
    description:
      "Checked items describe specific behavior available in the demo. They do not certify the whole game for 1.0.",
  },
  {
    id: "release",
    title: "03 · Before calling it 1.0",
    description:
      "Acceptance work for a polished single-player release. These checks remain open even when an individual feature works.",
  },
  {
    id: "later",
    title: "04 · Later ideas and scope decisions",
    description:
      "Proposed extensions, outside the current demo commitment. Pending here does not make an idea a required 1.0 feature.",
  },
] as const;
export type Phase = (typeof phases)[number]["id"];
export type RoadmapItem = {
  id: string;
  phase: Phase;
  title: string;
  status: Status;
  current: string;
  acceptance: string;
  evidence: string[];
  sourceRef?: string;
};
export const roadmap: RoadmapItem[] = [
  {
    id: "the-quiet",
    phase: "foundation",
    title: "Add The Quiet, a thirteenth 80-card volume",
    status: "completed",
    sourceRef: "main",
    current:
      "Release 13 adds 80 Ember/Grove cards for RR 2311–2313 (Book chapter VII), each with an individually reviewed painting, plus two ordinary-card recipes and empty-shelf save migration: 13 sets, 1,040 cards and 28 prepared recipes. Every card's text passes a cached TypeSafe gate for lore boundaries, paintability and name confusion.",
    acceptance:
      "Delivered: 80 individually reviewed paintings, cached text judgments, two collectable recipes and empty-shelf migration pass the rules, browser and production-path checks; the provenance archive is published as art-the-quiet-v1; the merged revision is deployed and the live site serves the set with byte-identical artwork. Human balance remains a separate release gate.",
    evidence: [
      "docs/THE_QUIET.md",
      "src/content/the-quiet.ts",
      "src/sim/the-quiet.test.ts",
      "scripts/card-judgments.ts",
      "assets/art/judgments/the-quiet.json",
      "docs/reports/the-quiet-balance.json",
    ],
  },
  {
    id: "living-cultures-full-sets",
    phase: "foundation",
    title: "Expand the Living Cultures to four complete 80-card sets",
    status: "completed",
    sourceRef: "53f750128d742a6edcf462fbf7441b81a9925e95",
    current:
      "224 additional cards and four ordinary-card recipes complete the four 80-card Living Cultures sets. All 960 paintings are individually reviewed and optimized. Every set has 33 common, 26 uncommon, 16 rare and five mythic cards.",
    acceptance:
      "Delivered: the original 736 definitions, twenty-two recipes and saved receipts are preserved; 960 distinct paintings pass exact review; all 45 gameplay scenarios and four production-path checks pass. Broader human balance remains a separate release gate.",
    evidence: [
      "src/content/living-expansion.ts",
      "src/sim/full-living-sets.test.ts",
      "scripts/living-cultures-balance.ts",
      "docs/development/LIVING_CULTURES_80_VERIFICATION.md",
      "assets/art/reviews/living-cultures-80-review.json",
    ],
  },
  {
    id: "living-cultures",
    phase: "foundation",
    title: "Bring all twenty-four cultures to the card table",
    status: "completed",
    sourceRef: "b039bd3018bddcf4efd9ad4f6d0723ef38992515",
    current:
      "Twelve additional cultures have six authored cards each in four 24-card folios, with individual paintings, four collection recipes and empty-shelf save migration. The original 640 card definitions and eighteen recipes are preserved.",
    acceptance:
      "Delivered: all twelve added cultures, 96 exact-reviewed paintings, collection recipes, pack orders and old-save continuation pass rules, desktop/mobile and production-path checks. Long-term human balance remains a separate release gate.",
    evidence: [
      "docs/LIVING_CULTURES.md",
      "src/content/living-cultures.ts",
      "src/sim/living-cultures.test.ts",
      "tests/browser/living-cultures.spec.ts",
      "docs/development/LIVING_CULTURES_VERIFICATION.md",
    ],
  },
  {
    id: "battle-rules",
    sourceRef: "main",
    phase: "next",
    title: "Finish the deeper duel rules",
    status: "in-progress",
    current:
      "Saved assisted/Full control priority, consecutive passes, payment previews, cleanup choices and drawn results are implemented. Each attacker now chooses its own destination, any number of blockers may share an attacker, the attacking player orders damage among them, Overrun spills past every blocker's lethal share, and rivals gang-block and order damage from the public table. Older saves with single blockers load as one-entry lists. Automatic triggers still resolve directly rather than through a queued, respondable trigger window.",
    acceptance:
      "Delivered: per-attacker destinations, ordered multiple blockers, save/reload continuity and the same rules on both seats, verified in simulation and Chromium. Still open: queued trigger timing with a response window.",
    evidence: [
      "src/sim/battle.ts",
      "src/sim/combat-rules.test.ts",
      "tests/browser/combat-rules.spec.ts",
      "docs/CARD_RULES.md",
    ],
  },
  {
    id: "rival-decisions",
    sourceRef: "main",
    phase: "next",
    title: "Give rivals distinct tactical decisions",
    status: "completed",
    current:
      "Every guest pilots their recipe with one of six public personalities: aggressive, defensive, reactive, recursive, evasive or Hero-minded. Personalities change casting priority, removal timing, held response mana, protection tricks, counter thresholds, attack risk, blocking, gang blocks, Hero abilities and attack destinations; all of them swing when the public table shows lethal. Duels without a recognizable guest keep the steady pilot. The duel welcome names the tactics, and the loser of the last meeting opens the next one.",
    acceptance:
      "Delivered: six personalities on the twenty-guest roster, scenario tests for removal timing, held counter mana, protection, lethal attacks, useful and gang blocks, evasion and Hero use, and a hidden-information test that swaps the keeper's hand and library without changing any rival decision. Limits: personalities use heuristics, not search, and do not bluff or evaluate every instant-speed trick.",
    evidence: [
      "src/sim/battle.ts",
      "src/content/tavern.ts",
      "src/sim/rival-profiles.test.ts",
      "tests/browser/combat-rules.spec.ts",
    ],
  },
  {
    id: "duel-tutorials",
    sourceRef: "main",
    phase: "next",
    title: "Teach casting, responses and blocking",
    status: "in-progress",
    current:
      "Four replayable borrowed-card lessons teach resource payment, counterspells, blocking and targeted protection through the same battle engine, and a free practice duel lets the keeper borrow any of the 28 recipes against any guest with no reward, record or recipe unlock. The protection lesson compares two targets, survives incoming damage and clears a temporary bonus at turn end. Checkpoints and checkmarks survive reload and JSON backup without changing rival rewards or ownership.",
    acceptance:
      "Delivered: deterministic lesson checkpoints, legal mana/stack/combat actions, target-dependent mistakes, temporary protection/cleanup, replay/exit, reward isolation, free borrowed-recipe practice duels and desktop/phone controls. Existing three-lesson saves retain their checkpoints and checkmarks. Still open: observed first-time players finishing without coaching.",
    evidence: [
      "src/sim/practice-duel.test.ts",
      "src/sim/practice.ts",
      "src/sim/practice.test.ts",
      "src/ui/PracticeTable.tsx",
      "tests/browser/practice.spec.ts",
      "tests/browser/protection-practice.spec.ts",
      "src/ui/KeeperJourney.tsx",
      "docs/BATTLE_POLISH_PROPOSAL.md",
    ],
  },
  {
    id: "rival-stories",
    sourceRef: "main",
    phase: "next",
    title: "Make rematches tell a story",
    status: "completed",
    current:
      "Each guest keeps a saved win/loss/draw/concession record and latest meeting receipt, including up to five public combat, spell/ability or empty-library moments. The guestbook speaks in the guest's own voice with an original line chosen by the record (first meeting, after their win, after their loss, after a draw), names their tactical personality and explains how a keeper can play against it. Rematches retain the guest, and the loser of the last meeting opens the next duel.",
    acceptance:
      "Delivered: stable guest IDs, one-time settlement, reload/JSON backup continuity, ownership-gated recipe preparation, bounded public-outcome recaps, eighty original rivalry lines, per-personality counterplay guidance and desktop/phone controls. Limits: lines are fixed per outcome rather than generated from the duel, recaps describe observed exchanges rather than a full replay, and passive upkeep and activation costs are not separately summarized.",
    evidence: [
      "src/ui/RivalRecord.tsx",
      "tests/browser/combat-rules.spec.ts",
      "src/content/tavern.ts",
      "src/sim/guest-recipes.test.ts",
      "src/sim/rivals.ts",
      "src/sim/rivals.test.ts",
      "src/sim/battle-moments.ts",
      "src/sim/battle-moments.test.ts",
      "src/ui/RivalRecord.tsx",
      "src/ui/BattleMoments.tsx",
      "tests/browser/rivals.spec.ts",
      "tests/browser/battle-moments.spec.ts",
      "docs/BATTLE_POLISH_PROPOSAL.md",
    ],
  },
  {
    id: "atmosphere",
    sourceRef: "main",
    phase: "next",
    title: "Finish battle feedback and tavern atmosphere",
    status: "in-progress",
    current:
      "Card motion, public-event highlights and reduced motion exist. The opt-in tavern soundscape is synthesized in the browser: distinct cues for payment, arrivals, casts, responses, counters, resolutions, combat, hearth damage, healing, fallen companions, turns and the outcome, a hearth layer of low fire and crackles, and a room layer of slow murmur with an occasional cup set down, each with its own volume, available from the tavern menu and Table options and kept as a device preference. Broader authored action animation remains open.",
    acceptance:
      "Make payment, response, impact and outcome sequences legible; add reviewed ambience and sound controls. Fast/reduced motion and muted audio must preserve identical game outcomes. Delivered: the soundscape and controls, cue derivation from public events and table changes only, a device preference outside the save, and a Chromium scenario that plays a turn with sounds on. Still open: authored action animation and a listening review on real speakers and phones.",
    evidence: [
      "src/ui/soundscape.ts",
      "src/ui/SoundControls.tsx",
      "src/ui/soundscape.test.ts",
      "tests/browser/sound.spec.ts",
      "src/ui/BattlePresentation.tsx",
      "src/ui/motion-table.css",
      "docs/BATTLE_POLISH_PROPOSAL.md",
    ],
  },
  {
    id: "shop-loop",
    phase: "foundation",
    title: "Run the card shop",
    status: "completed",
    current:
      "Order wholesale stock, set pack prices, fill shelves and serve browsing visitors at checkout. Transactions earn crowns and renown; orders arrive after three open-shop bells.",
    acceptance:
      "Delivered: paid orders, capacity checks, delivery, checkout and saved inventory follow authoritative simulation commands.",
    evidence: [
      "src/sim/game.ts",
      "src/sim/game.test.ts",
      "tests/browser/game.spec.ts",
    ],
  },
  {
    id: "collecting",
    sourceRef: "53f750128d742a6edcf462fbf7441b81a9925e95",
    phase: "foundation",
    title: "Open packs, collect and bind special editions",
    status: "completed",
    current:
      "Twelve 80-card sets contain 960 cards: eight historical expansions and four Living Cultures sets. Fourteen-card packs include a rare-or-mythic slot and a foil; bulk opening, haul receipts, spare sales and five-copy Illuminated crafting are playable.",
    acceptance:
      "Delivered: seeded single/bulk equivalence, holdings conservation and saved receipts. Illuminated is a frame treatment, not a second illustration.",
    evidence: [
      "src/content/catalog.ts",
      "src/ui/BulkOpening.tsx",
      "src/sim/game.test.ts",
    ],
  },
  {
    id: "card-art",
    sourceRef: "53f750128d742a6edcf462fbf7441b81a9925e95",
    phase: "foundation",
    title: "Illustrate the complete card catalogue",
    status: "completed",
    current:
      "All 960 cards have individual reviewed 256×384 full-art exports, displayed as whole paintings in the binder, packs and duel.",
    acceptance:
      "Delivered: distinct source/pixel hashes and exact approvals in the retained coverage report. Individual artwork does not mean every card has a unique mechanic or certified balance.",
    evidence: [
      "docs/reports/card-art-coverage.json",
      "tests/card-art.test.ts",
      "src/ui/CardView.tsx",
    ],
  },
  {
    id: "deck-shelf",
    sourceRef: "53f750128d742a6edcf462fbf7441b81a9925e95",
    phase: "foundation",
    title: "Build decks and earn guest recipes",
    status: "completed",
    current:
      "Construct 100-card decks, keep twelve named deck books and discover twenty-six prepared recipes. Six of twenty visitors teach a recipe on first victory; ownership still gates preparation.",
    acceptance:
      "Delivered: deck validation, ownership checks, saved books and once-only challenge unlocks. Twenty visitors share fourteen reviewed visual families.",
    evidence: [
      "src/ui/DeckShelf.tsx",
      "src/sim/guest-recipes.test.ts",
      "src/content/tavern.ts",
    ],
  },
  {
    id: "duel-foundation",
    phase: "foundation",
    title: "Play a complete single-player duel",
    status: "completed",
    current:
      "Colored resources, a spell stack, creatures, Heroes, attacks, blocks, a pausable decision clock and friendly AI form a playable 20-health duel. Confirmed targets and payment previews support deliberate casting.",
    acceptance:
      "Delivered: supported rules and battle decisions round-trip through saves. Remaining combat and trigger simplifications are tracked separately above.",
    evidence: [
      "docs/CARD_RULES.md",
      "src/sim/battle.test.ts",
      "tests/browser/battle-experience.spec.ts",
    ],
  },
  {
    id: "autoplay",
    phase: "foundation",
    title: "Watch a duel and take over",
    status: "completed",
    current:
      "Erilian can autoplay at the tavern table while a movable watch window shows the battle. Take control or resume autoplay during the same duel.",
    acceptance:
      "Delivered: legal decisions, save/stack continuity and once-only duel rewards. Autoplay is the current simple pilot, not an expert balance judge.",
    evidence: [
      "src/sim/autoplay.ts",
      "src/sim/autoplay.test.ts",
      "src/ui/AutoBattle.tsx",
    ],
  },
  {
    id: "hospitality",
    phase: "foundation",
    title: "Expand the tavern, cook and brew",
    status: "completed",
    current:
      "Unlock illustrated dining/bar wings and equipment, buy twelve ingredients, prepare fifteen recipes and learn six skills. Brewing advances overnight in the visible browser; guests buy completed servings.",
    acceptance:
      "Delivered: upgrades, reserved capacity, production and serving transactions persist. The 38-bell day and 10-bell night support automatic hours; no offline progress is implemented.",
    evidence: [
      "src/content/hospitality.ts",
      "src/sim/hospitality.test.ts",
      "tests/browser/hospitality.spec.ts",
    ],
  },
  {
    id: "keeper-progression",
    phase: "foundation",
    title: "Follow the keeper's chapters and missions",
    status: "completed",
    current:
      "Four introductory chapters pay once-only rewards. Keeper XP, repeatable mission branches and artisan batch goals provide ongoing objectives.",
    acceptance:
      "Delivered: progress follows completed simulation events; rewards and claimed chapters survive reload without duplicate payouts.",
    evidence: [
      "src/content/milestones.ts",
      "src/sim/progression.test.ts",
      "tests/browser/progression.spec.ts",
    ],
  },
  {
    id: "local-saves",
    phase: "foundation",
    title: "Protect the local ledger",
    status: "completed",
    current:
      "Immediate transaction saves, periodic movement checkpoints, a previous-save recovery copy, stale-tab detection and JSON import/export protect browser progress.",
    acceptance:
      "Delivered: recovery, blocked storage/export and competing-tab scenarios. Browser saves are local to this site and device, with no cloud synchronization or adversarial inventory protection.",
    evidence: [
      "src/sim/local-save.test.ts",
      "tests/browser/release-demo.spec.ts",
      "src/ui/App.tsx",
    ],
  },
  {
    id: "navigation",
    sourceRef: "main",
    phase: "foundation",
    title: "Use the tavern on desktop and phone",
    status: "completed",
    current:
      "Pan/zoom the illustrated room, walk connected stairs, open stations from the dock or phone menu, read notices and use touch casting with button alternatives.",
    acceptance:
      "Delivered within Chromium's desktop and emulated touch coverage. Phone panels reserve a sticky control strip, scroll destinations clear it, and card inspection keeps its 44px close target above the reading area. Geometry checks cover 360px, 390px and laptop station headings; physical-device and broader browser acceptance remain open below.",
    evidence: [
      "tests/browser/lore-camera.spec.ts",
      "tests/browser/release-demo.spec.ts",
      "tests/browser/battle-experience.spec.ts",
      "tests/browser/the-quiet.spec.ts",
      "src/ui/mobile-release.css",
    ],
  },
  {
    id: "lore-library",
    sourceRef: "b039bd3018bddcf4efd9ad4f6d0723ef38992515",
    phase: "foundation",
    title: "Read the sets and Theandril traditions",
    status: "completed",
    current:
      "The grimoire includes eight era histories, four contemporary set accounts, twenty-four faction folios and card readings tied to the adopted Theandril lore snapshot. New tavern people and card adaptations are identified as additions.",
    acceptance:
      "Delivered: in-game reading and linked content validation. All twenty-four registered cultures are adopted from Theandril f07024fe; proposed named biographies remain unconfirmed.",
    evidence: [
      "src/ui/SetLibrary.tsx",
      "src/content/lore.test.ts",
      "docs/WORLD_AND_SETS.md",
    ],
  },
  {
    id: "development-helper",
    phase: "foundation",
    title: "Follow development from one public ledger",
    status: "completed",
    current:
      "This project-specific helper brings together the current playable state, checked roadmap, missing features, source-linked change history and contributor handoff.",
    acceptance:
      "Delivered in this increment: static Pages entries, searchable statuses, shareable item links and a generated GitHub checklist from the same roadmap data. Reading the helper never loads or changes a game save.",
    evidence: [
      "src/development/roadmap.ts",
      "src/development/roadmap.test.ts",
      "tests/browser/development.spec.ts",
    ],
    sourceRef: "main",
  },
  {
    id: "balance",
    phase: "release",
    title: "Tune decks and the long-term shop economy",
    status: "in-progress",
    current:
      "Seeded pack checks, opening-hand samples and a 1,680-duel matrix exist: every recipe meets the next three recipes from both seats against the guest personality that pilots it, with the in-game autoplay in the keeper's seat and one scored block planner on both seats; BALANCE_OPPONENTS fixes a rival panel for before-and-after tuning. Balance pass 1 rebuilt the fast Ember recipes and trimmed recursion; balance pass 2 keeps The Returning Grove to Mourning companions, separates The Thornbound Path (previously the same sixty cards) into a Skyborne, Reach and Venom list with two recalls and a shield, and gives The Kiln Wakes a fifth burn spell, a removal and a draw. Full matrix afterwards: keeper's autoplay 45% overall; The Returning Grove 45% for the keeper and 70% as a rival (was 73% and 77%), The Thornbound Path 53% and 57% (was 73% and 67%), The Kiln Wakes 38% and 50% (was 28% and 47%); the recursive personality falls from 72% to 63%.",
    acceptance:
      "Test both seating orders and a wider matchup matrix, tune six to eight archetypes and counterplay, and conduct long-session human shop playtests covering income, costs, storage and progression pacing. Delivered: both seating orders, the matrix, a fixed-panel tuning method and two measured passes over nine generated recipes. Still open: the defensive rival recipes (72–80% as rivals), the authored Ember recipes Beacon to Beacon and An Answer in Practice (22–27% for the keeper), a further pass once human play confirms the direction, and long-session human shop playtests.",
    evidence: [
      "docs/reports/balance.json",
      "scripts/balance.ts",
      "docs/RELEASE_READINESS.md",
    ],
  },
  {
    id: "device-coverage",
    sourceRef: "main",
    phase: "release",
    title: "Verify real phones and supported browsers",
    status: "in-progress",
    current:
      "Chromium and browser-emulated touch checks cover narrow layouts. PW_BROWSER=firefox runs the same scenarios in Playwright's Firefox build: 51 pass and 11 skip for stated reasons (headless Firefox has no WebGL, so Three.js scenes skip and the illustrated fallback shows; HTML5 drag and CDP touch are Chromium-only automation). Physical touch hardware, Safari/WebKit and real-GPU Firefox remain unverified.",
    acceptance:
      "Choose supported browsers/devices and inspect real touch casting, long press, focus, scrolling, dense boards, short landscape layouts, text scaling and save recovery on them. Record actual results.",
    evidence: [
      "playwright.config.ts",
      "tests/browser/engine.ts",
      "docs/IMPLEMENTATION_STATUS.md",
      "docs/RELEASE_READINESS.md",
    ],
  },
  {
    id: "delivery-performance",
    sourceRef: "main",
    phase: "release",
    title: "Measure loading and long-session performance",
    status: "in-progress",
    current:
      "Reviewed lossless WebP keeps the playable deployment near 26 MiB with unused room wings loading on demand. scripts/performance.ts now measures the production build in headless Chromium with CDP throttling: first play transfers 1.08 MiB in 19 requests and the tavern is interactive in about 0.3 s unthrottled, 2.5 s on fast 3G and 8.8 s on slow 3G at 1366px and 390px; the thirteen set histories add 0.36 MiB; paging through all thirteen binder pages of the full catalogue takes about 2.1 s, 175 requests and 6.05 MiB; a 60 s autoplay duel holds 60 fps with no frame over 50 ms (SwiftShader software GL) while the JS heap grows from 9.7 to 11.1 MiB over fourteen turns.",
    acceptance:
      "Profile first play, all-set browsing and sustained duels on slower connections and devices. Measure memory, image delivery and frame behavior and resolve regressions before release acceptance. Delivered: the repeatable browser-emulated report. The report carries a proposed delivery budget that `--check` enforces. Still open: the owner's agreement to that budget, longer sessions, physical devices and non-Chromium engines with a GPU.",
    evidence: [
      "scripts/performance.ts",
      "docs/reports/performance.json",
      "docs/PERFORMANCE.md",
      "src/render/Tavern.tsx",
      "src/content/runtime-assets.test.ts",
    ],
  },
  {
    id: "release-scope",
    sourceRef: "main",
    phase: "release",
    title: "Agree the single-player 1.0 scope",
    status: "in-progress",
    current:
      "A playable pre-1.0 demo is published. docs/RELEASE_SCOPE.md proposes the required, deferred and excluded systems with player acceptance for each retained system, but the owner has not accepted it.",
    acceptance:
      "Record what is required, deferred or excluded, define player acceptance for the retained systems, and use those decisions to resolve the later ideas without expanding scope implicitly. Delivered: the written proposal. Still open: the owner's acceptance note.",
    evidence: [
      "docs/RELEASE_SCOPE.md",
      "docs/RELEASE_READINESS.md",
      "docs/HOSTING.md",
    ],
  },
  {
    id: "release-acceptance",
    sourceRef: "main",
    phase: "release",
    title: "Complete an evidenced 1.0 review",
    status: "in-progress",
    current:
      "docs/RELEASE_ACCEPTANCE.md gathers dated evidence per scope area (rules, rivals, balance, usability, compatibility, performance, saves, content, delivery) with the known issues to carry into 1.0 notes. Usability observation, archetype tuning, human playtests, physical devices and the owner's sign-off remain open.",
    acceptance:
      "Close the agreed scope, balance, usability, compatibility and performance requirements with dated evidence and a known-issues review. A successful Pages deployment alone does not close this item.",
    evidence: [
      "docs/RELEASE_ACCEPTANCE.md",
      "docs/RELEASE_READINESS.md",
      "docs/IMPLEMENTATION_STATUS.md",
    ],
  },
  {
    id: "staff-market",
    phase: "later",
    title: "Staff, rent and a changing marketplace",
    status: "pending",
    current:
      "Ingredients use fixed prices; staff hiring, insolvency and broader market forecasting are not implemented.",
    acceptance:
      "Decide whether these systems belong in 1.0 or a later expansion, then design their costs and failure/recovery loops before production.",
    evidence: ["docs/IMPLEMENTATION_STATUS.md", "docs/PROJECT_ANALYSIS.md"],
  },
  {
    id: "free-building",
    phase: "later",
    title: "Free furniture placement and a modeled tavern",
    status: "pending",
    current:
      "The room uses authored illustration stages and real aisle routes. Free construction, furniture collision meshes and a fully modeled building are not implemented.",
    acceptance:
      "Choose the visual and building scope before replacing the illustrated expansion system; preserve navigation and existing saves if pursued.",
    evidence: ["docs/IMPLEMENTATION_STATUS.md", "src/render/Tavern.tsx"],
  },
  {
    id: "online-play",
    phase: "later",
    title: "Online play, trading and tournaments",
    status: "pending",
    current:
      "The game is single player with local inventory. There are no accounts, authoritative multiplayer rooms, trading network or tournaments.",
    acceptance:
      "Treat online play as a separate product phase requiring servers, reconnect, identity, trusted inventory, matchmaking and operational support; no delivery date is committed.",
    evidence: ["docs/HOSTING.md", "docs/BATTLE_POLISH_PROPOSAL.md"],
  },
  {
    id: "cloud-offline",
    phase: "later",
    title: "Cloud saves and offline progression",
    status: "pending",
    current:
      "JSON backups can move progress manually. No cloud sync or offline/hidden-tab economic catch-up exists.",
    acceptance:
      "Define conflict resolution, recovery and progression rules before adding cross-device storage or offline time, and keep local export available.",
    evidence: ["src/sim/local-save.ts", "docs/IMPLEMENTATION_STATUS.md"],
  },
];

export function sourceUrl(path: string, ref = baseline) {
  return `${repository}/blob/${ref}/${path}`;
}
export function filterRoadmap(status: string, query: string) {
  const needle = query.trim().toLowerCase();
  return roadmap.filter(
    (item) =>
      (status === "all" || item.status === status) &&
      `${item.id} ${item.title} ${item.current} ${item.acceptance}`
        .toLowerCase()
        .includes(needle),
  );
}
export function roadmapMarkdown() {
  return [
    "# Hearth & Card development roadmap",
    "",
    "[Open the interactive roadmap](https://erikburdett.github.io/theandril-hearth-and-card/updates/roadmap/) · [Development helper](https://erikburdett.github.io/theandril-hearth-and-card/updates/)",
    "",
    `Reviewed ${reviewedOn}; gameplay baseline [${baseline.slice(0, 7)}](${repository}/commit/${baseline}). Pre-1.0, single player.`,
    "",
    "Generated from `src/development/roadmap.ts` with `npm run roadmap:build`. Edit that source, not this document.",
    "",
    "**Completed** = the named behavior is implemented within its stated limits. **In progress** = a working part exists and the listed acceptance remains open; this is not a claim someone is actively working on it today. **Pending** = not implemented or not yet verified. Checkmarks count scoped checkpoints, not a release percentage or promised schedule.",
    "",
    ...phases.flatMap((phase) => [
      `## ${phase.title}`,
      "",
      phase.description,
      "",
      ...roadmap
        .filter((item) => item.phase === phase.id)
        .flatMap((item) => [
          `- [${item.status === "completed" ? "x" : " "}] **${statusLabel[item.status]} — ${item.title}** (${item.id})`,
          `  - Current: ${item.current}`,
          `  - ${item.status === "completed" ? "Completion boundary" : "Acceptance still needed"}: ${item.acceptance}`,
          `  - Evidence: ${item.evidence.map((path) => `[${path}](${sourceUrl(path, item.sourceRef)})`).join(", ")}`,
          "",
        ]),
    ]),
  ].join("\n");
}
