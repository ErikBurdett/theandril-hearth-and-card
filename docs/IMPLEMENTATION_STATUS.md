# Hearth & Card implementation status

## Current development record · September 12, 2026

Use the [checked roadmap](ROADMAP.md) or [interactive roadmap](https://erikburdett.github.io/theandril-hearth-and-card/updates/roadmap/) for the current scoped checklist. It distinguishes Completed, In progress and Pending, links evidence and acceptance criteria, and separates later proposals from release requirements. The public [development helper](https://erikburdett.github.io/theandril-hearth-and-card/updates/) adds the current playable state, reviewed change summaries, source guides and a build-generated first-parent Git ledger. The in-game Ledger and phone menu link to it. No simulation, content IDs, save schema or existing game URL changes are required.

Current gameplay baseline is `841cd94`: 8 sets / 640 cards, 18 prepared recipes, 20 named visitors using 14 visual families, and save schema 3. Battle polish, local-save recovery and guest challenges described below are implemented. Deeper combat rules, individual strategic AI profiles, tactical tutorials, long-term balance, real-device coverage and full 1.0 acceptance remain open. Detailed sections below retain earlier increments and their scoped historical measurements; they are not an accumulating full-suite total or a substitute for the current roadmap.

This helper increment passes **102 tests across 16 files**, **38 Chromium gameplay scenarios**, **4 production-subpath scenarios**, TypeScript/build and formatting. Original art archives were restored and checksum-verified for the full art tests; no artwork changed. Independent code, content and desktop/mobile visual review passed. These suites overlap and do not add up to a larger unique test total. See the [verification record](development/VERIFICATION.md) for logs, corrected test findings and the limits of this review.

## September battle polish and longer days

Implemented the proposal’s first release: saved Full control/assisted response handling and consecutive passes; shared legality/payment previews with aspect preservation and reversible manual taps; direct pointer lifting alongside click/native drag; touch inspection and horizontal hand browsing; a reserved desktop action corner and phone action footer; attack/block tethers, conditional casualty markers, cleanup card selection and drawn results. A public event trail drives restrained highlights and opt-in synthesized card/hearth sound with separate volumes. Enemy/autoplay responses share a public-information evaluator, and attacks avoid isolated losing trades. The recap includes turn/library/grave counts and learned recipe notices when available.

Daylight now lasts **38 bells / 2m 32s**, night **10 bells / 40s**. Total cycle length and fermentation durations stay unchanged. Existing saves retain their bell count, collections and battles; new battle/progression fields have schema defaults.

This is the first battle-polish increment, not the entire competitive roadmap: multiple blockers, separate attacker destinations, queued triggers, authored tutorials, richer rival histories and six strategic AI profiles remain follow-up work. Browser touch is emulated in Chromium; physical-phone playtesting remains necessary.


Playable Three.js foundation in `Projects/tcg-shop`, Theandril lore snapshot `b17900d`, save schema **3**.

## Working

- Per-set Open all packs consumes the selected stock atomically with the same seeded results as individual opening. A saved, compact receipt powers a scrollable haul window with grouped duplicates, pull/holdings counts, search, rarity filters, card inspection, quantity sales, deck editing and Illuminated crafting. Latest bulk receipt survives reload; old saves default to none.
- Five ordinary spare copies bind into one Illuminated edition, consuming four net copies with no crown fee. Active deck, foils and existing Illuminated copies are protected. Quantity sales show returns and conserve deck ownership; invalid amounts and insufficient ingredients leave state unchanged.


- A floating lower-right action tray replaces the battle toolbar; stage, priority and damage actions stay contextual. Click companions to attack, choose an enemy hearth/Hero destination, and confirm. Click a defender then an attacker to block; paired Clash labels show assignments. Spells drag directly onto highlighted legal targets, with a click-to-target Cast alternative and Escape cancellation. Resource mana counts by aspect include ready sources, floating mana and clearly identified flexible sources.
- Presentation motion spans panel arrival, card dealing, hover/press feedback, pack flips and seal breaking, foil shimmer, health updates, combat pulses, sprite breathing/step squash and candle motes. Reduced-motion preference disables ornament; hidden tabs pause Three rendering. Animation never owns rules, sales, or pack rewards.
- Illuminated editions upgrade the rare slot in 5% of packs using gilded framing over the existing painting. This is a special frame, not alternate artwork. Same rarity policy across all eight eras, separate foil/Illuminated ownership, collection filtering, pack odds, save defaults and spare-sale conservation. All 576 reviewed illustrations remain unchanged.


- Renamed Theandril: Hearth & Card throughout player-facing UI. New duels start at 20 health per player. Saved in-progress duels retain their existing health. Presentation uses Skyborne, Quickstep, Steadfast, Hearthbond, Doommarked, Overrun, Highguard, exhaustion and Hero devotion while stable engine keys preserve saves.
- Complete card paintings fit art areas without cropping; obsolete inner arches no longer cross the picture. The laptop table uses available viewport height, density-based card widths, resource rows beneath companions, larger hover previews and compact inspectable fallen-card lists.
- Prepared recipes show missing-copy counts in the grimoire and duel welcome. Only owned recipes are enabled; six starter collections are supplied, with six additional recipes to collect.

- Twelve named deck books support saving, case-insensitive updates, preparing and removing 100-card recipes. Recipes survive reload/import and may outlive sold spares; preparation checks current ownership before changing the active deck.
- First Chapters journal guides opening a pack, saving a deck, completing a customer sale and winning a duel. Crown rewards of 10/15/25/40 are claimable once; claims persist and rejected claims conserve state.

- Resource terminology across card types, deck building, pack slots and battles; the resource-entry trigger is now Gather. Stable card IDs and the saved `landDrops` counter remain compatible.
- Illustrated battlefield permanents, readable compact hand cards, concealed opponent card backs, library backs, lich/opponent portraits, distinct playmats and direct hearth targeting. Desktop drag-to-play checks the original hand position and card ID before issuing a normal simulation command. Touch has a dedicated drag handle; Play/Cast buttons and target selectors remain available.
- A saved 60-second decision clock with untimed mode. It pauses outside the table, in hidden tabs and while inspecting cards. Expiry resolves one stack item, advances combat with current blockers, declares no attackers, or passes the turn/AI priority. Phase/stack changes reset the clock; tapping sources does not.
- Fourteen named opponents use eleven lawful 100-card/two-color recipes. Bard Pella, beekeeper Adra, ferryman Hobb, mason Dorr and archivist Ysra add original dialogue and protection, pressure, recovery and relic plans. All fourteen now have distinct reviewed medieval portraits, with eight new visitor paintings. Dialogue changes by visit, day and checkout/departure phase.
- Individual full-art card catalog: 640 retained original illustrations, lore-linked briefs, 256×384 nearest-sampled Theandril palette exports and exact-hash reviews. Card faces use art behind readable overlays in collection, packs, inspection, hands and permanents. Featured Heroes illustrate set volumes and sealed inventory. The earlier six shared resource images remain as historical assets. See the coverage report for the audited completion state.

- Tavern materials across every station: dark timber, aged brass, green felt and inked vellum. Native in-game forms, filters, notices, chronicle and battle controls share the same theme; the room remains mounted behind them.
- A card-first grimoire with separate Card binder / Set histories tabs, rarity and holdings filters, 8 historical volumes, per-set unique-card completion, and strategy/lore notes. Deck recipes and curves open during deck editing instead of obscuring browsing.
- Clickable card names and illustrations open a focused lore reader with ownership, deck commitment, spares, foils, chapter attribution, historical uncertainty and original Erilian margin prose. Keyboard focus is contained and restored; the close control remains visible on mobile while reading.
- Mana-aspect full-art frames, individually laid-out Hero abilities, foil treatments and original flavor vignettes. Sixteen featured cards have individual vignettes; other cards use set/type context. These are collector adaptations, not podcast quotations.
- Wax-sealed pack presentation, face-down card backs, sequential or immediate reveal, foil and new-to-collection markings, and expandable exact odds. Opening commits all 14 cards once; reveal state is presentation only and reload retains the cards.
- Inventory ledger totals for sealed stock, wholesale value, incoming packs, spare copies and buyback value; low-stock filter, 1/5/10/20 restock quantities, gross margins and a delivery book with remaining open-shop bells.

- Single persistent room with compact HUD, room hotspots, walkable aisle graph, keyboard movement, contextual management/table panels and Escape-to-room behavior.
- Erilian Kantonine in black robes with a staff, and fourteen original medieval customer adaptations: dwarf smith, merchant, elven herbalist, knight, scholar and sailor. Customers enter, browse, queue at the counter, purchase and leave; checkout alone changes inventory and crowns. Closing redirects remaining guests to the entrance.
- Shop ordering, deliveries, prices/demand, daily closing, collection, spare sales, eight releases and **640 card definitions**. Each 80-card set includes all eight card types, four rarities, six basics, four special resources and five Heroes.
- Fourteen-card slot-collated packs with foil treatment, visible exact odds, collection rarity filters, deck curves and mana sources. Six 100-card starter recipes with 40 resources each.
- Resource mana, permanent tapping, seven combat keywords, cast/response stack, attacks/blocking, targeted spells, recursion, cross-card triggers, persistent artifacts/enchantments, devotion-based Heroes, AI play, concession and one-time victory rewards. See `CARD_RULES.md` for the precise custom format and simplifications.
- Validated deterministic command state; invalid commands leave input untouched. Schema 1/2 migration preserves economy and owned cards, grants starter supplies and archives old-format duels rather than pretending their resolve rules continue. Schema 3 resumes stacks, routes, deliveries, foils and RNG.
- Exact-reviewed art: **17 sprite assets / 23 frames**, 1024² atlas (4 MiB uncompressed), separate 1536×1024 scene (6 MiB). Original source images, prompts, processed pixels, hashes and review evidence retained.
- Project card-design skill with research from official Lorwyn Eclipsed, Secrets of Strixhaven and Edge of Eternities design/product articles.

## Evidence

Current verification: **98 unit/art/content tests**, production build, formatting check and **35 Chromium gameplay scenarios**. Gameplay covers persistent canvas/lich/customers, real checkout and deliveries, pack/foil persistence, catalog search, 100-card editing, JSON import, mana tapping, stack reload, Hero activation and 390px panel overflow checks, resource artwork loading, hidden enemy hands, native drag-to-play, resource-drop limits and clock pause/resume, lore-reader focus/return, historical-volume browsing, foil holdings, low-stock filtering and variable restock quantities. The final browser pass additionally visits all eight sets, decodes all 640 distinct full-art images and checks that card faces do not repeat the painting as a background. Saved deck books and one-time journal claims survive reload. New checks cover crowded laptop table geometry, preview artwork, prepared-recipe ownership/unlocking, direct attacker/blocker selection, targeted spell dragging, floating controls, Illuminated persistence and reduced motion. A 10,000-pack sample checks the 5% edition upgrade alongside existing rarity distributions. Screenshots are retained in `docs/screenshots`; inspect the current images alongside this status.

A seeded 10,000-pack test checks distributions. `docs/reports/balance.json` records 2,000 opening hands per recipe and 540 completed diagnostic duels, averaging 17.5 alternating turns across eighteen adjacent matchups. The final card-art audit reports **640/640 approved, 80/80 in each set, zero missing, stale or shared images**. Exact art approval hashes and reverse-input atlas determinism pass. Build prints harmless upstream Zod annotation warnings.

The earlier website-style 128-card/20-card-deck checkpoint passed 21 unit tests and 5 browser scenarios before being superseded. Those numbers are history, not current evidence.

## Limits

- The table fits crowded rows (12 companions and 14 resources per side) at 1366×768 without scrolling the board. Smaller cards use hover/focus previews and click-to-inspect; resources sit below companions. It remains an illustrated table rather than a fully animated arena. Physical touch devices, exceptionally dense boards and shorter landscape phone screens need further coverage.
- Ten deck plans share the same rule-following AI; guests do not yet have separate AI personalities. All 300 diagnostic duels finished; matchup results remain uneven and need tuning. No claim of competitive balance.

- Save schema remains 3. Existing cards, crowns, stock, decks, battles and foils remain compatible; existing battles receive default clock fields when decoded. Missing saved-deck and claimed-journal fields default to empty lists without resetting progress. Older collections are not silently granted additional deck recipes; deck ownership rules still apply.

- Card mechanics remain a 80-card-per-set skeleton with recurring effect patterns. Individual artwork does not imply 640 mechanically unique or balance-certified designs. The spell-heavy recipe needs more tuning against recursion.
- Custom direct-trigger/priority/combat simplifications are documented. No comprehensive MTG compatibility, multiplayer, tournaments, equipment subsystem, trading network or adversarial save protection.
- The room is an orthographic illustration with translated character poses with procedural breathing/step motion. Aisle navigation is real; a fully modeled 3D building, furniture collision/occlusion meshes, authored multi-frame walk cycles and free furniture placement are not implemented. Several guests can overlap at shared nodes.
- No soundscape, staff hiring, rent/insolvency, broad market forecasting or changing ingredient prices yet. Full-catalog image delivery still needs profiling on slower devices and connections before a public 1.0.
- Retained native upstream sprite sources exist, but the new characters/room are generated raster sources with reviewed factory processing. Aseprite and Pixel Snapper are unavailable here; no new native-tool export is claimed.
- Browser storage and JSON backups only; no cloud sync or offline progression. High-frequency room movement is checkpointed every 1.2 seconds and on pagehide; player transactions save immediately.
- The free demo is published on GitHub Pages. No paid service or old Python runtime is installed.

Bulk acceptance evidence: all eight sets match sequential seeded opening; receipt totals and finish counts round-trip through saves. Chromium exercises crafting, selling, deck edits, nested inspection, desktop/390px scrolling and reload review. The 10,000-pack diagnostic produced 140,000 cards in 72 grouped rows and a 12,552-byte save (33 ms in the local Node run; not a browser/device performance guarantee).


## Tavern hospitality increment

- Persistent 48-bell day/night cycle (four seconds per visible-browser bell), automatic dawn opening/night closing, manual override and night lighting. Fermentation advances while closed; no offline or hidden-tab catch-up.
- Six skills in three prerequisite branches. Start with two points, gain one per five successful NPC purchases; storage, arrival frequency, guest capacity, meal prices and cellar speed/slots change simulation rules.
- Paid dining wing (160 crowns), kitchen equipment (180) and bar wing (260), eight market ingredients, four meal recipes and three brewing recipes. Ale and mead are also ingredients for premium dishes. Meal/drink customers route to serving areas and pay once, consume stock and award service experience.
- Two original 1536×1024 architectural expansion plates, reviewed after factory palette normalization, retained with originals, prompts, exact approvals and evidence under `assets/art/tavern-expansions`. Three.js switches plates and maps actors/markers to the expanded floor. These are authored illustration stages, not free building construction. Kitchen equipment unlocks the kitchen alcove already present in the dining-wing illustration.
- Sealed storage reserves incoming orders; pantry reserves fermentation yields. Existing schema-three saves acquire hospitality defaults without losing inventory, currency or day. Overcapacity old sealed inventory remains intact, with further orders blocked until there is room.
- Ingredient and recipe prices are fixed initial balance values. No spoilage, staff automation, configurable food pricing or free-form drink recipes. Ready food/drink sells automatically; ingredient purchases and production are player commands.

Hospitality evidence: eight simulation tests cover the clock, reload, prerequisites, conservation, storage, skills, fermentation and checkout; an art test checks both expansion exports against exact reviews. Two Chromium flows cover actual upgrades, marketplace purchases, cooking, brewing, skill learning, reload, timed auto hours, meal checkout and 390px controls. Screenshots: `hospitality-hall.png`, `hospitality-expanded.png`, `hospitality-night.png`, `hospitality-kitchen.png`, `hospitality-mobile.png`.


## Faction reference and navigable tavern update

Pulled Theandril cleanly to `b17900d`. Retained the new faction bible, twelve-culture cohort, updated foundations and unchanged Book with SHA-256 snapshot evidence. Twelve registered cultures have faction folios, three card connections each, and search/inspection support. Eight set continuity notes and 32 card-specific marginal notes preserve chronology and disputed accounts. Proposed cultures and named character seeds remain outside the adopted catalog; no card rules, rarity, IDs or artwork were silently reassigned.

Replaced both expansion plates with reviewed version-two artwork: a broad dining staircase, front stairs, open landings and a continuous bar approach. Prior sources, prompts, candidates, reports, approvals and published pixels are archived at `assets/art/reviews/tavern-before-stairs` using their original relative paths. Rendered routes follow authored stair waypoints while preserving canonical saved routes. This remains illustration-based navigation, with no furniture collision mesh or dynamic structural construction.

The tavern camera supports drag pan, wheel/pinch zoom, directional buttons and Fit tavern. Zoom is bounded to 65–260%; panning is bounded. Markers, labels and click hit tests use the current camera transform. Dragging does not issue a walk command. The mobile default fits the full scene; camera controls are hidden while a tabletop panel is open. Camera framing is not saved. Chromium covers transformed movement, zoom/pan/reset, stair arrival, mobile controls and faction reading; physical multi-touch hardware still needs a human pass.


## Hearths and Obligations expansion

- Collector numbers 73–80 add one card of each type to all eight sets: 64 new definitions and 64 separately commissioned, visually reviewed full-art paintings. Per-set rarity pools are 33 common / 26 uncommon / 16 rare / 5 mythic; existing pack slot odds are unchanged.
- Binding, Renew, Rally and Drain; Rootfast and Daunt; Welcome and Recordwork; low-hand archive and watchfire upkeep relics; eight three-ability Heroes. Shared pure rules cover both sides. Optional `bound` state preserves old schema-3 saves; once-per-turn Recordwork survives reload.
- Two additional prepared recipes, The Open Door and Letters of Restraint. Fourteen duelists use eleven different recipes. Six recipes remain starter-owned; all others require collecting the exact copies.
- Eight new occupation-specific visitor portraits and atlas sprites make all fourteen guests visually distinct. Reviewed source-sheet corrections and exact processing hashes are retained; static poses still use procedural walking/breathing.
- Attack-all/Clear selection, stage labels, visible-board combat forecast, direct Binding targeting, bound badges, disabled-hand reasons and a smaller station dock that leaves hand controls clear. Forecasting never uses hidden cards; pending responses can alter the result.
- New browser evidence: `expansion-combat-laptop.png`, `expansion-combat-mobile.png`, `new-visitor-portrait.png`. Both prepared recipes are ownership gated; all fourteen visitor images load. The existing suite loads all 640 card faces and checks crowded laptop geometry.

Balance remains provisional. The Open Door versus Letters of Restraint completed 30 seeds at 16 wins / 14 losses; Letters versus Fellowship finished 9 / 21. The diagnostic pilot does not activate Heroes and does not establish human balance. See the full report for other uneven matchups.


## Direct casting and a living auto-battle table

- Spells and Hero abilities stage a legal target before a single Confirm action commits costs. Drag-to-target, hand-art click-to-target, retargeting, cancellation and revalidation share the same engine. Sorceries retain their timing; instants keep response windows. Resources still place directly.
- A revolving primary-button glow, readable casting ribbon, selected-target outline, animated hand lift, full-art hand surfaces and complete hover reader improve feedback. Reduced motion disables ornament. Crowded companions now use shrinking grid tracks; browser checks verify every card stays inside the row, not merely that the board container fits.
- Autoplay uses the real command engine in 850 ms steps after Erilian reaches the table. It has no hidden-hand knowledge, uses Heroes and blockers, and immediately chains new duels against different NPCs and decks. A draggable, viewport-bounded watch window displays boards/resources/stack/hand with concealed opponent cards. Open it to take control; resume from the table or miniature. Pause and close stop automation without resetting the duel.
- Older saves default to manual control. Active autoplay and pending response stacks round-trip. Tests cover public-state independence, table arrival, manual-command rejection, twelve completed automated duels, pause/takeover continuity and exactly-once win payouts.
- Evidence: `confirm-casting-laptop.png`, `autobattle-tavern.png`, `autobattle-mobile.png`, updated crowded laptop and mobile battle screenshots. All 640 retained paintings remain unchanged.

Remaining limitations: automated tactics are simple, full priority/trigger ordering remains the documented custom engine, and physical touch-device testing is still pending. Watch-window coordinates are not save data. No offline combat is simulated.


## Endless progression and reflective foils

The tavern card table now has a direct Start autobattles button, also resuming a paused match without resetting it. The watch window places pause/play between lifetime wins and losses and displays the previous outcome. It hides behind full menus so it cannot obscure their controls.

Keeper levels and three endless mission branches reward battles, guest booster purchases and food/drink service with scaling XP, crowns and cards. Mission chapters repeat six objective templates with growing targets and rewards; they are not unique authored quests. Existing saves receive safe defaults. See CARD_RULES.md for formulas and claim semantics.

Foils use pointer-position spectral highlights in ordinary card views and an original transparent Three.js shader with sparse animated flecks in card inspection. Graphics resources are disposed on close, and reduced motion freezes light movement. Existing full paintings and readable rules remain intact. The technique was informed by the public Holo Card Studio README (https://github.com/EverettFish/holo-card-studio); its repository was not cloned or installed. Our paintings do not contain separate subject/background/lineart layers, so this is a surface finish, not authored depth parallax. Blender was not needed.

## Sprite animation and ornate tome interface

- Fifteen animated actors use two idle and four walk frames each, selected by actual route state. Westward movement mirrors the southeast poses. New idle portraits match the in-room sprites.
- Eight four-frame environment/UI sheets supply flame, lantern, stew steam, brewing foam, book opening, pack opening, card-back glints and gilded corners. Props complement the existing architectural paintings; there is no claim of fully animated walls or 640 animated card illustrations.
- The six dock entries use matching raster icons; menu panels have gilded filigree, leather-toned shading, book-spine edges and readable live text. Hover/focus activates interface sheets, with reduced-motion fallbacks.
- Foils no longer apply a broad rainbow wash. A narrow pointer-position reflection and sparse glints have zero base opacity elsewhere. The shader and CSS finish do not stack in inspection. A browser comparison verifies over 90% of art-area pixels stay within a small difference of the unmodified painting at the tested angle.
- Source images, exact prompts, 23 reviews, processed frames and 2048 atlas are retained. See `docs/art/WORKFLOW.md` and `assets/art/animation/review-findings.json`.

## Bound-tome materials and weighted cards

- Shared parchment, leather and aged-brass materials now style panels, inputs, embossed buttons, card labels and the battle table. Dark ink on parchment keeps names and rules readable; reviewed gilded ornaments are reused.
- Each card renders its painting once, fitted inside the art window. The duplicate background painting and competing native battlefield rules tooltip are removed. Recessed art, layered paper edges, contact shadows, hover lift, press feedback and brief settling/opening motion give cards and menus physical weight. Reduced-motion preferences suppress these animations.
- The new `hearth-visual-design` project skill records material hierarchy, single-image framing, motion and laptop/mobile review rules. The card-design skill and AGENTS.md reference it.
- Browser evidence: `tome-materials-binder.png`, `tome-card-reader.png`, and refreshed battle/hospitality screenshots. The regression suite checks single-image framing and dark label ink, plus all 640 image loads and existing battle interactions. Timer checks measure the paused inspection interval before resuming play.

## Walnut workshop and artisan progression

- Replaced muted green interface surfaces and accents across the dock, HUD, battle mats, controls, reader, mission panels and camera controls with warm browns/gold/cream. Card aspect identities and painted scenery retain their own palettes. The keeper selection ring is candle gold.
- Two new generated pixel material sources (vellum and carved walnut), each normalized to 512×512 through the vendored art factory, are reviewed and published in `public/art/materials`. Exact prompts, originals, candidate pixels and review hashes are retained. A pale writing wash reduces text-area noise; these are material textures, not newly authored room wings or seamless-tile guarantees.
- Four new ingredients and eight recipes bring the menu to 12 raw ingredients, 10 meals and 5 drinks. Oven recipes use cheese, mushrooms, honey and cooked/brewed intermediates. Reserve mead and berry cordial expand fermentation.
- Three paid equipment refits bring upgrades to six: oak pantry cabinets (+120 pantry/+100 sealed storage), stone oven (four recipes/+2 meal crowns), and cellar racks (+2 vessels/+80 pantry/-8 bells on new batches and two recipes). These refit the existing illustrated wings; no additional architectural stage is claimed.
- Search and meal/drink/unlocked/ready filters keep the recipe book manageable. Missing inputs, equipment and full-vessel/storage reasons remain visible. Buy missing supplies purchases only the exact raw-ingredient shortfall atomically, with funds and capacity checks; cooked inputs and finished brews cannot be bought by this shortcut.
- A fourth endless branch, the artisan, adds two recurring objective templates: finished batches and finished fermented batches. Counters advance on completion, preserve active older missions and reject early/duplicate claims. Eight total recurring templates are scalable objectives, not infinitely authored quests.
- 82 unit/art/content tests pass. All 29 Chromium scenarios pass across the full run and focused correction/review run; the new flow verifies equipment, recipe supplies, prices, filters, storage and artisan acceptance. Build and format checks pass. New evidence: `parchment-workshop-desktop.png` and `parchment-workshop-mobile.png`, with refreshed binder and crowded-table views.

## Open contribution and lightweight deployment

Public preparation adds MIT code licensing with separately reserved game content, attribution, contributor/security/conduct guides, issue/PR templates, CODEOWNERS and pinned read-only PR checks. Pages deploys only a successful main push (or maintainer dispatch). The complete playable build is approximately 26 MiB. Lossless runtime WebP saves 82.8% of image bytes with verified identical visible pixels. Source archives remain outside the deployment and Git clone, with checksummed restoration for full art audits. Dynamic art URLs and production CSS work below a GitHub project subpath; unused room wings load only when unlocked.

Local verification: 83 unit/content/art tests; 29 gameplay scenarios across the full and corrected URL assertion runs; production subpath smoke; build and formatting. See PERFORMANCE.md and HOSTING.md for measurements and hosting/commerce boundaries. No payments, accounts or server-trusted inventory are implemented.

The public repository and free Pages demo are published. Main-branch CI and Pages deployment passed; all three public provenance archives match their committed SHA-256 values. A clean checkout restored the archives and passed all 83 tests. GitHub runner fonts exposed a narrow native-select overflow, corrected with explicit width constraints; live review also corrected duel-setup text contrast by restoring its parchment writing surface. Main requires checks and contributor/code-owner review, with standard repository-admin maintenance access.


## Demo saves, guest challenges and mobile navigation · September 7

- Existing `hearth-hollow-v1` saves remain compatible at the same demo URL. Actions save immediately; movement/clock checkpoints persist every 1.2 seconds, on page hide and when hiding the tab. A validated previous checkpoint provides recovery when the primary save cannot decode. An unreadable save without recovery stays untouched until the player explicitly imports or replaces it.
- A visible save badge and Ledger controls expose Save now, export/import, save errors and original damaged-ledger export. Import/replacement asks before replacing progress. Storage failure leaves the session playable with a persistent export warning. Stale-tab detection pauses writes/actions in the outdated tab; reload resumes the latest copy. This is local browser storage, not cloud sync, offline progress or a transactional multi-device database.
- Twenty original tavern visitors use all eighteen prepared deck lists. Six new visitors (Mira Wickward, Jory Claythumb, Sella Bellrest, Iven Shardwake, Branna Briarstitch and Odel Rimefolio) each teach a new challenge recipe on first victory, including autoplay victories. Concessions/losses do not teach recipes. Copy ownership still gates preparing a learned deck. The original twelve recipes remain available under their prior ownership rules; free-form deck construction remains open.
- New identities have original greetings, roles and strategies; they reuse six reviewed animated character silhouettes. There are still fourteen distinct visitor portrait/animation families. No new custom NPC artwork is claimed.
- The latest sixty important event notices persist with unread state. The bell opens a parchment dialog; deliveries, learned recipes, victories and upgrades also give brief feedback. Routine arrival notes remain in the journal without filling the notification list.
- Phone navigation includes a hamburger station menu, save badge, notice bell, six 44px-or-larger dock targets and panels bounded between the header and dock. Native modal dialogs contain focus and restore it on close; table timers/autoplay pause while a dialog is open. Inputs use readable 16px phone text and respect safe-area insets. Physical device and non-Chromium coverage remain release work.

Validation for this increment: **91 unit/content/art tests**, **35 Chromium gameplay scenarios**, production build and formatting pass. All **540** diagnostic games completed across eighteen sampled matchups, averaging **17.1 alternating turns**; the simple pilot and uneven matchups remain balance limitations. Reviewed phone evidence: `screenshots/mobile-station-menu.png`, `screenshots/mobile-notices.png`, and `screenshots/expansion-combat-mobile.png`.

Hosted CI exposed a restore-message race: imported historical notices could interrupt the confirmation. Imports now mark that history as already announced, while preserving unread state. The import/camera and save/mobile browser scenarios pass after the correction.
