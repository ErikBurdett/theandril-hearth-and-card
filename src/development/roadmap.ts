export const repository =
  "https://github.com/ErikBurdett/theandril-hearth-and-card";
export const reviewedOn = "2026-09-12";
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
    id: "battle-rules",
    phase: "next",
    title: "Finish the deeper duel rules",
    status: "in-progress",
    current:
      "Saved assisted/Full control priority, consecutive passes, payment previews, cleanup choices and drawn results are implemented. Combat still shares one attack destination and supports one blocker per attacker; some triggers resolve directly.",
    acceptance:
      "Define and implement separate attacker destinations, multiple blockers and their damage order, and queued trigger timing. Preserve each decision through save/reload and verify both sides use the same rules.",
    evidence: [
      "src/sim/battle.ts",
      "src/sim/battle.test.ts",
      "docs/BATTLE_POLISH_PROPOSAL.md",
    ],
  },
  {
    id: "rival-decisions",
    phase: "next",
    title: "Give rivals distinct tactical decisions",
    status: "in-progress",
    current:
      "Enemy responses and autoplay share legal public-information evaluation, and attacks avoid some losing trades. The roster still shares a simple pilot rather than individual strategic personalities.",
    acceptance:
      "Add aggressive, defensive, reactive, recursive, evasive and Hero-focused profiles. Prove removal timing, defensive resource planning, protection, lethal attacks and useful blocks in scenario tests without reading hidden cards.",
    evidence: [
      "src/sim/battle.ts",
      "src/sim/autoplay.ts",
      "docs/BATTLE_POLISH_PROPOSAL.md",
    ],
  },
  {
    id: "duel-tutorials",
    phase: "next",
    title: "Teach casting, responses and blocking",
    status: "pending",
    current:
      "First Chapters introduces a pack, a deck, a sale and a win. Authored tactical practice encounters are not implemented.",
    acceptance:
      "Build replayable guided encounters for resource planning, instant responses, protection and blocking. Observe new players finishing these actions without coaching.",
    evidence: ["src/ui/KeeperJourney.tsx", "docs/BATTLE_POLISH_PROPOSAL.md"],
  },
  {
    id: "rival-stories",
    phase: "next",
    title: "Make rematches tell a story",
    status: "pending",
    current:
      "Twenty named visitors include six first-victory recipe challenges. Persistent rival histories and explained turning points are not yet available.",
    acceptance:
      "Save rematch history, show rewards and missing recipe copies together, and explain a visible turning point without exposing the opponent's hidden hand.",
    evidence: [
      "src/content/tavern.ts",
      "src/sim/guest-recipes.test.ts",
      "docs/BATTLE_POLISH_PROPOSAL.md",
    ],
  },
  {
    id: "atmosphere",
    phase: "next",
    title: "Finish battle feedback and tavern atmosphere",
    status: "in-progress",
    current:
      "Card motion, public-event highlights, reduced motion and optional synthesized card/hearth sounds exist. A composed tavern soundscape and broader authored action animation remain open.",
    acceptance:
      "Make payment, response, impact and outcome sequences legible; add reviewed ambience and sound controls. Fast/reduced motion and muted audio must preserve identical game outcomes.",
    evidence: [
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
    phase: "foundation",
    title: "Open packs, collect and bind special editions",
    status: "completed",
    current:
      "Eight sets contain 640 cards. Fourteen-card packs include a rare-or-mythic slot and a foil; bulk opening, haul receipts, spare sales and five-copy Illuminated crafting are playable.",
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
    phase: "foundation",
    title: "Illustrate the complete card catalogue",
    status: "completed",
    current:
      "All 640 cards have individual reviewed 256×384 full-art exports, displayed as whole paintings in the binder, packs and duel.",
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
    phase: "foundation",
    title: "Build decks and earn guest recipes",
    status: "completed",
    current:
      "Construct 100-card decks, keep twelve named deck books and discover eighteen prepared recipes. Six of twenty visitors teach a recipe on first victory; ownership still gates preparation.",
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
    phase: "foundation",
    title: "Use the tavern on desktop and phone",
    status: "completed",
    current:
      "Pan/zoom the illustrated room, walk connected stairs, open stations from the dock or phone menu, read notices and use touch casting with button alternatives.",
    acceptance:
      "Delivered within Chromium's desktop and emulated touch coverage. Physical-device and broader browser acceptance remain open below.",
    evidence: [
      "tests/browser/lore-camera.spec.ts",
      "tests/browser/release-demo.spec.ts",
      "tests/browser/battle-experience.spec.ts",
    ],
  },
  {
    id: "lore-library",
    phase: "foundation",
    title: "Read the sets and Theandril traditions",
    status: "completed",
    current:
      "The grimoire includes eight era histories, twelve faction folios and card readings tied to the adopted Theandril lore snapshot. New tavern people and card adaptations are identified as additions.",
    acceptance:
      "Delivered: in-game reading and linked content validation. The wider strategy game's twenty-four cultures are not silently claimed as this project's adopted lore catalogue.",
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
      "Seeded pack checks, opening-hand samples and 540 diagnostic duels exist. Matchups are uneven; adjacent-deck samples and the simple pilot cannot establish competitive or human balance.",
    acceptance:
      "Test both seating orders and a wider matchup matrix, tune six to eight archetypes and counterplay, and conduct long-session human shop playtests covering income, costs, storage and progression pacing.",
    evidence: [
      "docs/reports/balance.json",
      "scripts/balance.ts",
      "docs/RELEASE_READINESS.md",
    ],
  },
  {
    id: "device-coverage",
    phase: "release",
    title: "Verify real phones and supported browsers",
    status: "pending",
    current:
      "Chromium and browser-emulated touch checks cover narrow layouts. Physical touch hardware and non-Chromium release coverage remain unverified.",
    acceptance:
      "Choose supported browsers/devices and inspect real touch casting, long press, focus, scrolling, dense boards, short landscape layouts, text scaling and save recovery on them. Record actual results.",
    evidence: ["docs/IMPLEMENTATION_STATUS.md", "docs/RELEASE_READINESS.md"],
  },
  {
    id: "delivery-performance",
    phase: "release",
    title: "Measure loading and long-session performance",
    status: "in-progress",
    current:
      "Reviewed lossless WebP reduces the playable deployment to roughly 26 MiB; unused room wings load on demand. This is a build-size checkpoint, not a slow-network or physical-device performance signoff.",
    acceptance:
      "Profile first play, all-set browsing and sustained duels on slower connections and devices. Measure memory, image delivery and frame behavior and resolve regressions before release acceptance.",
    evidence: [
      "docs/PERFORMANCE.md",
      "src/render/Tavern.tsx",
      "src/content/runtime-assets.test.ts",
    ],
  },
  {
    id: "release-scope",
    phase: "release",
    title: "Agree the single-player 1.0 scope",
    status: "pending",
    current:
      "A playable pre-1.0 demo is published. The final depth of shop products, staffing/market systems and progression has not been accepted as a fixed 1.0 scope.",
    acceptance:
      "Record what is required, deferred or excluded, define player acceptance for the retained systems, and use those decisions to resolve the later ideas without expanding scope implicitly.",
    evidence: ["docs/RELEASE_READINESS.md", "docs/HOSTING.md"],
  },
  {
    id: "release-acceptance",
    phase: "release",
    title: "Complete an evidenced 1.0 review",
    status: "pending",
    current:
      "Feature-specific tests and successful demo deployments exist. There is no complete 1.0 acceptance report.",
    acceptance:
      "Close the agreed scope, balance, usability, compatibility and performance requirements with dated evidence and a known-issues review. A successful Pages deployment alone does not close this item.",
    evidence: ["docs/RELEASE_READINESS.md", "docs/IMPLEMENTATION_STATUS.md"],
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
