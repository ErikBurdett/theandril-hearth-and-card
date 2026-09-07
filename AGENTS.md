# Theandril: Hearth & Card project rules

This project is a fresh Three.js card-shop simulator in Theandril's world. Read README.md and docs/IMPLEMENTATION_STATUS.md before working.

- Game rules and canonical state belong to src/sim. UI and renderer issue commands and consume snapshots. Never decide sales, damage or turn order in animation callbacks.
- Use stable content IDs, explicit schemas, seeded randomness and integer currency. Rejected commands must leave state untouched. Preserve save compatibility or add a deliberate migration.
- Read docs/WORLD_AND_SETS.md and the relevant lore chapter before adding history. Do not resolve the book's disputed origins, magic mechanisms, or Ashfall causes as fact. New tavern characters and card adaptations must be identified as additions.
- Reuse the vendored art factory. Candidates are not approvals. Preserve original sources, exact review hashes, evidence, editable source when available, and deterministic atlas output. Never fabricate native-tool runs or provider metadata. See docs/art/WORKFLOW.md.
- Use nearest sampling and no mipmaps for the packed sprite atlas. Dispose owned Three.js resources. Keep world art separate from readable DOM text and controls.
- Verify rule changes with meaningful unit tests and determinism/save tests. Verify player-facing changes in Chromium and inspect desktop/mobile screenshots. Run npm test, npm run build and npm run format:check before handoff.
- Keep docs/IMPLEMENTATION_STATUS.md honest. Distinguish the playable slice from a complete simulator, shared set motifs from bespoke card art, and proposed content from canonical lore.
- Do not alter the sibling Theandril checkout, publish, or overwrite the old Python repository as a side effect of routine development.

For set, deck, pack or battle work, apply `.agents/skills/hearth-card-design/SKILL.md` and its research reference.

For release-completion or full card-art catalog work, apply `.agents/skills/hearth-release-finish/SKILL.md`.

For interface, card-frame or animation styling, apply `.agents/skills/hearth-visual-design/SKILL.md`.
