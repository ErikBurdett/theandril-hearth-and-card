# Living Cultures verification

Reviewed September 13, 2026. Scope: twelve additional registered cultures, four 24-card folios, 96 distinct illustrations, four collection recipes and compatible existing ledgers. The game remains pre-1.0.

## Completed checks

| Check | Result |
|---|---|
| Full rules, content, save and art suite (`npm test`) | 108 tests across 17 files passed |
| Chromium gameplay (`npm run test:gameplay`) | All 41 scenarios passed; every one of the 736 catalog paintings loaded |
| Production build with `/theandril-hearth-and-card/` base | TypeScript, asset verification and Vite passed |
| Production-path Chromium (`PAGES_SMOKE=1 npm run test:gameplay`) | All four scenarios passed, including all 96 new paintings and the development helper |
| Formatting | `npm run format:check` passed |
| Approved art coverage | 736/736; zero missing, stale or shared card images |
| Lossless runtime optimization | 820 assets; visible pixels identical to reviewed PNGs |
| Local source archive | SHA-256 verified; all 491 members compared byte-for-byte against retained workspace files |

The pinned fixture preserves every original card definition, all eighteen earlier recipe lists and a recorded seeded booster from `5da67e3`. Migration adds empty shelves without changing existing holdings, currency or RNG. A valid live spell stack survives catalog migration and reload, then accepts a new counter card. Existing new product rows remain intact; malformed original products are still rejected.

The browser flows read all four folios and their twelve cultures, inspect the correct cover and lore attribution, order a new pack from an old ledger on a phone, open it and retain all fourteen cards after reload. A fully collected recipe prepares through the grimoire and survives an active duel reload. Desktop and 390px captures were inspected: `living-cultures-desktop.png`, `living-cultures-mobile.png`, `living-cultures-pack-mobile.png` and `living-cultures-battle.png` under `docs/screenshots/`.

Visual review found low-contrast text in faction disclosures; the entries now use dark ink on parchment. Initial test corrections addressed two historical eight-set expectations, actual stockroom/deck controls and the catalog's default Owned only filter. The final complete runs above passed after those corrections; no tests were skipped to obtain these results.

## Source and artwork

All 24 registered cultures are adopted from Theandril `f07024fe23ad3386874656d48fbbc33a5380d979`. Book and Foundations bytes remain unchanged. The earlier `b17900d` snapshot is retained in lore history. The new folios identify RR 2447 civic comparisons, collector-invented Heroes and proposed character seeds explicitly.

Ninety-six separate built-in image-generation compositions received exact-hash visual approval. Eight contact sheets and 96 written observations are linked in `assets/art/reviews/living-cultures-review.json`. Every inspected sheet cell was compared to the approved candidate pixels. One human steward required a targeted anatomy correction; the rejected original, edit reference and actual edit prompt remain retained. No unexposed model/seed or native-editor run is claimed.

The new 96 lossless WebP files total **4,310,438 bytes**; all 820 runtime assets total **28,453,764 bytes**. The production site is approximately **29 MiB**. These are file-size measurements, not frame-rate or slow-device guarantees.

The optional archive is `art-living-cultures-v1.tar.gz`: **327,153,768 bytes / 491 files**, SHA-256 `2cf8cbf03ff7212d0f2625697b0f4c58d956d777f47bdf92f1b83efac44bc384`. The archive manifest retains all three preceding archive hashes and adds this source/review bundle. Runtime play uses the tracked WebP files without downloading source archives.

## Diagnostic balance and remaining limits

`docs/reports/living-cultures-balance.json` records **8,000 opening hands**, **40,000 packs** and **288 completed duels with zero unfinished games**. Each recipe faced fellowship, tempo and recursion in both seats across twelve seeds. Explicit supplied opponent decks were checked before each duel. The recipes won 17, 20, 20 and 22 of their respective 72 games (23.6–30.6%); these are uneven prototype matchups, and human balance remains open.

Every new card appeared in its folio's pack sample. The sampled rare-slot mythic rate was 12.36%, Illuminated rate 4.88%, and ordinary-card buyback averaged 24.3801 crowns against 32 wholesale. Identical seeds and sheet sizes produce the same rates across the four folios. These samples do not establish long-session economy balance.

Physical phones, additional supported browsers, long sessions, strategic AI and broader human balance remain separate roadmap acceptance. Chromium phone emulation and deterministic diagnostics do not close those gates.

## Publication

Local acceptance is complete. GitHub source-archive publication, branch checks and live Pages readback are recorded here after their actual completion.
