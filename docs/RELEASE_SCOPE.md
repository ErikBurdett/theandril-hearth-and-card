# Theandril: Hearth & Card · proposed 1.0 scope

Status: **proposed, not accepted**. This records a concrete single-player 1.0 boundary so the remaining release work can be judged against something fixed. The owner's acceptance of this page closes the roadmap item `release-scope`; until then every "required" line is a proposal, and nothing here expands the demo commitment on its own.

## Required for 1.0

The retained systems, with the player-facing acceptance each must meet. "Verified" means covered by the unit, content and Chromium suites today; "open" names the evidence still missing.

| System | What 1.0 ships | Player acceptance | State |
| --- | --- | --- | --- |
| Card catalogue | 13 sets × 80 cards, 1,040 reviewed paintings, equal rarity policy, foils and Illuminated editions | Every card is readable in binder, reader, hand and table at 1366px and 390px; every painting matches its reviewed hash | Verified |
| Packs and collection | 14-card packs, explicit slot odds, open-all hauls, spare sales, crafting, set histories | A new player can buy, open and sort a pack without instructions; hauls survive reload | Verified |
| Deck building | 100-card recipes, four-copy rule, 28 prepared recipes, twelve-book shelf, ownership gating | Any owned recipe prepares in one action; missing copies are counted exactly | Verified |
| Duels | 20-health duels, LIFO stack, assisted/full-control priority, per-attacker destinations, multiple ordered blockers, nine keywords, Heroes, decision clock, key-moment recaps | Both seats play by the same rules; every rejected command leaves state untouched; every decision survives reload and JSON backup | Verified; queued trigger timing open (`battle-rules`) |
| Rivals | Twenty guests, six public tactical personalities, loser-opens seating, saved guestbook | Personalities differ observably in removal timing, held mana, protection, blocks and lethal; no decision reads hidden cards | Verified |
| Practice | Four replayable lessons on payment, responses, blocking and protection | A first-time player finishes the four lessons without coaching | Lessons verified; observed newcomers open (`duel-tutorials`) |
| Shop loop | Wholesale orders, shelves, pricing, demand, auto hours, daily closing, renown | A full in-game day neither strands the player without stock nor floods them with crowns | Mechanics verified; long-session pacing open (`balance`) |
| Hospitality | Dining wing, kitchen, cellar, twelve ingredients, meals and brews, six skills | Wings and brews persist; sales settle only at checkout | Verified |
| Progression | XP, missions, First Chapters journal, milestones | Rewards are granted once and survive backups | Verified |
| Saves | Schema 3, local storage, JSON export/import, migrations from 1/2 | Any save from a published build loads in the next build or migrates deliberately | Verified by fixtures; keep a fixture per published build |
| Delivery | GitHub Pages, lossless WebP, on-demand room wings | First play is interactive within an agreed budget on fast 3G; sustained duels do not leak memory | Measured in `docs/reports/performance.json`; budget and physical devices open (`delivery-performance`, `device-coverage`) |

## Deferred past 1.0

Proposed to ship later as expansions, not as 1.0 blockers:

- **Queued trigger timing** with a response window (`battle-rules`). Triggers resolve deterministically today; this changes feel, not outcomes.
- **Composed tavern soundscape and authored action animation** (`atmosphere`). Synthesized card and hearth sounds with a mute control are enough for 1.0.
- **Broader free-choice practice** beyond the four scripted lessons (`duel-tutorials`).
- **Richer rivalry dialogue** in the guestbook (`rival-stories`).
- **Staff, rent and a changing marketplace** (`staff-market`). Fixed ingredient prices stay; insolvency is not a 1.0 mechanic.

## Excluded from 1.0

- **Free furniture placement and a fully modeled tavern** (`free-building`). The illustrated stages and real aisle routes are the 1.0 room.
- **Online play, trading and tournaments** (`online-play`). 1.0 is single player with local inventory; no accounts.
- **Cloud saves and offline progression** (`cloud-offline`). JSON backups remain the only cross-device path; the shop does not progress while hidden.
- **Real-money purchases** of any kind.

## What acceptance of this scope changes

- `release-scope` moves to Completed, citing this page and the owner's acceptance note.
- `release-acceptance` gains a checklist: every "open" cell above gets dated evidence or a recorded known issue before 1.0 is tagged.
- Later-ideas items stay Pending with the decision recorded here rather than silently becoming obligations.
