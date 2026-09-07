# Lightweight deployment evidence

September 7, 2026 local production build:

- 724 runtime PNGs: **140,507,502 bytes** before encoding.
- Lossless WebP derivatives: **24,143,326 bytes**, **82.8% smaller**.
- All alpha values and every nontransparent RGB pixel compared equal after decoding. Resolution and visible artwork remain unchanged. This saves transfer/storage, not decoded GPU texture memory.
- Full `dist` is approximately **26 MiB**, including 640 card illustrations. JS totals about 1.03 MB uncompressed / 291 KB gzip; CSS about 126 KB / 28 KB gzip. These are build-size measurements, not device frame-rate claims.
- Initial room loading no longer prefetches hall and bar textures. Each loads when its upgrade is needed. Cards already use lazy image loading and async decoding; the renderer already caps frame frequency, pauses in hidden tabs and limits pixel ratio.
- The production build verifies derivative hashes and omits original runtime PNGs. The source/provenance release remains separate and checksum-pinned. No runtime call to an image generation service is needed.

`assets/art/optimized-manifest.json` contains every source/output hash, visible-pixel hash and byte count. `scripts/optimize-assets.mjs` performs reproducible encoding and comparison with ImageMagick. `src/content/runtime-assets.test.ts` checks every published derivative and complete card coverage in normal CI. The full audit additionally verifies approved PNG sources after restoring the optional archives.

`tests/browser/pages.spec.ts` exercises the actual built app under a project subpath; ordinary gameplay tests cover desktop/mobile card viewing, packs, battles, upgrades and persistence. Further release work: real slow-device profiling, long-session memory/texture lifecycle measurements, and measured bundle splitting if startup CPU becomes a problem. Lossy art, resolution reduction and aggressive caching were not introduced to meet a size target.
