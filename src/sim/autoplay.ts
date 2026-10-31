import { cardById, isResource } from "../content/catalog";
import {
  deckProfile,
  planBlocks,
  plannedCast,
  plannedDeclaration,
  plannedHero,
  redrawAvailable,
  responseChoice,
  type Battle,
  type BattleCommand,
} from "./battle";

/** Autoplay pilots the keeper's recipe in the style its own cards suggest. */
export function autoplayProfile(b: Battle) {
  return deckProfile([
    ...b.player.draw,
    ...b.player.hand,
    ...b.player.grave,
    ...b.player.board.map((p) => p.cardId),
  ]);
}
/**
 * One command from the keeper's own hand and the public table, chosen by the
 * same scored planners the rivals use. Opponent hand and library contents are
 * never read.
 */
export function autoplayCommand(b: Battle): BattleCommand {
  const profile = autoplayProfile(b);
  if (b.phase === "cleanup")
    return {
      type: "discard",
      indices: b.player.hand
        .map((id, index) => ({ id, index }))
        .sort((a, z) => cardById[z.id].cost - cardById[a.id].cost)
        .slice(0, b.player.hand.length - 7)
        .map((p) => p.index),
    };
  // The one free redraw a keeper gets: take it on a hand with fewer than two or more than five resources.
  if (redrawAvailable(b)) {
    const n = b.player.hand.filter((id) => isResource(cardById[id])).length;
    if (n < 2 || n > 5) return { type: "mulligan" };
  }
  if (b.stack.length) {
    const response = responseChoice(b, "player", profile);
    return response
      ? {
          type: "play",
          index: response.index,
          target: response.target ?? undefined,
        }
      : { type: "pass" };
  }
  if (b.active === "enemy") {
    if (b.phase === "block") {
      // The same scored planner the rivals use; steady decks block by score too.
      for (const planned of planBlocks(
        b,
        "player",
        profile === "steady" ? "reactive" : profile,
      )) {
        const current = b.combat.find((a) => a.uid === planned.uid);
        const next = planned.blockers.find(
          (uid) => !current?.blockers.includes(uid),
        );
        if (next !== undefined)
          return { type: "block", attacker: planned.uid, blocker: next };
      }
      return { type: "damage" };
    }
    return { type: "pass" };
  }
  if (b.phase === "attack") {
    const { attackers, hero, destinations } = plannedDeclaration(
      b,
      "player",
      profile,
    );
    return {
      type: "declare",
      attackers,
      hero: hero ?? undefined,
      destinations,
    };
  }
  if (["block", "damage"].includes(b.phase)) return { type: "damage" };
  if (b.player.landDrops === 0) {
    const index = b.player.hand.findIndex((id) => isResource(cardById[id]));
    if (index >= 0) return { type: "play", index };
  }
  const cast = plannedCast(b, "player", profile);
  if (cast)
    return {
      type: "play",
      index: cast.index,
      target: cast.target ?? undefined,
    };
  const activation = plannedHero(b, "player", profile);
  if (activation)
    return {
      type: "hero",
      uid: activation.uid,
      ability: activation.ability,
      target: activation.target ?? undefined,
    };
  return b.phase === "main" ? { type: "combat" } : { type: "end-turn" };
}
