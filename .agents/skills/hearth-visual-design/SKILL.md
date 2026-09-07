---
name: hearth-visual-design
description: Design and review Theandril Hearth & Card interfaces, card frames and motion using aged parchment, bound leather, carved timber and restrained gilding. Use for this project's visual and interaction work.
---

# A playable tome inside the tavern

Read `src/ui/tome-materials.css` for shared material tokens and `docs/art/WORKFLOW.md` before creating raster assets. Reuse reviewed ornaments from `public/art/animation`. New illustrations go through the existing source/prompt, candidate, visual review and exact-hash factory workflow.

## Material hierarchy

- The room is timber and candlelight; the battlefield is a dark walnut playmat with a wooden rim. Keep targets and resources legible on it.
- Menus feel like bound volumes: leather edges, aged parchment writing surfaces, restrained gilding, dark brown ink. Use patina around edges, not noise over text.
- Buttons feel like embossed tabs or small plaques. Primary actions get brighter brass edges; selected, disabled, danger and legal-target states remain distinguishable without relying solely on color.
- Cards are thick printed objects: beveled edges, layered paper shadows, parchment titles/rules and a dark recessed art window. Rarity and mana colors are accents, not opaque tints over the painting.

## One painting, one presentation

Render each card painting exactly once in `.full-card-art`, with `object-fit: contain`. Do not repeat it as the outer card's CSS background or as a blurred fill behind it. The frame is a material, not a second illustration. Borders stay outside the painting. Check collection, pack haul, hand, permanent, hover and inspection contexts.

A custom hover reader replaces a native `title` tooltip on the same target. Keep short accessible names and keyboard inspection. Preview placement must leave action controls and the selected target usable.

## Weight and motion

Use a short lift with a growing contact shadow on hover/focus, a smaller downward press on activation and a restrained settle after dealing. Preserve existing drag, target and combat transforms; never apply a blanket transform to every nested button. Ambient sprite loops remain separate from rule/state updates. Honor reduced motion and stop decorative loops where practical when hidden.

## Review at player scale

Inspect a 1366×768 battle, a dense battlefield, a card preview, collection/pack screens and a 390-pixel portrait view. Verify actual geometry and loaded images, not only presence of labels. Check contrast on parchment, non-overlapping ornamentation and cards with long rules. Existing browser tests cover all 640 art URLs; keep them enforcing a single painting rather than a duplicated face background. Run the project-required checks before handoff. Keep authored content and remaining visual limitations honest.

## Material assets and hospitality usability

Use the reviewed `public/art/materials/parchment.png` and `wood.png` with quiet translucent ink backings for dense text. Keep interface surfaces in cream, walnut, ochre and brass; do not reintroduce green mats, selected tabs, dock panels or status backgrounds. Aspect colors inside card symbols and colors intrinsic to paintings are content, not menu surfaces. UI materials stay outside the sprite atlas. `scripts/ui-art.ts` retains source/prompt, factory palette processing and exact-hash reviews.

Recipes need a visible missing-input or prerequisite explanation, a searchable/filterable menu, and a costed shortcut to buy missing raw ingredients. Never silently purchase cooked ingredients or skip fermentation. Upgrade descriptions must state their real simulation benefit and distinguish equipment refits from illustrated new wings. Mission counters advance on completed events, never animations or reload.
