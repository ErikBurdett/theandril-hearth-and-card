# Art workflow

## Full-card catalog workflow

The full-art catalog uses one built-in image-generation call per card and retains the original in `assets/art/source/cards/CARD_ID.png`. Exact prompts, card subjects, rules inspiration, era and chapter attribution live in `assets/art/card-briefs/catalog.json` and the eight set files. Targeted corrections are retained in `overrides.json`; rejected originals and review evidence are preserved. No API fallback or new native editor run is claimed.

`npm run art:briefs` rebuilds the briefs from stable catalog IDs, set context and explicit overrides. `npm run art:cards -- prepare SET_ID` samples each retained source to 256×384 using nearest sampling and the Theandril palette. It records the actual source hash, crop and processing settings. Already approved assets are left untouched.

Create seven readable contact sheets with `npm run art:cards -- sheet SET_ID PAGE`, where PAGE is 0–6. Inspect every image, then inspect doubtful subjects individually. Record actual findings in `assets/art/reviews/cards/SET_ID-findings.json`. Publish each reviewed candidate with `npm run art:cards -- approve CARD_ID INPUT_HASH 'Observed findings'`. Approval requires the exact validated pixels and writes the runtime image to `public/art/cards/` and its mapping to `assets/art/card-art-index.json`. Generation success never grants approval.

`npm run art:coverage` and `tests/card-art.test.ts` require all 640 cards, valid exact-hash reviews, retained originals, distinct source and decoded pixel hashes, correct dimensions and matching published bytes. A nonempty filename or a renamed copy does not meet this gate. The individual portrait images stay separate from the world sprite atlas. Full-face presentation uses readable overlays in binder, packs, reader, hand and battlefield.

The sections below document the retained environment, character and earlier shared-art workflows.

The implementation in `packages/art-pipeline` is copied from the user's Theandril project. Its PNG parser, palette checks, manifests, exact-input review validation, provider/tool adapters and atlas compiler are preserved. Project-specific publishing lives in `scripts/art.ts`.

```sh
npm run art:doctor
npm run art:prepare
npm run art:validate
# Inspect assets/art/candidates/tavern.png at native size and in context.
npm run art:review -- INPUT_HASH 'Specific visual findings and limitations'
npm run art:atlas
npm test
npm run test:gameplay
```

`prepare` reprocesses the retained original image; it does not call an AI service. Built-in image generation created `assets/art/source/tavern-original.png`; the exact prompt is in `tavern-prompt.txt`. Model/seed were not exposed by the tool. Source and candidate paths are durable because approvals reference those exact bytes. Re-running preparation does not silently approve changed output. Atlas publishing rejects stale review hashes.

Only reviewed sprites enter the runtime atlas. The tavern background is a separately validated and reviewed scene illustration, with palette conversion but no claim of native-tool normalization. Keep that distinction when reporting art quality. 10 historical sprite approvals include their retained native editable files and export metadata; their original Theandril IDs remain intact. Thumbnail PNGs reproduce first-frame pixels exactly. The Three.js atlas adapter uses nearest filtering, no mipmaps, normalized atlas UVs and a separate presentation layer.

Visual review found coherent timber, candlelight, gaming tables and a readable counter. Palette normalization adds high-frequency texture and harsher shadows than the original; this is acceptable as first-slice environment art, with a future native-grid repaint planned. Shared set illustrations are placeholders for individual card art, deliberately documented rather than presented as completed card portraits.

Upstream native-tool adapters are available, but Aseprite and Pixel Snapper were not found in the live environment. Set ASEPRITE_BIN / PIXEL_SNAPPER_BIN to valid installations and run doctor before claiming new exports. No tools were installed implicitly and no provider credentials were requested.

## New character family

`node --import tsx scripts/characters.ts prepare` processes retained Erilian and six-customer source sheets. It extracts actual alpha silhouettes (threshold 220), registers feet at (48,122) in a 96×128 frame, uses nearest sampling, then applies the same 64-color palette validation. Exact source hashes, extraction settings and resulting review inputs are retained. Static poses are intentional; no walking animation or native editable Aseprite source is claimed for these new characters.

Inspect candidate PNGs and the 4× review images before approving each individual ID:

```sh
node --import tsx scripts/characters.ts approve ID INPUT_HASH 'Specific observed findings'
node --import tsx scripts/art.ts atlas
```

Seven new approvals extend the ten upstream sprite families to 17 assets / 23 frames. The Erilian skull/robe/staff and six distinct customer silhouettes were inspected at 4× and in the runtime scene. Desktop/mobile screenshots record the room integration. Provider model/seed remain accurately marked unavailable where the generation tool did not expose them.

## Tavern interface and card treatments

The September 6 design pass reuses the reviewed sprite PNGs unchanged. Card frames, mana-aspect borders, sigils, relic emblems, wax-seal UI, book spines and card backs are native CSS/SVG interface elements in `src/ui`, not newly generated or approved raster art. Creature, Hero and land presentations now select appropriate retained motifs; artifacts use dependency-provided vector emblems and spells use geometric sigils. Shared motifs are still not bespoke card illustrations or authenticated character portraits.

New retained integration views: `card-binder.png`, `set-library.png`, `card-inspection.png`, `card-inspection-mobile.png`, `inventory-ledger.png`, and `sealed-pack-table.png`. Pack and duel screenshots also use the shared dark tavern palette. Finite reveal animations are fast-forwarded for stable screenshot evidence; reduced-motion preferences disable them in the application.

## Resource illustrations

Six built-in image generations are retained as `assets/art/source/resource-{dawn,tide,grave,ember,grove,special}-original.png`, with each exact prompt in the matching `-prompt.txt`. The prompt set requests original 3:2 medieval pixel landscapes: Cold Ford at dawn, Glass Tide quay, chalk memorial terraces, Anvil-height forge, Deepfen roots and a crossroads inn. These are shared aspect illustrations, not 64 bespoke resource paintings or assertions of historical accuracy.

`node --import tsx scripts/resources.ts prepare ID SOURCE_PATH` retains the original, samples nearest to 384 pixels wide, normalizes the factory palette and writes a candidate manifest and validation report. Inspect the actual candidate PNG, then use `node --import tsx scripts/resources.ts approve ID INPUT_HASH 'Visual findings'`. Approval checks exact input hashes before publishing to `public/art/resources/ID.png`. `scripts/art.ts atlas` revalidates these separately from the sprite atlas. Art tests verify every approval and the published resource bytes. No Aseprite or Pixel Snapper run is claimed.

The six original images are 1536×1024, runtime exports 384×256. Approved scene reviews note fine palette texture and dark edges; the focal objects remain readable at card size. Updated desktop/mobile evidence is in `docs/screenshots/battle-resources-*.png`.


## Tavern architectural upgrades

Two new generated sources extend the original room in matching architectural stages: `tavern-hall-original.png` and `tavern-bar-original.png` under `assets/art/source`. Exact prompts are retained beside them. Run `node --import tsx scripts/tavern-expansions.ts prepare hall SOURCE.png` (or `bar`) to normalize at the original 1536×1024 resolution with the vendored palette. Inspect the actual candidate, then use `approve ID INPUT_HASH 'Visual findings'`. This publishes a separate room texture and manifest in `assets/art/tavern-expansions`, outside the sprite atlas. Unit tests validate both exact review hashes and published pixels. Three.js uses nearest sampling, disposes its textures and maps walkers to the expanded floor. No native editor run is claimed.

## Eight additional visitor sprites

`node --import tsx scripts/visitors.ts prepare` extracts the eight visitors from the retained `visitors-original.png` sheet. The first transparent-background attempt painted a checkerboard into opaque pixels; it is retained as rejected evidence. A generated magenta-background correction is keyed by the recorded RGB threshold, split at the visually reviewed row boundary y=490, registered to 96×128, and normalized through the same factory palette. Review each 4× PNG before exact-hash `approve ID HASH FINDINGS`; rebuild with `npm run art:atlas`.

The courier, warden, antiquarian, bard, beekeeper, ferryman, mason and archivist each have distinct silhouettes and occupational props. These eight approvals increase the world atlas to 25 assets / 31 frames and give all fourteen tavern guests their own portrait. Poses remain static with procedural scene movement; no authored walk-cycle or native editor export is claimed. Existing card-art prompt wording is retained from the approved manifest when briefs rebuild, so revised presentation terminology never rewrites generation provenance.

## Authored animation sheets (September 7)

The built-in image generator produced seven retained 1536×1024 sources in `assets/art/source/animation`, plus a background correction for the keeper sheet whose first attempt had an opaque checkerboard. Every prompt is saved beside its source. No native-editor export or model/seed not exposed by the tool is claimed.

`node --import tsx scripts/animation-art.ts prepare` uses the vendored factory's PNG, palette, manifest and validation functions. Reviewed row boundaries, a shared scale across each character's poses, foot registration, nearest sampling and alpha threshold 220 produce 128×160 character frames and 128×128 prop frames. The corrected keeper sheet uses documented magenta keying. A changing outline is expected during walking; opening packs intentionally have a larger bounding-box allowance. Originals and all prior static assets remain retained.

After visually inspecting every processed contact sheet, explicit ID/hash/findings approvals are recorded under `assets/art/animation/approved`. `node --import tsx scripts/animation-art.ts atlas` revalidates exact approvals and verifies stable packing against reversed input before producing a separate 2048×2048 runtime atlas, metadata, strip sheets and idle portraits in `public/art/animation`.

Coverage: **23 approved assets / 122 authored frames**. Erilian and fourteen visitors each have two idle poses and four walk poses (90 frames). Fire, lantern, cauldron, brewing barrel, opening book, opening pack, glinting card back and corner filigree each have four states (32 frames). Character animation is one southeast view mirrored for westward movement, not an eight-direction animation library. The 640 existing card paintings remain still illustrations; animated backs, pack reveals and foil reflections complement them. Solid walls and architectural additions remain static paintings with animated prop overlays.

Three.js selects clips without consuming game RNG. Reduced motion selects frame zero and UI ornament animations stop. The atlas uses nearest filtering without mipmaps; owned GPU resources are disposed. The existing 1024 atlas is retained for historical/static consumers, while the tavern actor renderer uses the new animation atlas.

## Parchment and walnut materials

Built-in image generation supplied two original square UI textures. Sources and exact prompts: `assets/art/source/ui/{parchment,wood}-original.png` and `-prompt.txt`. `node --import tsx scripts/ui-art.ts prepare ID SOURCE` retains the source, nearest-samples to 512 pixels and uses the factory palette/validation. Inspect the candidate before `approve ID INPUT_HASH FINDINGS`; approvals publish `public/art/materials/ID.png`. Materials stay outside the world sprite atlas, alongside separate exact-hash approval manifests `ui.parchment` and `ui.wood`. Art tests validate their hashes and runtime bytes. No native editor, new room plate or perfectly seamless texture is claimed. Runtime CSS uses a translucent writing wash to quiet the parchment fibers.
