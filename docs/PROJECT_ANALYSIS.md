# Reference project analysis

## Theandril

Installed to `../Theandril` with its pinned pnpm 10.32.1 and frozen lockfile. Initially inspected commit `cb068f8198c97d91ead7d0600b34090ea64569b6`; pulled to `d7e5051` at the user's request. The new commit includes The Book of Broken Roads, military transport changes, and character skills. The source checkout was clean after pulling; no fixes were made to it.

Theandril uses a pnpm/Turbo workspace, React UI, PixiJS presentation, deterministic headless simulation, typed content, persistence/replay, and testable command boundaries. Its real art pipeline includes Zod manifests, strict PNG decoding, palette validation, provenance, source/provider adapters, Aseprite/Pixel Snapper adapters, exact reviewed-pixel receipts, and deterministic atlas packing with padding/extrusion. This actual code and selected retained approvals are reused here; the PixiJS renderer and grand-strategy game rules are not carried over.

The initial commit passed typecheck and 458 tests across 52 files. After the requested update, a new validation pass observed **421 passing and 63 failing tests across 53 files**. Typecheck fails at `packages/sim/src/characters.test.ts:110` because `embark` is not in the current command union. Failures also include migration handling of `waterDepth`/`transports`, movement fixtures, changed army capacity, and art coverage expectations. These are upstream results, not failures in Hearth & Hollow. They should be repaired in a separate Theandril development task; the lore remains useful independently of those regressions.

Historical art status claims Aseprite and Pixel Snapper were installed in the earlier working environment. Live discovery in this session found neither executable. The already retained reviewed exports validate without either tool. This distinction is recorded rather than silently reusing the historical tooling claim.

## Old Python tcg-shop

Downloaded source only to `/tmp/tcg-shop-reference`; never installed dependencies or ran the game. Reviewed its README, module organization, economy rules and product/battle/collection boundaries. Its essential loop is worth preserving: wholesale ordering → shelves/pricing → customers → packs → collection/deck → battles → progression. The old implementation includes staff, fixtures, forecasting, skills, and broader economy UI which are not all present in this first slice.

The rewrite uses one authoritative immutable command transition, integer currency, seeded RNG, explicit card/set IDs, validated save ingress, disposable render resources and browser tests. The small initial state is cloned on command; no premature worker protocol is introduced. A worker/read-model boundary is the next step if profiling a larger customer or inventory simulation justifies it.

## Rendering decision

The user requested Three.js with the same 2D art factory. The first scene is intentionally 2.5D: an orthographic illustrated room with sprite patrons, rendered by Three.js, with React management screens. It is not yet a freely navigable 3D interior or furniture-placement game. The current slice adds individual customers on an authored aisle graph: arrival, browsing, checkout, purchase, and departure. A fixed-step room simulation owns their movement and sales. Static sprite poses translate along those paths; there are no walk cycles or full 3D furniture collision meshes. The room remains mounted beneath contextual management panels.

Official API references inspected during implementation: https://threejs.org/docs/ and https://vite.dev/guide/ . Installed library types and the lockfile are the implementation authority.
