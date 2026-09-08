# Battle polish proposal

Status: the first release described below is implemented, with initial combat connections, casualty forecasts, cleanup choices, draws, public presentation events, optional synthesized audio and shared response/attack evaluation also included. This document retains the broader roadmap; it is not a claim that every later milestone is finished.

Still planned: independent attacker destinations, multiple blockers and ordered damage allocation; separately queued respondable triggers; configurable phase-stop skipping (the current opponent flow already pauses between actions); six fully differentiated AI personalities and broader balance tuning; authored tutorial encounters and persistent per-rival rematch histories. The practice panel currently provides instructions, not scripted lessons. See `CARD_RULES.md` for the exact implemented custom format.

## Direction

Make the card table feel like a physical, responsive game inside Erilian's tavern. Compete on tactical clarity, fair collection progression, memorable rivals and a coherent world. Arena is a useful reference for interaction quality; Theandril's setting, artwork and terminology remain its own.

The existing foundation includes 100-card decks, resource mana, 20 starting health, an instant/spell stack, Heroes, direct spell targeting with confirmation, attack/block selection, a combat forecast, persistent battles, and autoplay takeover. Twenty NPCs now use eighteen deck lists. We should improve the quality of these decisions before expanding the rules catalog again.

## Confirmed gaps

- `src/sim/battle.ts`: passing with a nonempty stack resolves an item immediately. There is no explicit priority owner and consecutive-pass protocol. Automatic triggers apply directly. These simplifications limit response sequencing; automatic advancement needs a stronger timing model first.
- `src/ui/BattleTable.tsx`: contextual controls exist but several primary-looking actions can coexist. Target state, legality messages and actions are partly assembled in the UI. A simulation-supplied decision description would keep click, touch, drag and autoplay consistent.
- Desktop dragging uses native HTML drag; touch uses a separate handle. There is no common moving card presentation with a persistent target tether and payment preview.
- The current mobile screenshot shows the action tray occupying a substantial part of the hand region. Card names/stats compete with ornaments and controls. Fitting within the viewport alone is insufficient evidence of comfortable phone play.
- `combatForecast` reports aggregate life/creature losses after assignments with an empty stack. It does not identify each doomed creature, preview every proposed attack, or show which effect changed a stat.
- The opponent AI tends to choose affordable creatures/Heroes and attack with all eligible creatures. Its explicit reaction policy focuses on counterspells. Different deck lists do not yet provide distinct tactical personalities.
- Combat supports one blocker per attacker and a shared attack destination. Cleanup discards automatically from the hand's right edge; simultaneous zero life records a player loss. These should become explicit choices or deliberate published format rules.
- All 540 sampled diagnostic games completed, but adjacent matchup win rates range from roughly 23% to 77%. The small samples and simplified pilot do not establish competitive balance.

## Recommended implementation order

### 1. Reliable timing and one clear next action

Add an explicit priority owner, consecutive passes, and response checkpoints. Resolve an item only after the required passes; reset passes after a new action. Preserve decisions across saves. Define supported trigger sequencing instead of silently mixing immediate triggers with respondable effects.

Expose one dominant action: Confirm spell, Confirm attackers, Confirm blocks, Continue, or End turn. Display a short explanation of who can act and what will happen next. Put concession, autoplay, clock preferences and advanced timing behind a compact table menu.

Offer assisted timing plus Full control and selected phase stops. Assisted timing may skip non-decisions, but must preserve declared stops, meaningful responses and bluffing options. Keep the friendly clock optional and do not run it during inspection, animation-only delays or suspended tabs.

Acceptance: a spell/counter/response chain works symmetrically for player and AI; reloading at each checkpoint preserves the decision; no automatic step consumes a reserved response window.

### 2. One casting interaction across input methods

Use a shared pointer interaction with a lifted card that follows the pointer, a line to the current target, clear legal destinations, and a brief explanation for rejected drops. Tap/click selects the same staged action; keyboard users receive the same targets and confirmation. An invalid drop returns the card without cost.

Keep target confirmation as the default. Show the target name, proposed payment and remaining resources before commitment. Let players adjust sources or preserve a color for a response. Undo staged selections and resource taps only before an irreversible action or newly revealed information.

Acceptance: drag, tap and keyboard produce the same legal command; no accidental cast while scrolling; previews and actual payment agree.

### 3. Readable combat planning

Draw attack/block connections and place predicted damage and defeat markers on the affected cards. Support reassignment and cancellation before confirming. Retain the aggregate forecast, labeled as conditional on the current public board with no further responses.

Allow a destination per attacker, then add multiple blockers with an explicit, documented damage-allocation rule. Add chosen cleanup discards and a genuine drawn result. Each rule expansion needs its own saved-state migration and regression coverage; avoid adding every mechanic simultaneously.

Acceptance: players can identify attackers, blockers, threatened Heroes and likely losses without opening the log; previews never inspect hidden cards or become authoritative battle state.

### 4. A battle layout designed for each screen

Desktop: use the central space for permanents, a compact expandable stack, a bottom hand and a fixed reserved action corner. Inspection should open in a safe region without covering the selected target or action button.

Phone portrait: place a compact action footer outside the hand, keep the hand horizontally browsable, and expose resources as an expandable count strip. Long-press opens inspection; tap selects; a deliberate drag casts. Keep legal targets reachable if rows overflow. Landscape may use a wider table, but should not be required.

Acceptance: verify 360px portrait, a short landscape viewport and 1366×768 with crowded boards. Touch targets remain usable even when visual cards shrink; inspect/close/confirm never compete for the same screen area. Test on actual touch devices as well as browser emulation.

### 5. Animation that explains the rules

Sequence card lift, resource payment, stack arrival, response pause, impact and resulting state changes. Give damage, protection, restraint, healing, recall and Hero abilities distinct, restrained effects. Preserve pixel art with small sprite effects, light and particles. Add card/table sounds and a quiet tavern soundscape with separate volume controls.

Emit ordered simulation events for presentation. Rules determine outcomes; animation displays them and must not own damage, rewards or turn advancement. Support fast animation and reduced motion.

Acceptance: players can explain why a creature died or a spell failed from the visible sequence; skipping animation produces identical saved state.

### 6. Rivals with better decisions

Build a shared legal-action evaluator for the enemy and autoplay, with different strategic weights. Evaluate lethal opportunities, bad trades, defensive resources, protection, counterspell value and Hero pressure. Every decision uses only that side's hand and public information.

Start with six clear personalities across the roster: aggressive, defensive, reactive, recursive, evasive and Hero-focused. Difficulty should change planning quality, not hidden-information access or unexplained bonuses.

Acceptance: scenario tests demonstrate saving removal for a threat, declining a losing attack, protecting lethal and choosing an effective block. Compare both seating orders and expand beyond adjacent-deck diagnostics before drawing balance conclusions.

### 7. Make improvement and collecting part of the tavern story

After a duel, show rewards, any learned recipe, missing copies, and a short explanation of an important visible turning point. Give each guest a challenge, rematch history and a reason to master a different strategy. Add guided practice encounters for instant responses, protection, resource planning and blocking.

Retain the requested 100-card format. Evaluate opening-hand quality, color access and redraw policy before changing resource counts or deck size. Strengthen six to eight archetypes and their counterplay before introducing more sets. Tavern sealed evenings and faction challenges are promising later modes, with separately defined deck rules.

## First release of this work

Scope the next increment to timing, the unified casting interaction, a single main action, payment/target previews, and the mobile hand/action layout. These improvements should make every existing deck feel better. Follow with combat planning and audiovisual events, then AI and matchup tuning.

Suggested acceptance targets, not current measured results: first-time testers complete casting and blocking without coaching; no critical target/action overlap at supported sizes; no lost response windows in scenario tests; battle saves resume every decision state; and routine turns need materially fewer non-decision clicks than today's flow.

A direct competitive online product would additionally require authoritative servers, accounts, reconnect, matchmaking and operational support. Those are a separate product phase; the near-term opportunity is a polished single-player tavern card game with tactical depth.

## Arena references and design inferences

- [Wizards: Smart priority explanation](https://magic.wizards.com/en/news/mtg-arena/announcements-october-27-2025): Arena uses automated priority handling with exceptions and player-selected stops/full control. Inference: assist ordinary play while preserving deliberate response windows.
- [Wizards: 2025.53.0 patch notes](https://mtgarena-support.wizards.com/hc/en-us/articles/43247211334292-Patch-Notes-2025-53-0): automatic payment can be previewed while hovering a spell or ability. Inference: make the proposed resource payment inspectable before casting.
- [Wizards: Bringing battles to Arena](https://magic.wizards.com/en/news/mtg-arena/we-put-battles-on-mtg-arena-what-was-that-like): discusses targeting conventions and context-dependent presentation across hand, battlefield and inspection. Inference: use consistent interactions while adapting card presentation to its current job.
- [Wizards: Mobile interface iteration](https://magic.wizards.com/en/news/mtg-arena/mtg-arena-state-game-adventures-forgotten-realms-2021-07-02): describes full-control access and larger tablet hand cards. Inference: touch interaction deserves an intentional layout, not just scaled desktop elements.

These references document design patterns across multiple releases; this review is not a hands-on audit of the current Arena client.
