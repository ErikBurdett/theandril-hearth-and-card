---
name: hearth-card-design
description: "Design and balance Theandril: Hearth & Card card sets, 100-card decks, Hero abilities, booster rarity sheets, and tactical battles within Theandril lore. Use for card-content and TCG rules changes, not ordinary tavern UI or character art."
---

# Hearth card design

Read `src/content/catalog.ts`, the relevant simulation module, and `docs/WORLD_AND_SETS.md` before altering an existing mechanic. The user's current format is 100-card constructed, 20 starting health, with resources producing mana and Heroes occupying the devotion-permanent role. Do not silently impose Commander singleton rules.

For source-backed design lessons, read [research](references/research.md). Treat them as design inputs; never claim our simplified engine implements the comprehensive Magic rules.

## Set design

Give each release a historical question, two primary mana aspects, a primary archetype, a secondary strategy and bridge cards useful outside the set. Start with a mechanical skeleton: curve, creature/noncreature ratio, interaction, fixing, enablers and payoffs. Named reskins with identical rules are not substantial set expansion.

Commons must teach the mechanic and supply playable early creatures, answers and fixing. Uncommons should signal a strategy or connect strategies. Rares and mythic Heroes may be unusual build-arounds; rarity alone is not permission to invalidate ordinary answers. Basics use unlimited deck copies; special resources must pay for flexibility with entering tapped or a comparable explicit cost. Preserve stable collector IDs when expanding old releases.

For each supported archetype, author a line of play, a credible counterplay, and a reason to combine two releases. Favor timing decisions, combat tricks, recursion with limits, resource tradeoffs and attack/block choices. Do not add rules text without an executable effect and a meaningful test.

## Decks and battles

Use a starting 38–42 resources per 100 cards and adjust against curve and actual mana-source requirements. Show colored sources separately from generic costs; two-color resources are alternatives, not two simultaneous mana. Evaluate early resource drops, affordable spells and hand quality over many seeds. Supply useful ordinary-card decks so collecting mythics is optional.

Preserve timing: one resource per turn; tapped resources; summoning sickness; non-instant casting at main-phase empty-stack timing; opponent response opportunities; targets rechecked on resolution; simultaneous combat; tapped blockers illegal; blocked attackers remain blocked after removal; Hero loyalty costs paid on activation and one activation per Hero per turn. State-based deaths are independent of visuals. Name any rules simplifications explicitly.

AI uses the same payment, targets, casts and combat functions as the player and does not inspect the player's hand or draw pile when choosing actions. Test attack/block interaction, lethal responses, countered spells, removed targets, mana empties, Hero loss, and save continuation with a nonempty stack.

## Packs and economy

Define slots in data, not a single rarity roll. Distinguish conditional per-slot odds from pack-wide odds. Foil is treatment, not rarity. Every slot must have a nonempty eligible sheet in every set. Preserve seeded pack outcomes and inventory conservation; rejected actions never consume a booster. Show the odds in the opening screen.

Run exact slot tests and a seeded statistical sample large enough to check the configured probabilities. Check that guaranteed pack buyback does not exceed wholesale cost. Do not describe a sampled proportion as a guaranteed drop rate.

## Validation

Run content validation, unit tests, deterministic battle/save tests, pack sampling and browser play. Compare at least two meaningfully different deck strategies before claiming tactical variety; label prototypes and balance limits honestly. Update implementation status with counts, active mechanics, schema migration and actual evidence.

Player-facing skill names are Skyborne, Quickstep, Steadfast, Hearthbond, Doommarked, Overrun and Highguard. Use exhausted/ready and Hero devotion. Keep stable engine keys compatible; `src/content/wording.ts` maps presentation. Prepared recipes require every owned copy and must show missing-copy counts before selection.

## Card presentation

For card frames, table usability and motion, apply `../hearth-visual-design/SKILL.md`. Render a painting once inside its art window; never use the same art as the surrounding card background. Keep rules and costs on readable material plates, outside the illustration. Retain timing/target semantics while changing visual feedback.
