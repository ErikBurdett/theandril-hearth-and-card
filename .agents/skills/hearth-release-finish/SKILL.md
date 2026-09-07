---
name: hearth-release-finish
description: Finish Theandril: Hearth & Card release work with per-card art coverage, playable feature acceptance checks, save compatibility and honest 1.0 readiness evidence. Use when developing this game toward a release or completing its card-art catalog.
---

# Hearth release finish

Work in the Theandril: Hearth & Card checkout. Read its AGENTS.md, implementation status, art workflow and card-design skill before changing content or rules. Preserve the user's chosen scope; “toward 1.0” is not permission to publish or replace the old Python repository.

## Make completion measurable

Track requested outcomes in `docs/RELEASE_READINESS.md`, including executable evidence and remaining defects. A feature is complete only when its normal player flow works, reload retains relevant state, rejected commands conserve inventory/currency, and desktop/mobile controls are reachable. A roadmap, disabled button, generic placeholder or passing build alone does not complete a requested feature.

For broad release work, implement and verify concrete player-facing features while recording the remaining 1.0 work. Do not label the game 1.0 while known release blockers remain. Do not turn a request to continue development into an unbounded rewrite of unrelated systems.

## Card art contract

Enumerate the live catalog before commissioning art. Each brief must record stable card ID, title, type, rules-driven action, set setting/era, source chapter, and the boundary between canon and interpretation. Keep the subject recognizable at small size; artifacts need an object, spells need an event, creatures and Heroes need an appropriate subject in a setting.

Full-art uses a distinct complete painting with legible name/rules/collector overlays. Fit the complete painting inside the art area with aspect ratio preserved; never crop its subject to fill a frame. Decorative borders must not cross the art. A small sprite on a colored field is not full art. Check collection, packs, inspection, hands and battlefield contexts, including hover previews on crowded laptop tables.

When distinct art is requested, each card needs a distinct authored composition and retained source. Recoloring, cropping, changing a filename or overlaying a symbol on one shared picture does not meet that requirement. Shared art must be explicitly permitted and counted separately. Coverage checks must report missing, shared, unreviewed and stale assets, not merely count nonempty URLs.

Use the existing Theandril factory for deterministic processing and exact-hash approvals. Review the actual processed images, using readable contact sheets for triage and individual inspection for uncertain subjects. Never auto-approve generation success. Preserve prompts and source bytes. Native-tool provenance may be claimed only for tools actually run.

## Verify the player experience

Use pure commands for state changes. Test meaningful boundaries: ownership and copy limits, invalid actions, migration, timing and one-time rewards. Browser checks should exercise actual controls, inspect images for successful loading, and test geometry/hit targets—not just text presence. Make focused fixes to observed issues and rerun affected checks.

Before handoff run the project-required tests, build and formatting. Update the readiness record with actual counts, reviewed screenshots and art coverage. Keep omissions visible; never describe partial art coverage, shared pictures or diagnostic balance as a completed bespoke catalog or balanced release.
