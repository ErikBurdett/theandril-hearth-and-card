# Development helper verification · September 12, 2026

Scope: public current-state overview, checked roadmap, generated Git change ledger, static Pages entries, and in-game Ledger/phone links. Gameplay is the unchanged `841cd94` baseline; no rules, save schema, stable content IDs or original artwork changed.

| Check | Result | Evidence |
| --- | --- | --- |
| `npm test` | 102/102 tests across 16 files | [Full test log](tests.txt) |
| `npm run test:gameplay` | 38/38 Chromium scenarios, 1.3 minutes | [Final browser log](gameplay-final.txt) |
| `VITE_BASE_PATH=/theandril-hearth-and-card/ npm run build` | Passed, three helper entries plus existing game | TypeScript and Vite completed locally; hosted build repeats this gate |
| `PAGES_SMOKE=1 npm run test:gameplay` | 4/4 production scenarios | Production game, helper navigation, statuses/search, deep links and unchanged save bytes |
| `npm run format:check` | Passed | Includes helper HTML, source, scripts and tests |
| `npm run roadmap:check` | Passed | Generated Markdown is the exact same catalogue as the website |
| Independent code, factual and visual review | Approved, no open scoped findings | [Review record](independent-review.md) |

The 98 rule/content/helper tests are a subset of the full 102; production helper journeys reuse browser cases. Do not add these counts into a combined total. Physical-device and non-Chromium acceptance remain pending.

The optional source/review/runtime art archives were downloaded through the existing restoration command and verified against the committed SHA-256 manifest before extraction. This enabled all existing exact-pixel and provenance tests in a fresh worktree. No new native-tool run, painting or art approval is claimed. The public helper reuses the reviewed WebP tavern illustration and material textures without changing them.

Corrections during verification:

- The first new filter test exposed an ambiguous exact-label query; the select now carries an explicit accessible Status label.
- At 360px and 200% text, the long roadmap heading overflowed. Headings now wrap long words rather than hiding overflow. The production narrow/text-scale test passes.
- The first full browser run passed 37/38; the new overview test sampled an image before its network decode completed under nine workers. The test now waits for actual image completion and nonzero dimensions. The unchanged complete suite then passed 38/38. [Initial run](gameplay-initial.txt).
- The source-evidence test honors each item's optional immutable revision rather than always checking the default baseline.

Inspected screenshots: [desktop overview](../screenshots/development-overview-desktop.png), [390px roadmap](../screenshots/development-roadmap-mobile.png). Existing historical game screenshots produced by the broad suite were restored to their prior committed bytes. Only the new helper evidence is included in this change.

Existing Vite warnings concern future native-config JSON import attributes and the large Three.js game chunk. The helper has a separate module and does not load Three.js or game-save code. These warnings were not suppressed.

GitHub CI, final commit identifiers and public deployment readback are recorded separately after publication; the local results above are not a claim of 1.0 acceptance.

Retained terminal logs normalize trailing spaces and final blank lines only; result text and counts are unchanged.
