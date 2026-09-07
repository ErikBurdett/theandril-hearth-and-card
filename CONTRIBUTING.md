# Contributing

Welcome to Theandril: Hearth & Card. This is a playable pre-1.0 game; focused fixes, accessibility improvements, balance reports and carefully scoped additions are welcome. Read [release readiness](docs/RELEASE_READINESS.md) and [project rules](AGENTS.md) first. Open a proposal before a large feature or content expansion.

## Run locally

Use Node 24 (minimum 22.12), Git and pnpm 10.32.1. Install pnpm through your preferred version manager or `npm install --global pnpm@10.32.1`.

```sh
git clone https://github.com/ErikBurdett/theandril-hearth-and-card.git
cd theandril-hearth-and-card
pnpm install --frozen-lockfile
pnpm dev
```

Visit http://127.0.0.1:5174. Optimized runtime art is included; normal development requires no image API, Blender, Python or art-source download. Save data lives in browser storage. Use the game's JSON export before experimenting with saves. Local and hosted games have separate saves; use export/import to transfer them.

## Checks

```sh
pnpm test:rules
pnpm build
pnpm format:check
pnpm exec playwright install chromium
CI=1 pnpm test:gameplay
```

CI uses Playwright's managed Chromium. For a custom local Chromium, set `PLAYWRIGHT_CHROMIUM_PATH`; the original workstation defaults to `/usr/bin/chromium`. Linux browser dependencies may require `pnpm exec playwright install --with-deps chromium`.

A production path check catches artwork URLs that work locally but fail on Pages:

```sh
VITE_BASE_PATH=/theandril-hearth-and-card/ pnpm build
CI=1 PAGES_SMOKE=1 pnpm test:gameplay
```

Use the frozen lockfile. Commit intentional dependency updates with `pnpm-lock.yaml`. CI runs untrusted PR code with read-only permissions; only successful main-branch checks trigger deployment.

## Art contributions and full audits

Read [the art workflow](docs/art/WORKFLOW.md). Reviewed runtime exports, manifests and briefs are in Git. Full-resolution originals, approved runtime PNGs and candidate/review pixels are in the immutable `art-v0.1.0` release, avoiding a multi-gigabyte clone. Restore into a clean checkout with Node and `tar`:

```sh
pnpm art:restore
pnpm test
pnpm art:coverage
```

The restore downloads about 2 GB and verifies committed SHA-256 checksums before extraction. It preserves existing files and stops on conflicts; use a clean clone for repeat audits. `pnpm test` includes source-dependent art tests; use `pnpm test:rules` for ordinary changes without the bundle. The manual full-art Actions workflow runs the same restore and audit.

Do not regenerate or reapprove unrelated art. Include source/prompt and candidate hashes for changed assets; attach large source bundles to the PR or a linked release, with checksums. A maintainer incorporates approved provenance into a new versioned archive manifest. Never replace a released archive in place. Generated art must be disclosed; generation success is not visual approval.

## Review expectations

Keep rules pure and deterministic under `src/sim`; React and Three.js present state. Test invalid-command conservation and save compatibility for economy/rules changes. Check desktop and 390px layouts, keyboard operation and reduced motion for interfaces. Public asset paths must go through `assetUrl`; CSS assets are rewritten by Vite.

Use [the visual-design skill](.agents/skills/hearth-visual-design/SKILL.md) for parchment/walnut surfaces and card framing. Canonical lore sources are snapshotted in `docs/lore`; new tavern inventions must be identified as adaptations. Never copy third-party card art or rules text into the catalog.

Submit a small PR with purpose, tests and screenshots as needed. The maintainer reviews and merges; passing tests do not establish balance or 1.0 readiness. By submitting, you agree your contribution can be distributed under the applicable licenses in [LICENSE](LICENSE) and [ASSET_LICENSE.md](ASSET_LICENSE.md). No separate CLA is required.

## Asset optimization

`pnpm art:optimize` requires ImageMagick with WebP support and the restored PNG archives. It losslessly encodes every runtime PNG, decodes both versions, verifies alpha and every visible RGB pixel, and records input/output hashes. Commit changed WebPs and `assets/art/optimized-manifest.json`; preserve approved PNGs in the next provenance bundle. Normal builds verify all derived file hashes and exclude duplicate PNGs from `dist`. Never replace this with lossy defaults without a separate visual review.
