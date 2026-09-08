# Theandril, seen from a tavern

## Canon and adaptation

Primary source: the local copy of **The Book of Broken Roads**, upstream `b17900d`. The present hour is RR 2447. Grey Weir stands above a ford on the river Sallow. Ilthen Vael, Third Recorder, also called Ledgerbone, preserves the records. The four modern powers are the Ashen Compact, Reedbound Council, Cinder March and Glass Tide. The old crowns include the Iron Covenant, Saltwind League, Mire Courts, Sepulchral Synod and Null Throne.

**New additions:** Theandril: Hearth & Card is a tavern downstream of Grey Weir; its proprietor is Erilian Kantonine, adapted from the user’s podcast The Lich’s Tale. Tamsin Reed is a fictional Reedbound regular created for this game. Broken Roads is a collectible card game played by travelers here. The tavern, Tamsin, collectible booster commerce and the game are not claims found in the upstream book.

Cards depict recorded people and events, everyday archetypes inspired by the book, or the stories people tell. Their statistics, card types and tradition labels are gameplay adaptations, not a claim that a named person canonically wielded a particular magic. Each card has a distinct reviewed illustration; these remain artistic interpretations, not authenticated portraits. `First Witness` is an archetype. The Drowned Star and other creation accounts remain beliefs. The Roads' mechanism, motives of the Synod, hidden decisions of the enduring Iron Covenant, and the cause of the Ashfall remain explicitly disputed or unattested.

## Eight original releases

| Release | Code | Expansion | Era | Traditions | Play identity |
|---|---|---|---|---|---|
| 1 | OAT | The First Oaths | RR 1–800 | Oath, Spirit, Radiance | Dawn/Grove · fellowship, protection |
| 2 | WIT | Witness Roads | Late Roads, RR 2210–2231 | Star, Rune, Oath | Tide/Dawn · responses, card draw |
| 3 | IRN | Forges of the Covenant | Age of Crowns | Rune, Stone, Flame | Ember/Dawn · artifacts, defense |
| 4 | SLT | The Paper Sea | Age of Crowns | Tide, Storm, Star | Tide/Ember · spellcraft, tempo |
| 5 | FEN | Courts of the Deepfen | Before RR 2289 | Verdancy, Spirit, Dream | Grove/Grave · lifegain, recursion |
| 6 | REC | Written Fire | RR 2291–2311 | Shadow, Grave, Oath | Grave/Tide · mourning, control |
| 7 | ASH | The Long Ash | RR 2313–2443 | Flame, Void, Grave | Ember/Grave · Quickstep, burn |
| 8 | HRTH | Rekindled Hearths | RR 2447 | Verdancy, Stone, Radiance | Grove/Dawn · landfall, rebuilding |

Each release now has **80 cards**: 33 commons, 26 uncommons, 16 rares and 5 mythics. The commons include six basic resources. Every set also has four special resources, instant spells, sorceries, creatures, artifacts, enchantments and Heroes. Stable collector IDs 1–16 remain, with mechanics deliberately updated for the 100-card mana format. Repeated spell patterns teach shared rules; themed creature triggers and deck recipes connect different eras. These are growing seed sets, not commercial-scale 200–300-card releases or fully balanced designs.

See [card rules](CARD_RULES.md) for pack slots, actual odds, deck composition and rules. The project skill at `.agents/skills/hearth-card-design/SKILL.md` guides subsequent design; its reference file links the official Magic research. No Magic card names, setting characters, illustrations or card text were copied.

## Erilian and tavern characters

The user explicitly requested Erilian Kantonine as the shopkeeper, in black robes carrying a staff. [The Lich’s Tale show listing](https://podcasts.apple.com/us/podcast/the-lichs-tale-a-faer%C3%BBn-lorecast/id1883894054) presents a friendly scholarly lich and a hidden-library framing beneath Waterdeep. [Episode 2’s show notes](https://www.listennotes.com/podcasts/the-lichs-tale-a/e2-age-of-myth-first-stories-YBgCsHnzRf5/) identify Erilian Kantonine as a baelnorn lorekeeper. The official landing site is [taleofthelich.com](https://taleofthelich.com); no extractable official portrait was available during research.

His appearance here follows the user's black-robe/staff direction. Ivory skull, teal accents and the tavern role are this game's visual adaptation; no authenticated podcast likeness or canonical Theandril crossover is claimed. Erilian and Ilthen Vael are different characters. The fourteen customers in `src/content/tavern.ts` are original tavern additions, not asserted figures from the lore library. Their roles draw on the setting's medieval trade and faction themes.

## Strategy bridges and next content work

| Set strategy | Bridge / secondary plan | Counterplay |
|---|---|---|
| First Oaths fellowship | Lifegain from Deepfen; banners protect ordinary creatures | Remove growing creatures before additional healing |
| Witness control | Draw and bounce feed Saltwind spellcraft | Pressure early and play around open counter mana |
| Covenant formation | Mana rocks support expensive Heroes; anthems support Oath creatures | Force awkward blocks before the formation grows |
| Saltwind tempo | Instants trigger spellcraft while Witness cards replenish the hand | Recursion recovers removed threats; hold targeted answers |
| Deepfen returning grove | Life triggers bridge to Oaths; recall reuses Reckoning creatures | Repeated bounce or counters disrupt expensive recasts |
| Reckoning debts | Mourning rewards creature trades and Deepfen recall | Flying and trample avoid repeated profitable ground blocks |
| Long Ash aftermath | Burn clears blockers for haste; mourning punishes trades | Lifegain, shield and well-timed instant removal |
| Rekindled rebuilding | Resources grow creatures; Oath protection preserves counters | Answer threats before resource plays compound their size |

Next: refine individual effects/color identities and costs using playtests; add more fixing to recipes where needed; give Heroes and other build-arounds more distinct abilities; add release-day events and product formats. Record per-card attestation before elevating invented names or visuals to canon. The book's disputed origins and Ashfall causes must remain disputed.

## Reading the histories in play

The grimoire’s Set histories tab presents all eight volumes with their historical question, account, explicit uncertainties, gameplay identity and unique-card completion. The card reader identifies the relevant chapter of The Book of Broken Roads. Sixteen featured cards have individual original vignettes; remaining cards draw from set/type prose. Erilian’s margin notes are new writing for this game, not quotations from The Lich’s Tale or the Book.

`src/content/lore.ts` is the presentation source for these accounts and vignettes. It must preserve distinctions such as the witnessed practice versus the disputed mechanism of attestation, the Mire Courts’ recorded withdrawal versus their unattested motives, and the modern charters versus any claim that the old network returned. Ilthen/Ledgerbone and Erilian remain distinct people.

## Additional tavern regulars

Nessa Reedpath (Witness-road courier), Torren Ashward (Compact hearth warden), and Vey Mossglass (itinerant antiquarian) are original game additions, not people asserted by The Book of Broken Roads. Alongside the six existing guests they are available for friendly duels, using six deck recipes. They reuse existing reviewed character silhouettes.

Every card has an individual lore-linked illustration brief, including resources and special resources. The complete-catalog review and runtime report is documented in `docs/reports/card-art-coverage.json`. Their visual details are artistic interpretations, not new canonical history. Erilian remains the player; Ilthen Vael/Ledgerbone remains a distinct recorded figure.

Pella Copperstring (balladeer), Adra Honeyreed (beekeeper), Hobb Lanternwake (ferryman), Dorr Slatefoot (mason), and Ysra Paleink (archivist) are additional original tavern characters. Their dialogue is authored for this adaptation, not quoted podcast or book material. All fourteen guests span eleven of twelve prepared recipes; each now has a distinct reviewed portrait.


## Twelve cultures, with historical boundaries

The upstream faction bible at `b17900d` supplies twelve registered culture identities. Its Part II contains twelve **proposals**, and its named character seeds are proposals even within Part I. Neither category is silently promoted into this card catalog. The Book itself did not change in this pull; the new material is the out-of-world faction reference, cohort appendix and updated foundations. Exact retained source hashes are in `docs/lore/SNAPSHOT.json`.

The registered roster comprises Ashen Compact, Reedbound Council, Cinder March, Glass Tide, Iron Covenant, Sepulchral Synod, Mire Courts, Saltwind Remnant, Wardhall Remnant, Rimehorn Clans, Sable Steppe and Morrow Spore. The first four are rekindled powers; the next three endured. The two Remnants are successor organizations. The final three are present regional cultures beyond the Book’s principal account, with no invented ancient founding dates.

`src/content/factions.ts` gives each a civic conflict, relationships, material language and three connected existing cards. All eight set histories now explain historical continuity; thirty-two card-specific marginal notes deepen resources, relics and surveyors across the eight eras. Card inspection and the binder’s text search expose faction connections. These are collector lenses, explicitly distinguished from literal membership, new powers or authenticated faction portraits. That lore pass preserved the then-existing 576 cards. The subsequent Hearths and Obligations expansion appends IDs 73–80 in every era with new effects and distinct paintings; the original 576 IDs and art approvals remain valid.

The Covenant’s closure is no longer described as evidence of uncertain survival: the new reference explicitly says it endured. Its hidden decisions remain uncertain. The Saltwind League still collapsed, the Null Throne still fell, and the Ashfall’s cause remains unresolved.


## Hearths and Obligations · collector numbers 73–80

Eight additions per release turn household provisioning, recorded obligations, workmanship and shelter into playable resource sites, companions, actions and Heroes. They are original collector interpretations of each era, not newly discovered canonical people or events. Full individual artwork follows the retained chapter settings and each card’s role. Hero titles such as Keeper of the Open Door and Advocate of the Living Dependents describe archetypes; they do not replace named figures in the book. The expansion adds tactical Binding, renewal, rallying, shield-aware draining and entry/upkeep rewards while keeping historical uncertainty intact.


Mira Wickward (lamplighter), Jory Claythumb (potter), Sella Bellrest (memorial keeper), Iven Shardwake (glasswright), Branna Briarstitch (hedge tender), and Odel Rimefolio (guestbook scribe) are original contemporary tavern adaptations. Their occupations and greetings introduce no new authenticated history or podcast quotations. Their six challenge recipes combine existing sets; victory teaches the list, not ownership of its cards.
