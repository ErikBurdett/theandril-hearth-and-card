# Testing method

The tests are a tool for finding defects at the cost the project can afford, not
a ritual. This page says what runs when, what each tier is for, and what is
deliberately not done. Keep it honest when a tier changes.

## Tiers

| Tier                | Command                               | What it covers                                                                                                 | Cost on a quiet machine                           |
| ------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Checks              | `npm run check`                       | Prettier, the roadmap ledger, TypeScript and the whole Vitest suite (rules, saves, content, art provenance).    | About 16 s; the unit suite alone is 12 s.         |
| Smoke               | `npm run test:smoke`                  | Six Chromium scenarios tagged `@smoke`: the tavern scene, the shop loop with a real checkout and save reload, a duel's drag and targeting, the phone menu and local saving, the card catalogue's paintings, and the development helper. | About 30 s at two workers.                        |
| Covering specs      | `npx playwright test tests/browser/<file>.spec.ts` | The spec files whose names match the feature you changed. Run these, not the suite.                 | 10–60 s per file.                                 |
| Ordinary suite      | `npm run test:gameplay`               | Every Chromium scenario, one representative per equivalent case (55 scenarios, 17 files).                       | About 2 min at two workers.                       |
| Review run          | `npm run test:screenshots`            | Every equivalent case (each viewport width, each folio: 64 scenarios) and a refresh of `docs/screenshots`.     | About 3 min at two workers, plus image inspection. |
| Deployment path     | `PAGES_SMOKE=1 npm run test:gameplay` | Four scenarios against the production build at the GitHub Pages sub-path; `PAGES_SMOKE_URL=…` against the live site. | Under 10 s.                                       |
| Firefox             | `npm run test:firefox [files]`        | The same scenarios in Playwright's Firefox build, one file at a time with one worker (WebGL and drag scenarios skip). | About 8 min for every file.                       |
| Diagnostics         | `scripts/balance.ts`, `scripts/economy.ts`, `scripts/performance.ts` | Dated reports under `docs/reports/`. Evidence for a decision, never a gate.                    | 1–15 min each.                                    |

## What runs when

- **While developing a slice**: Checks, then the covering spec files. Nothing else.
- **Before a commit**: Checks and Smoke. Add the covering specs if the slice changed what they cover.
- **Before a publish**: Checks, `npm run build`, the Ordinary suite once, then the deployment-path smoke before and after `npm run deploy:pages`, and `scripts/capture-save.ts` for the published build's save fixture.
- **At a release checkpoint the owner agrees to**: the Review run (inspect the refreshed images and commit only intended evidence), Firefox, and whichever diagnostics the decision needs.
- **Continuous integration**: Checks and the Pages build only. Browser scenarios are verified locally because Actions minutes are limited; the deployment-path smoke runs locally against the same build the publish ships.

## Rules of weight

- One heavy job at a time. Never run two browser suites, or a suite and a diagnostic, together. Check `free -g` first on this shared machine.
- Two Playwright workers locally (`PW_WORKERS=1` when memory is tight); no retries. The config enforces both.
- Do not rerun a suite to chase a timeout to green. A failure that does not reproduce in the covering spec on a quiet machine is load, not a defect; note it and move on.
- Prefer deleting or merging a test to adding one. A new regression test covers the defect in the smallest layer that can see it: a rule in Vitest, a layout or interaction in the covering spec, never a new spec file for one case.
- Never weaken an assertion or raise a timeout to pass. Fixed waits (`waitForTimeout`) are replaced with `expect.poll` when touched.
- Equivalent cases (the same assertions at several widths, the same flow for each folio) run once in ordinary runs through `reviewCases` in `tests/browser/screenshots.ts` and in full only in the review run.
- Ordinary runs take no documentation screenshots. `docScreenshot` is a no-op outside the review run; failures keep their own screenshot and trace through the config.

## Counts

Counts are not a target. The ordinary suite is 55 Chromium scenarios because that is what the game's player-facing surfaces need, not because 64 was too many or 40 would be enough. When a surface is removed, remove its scenarios.
