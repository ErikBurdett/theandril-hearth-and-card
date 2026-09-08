# Cards, packs and battles

## Rarity and pack collation

Each set contains 33 commons (including six basic resources), 26 uncommons, 16 rares and 5 mythics. Rarity is visible on cards and filterable in the grimoire. Foil is an additional finish, not a fifth rarity.

A booster consumes exactly one shop product and adds **14 cards**:

| Slot | Count | Conditional odds |
|---|---:|---|
| Common | 7 | 100% common; excludes basic resources |
| Uncommon | 3 | 100% uncommon |
| Resource | 1 | 80% basic resource; 20% special resource |
| Rare/mythic | 1 | 87.5% rare; 12.5% mythic |
| Wildcard | 1 | 70% common; 22% uncommon; 7% rare; 1% mythic |
| Foil | 1 | 70% common; 22% uncommon; 7% rare; 1% mythic |

Within a selected sheet, each eligible card is equally likely. The special-resource sheet contains three cards: two uncommon and one rare. Special resources may also appear on ordinary rarity sheets. Basic resources appear only in the dedicated resource slot. Slots sample independently with replacement: duplicates are possible, including a foil/nonfoil pair. Every pack guarantees at least one rare or mythic, and exactly one foil treatment.

The chance of at least one mythic is **1 − 0.875 × 0.99 × 0.99 = 14.24125%**. This is a pack-wide probability; 12.5% describes only the rare/mythic slot. There is no hidden pity counter or paid-randomization integration.

`PACK_SLOTS` in `src/content/catalog.ts` is authoritative. Seeded tests sample 10,000 packs and check each configured distribution, exact slots, foil counts and inventory conservation. Pack buyback is not guaranteed to exceed wholesale: basics sell for 0 crowns, commons 1, uncommons 2, rares 6 and mythics 18. Foils currently have the same sale value. Ordinary wholesale is 32, latest-release wholesale 34, initial shelf price 48. Demand declines with price. Numbers remain tunable.

## Battle format

- 100-card constructed, four copies per collector ID except unlimited basic resources. Own every deck copy. This is not Commander/singleton.
- 20 starting health in new duels, seven-card opening hand. One free redraw before first play puts the old hand beneath the library and draws seven; it is a custom redraw, not the London mulligan.
- One resource per own main phase, with an empty stack. Basics enter untapped; dual resources enter tapped and supply **one** of their colors per tap.
- Mana aspects: Dawn, Tide, Grave, Ember, Grove. Cards cost generic mana plus colored pips. Colored pips are paid first; automatic tapping prefers basics before flexible duals. Players can tap explicitly to plan payment. A staged spell previews the exact sources and remaining mana. Preserve resource aspect biases generic payment away from that aspect; mandatory colored pips still take precedence. Manual taps can be undone before casting, passing or advancing a phase. Tapping a source creates floating mana; it empties at phase/turn boundaries.
- Non-instants and Hero abilities require the active player's main phase and empty stack. Instants may be cast during response windows and combat. Cast spells and activated Hero abilities enter a visible LIFO stack; targets are rechecked on resolution. Assisted casting offers the AI a response immediately, then returns control to the player. Full control holds the player’s response after casting; Pass response offers the AI its response. Two consecutive passes resolve one item; a new action resets the pass count. Response state survives saving. Enemy actions advance through visible priority passes.
- Creatures have arrival fatigue until a later turn. Quickstep bypasses it; Steadfast avoids exhaustion when attacking. Skyborne requires Skyborne/Highguard blockers. Overrun sends excess combat damage onward; Doommarked makes positive creature damage lethal; Hearthbond gains life from combat damage.
- Declare attackers together, aimed at the opposing hearth or one Hero. Each attacker can have one blocker and each blocker can block once. Tapped creatures cannot block. Removed blockers leave attackers blocked unless Overrun applies. Combat uses a power/toughness snapshot for simultaneous damage. Damage and temporary boosts clear during cleanup. A player with more than seven cards selects exactly the excess cards to discard before the next turn. The optional clock discards from the end of the hand if this choice expires; autoplay prefers to discard the most expensive cards.
- Heroes enter with printed devotion. Pay the signed devotion cost on activation, once per Hero per turn. A Hero at zero devotion goes to the graveyard; an already activated ability remains on the stack. Opposing creatures and damage spells can attack/damage Heroes. A second exact same Hero replaces its earlier copy.
- Life at zero loses; attempting to draw from an empty library loses. If both hearths reach zero together, the duel is drawn; draws have their own lifetime counter and award the participation XP, without a victory reward or recipe unlock. Victories award 35 crowns and 5 renown once. Conceding is free.

## Synergies and explicit simplifications

Gather places +1/+1 counters when a resource enters. Spellcraft grows creatures on instant/sorcery casts. Fellowship grows on friendly lifegain; Mourning drains the other hearth when another friendly creature dies. Anthems increase friendly creatures' stats; sanctuaries heal at upkeep; mana rocks are persistent tap sources. Recall returns the latest fallen creature, leaving noncreatures in the graveyard. Instants provide targeted damage, removal, bounce, counters, temporary boosts and protection.

This is a custom Magic-inspired engine, **not comprehensive MTG rules**. Automatic triggers apply directly rather than entering a separately ordered trigger stack; players resolve response windows explicitly rather than a full two-pass priority protocol. The AI actively responds with counters but does not yet evaluate every instant-speed bluff or defensive trick. There are no multiplayer turns, first strike, multiple blockers per attacker, equipment attachments, exile, sideboards or full replacement-effect ordering. Excess cards at cleanup are discarded from the right of the active player's hand until seven remain. Defender choices and attack destinations are simplified as above.

The original three starter recipes cross releases: Fellowship combines Rekindled gather with First Oaths protection, Paper & Flame combines Saltwind spellcraft with Witness draw/counters, and Returning Grove combines Deepfen lifegain/recall with Reckoning death synergies. Recipes use 40 basics, 36 creatures, 20 spells/permanents, and 4 Hero copies. Mythics are supplied with the starter collection, not a spending prerequisite.

`node --import tsx scripts/balance.ts` writes `docs/reports/balance.json`, with 2,000 opening seeds and 30 adjacent-matchup games per recipe. Its simple pilot does not activate Heroes; results are diagnostics, not human balance certification.

## Table controls and decision clock

Drag a playable card from your hand to your side of the felt, or onto a hearth, creature, Hero or stack entry for a targeted spell. A rejected target leaves cards and mana unchanged. The target selector and Play/Cast buttons provide the same actions without dragging. Inspect card art for complete rules; compact hand cards abbreviate longer text. On touchscreens, use the dedicated drag handle or buttons.

Each decision window starts at 60 seconds. Phase/turn/stack changes refresh it; selecting targets, changing blockers and tapping mana do not. Pause clock enables untimed play without restoring spent seconds. The clock automatically pauses outside the card table, while the browser tab is hidden, and during card inspection. It does not run offline.

At expiry: resolve the top stack item first; otherwise resolve pending combat with already assigned blockers, let the opponent act, declare zero attackers, or end your main phase turn. No card is automatically cast from your hand. This is Theandril: Hearth & Card’s custom friendly timing system.

Fourteen tavern guests use eleven of the twelve prepared deck recipes; their names and roles are original additions. Each recipe contains 40 basic resources and 60 nonresources. Six starter recipes are supplied in new games; six additional recipes unlock by collecting all required copies; older saves keep their existing collections and must meet ownership requirements to switch to a new recipe.

New duels use 20 health for both players. Existing in-progress schema-3 duels retain their exact saved health and board; concede and begin a new duel to use the new starting total. Engine identifiers remain stable under the new skill wording.

The table uses the available viewport height, placing each resource row beneath its companions. Cards narrow as rows grow. Hover/focus a permanent for a larger readable card; click its art for the full lore reader. Fallen-card lists open over the table without pushing either side off screen.

## Floating actions and direct targeting

The lower-right tray exposes the current next action (combat, attack confirmation, stack resolution, damage or opponent priority) and End turn where legal. Free redraw and concession live in Table options. Timing and costs still run through the simulation commands.

Click ready companions to select attackers; click the opposing hearth or Hero to choose their destination, then confirm. During enemy combat, click a ready defender and then an opposing attacker; matching Clash labels show each pair. Click an assigned attacker without a selected defender to remove a block. Illegal blocks preserve state. Hover/focus reads a card; double-click a battlefield card (or focus it and press I) opens its story. Drag a targeted spell directly to a highlighted hearth, creature, Hero or stack entry. The Cast button also permits click-to-target; Escape or Cancel targeting cancels. Target options remain available for Hero abilities and keyboard selection.

The resource row shows available Dawn/Tide/Grave/Ember/Grove mana, counting ready sources and floating mana. The total counts a flexible source once. Its individual color counters show alternatives and must not be summed; exhausting it commits one color. Mana-producing artifacts are included.

## Editions across releases

All eight sets use the same rarity and finish policy. A card's common/uncommon/rare/mythic identity belongs to its collector ID; foil and Illuminated are separate collectible finishes, without rule changes or increased buyback value. Older eras do not have hidden scarcity multipliers.

One foil slot is guaranteed in each pack (70% common, 22% uncommon, 7% rare, 1% mythic). Independently, **5% of packs** upgrade the rare/mythic slot to **Illuminated**: a gilded special frame around the existing complete painting. This is not an alternate illustration or a fifteenth card. The upgrade retains the ordinary rare-slot odds: 87.5% rare, 12.5% mythic. Thus any particular rare has a 1/320 pack chance as Illuminated; a particular mythic, 1/640. Foil and Illuminated occupy distinct slots and can coexist in one pack.

Edition counts and the last opened pack persist in schema 3. Old saves default to no Illuminated holdings. Selling a spare consumes ordinary copies first, then foil, then Illuminated; the simulation checks combined finish counts against total ownership. New booster RNG consumes one additional finish roll; old opened packs retain their stored outcomes, while future packs follow the new deterministic sequence.

## Opening a whole set's stock and binding editions

Each set in Boosters has an **Open all packs** button. It consumes that set's current sealed stock in one simulation command. All other sets remain untouched. It uses the exact same sheets, slots, finish rolls and RNG sequence as opening that many packs one at a time. A single opening supports up to 10,000 packs; larger imported stocks are rejected without spending stock. The collation sheets are cached, and the receipt groups duplicates into at most 72 card rows rather than rendering every individual copy.

The scrollable haul window shows original pull counts and separate current holdings, with search and rarity filters. Sell one spare or the displayed quantity of ordinary spares, add/remove active-deck cards, inspect a card, or bind an Illuminated edition. Actions update the collection immediately; the original receipt remains a historical record. Review last haul reopens the latest bulk receipt, including after save reload or JSON import. Older saves default to no receipt. The final individual pack is retained for compatibility with existing pack history and journal rewards.

**Illumination recipe:** five ordinary spare copies of the same collector ID become one Illuminated copy, reducing total holdings by four. There is no crown fee or randomness. All card rarities and types can be crafted; the 5% pack upgrade still applies only to the rare slot. Foils and existing Illuminated copies are never ingredients. Five copies must be available outside the active deck, so active-deck ownership remains valid. Saved recipe books retain their contents but still recheck ownership when prepared. Crafting adds a visual edition, not different rules or an alternate painting.

Spare-sale quantities must be positive whole numbers and cannot exceed holdings outside the active deck. Ordinary copies sell first; the “Sell ordinary spares” action leaves foil and Illuminated holdings untouched. Crown returns are shown before clicking. Invalid opening, sale or crafting commands leave the input state unchanged.

## Hearths and obligations expansion

Each era adds collector IDs 73–80: one basic resource, one special resource, one companion, one instant, one sorcery, one relic, one enchantment and one Hero. Original IDs stay stable. New special resources enter exhausted, restore two life, and produce one of two aspects when exhausted.

- **Binding** exhausts a targeted companion and skips exactly its next ready step. **Renew** readies a companion and clears Binding; arrival fatigue still applies. Neither removes an already-declared attacker or blocker from combat.
- **Rootfast** prevents return-to-hand effects. Destruction, damage and Binding still answer it. **Daunt** prevents companions with current power of one or less from blocking it; counters, auras and temporary boosts affect this check.
- **Welcome** restores one life when another friendly companion enters. A newly entered companion does not welcome itself. **Recordwork** draws for the first artifact entry a watcher sees each turn; the used-turn marker persists through saves.
- **Rally** grants a temporary team power/toughness bonus. **Drain** damages the opposing hearth and restores only the damage that passes shields. Archive relics draw at upkeep when hand size is at most three, before the ordinary turn draw; watchfires deal one shieldable damage at upkeep.

The Open Door combines First Oaths and Rekindled Welcome/Rally with renewal. Letters of Restraint combines Witness Roads and Reckoning Binding, Recordwork and Drain. They obey the same ownership gate as other prepared recipes. AI uses the same effects but its timing remains deliberately simple.

Attack with all selects every legal attacker for confirmation; Clear removes the selection. A visible-board forecast previews hearth damage and companion losses during combat without touching live state or consulting hidden cards. It updates when blocks or visible effects change and disappears while the response stack is nonempty. Responses can change its outcome. Unavailable hand cards explain phase, mana or target requirements. Binding has a visible badge. Compact station navigation stays below the hand.

## Casting confirmation and automated play

Manual spells now have a reversible selection stage. A legal drop selects the target; **Confirm** spends the card/mana and places the effect on the existing response stack. Clicking another legal target changes the selection. Escape, Cancel targeting, leaving the table, or a changed turn/phase discards the uncommitted selection. Confirm rechecks the original hand index/ID, available mana and target. Invalid drops consume nothing. Sorceries keep main-phase/empty-stack timing; instants can respond. Hero abilities similarly wait for confirmation before spending devotion. Resource cards retain immediate placement.

The primary action uses a revolving light while it awaits input, with reduced-motion support. Hand cards use one fitted painting with name/cost and a compact action overlay; hovering/focusing raises a card and opens the complete readable preview. The battlefield uses real shrinking grid tracks instead of the old forced flex layout. Resources stay underneath companions.

Autoplay is an optional saved boolean in schema-three battles, defaulting to false for older saves. Starting it routes Erilian to the table and waits until arrival. Each visible-browser 850 ms tick chooses one command from public board information and Erilian’s own hand. It casts legal cards, answers enemy spells with available counters, uses Heroes, declares attackers, assigns legal blockers and resolves combat through the same engine. It does not inspect hidden opponent hand or draw-pile contents. Manual commands are rejected until takeover; pausing preserves stack, costs, devotion, health and the decision clock. Finished duels settle rewards once and immediately shuffle a fresh match against a different NPC and deck while autoplay remains enabled.

The watch window is movable by pointer or keyboard and remains within the viewport as its size changes. Boards, resources, stack and Erilian’s hand render every card; long rows wrap and the window scrolls. Opponent cards remain face-down. Opening the miniature pauses autoplay without beginning a new duel. The window position is session UI state; battle progress and autoplay preference survive saves. The central play/pause control sits between lifetime wins and losses counted since the new progression system was introduced. A last-result line preserves the previous outcome as the next duel starts. The miniature is shown in the tavern, leaving full menus unobstructed. The pilot is intentionally basic, not a claim of expert tactical play.

## Endless chronicle

Keeper XP is separate from the existing hospitality skill points. Completed wins give 60 XP (and the existing 35-crown victory purse); completed losses give 25. Guest booster purchases give 12 XP; meals and drinks actually served give 18. Conceding, selling duplicates and opening packs give no XP. Level L begins at `25*(L-1)^2 + 75*(L-1)`. Every crossed level pays `20 + 5*L` crowns and `1 + floor(log2(L))` copies of a deterministic catalog card: uncommon ordinarily, rare every fifth level, mythic every tenth. Rewards do not consume pack RNG. No designed level cap exists; saved numbers still use finite numeric limits.

The mission tree has four parallel branches (duelist, merchant, host, artisan), each with two objective choices per chapter. The eight recurring objective templates grow with chapter number; they are not infinitely many authored stories. Only activity after accepting counts. A completed chapter must be claimed once, granting `40 + 20*chapter` XP, `30 + 10*chapter` crowns and `1 + floor(chapter/5)` cards with the same fifth/tenth rarity milestones. Claiming unlocks the next chapter immediately. Saving retains choices, baselines and chapter numbers. Legacy saves begin this new chronicle at level one; old accomplishments are not paid retroactively.

The artisan’s steady target is `3 + 2*chapter` completed recipe batches; bold is `1 + 2*chapter` completed fermented batches. Immediate meals count on cooking; brews count at maturity, once. Queuing a batch grants no completion credit. Older saves default the artisan counters/branch to zero/chapter one while retaining other active missions.

## Battle presentation and pacing

The table shows conditional casualty markers, attack/block connections, a lifted spell and target tether, legal targets, and a payment preview. Forecasts simulate the public board without consulting either hidden hand and never commit outcomes. Tap/click, keyboard confirmation, native desktop drag and vertical touch lift issue the same rules commands. Horizontal touch movement browses the hand; a long press opens inspection. The action corner is reserved on desktop; phone portrait places actions below the hand. Short landscape uses the screen without the room dock; the close button returns to the tavern.

The engine retains the latest 40 ordered public presentation events in saves. A small event announcement and opt-in synthesized card sounds consume those events; sound and animation never advance rules. Card and hearth sound volumes are independent, and sound suspends in hidden tabs. Reduced-motion preferences disable the new tethers' motion and impact highlights. This is an initial event presentation layer, not a complete per-effect cinematic sequence.

Both enemy responses and player autoplay evaluate counters, lethal damage and protection from their own hand and public information. Their shared attack evaluator avoids an isolated losing trade; card selection and blocking still use simple heuristics. This is not a competitive search engine or hidden-information cheat.

The tavern cycle remains 48 four-second bells: 38 daylight bells (2m 32s, including dawn and dusk), followed by 10 night bells (40s). Closing, automatic opening, phase labels and scene lighting use the revised schedule. Brewing still advances by its printed bell duration, including at night.
