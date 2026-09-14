# Living Cultures · full-set expansion verification

Status: **Local acceptance complete; GitHub delivery pending**. This record covers the 224-card expansion beyond the initial four 24-card folios. The [initial release record](LIVING_CULTURES_VERIFICATION.md) remains a separate historical checkpoint. The maintained acceptance status is the `living-cultures-full-sets` item in [the roadmap](../ROADMAP.md).

## Content and compatibility

The catalog contains twelve 80-card sets: **960 cards** and **26 prepared recipes**. Each Living Cultures set appends collector numbers 25–80 without changing numbers 1–24. Its rarity distribution matches every historical set: 33 common, 26 uncommon, 16 rare and five mythic cards. Six basics and four exhausted dual resources support the same booster configuration.

Each of the twelve added cultures has its original six cards plus sixteen ordinary additions. Two extra faction Heroes per set and two shared collector-comparison cards complete each list. The Heroes remain unnamed adaptations; no new canonical biographies, alliances, innate species powers or explanation of the Ashfall is asserted.

`src/sim/fixtures/pre-full-living-sets.json` was captured at `53a1d3c856981236b5bb7aecfe24a117ff3a6773` before expansion. Its hashes verify all 736 released card definitions and twenty-two exact recipes. The corresponding saved folio receipt decodes unchanged. Historical booster samples retain their card IDs, foil flags, Illuminated flags and RNG. Fresh boosters from the expanded sets deliberately sample the larger sheets; an unopened old booster is not promised its former 24-card outcome. No schema migration is needed.

`src/sim/full-living-sets.test.ts` checks those boundaries, exact rarity/resource counts, faction ownership and the additional ordinary-card recipes. The existing migration, atomic rejection, stack, targeting, save and pack suites remain applicable. The combined suite passes 112 tests across eighteen files, including the complete 960-source art audit. A browser-discovered duplicate recipe name was corrected to A Door Freely Opened; the content gate also requires unique recipe names.

## Diagnostic play and packs

Run `node --import tsx scripts/living-cultures-balance.ts --full-sets`. [The report](../reports/living-cultures-80-balance.json) retains 8,000 opening hands, 288 completed duels and 40,000 boosters. The previous 24-card report is retained separately. Every one of the 80 cards appeared in each set's sample.

| Additional recipe | Opening hand with an early spell and its source | Wins across 72 diagnostic games |
|---|---:|---:|
| A Fellowship Maintained | 84.25% | 18 |
| A Door Freely Opened | 81.50% | 25 |
| Many Roads Together | 87.85% | 19 |
| An Answer in Practice | 93.05% | 17 |

Every recipe uses forty basics, thirty-six companions and twenty-four support cards, with four copies of fifteen ordinary choices. All three cultures of its primary set are represented and an older release supplies interaction. Existing recipes are unchanged. Both seating orders were tested against Fellowship, Tempo and Recursion over twelve seeds. No match remained unfinished. These uneven results are diagnostic evidence, not human balance certification; broader balance remains open.

Each set's 10,000-booster sample produced a 12.36% mythic rate in the rare/mythic slot and a 4.88% Illuminated rate. Mean ordinary-card buyback was 24.7773 crowns against a 32-crown wholesale pack. These are samples, not guaranteed refunds or probabilities. Conditional slot rules are unchanged. The visible individual Illuminated odds are 0.2734% for a given rare and 0.1250% for a given mythic.

## Artwork and release checks

The built-in image tool supplied one original composition for each of the 224 additions. Exact prompts and generation records are retained beside the sources. Processed 256×384 paintings are inspected on readable contact sheets, with individual inspection when a subject is uncertain. [The review record](../../assets/art/reviews/living-cultures-80-review.json) grows only after observed review and verifies that the inspected sheet cells match the candidate pixels. Generation success alone never grants approval.

All 960 cards have distinct approved sources and processed pixels. The 224 additions were reviewed on twenty contact sheets, with full-resolution inspection of the boarfolk waypost keeper to resolve a small silhouette. All original generation prompts still match the retained source metadata. The 1,044-file lossless runtime collection is 38,249,926 bytes; the complete built site measured 39,842,658 bytes (about 38 MiB). All previously shipped WebP files remain byte-identical.

All 45 Chromium gameplay scenarios pass: 44 in the initial complete run, followed by the corrected recipe's focused rerun. Four production-subpath scenarios pass, including loading every card in the four expanded sets and navigating the development helper. TypeScript, production build and formatting pass. Reviewed evidence includes `screenshots/living-cultures-80-{maintained-fellowship,open-door-service,many-roads-together,answer-in-practice}.png`, the 80-card set library, phone pack table and development helper. The first three deck views are 1366×768; the final recipe uses a 390×844 phone viewport. Whole paintings fit their card areas, the phone hand scrolls within its row, and controls remain reachable. Touch is emulated in Chromium; physical-device acceptance remains open.

The new source bundle is `art-living-cultures-80-v1.tar.gz`: **742,224,990 bytes / 1,140 files**, SHA-256 `04104cf99a3c24b10df297284cd39b6e07727af7919ce54e50612bc32cd5e280`. Every archived member was read back and hashed against its retained original. It contains 224 source PNGs, 224 generation records, 224 candidate PNGs, 224 review PNGs, 224 original runtime PNGs and twenty contact sheets. Existing archives remain unchanged. The checksum-pinned manifest provides the restore URL; GitHub upload and deployed-page readback are pending.

No new native Aseprite, Pixel Snapper or unexposed provider model is claimed. Human balance, physical phones, sustained-session economy and broader 1.0 acceptance remain open.
