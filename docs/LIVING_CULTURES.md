# Living Cultures · four 80-card sets

Hearth & Card adopts all 24 registered cultures from Theandril revision `f07024fe23ad3386874656d48fbbc33a5380d979`. The four Living Cultures sets now contain **320 cards**, bringing the full game to **12 × 80 = 960 cards / 26 prepared recipes**. The initial 96-card release is preserved; collector numbers 25–80 add 224 further cards and four additional collection recipes.

These RR 2447 sets compare civic questions. They do not assert alliances or add missing chapters to Ilthen's testimony. Vesper Court replaces the never-registered Testament Union proposal. Proposed named character seeds remain proposals; all twenty Living Cultures Heroes are unnamed collector inventions. Cairnfolk are grounded, two-armed tool users; brinefolk have two legs, hands and small neck fins; burrowfolk differ from Covenant deepfolk; Manytrack peoples are speaking persons. Paid card effects do not establish innate powers for every member of a culture.

The current source hashes are in [SNAPSHOT.json](lore/SNAPSHOT.json); the former adoption is retained in [history/b17900d-SNAPSHOT.json](lore/history/b17900d-SNAPSHOT.json). Only the Faction Bible and cohort appendix changed in that adoption. The Book and Foundations remain byte-identical. Card stats, spells, characters and illustrations are Hearth & Card adaptations.

| Set | Cultures | Primary plan | Secondary plan and counterplay | Older-volume bridge |
|---|---|---|---|---|
| The Shared Measure · Dawn/Tide | Cistern Assembly, Red Sluice Directorate, Brine Choir | Recordwork rewards artifacts while binding and renewal manage the opposing attack | Welcome and a rally close a patient game. Several cheap attackers stretch limited shields; remove the reader before a relic enters. | Witness Roads supplies Spellcraft threats and a late archive. |
| Terms of Shelter · Dawn/Grave | Unsealed Companies, Lantern Hospices, Vesper Court | Welcome, healing and bounded recovery sustain a protecting line | Mourning and measured Drain pressure a stalled hearth. Evasion and timely removal punish setup; shields reduce the life actually drained. | Reckoning adds durable threats and Mourning. |
| The Unclaimed Ways · Grove/Tide | Cairnwing Concord, Underhush Exchange, Manytrack Moot | Gather, Highguard and Rootfast support maintained passage and a broad fellowship | Welcome sustains a growing guard, then Rally rewards a full board. Remove the guard before resource growth; Rootfast stops bounce, not destruction. | Deepfen connects life gain to growth and evasive finishers. |
| The Unfinished Answer · Tide/Ember | Velvet Meridian, Emberwake Convocation, Margin Observance | Spellcraft, held counters and focused damage reward careful timing | Recordwork and recovery rebuild after a trade. Bait the held response and pressure before a slow archive takes over. | Saltwind brings evasive Spellcraft threats. |

## Mechanical skeleton

Each 80-card set contains thirty companions, twelve instants, ten sorceries, thirteen persistent artifacts/enchantments, five mythic Heroes, six basics and four special resources. Its rarity distribution matches the eight older sets: **33 common / 26 uncommon / 16 rare / 5 mythic**. Commons provide early plays, interaction and support; uncommons connect strategies; rares add finishers and persistent rewards. Mythic Heroes remain optional in prepared recipes.

The original culture blocks remain at 1–6, 7–12 and 13–18, with their original resources at 19–24. Each culture receives sixteen additional ordinary cards at 25–40, 41–56 or 57–72. Number 73 is another basic; 74–76 are exhausted dual resources; 77–78 are shared collector-comparison cards; 79–80 are additional faction Heroes. Each culture therefore has 22 or 23 connected cards. Every prior collector number, rule definition and illustration remains unchanged.

Eight Living Cultures collection recipes now supplement the eighteen established recipes. All contain forty basics and sixty ordinary cards: thirty-six companions and twenty-four support cards, with four copies of fifteen choices. They include all twelve added cultures, combine two releases and require no mythics. The four original recipes are unchanged. The additional lists are A Fellowship Maintained, A Door Freely Opened, Many Roads Together and An Answer in Practice. Preparation requires every owned copy; these additions grant no starter cards, challenge rewards or new named guests to existing saves.

[The full-set diagnostic](reports/living-cultures-80-balance.json) records 2,000 openings per additional list, three established opponents in both seating orders and 10,000 packs per set. Every one of its 288 matches finished and every card appeared in the booster sample. Matchups remain uneven: 17–25 wins per 72 games depending on the new recipe. This is evidence of executable play, not human balance certification. The [initial 24-card diagnostic](reports/living-cultures-balance.json) remains a separate historical measurement. Broader balance stays open on the roadmap.

## Packs and saves

All twelve sets retain the same fourteen-slot booster configuration and independent finish rolls. Each set's eligible rarity sheets now contain **27 common, 26 uncommon, 16 rare and five mythic** cards, with six basics selected only through the resource slot. The uncommon and rare sheets include special resources. The UI shows the selected set's actual counts and individual Illuminated probabilities: 0.2734% for a given rare and 0.1250% for a given mythic in the upgraded rare/mythic slot. Conditional slot odds are unchanged.

The initial adoption added missing folio product rows to schema 1–3 saves with zero stock, a 48-crown shelf price and zero sales. This full-set expansion needs no further migration. Existing stock now opens from the expanded pool; already opened receipts, holdings, active decks, stored books, currency and live spell stacks remain intact. A baseline captured before expansion verifies all 736 released definitions, twenty-two existing recipes and all eight historical seeded booster outcomes. Fresh boosters from an expanded set intentionally have more possible cards.

## Artwork and verification

Every one of the 224 additions has a separate original built-in image generation. The existing factory produces 256×384 palette-controlled exports, and twenty readable contact sheets were inspected before approval. The [full-set review record](../assets/art/reviews/living-cultures-80-review.json) binds 224 written observations to exact candidate pixels and sheet hashes. A small boarfolk silhouette also received individual source inspection. All 960 catalog paintings have distinct reviewed sources and processed pixels. No new native Aseprite or Pixel Snapper run is claimed.

The initial 96-card [review record](../assets/art/reviews/living-cultures-review.json) and its corrected human steward remain preserved. Exact generation prompts are retained even when later card wording or tradition labels are refined; a brief rebuild never rewrites an approved painting's actual prompt.

Prompts: `assets/art/card-briefs/{shared-measure,terms-of-shelter,unclaimed-ways,unfinished-answer}.json`. Originals and generation records: `assets/art/source/cards/`. Exact approvals: `assets/art/approved/cards/`. Runtime paintings: `public/art/optimized/cards/`. The versioned provenance archives preserve the full originals and review pixels; the browser only loads the lossless runtime assets.

Executable coverage is in `src/sim/full-living-sets.test.ts`, `src/sim/living-cultures.test.ts`, the existing pack/save/battle suites, `tests/card-art.test.ts` and `tests/browser/living-cultures.spec.ts`. See [full-set verification](development/LIVING_CULTURES_80_VERIFICATION.md) for completed release checks and remaining limits. The [initial adoption verification](development/LIVING_CULTURES_VERIFICATION.md) retains its original 96-card scope.
