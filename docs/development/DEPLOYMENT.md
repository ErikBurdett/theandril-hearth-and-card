# Development helper publication · September 12, 2026

The functional helper and roadmap were published from main at [`bae1c4c`](https://github.com/ErikBurdett/theandril-hearth-and-card/commit/bae1c4c27a6c571c93af5d2fa9d84b5fc7709a25).

- [Hosted Checks passed](https://github.com/ErikBurdett/theandril-hearth-and-card/actions/runs/34723245367).
- [Publish game / Pages passed](https://github.com/ErikBurdett/theandril-hearth-and-card/actions/runs/34723494221).
- The public [development overview](https://erikburdett.github.io/theandril-hearth-and-card/updates/), [roadmap](https://erikburdett.github.io/theandril-hearth-and-card/updates/roadmap/), [change ledger](https://erikburdett.github.io/theandril-hearth-and-card/updates/changes/) and existing game were verified in Chromium.
- Final live checks: **4/4 passed in 23.3 seconds**. [Live log](live-browser.txt). The helper's local-save isolation, status/query persistence, direct links, keyboard/narrow layouts, game links, card art and materials all passed.

The first live invocation passed the three helper scenarios but exposed an existing game smoke test that sampled a card's dimensions before its remote image had loaded. The test now waits for completed loading while retaining the exact 256-pixel width assertion. The corrected four-scenario invocation passed against the same deployed game. `PAGES_SMOKE_URL` now selects the production smoke cases and disables the local web server, so this check can be repeated directly:

```sh
PAGES_SMOKE_URL=https://erikburdett.github.io/theandril-hearth-and-card/ npm run test:gameplay
```

This follow-up changes test configuration and records publication; gameplay and the public helper implementation are unchanged. The earlier functional commit/run links remain exact evidence rather than predictions about this reporting commit's hash. The main checkout is synchronized with the published main branch. Existing branch protections were not edited; the authorized main push used the repository's existing maintainer access, and hosted checks completed before Pages publication.

Local acceptance remains [102 unit/content/art tests, 38 gameplay scenarios and 4 production scenarios](VERIFICATION.md), with overlapping cases. This is a pre-1.0 single-player development deployment, with balance, broader browser/device testing and the final scope/acceptance gates still open.
