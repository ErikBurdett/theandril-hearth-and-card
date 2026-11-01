# The Hearth & Card development helper

The public helper lives at [Development journal](https://erikburdett.github.io/theandril-hearth-and-card/updates/), with a [roadmap](https://erikburdett.github.io/theandril-hearth-and-card/updates/roadmap/) and [change ledger](https://erikburdett.github.io/theandril-hearth-and-card/updates/changes/). The in-game Ledger and phone menu link to it. Each has a static HTML entry, so refreshes and direct links work on GitHub Pages. The helper does not mount the game or open its save storage.

## Updating a feature

1. Change the canonical implementation and verify the player behavior.
2. Update `src/development/roadmap.ts`: retain stable item IDs, name the working behavior, assign Completed / In progress / Pending, and state the remaining acceptance or completion boundary. In progress means a partial implementation, not an active staff assignment. Keep proposed later ideas separate from required release work.
3. Link the exact reviewed source revision and evidence. Earlier gameplay claims are pinned to `841cd94`; the initial Living Cultures release is pinned to `b039bd3` and its full 80-card expansion to `53f7501`. The helper's own source links use main. Move an item to Completed only when its named behavior is verified, and never infer overall release acceptance from a demo deployment.
4. Run `npm run roadmap:build` to update `docs/ROADMAP.md`. The website and Markdown use this single catalogue. `npm run roadmap:check` and the unit suite reject drift.
5. Update the current section of `docs/IMPLEMENTATION_STATUS.md` and release acceptance in `docs/RELEASE_READINESS.md`. Add a plain-language reviewed dispatch to the overview when the change deserves explanation. Preserve dates and limits on historical evidence.
6. Run `npm run check`, `npm run build` and `npm run test:smoke`, plus the spec files that cover the change (see [TESTING.md](TESTING.md)). For a fresh art-audit checkout, restore the optional checksummed archives with `npm run art:restore` before the full `npm test`; ordinary CI runs `test:rules` without the large source archive.

## Change tracking and publication

`npm run site:build-data` derives `src/development/changes.json` from the current branch's full first-parent Git history. It records exact SHAs, authored dates, full messages and changed paths grouped by area. Merges compare to their first parent. Messages render as React text, never executable HTML. The snapshot is checked against a contiguous suffix of real history so committing the generated feed does not create a self-reference loop.

Production build regenerates the feed; both CI and Pages check out full history. Shallow history is rejected rather than presented as a complete ledger. A new commit appears on the next deployed build automatically. No API token, browser GitHub request or private service is involved.

When preparing a pull request, retain a committed feed snapshot from the shared main history. A local feature-branch build also includes that branch's unpublished commits; keep those generated entries out of the committed snapshot, since GitHub's PR merge uses main as its first parent and a squash merge replaces the branch commits. The history test deliberately checks this boundary. The production build includes the actual resulting main commit in the live feed.

The game stays at `/theandril-hearth-and-card/`. The helper's three HTML entries share only their own React module and styles. Existing reviewed runtime WebP materials and the tavern illustration are reused without changing their pixels; the hero caption identifies it as an illustration rather than a gameplay screenshot.

## Publishing without Actions minutes

The live site is served from the `gh-pages` branch (Pages source: branch, legacy build). Publish a verified build locally:

```sh
npm run check
VITE_BASE_PATH=/theandril-hearth-and-card/ npm run build
npm run test:gameplay
PAGES_SMOKE=1 npm run test:gameplay
npm run deploy:pages
PAGES_SMOKE_URL=https://erikburdett.github.io/theandril-hearth-and-card/ npm run test:gameplay
npx tsx scripts/capture-save.ts <published sha>
```

`scripts/capture-save.ts` plays a representative game through the public commands of the published source (a delivery, a day's trade, a pack, a skill, a prepared recipe and a duel in progress) and writes `src/sim/fixtures/published-<sha>-save.json`; `src/sim/published-saves.test.ts` loads every such fixture on every later build, so a schema change must migrate them on purpose. Commit the fixture with the publish record in `docs/IMPLEMENTATION_STATUS.md`.

`scripts/deploy-pages.sh` refuses a dirty tree or a build made for another base path, copies `dist` into a temporary worktree on `gh-pages`, adds `.nojekyll`, and records the source commit in the publish commit. The `Publish game` workflow remains available by manual dispatch for a return to Actions-built Pages.

For deployment-path verification:

```sh
VITE_BASE_PATH=/theandril-hearth-and-card/ npm run build
PAGES_SMOKE=1 npm run test:gameplay
PAGES_SMOKE_URL=https://erikburdett.github.io/theandril-hearth-and-card/ npm run test:gameplay
```

The browser scenarios exercise filtering, empty states, status persistence, direct links, keyboard disclosures, desktop/phone layout, enlarged text, source links, in-game navigation and unchanged local save bytes. Ordinary runs take no documentation screenshots. To refresh the reviewed `docs/screenshots/development-*` evidence explicitly, run `npm run test:screenshots -- tests/browser/development.spec.ts` and inspect the result. CI remains the normal checks-to-Pages pipeline; source archives remain outside the deployed bundle.

## Test weight

What runs when, and the rules that keep the suite light on this shared machine, are in [TESTING.md](TESTING.md): checks and the covering spec files while developing, the six-scenario smoke tier before a commit, the ordinary Chromium suite once before a publish, and the review run, Firefox and diagnostics only at an agreed checkpoint.

## Diagnostics

Three scripts write dated reports under `docs/reports/`; none is a certification.

- `npx tsx scripts/balance.ts` — the duel matrix: every recipe against the next three from both seats, or against every other with `BALANCE_MATCHUPS=all`, against the guest personality that pilots it, with the in-game autoplay in the keeper's seat. `BALANCE_RECIPES` limits the keeper's recipes, `BALANCE_OPPONENTS` fixes a rival panel (the way to measure a tuning pass before and after), `BALANCE_MATCHUPS` widens the ring, `BALANCE_SEEDS` and `BALANCE_OUT` adjust the sample and path. About fifteen minutes for the full matrix.
- `npx tsx scripts/balance-trace.ts <recipe id>` — why a recipe loses: the recipe against every other from both seats with the matrix's seeds, then the losses' end states (resources on both sides, cards left in hand by cost and by name, the rival's remaining health); `TRACE=1` adds a turn-by-turn line per lost duel; `BALANCE_SEAT=rival` seats the recipe as the rival instead, piloted by its guest or its deck's style against every other recipe in the keeper's autoplay, reproducing a round-robin column in about a minute.
- `npx tsx scripts/economy.ts` — the shop loop: four scripted keepers run thirty days through the public commands at the interface's pace and record income, costs, stock, missed sales and progression per day. `ECONOMY_DAYS`, `ECONOMY_SEEDS` and `ECONOMY_OUT` adjust it. Under a minute.
- `npx tsx scripts/performance.ts --check` — the production build in headless Chromium with network throttling, against the proposed delivery budget. See `docs/PERFORMANCE.md`.
