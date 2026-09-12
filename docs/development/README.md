# The Hearth & Card development helper

The public helper lives at [Development journal](https://erikburdett.github.io/theandril-hearth-and-card/updates/), with a [roadmap](https://erikburdett.github.io/theandril-hearth-and-card/updates/roadmap/) and [change ledger](https://erikburdett.github.io/theandril-hearth-and-card/updates/changes/). The in-game Ledger and phone menu link to it. Each has a static HTML entry, so refreshes and direct links work on GitHub Pages. The helper does not mount the game or open its save storage.

## Updating a feature

1. Change the canonical implementation and verify the player behavior.
2. Update `src/development/roadmap.ts`: retain stable item IDs, name the working behavior, assign Completed / In progress / Pending, and state the remaining acceptance or completion boundary. In progress means a partial implementation, not an active staff assignment. Keep proposed later ideas separate from required release work.
3. Link the exact reviewed source revision and evidence. Existing gameplay claims are pinned to `841cd94`; the new helper's own source links use main. Move an item to Completed only when its named behavior is verified, and never infer overall release acceptance from a demo deployment.
4. Run `npm run roadmap:build` to update `docs/ROADMAP.md`. The website and Markdown use this single catalogue. `npm run roadmap:check` and the unit suite reject drift.
5. Update the current section of `docs/IMPLEMENTATION_STATUS.md` and release acceptance in `docs/RELEASE_READINESS.md`. Add a plain-language reviewed dispatch to the overview when the change deserves explanation. Preserve dates and limits on historical evidence.
6. Run `npm test`, `npm run build`, `npm run format:check` and `npm run test:gameplay`. For a fresh art-audit checkout, restore the optional checksummed archives with `npm run art:restore` before the full `npm test`; ordinary CI runs `test:rules` without the large source archive.

## Change tracking and publication

`npm run site:build-data` derives `src/development/changes.json` from the current branch's full first-parent Git history. It records exact SHAs, authored dates, full messages and changed paths grouped by area. Merges compare to their first parent. Messages render as React text, never executable HTML. The snapshot is checked against a contiguous suffix of real history so committing the generated feed does not create a self-reference loop.

Production build regenerates the feed; both CI and Pages check out full history. Shallow history is rejected rather than presented as a complete ledger. A new commit appears on the next deployed build automatically. No API token, browser GitHub request or private service is involved.

The game stays at `/theandril-hearth-and-card/`. The helper's three HTML entries share only their own React module and styles. Existing reviewed runtime WebP materials and the tavern illustration are reused without changing their pixels; the hero caption identifies it as an illustration rather than a gameplay screenshot.

For deployment-path verification:

```sh
VITE_BASE_PATH=/theandril-hearth-and-card/ npm run build
PAGES_SMOKE=1 npm run test:gameplay
PAGES_SMOKE_URL=https://erikburdett.github.io/theandril-hearth-and-card/ npm run test:gameplay
```

The browser scenarios exercise filtering, empty states, status persistence, direct links, keyboard disclosures, desktop/phone layout, enlarged text, source links, in-game navigation and unchanged local save bytes. New screenshots are retained under `docs/screenshots/development-*`. CI remains the normal checks-to-Pages pipeline; source archives remain outside the deployed bundle.
