# The Quiet · release 13

**The Quiet** (code QUI, `the-quiet`) is an 80-card historical volume for RR 2311–2313, drawn from Book chapter VII, *The Failing and the Ashfall*. It was prepared on the `feat/the-quiet-set` branch and merged for release; its source archive is published as `art-the-quiet-v1`.

The historical question: **when the far stones fall silent, what can a neighbor still promise?** On the last day of RR 2311, forty thousand bargains stood attested; by midwinter none did. Seals still cut and wax still cooled, but nothing answered. The set shows the attested sequence: credit vanishing, the League failing, the Throne's word outrun by rumor, the Covenant closing its passes and every bargain becoming local.

## Lore boundaries

- The Book gives three contradictory named sources for the Failing's first cause. No card chooses among them.
- The Ashfall of RR 2313 lies at the set's edge. It is not depicted, and its cause remains unresolved.
- No waystone glows, speaks or answers on any card. People replace attestation with memory, tally sticks, riders and beacon fires.
- All five Heroes are unnamed collector figures. The League pilot on card 53 is the unnamed pilot of the Book's log. Card 76 shows Ilthen's tower, not Ilthen.
- The people, scenes and spells are Hearth & Card adaptations, not historical testimony.

The prose lives in `src/content/the-quiet.ts` (set lore, four collector notes, continuity and faction lenses). Each card carries its own authored scene, which the reader shows in place of generic type notes (`CardSet.authored`).

## Mechanical identity

Ember/Grove was the only two-aspect pair without a primary set. The primary plan is **every bargain local**: Gather companions grow with each resource, and Rootfast neighbors hold their ground. The secondary plan is **beacon and rider**: Quickstep riders strike before blockers settle, Daunt marchers make small blocks awkward, and watchfire beacons tax the opposing hearth each turn. Counterplay is Skyborne attackers passing over the ground-bound board, removal before Gather counters accumulate, and lifegain or shields blunting the fires.

The set uses only existing, tested engine effects. It adds no rule, keyword, trigger or save schema.

| Strand | Collector numbers | Tradition | Subjects |
|---|---|---|---|
| The Quiet Stones | 1–22 | Oath | Waystation keepers, local tallies, gates, the habit of swearing at silent stones |
| The Near Fields | 23–44 | Verdancy | Foragers, granaries, drovers, hedges, the Reedfen margin |
| Beacon and Rider | 45–66 | Flame | Beacon lines, relay riders, pass-forts, the closed Covenant gate, the Anchorage riots |
| Resources | 67–76 | by aspect | Six basics; two Ember/Grove duals; Grove/Dawn and Ember/Grave bridges |
| Shared and Heroes | 77–80 | Oath, Flame, Verdancy | A seal never answered, a market of local bargains, two further Heroes |

Skeleton: thirty companions, twelve instants, ten sorceries, nine artifacts, four enchantments, five mythic Heroes, six basics and four exhausted dual resources. Rarity matches every other set: **33 common / 26 uncommon / 16 rare / 5 mythic**. Mana costs run 7 / 20 / 17 / 16 / 10 across costs 1–5.

## Recipes and packs

Two ordinary-card recipes join the prepared list (28 total). Each has forty basics and fifteen four-copy choices, needs no mythics and requires owned copies before preparing:

- **Keep the Near Fields** (Grove/Ember, bridges Rekindled Hearths through Reedfen Bargainer): Gather growth, Ember removal, a wide rally.
- **Beacon to Beacon** (Ember/Grove, bridges The Long Ash through Written in Fire): Quickstep and Daunt pressure, Grove drovers, a beacon fire.

Boosters use the unchanged fourteen-slot configuration. Saves from schemas 1–3 without a Quiet shelf gain an empty row (stock 0, price 48), exactly as the folios did. No stock, cards or RNG change.

## Balance diagnostic

`node --import tsx scripts/living-cultures-balance.ts --the-quiet` writes [the report](reports/the-quiet-balance.json). It uses 2,000 openings per recipe, three established opponents in both seats with 12 seeds each (144 matches), and 10,000 boosters. Every match finished and all 80 cards appeared in the booster sample.

Keep the Near Fields won 27 of 72 and Beacon to Beacon 20 of 72, comparable to the Living Cultures range (17–25). The first recipe drafts were nearly single-color on a 20/20 resource split; Beacon to Beacon won 15 of 72 before both lists became genuine two-color decks. Recursion remains the hardest matchup for both. This is diagnostic evidence of executable play, not human balance certification.

## TypeSafe text gate

The set is the first content to pass a TypeSafe System One gate (`scripts/card-judgments.ts`, `jev-1.13.0`). Jev reads text only, so it judges card text and written reviews, never images. One request per card asks, in parallel:

- whether the text suggests a cause of the Failing or the Ashfall, a stone answering again, a named historical person as a Hero, or graphic harm (blocking Nouls);
- how concretely the scene can be painted at card size (Score) and whether it connects to the card's game action (Noul);
- which framing the painting needs — person, animal, handheld object, structure, place or event (Choice). The brief builder uses this to describe buildings such as the staddle-stone granary as structures rather than handheld objects.

Code shortlists the three most similar existing names by shared words; a Noul per pair judges whether a player would confuse them. Thresholds live in code (`scripts/card-judgment-state.ts`).

The first pass found no lore violations but flagged real problems. *Relieve the Night Watch* was easily confused with *Release the Night Shift* (0.73), *Reedfen Margin Tenant* with *Reedfen Tenant* (0.64) and *Keeper of the Quiet Stone* with *Keeper of Quiet Names* (0.58). Beacon Stoker's "flame answers another" scored 0.45 on the stones-answering boundary. Six scenes, mostly objects, were too abstract to paint. Sixteen names and seven scenes were revised, and all 80 cards now pass with no flags. A seventeenth name changed after art review (see Artwork) and was re-judged. Results are cached with exact state hashes in `assets/art/judgments/the-quiet.json`, and `tests/card-judgments.test.ts` requires them to be current. Play, CI and brief building need no key; re-judging edited text needs `TYPESAFE_API_KEY` or `~/.config/typesafe/api-key`.

Before approval, the `reviews` command asks whether each written visual finding reports a defect (wrong subject, malformed anatomy, lettering, frame, cropped subject). A negative control scored 0.95 and was blocked; the accepted findings are retained in `assets/art/judgments/the-quiet-review-guard.json`. This guards the approval record's consistency; it does not see the images.

## Artwork

See [the art workflow](art/WORKFLOW.md#the-quiet-september-19). Each card has one Codex built-in image generation from its exact brief, processed by the vendored Theandril factory, inspected on contact sheets and at 2× for figures and animals, and approved by exact hash. Seventy-five first generations were approved. Five were rejected, retained as evidence and replaced:

- **Call In the Local Debts:** a cold stone streamed light into a lantern, breaking the silent-stone boundary.
- **Burn the Toll Bridge:** an armored figure appeared to burn apart.
- **The Anchorage Burns:** a sorcerer set the harbor alight, contradicting the Book's riots.
- **Sunlit Waystation Yard:** the signal mast became a cross atop a church-like tower.
- **Market Cross at the Quiet Stone:** the name produced a Celtic high cross. The card was renamed **Barter Stalls at the Quiet Stone** and re-judged.

The first four were replaced from override prompts retained in `assets/art/card-briefs/overrides.json`; the fifth from its renamed brief. Every finding and rejection is recorded in [the review record](../assets/art/reviews/the-quiet-review.json).

## Verification

`src/sim/the-quiet.test.ts` covers the skeleton, strands, authored lore, executable Gather/Rootfast/Daunt/rally lines, rejected resource plays, both recipes' ownership rules, 400 deterministic boosters reaching all 80 cards, and replayable AI duels for both recipes in both seats. Existing migration tests now include the Quiet shelf. The full suite, build, formatting and browser results for this branch are recorded in [the implementation status](IMPLEMENTATION_STATUS.md).
