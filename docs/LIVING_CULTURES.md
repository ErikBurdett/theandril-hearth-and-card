# Living Cultures · four present-day folios

Hearth & Card adopts all 24 registered cultures from Theandril revision `f07024fe23ad3386874656d48fbbc33a5380d979`. The twelve previously missing cultures receive six authored cards apiece. Each focused folio adds five basic resources and one exhausted dual resource: **4 × 24 = 96 new cards**, bringing the game to **12 sets / 736 cards / 22 prepared recipes**.

These are RR 2447 comparisons of civic questions, not asserted alliances or missing chapters of Ilthen's testimony. Vesper Court replaces the never-registered Testament Union proposal. Proposed named character seeds remain proposals; all twelve new Heroes are unnamed collector inventions. Cairnfolk are grounded, two-armed tool users; brinefolk have two legs, hands and small neck fins; burrowfolk are distinct from Covenant deep-folk; Manytrack peoples are speaking persons. Vesper's paid Drain cards do not give every court member an innate feeding mechanic.

The current source hashes are in [SNAPSHOT.json](lore/SNAPSHOT.json); the former adoption record is retained in [history/b17900d-SNAPSHOT.json](lore/history/b17900d-SNAPSHOT.json). Only the Faction Bible and cohort appendix changed in the lore snapshot. The Book and Foundations remain byte-identical. Card stats, spells, characters and illustrations are Hearth & Card adaptations.

| Folio | Cultures | Primary plan | Secondary plan and counterplay | Older-volume bridge |
|---|---|---|---|---|
| The Shared Measure · Dawn/Tide | Cistern Assembly, Red Sluice Directorate, Brine Choir | Recordwork rewards artifacts while binding and renewal manage the opposing attack | Welcome and a rally close a patient game. Several cheap attackers stretch limited shields; remove the reader before a relic enters. | Witness Roads supplies Spellcraft threats and a late archive. |
| Terms of Shelter · Dawn/Grave | Unsealed Companies, Lantern Hospices, Vesper Court | Welcome, healing and bounded recovery sustain a protecting line | Mourning and measured Drain pressure a stalled hearth. Evasion and timely removal punish setup; shields reduce the life actually drained. | Reckoning adds durable threats and Mourning. |
| The Unclaimed Ways · Grove/Tide | Cairnwing Concord, Underhush Exchange, Manytrack Moot | Gather, Highguard and Rootfast support maintained passage and a broad fellowship | Welcome sustains a growing guard, then Rally rewards a full board. Remove the guard before resource growth; Rootfast stops bounce, not destruction. | Deepfen connects life gain to growth and evasive finishers. |
| The Unfinished Answer · Tide/Ember | Velvet Meridian, Emberwake Convocation, Margin Observance | Spellcraft, held counters and focused damage reward careful timing | Recordwork and recovery rebuild after a trade. Bait the held response and pressure before a slow archive takes over. | Saltwind brings evasive Spellcraft threats. |

## Mechanical skeleton

Each folio contains six companions, three instants, three sorceries, three persistent artifacts/enchantments, three mythic Heroes, five basics and one dual. The six cards for a culture occupy a contiguous collector range: 1–6, 7–12 or 13–18. Resources are 19–24. Commons teach early play, interaction and the setting; uncommons connect timing, artifacts and arrivals; rares offer persistent rewards or a decisive ritual. Heroes use paid devotion abilities, remain answerable through ordinary combat and are optional in the prepared recipes.

The four collection recipes each contain 40 basics and 60 ordinary cards: 36 companions and 24 support cards, with four copies of fifteen choices. They include all twelve cultures, combine two releases and require no mythics. They are visible immediately but preparation requires every owned copy. They do not add starter supplies, challenge rewards or new named guests.

The first diagnostic found too few companions and weak late pressure in the initial recipes. The final lists increase companion density and include established finishers; selected new companions also received conservative curve adjustments. [The diagnostic report](reports/living-cultures-balance.json) records 2,000 openings per list, three established opponents in both seating orders and 10,000 packs per folio. Opponent decks are supplied directly and verified, because these collection recipes have no associated tavern visitor. The simulation is evidence of executable play, not human balance certification. Broader balance stays open on the roadmap.

## Packs and saves

All sets retain the same 14-slot booster configuration and independent finish rolls. Each folio's eligible sheets contain **6 common, 7 uncommon, 3 rare and 3 mythic** cards, plus five basics selected only by the resource slot. The uncommon sheet includes the dual. Small sheets allow frequent duplicate pulls; the UI shows the selected set's actual counts and individual Illuminated probabilities. Conditional rarity odds are unchanged. No old card definition, collector ID or prepared recipe is replaced.

Schemas 1–3 gain missing folio product rows with zero stock, a 48-crown shelf price and zero sales. Migration grants no crowns or cards and consumes no randomness. Existing product rows, holdings, active decks and live spell stacks survive. A missing original product or invalid existing row still fails validation. New games receive the usual five starter boosters per added folio; existing keepers order them from the stock ledger.

## Art and verification

The built-in image tool supplied a separate composition for each new card. The project factory creates 256×384 palette-controlled exports; no new native Aseprite or Pixel Snapper run is claimed. Eight inspected contact sheets and 96 written observations are bound to exact candidate pixels and review hashes in [the review record](../assets/art/reviews/living-cultures-review.json). One Shared Landing Steward candidate showed brinefolk anatomy on the authored human; a targeted image edit corrected it. Its rejected source, reference, exact edit prompt and final source remain in the provenance bundle.

Retained prompts: `assets/art/card-briefs/{shared-measure,terms-of-shelter,unclaimed-ways,unfinished-answer}.json`. Original sources and generation records: `assets/art/source/cards/`. Approved manifests: `assets/art/approved/cards/`. Runtime paintings: `public/art/optimized/cards/`. The optional versioned art archive preserves full sources and review pixels; normal play only downloads the lossless runtime assets.

Executable coverage lives in `src/sim/living-cultures.test.ts`, the existing pack/save/battle suites, `tests/card-art.test.ts`, and `tests/browser/living-cultures.spec.ts`. The baseline fixture pins all 640 original card definitions, all eighteen prior recipes and a recorded seeded pack to commit `5da67e3`. See [the current verification record](development/LIVING_CULTURES_VERIFICATION.md) for actual completed checks and remaining limits.
