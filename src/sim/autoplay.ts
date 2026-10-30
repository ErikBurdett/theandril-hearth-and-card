import {
  cardById,
  isResource,
  type Card,
  type Effect,
} from "../content/catalog";
import {
  affordable,
  deckProfile,
  planBlocks,
  responseChoice,
  plannedAttackers,
  canAttack,
  creatures,
  heroes,
  stats,
  validateTarget,
  type Battle,
  type BattleCommand,
  type Target,
} from "./battle";

/** Public-board decisions only. Opponent hand and library contents are never read. */
function targetFor(b: Battle, effect: Effect, amount = 1): Target | undefined {
  const enemies = creatures(b.enemy).sort(
    (a, z) => stats(b.enemy, z).power - stats(b.enemy, a).power,
  );
  if (effect === "counter") {
    const top = b.stack.at(-1);
    return top?.owner === "enemy"
      ? { side: "enemy", kind: "stack", uid: top.uid }
      : undefined;
  }
  if (effect === "damage") {
    const kill = enemies.find(
      (p) => stats(b.enemy, p).toughness - p.damage <= amount,
    );
    return kill
      ? { side: "enemy", kind: "creature", uid: kill.uid }
      : { side: "enemy", kind: "hearth" };
  }
  if (["destroy", "bounce", "bind"].includes(effect)) {
    const p = enemies.find(
      (p) =>
        validateTarget(b, effect, {
          side: "enemy",
          kind: "creature",
          uid: p.uid,
        }) &&
        (effect !== "bind" || !p.bound),
    );
    return p ? { side: "enemy", kind: "creature", uid: p.uid } : undefined;
  }
  if (effect === "renew" || effect === "pump") {
    const p = creatures(b.player).find((p) =>
      effect === "renew" ? p.bound || p.tapped : canAttack(b, p),
    );
    return p ? { side: "player", kind: "creature", uid: p.uid } : undefined;
  }
}
function useful(b: Battle, c: Card) {
  if (!affordable(b.player, c)) return false;
  if (
    ["rally", "pump"].includes(c.effect) &&
    !creatures(b.player).some((p) => canAttack(b, p))
  )
    return false;
  if (c.effect === "renew" && !targetFor(b, c.effect)) return false;
  return validateTarget(b, c.effect, targetFor(b, c.effect, c.amount) ?? null);
}
/** Autoplay pilots the keeper's recipe in the style its own cards suggest. */
export function autoplayProfile(b: Battle) {
  return deckProfile([
    ...b.player.draw,
    ...b.player.hand,
    ...b.player.grave,
    ...b.player.board.map((p) => p.cardId),
  ]);
}
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
  if (b.phase === "attack")
    return {
      type: "declare",
      attackers: plannedAttackers(b, "player", profile),
    };
  if (["block", "damage"].includes(b.phase)) return { type: "damage" };
  const choices = b.player.hand
    .map((id, index) => ({ c: cardById[id], index }))
    .filter(({ c }) => c.effect !== "counter" && useful(b, c))
    .sort(
      (a, z) =>
        Number(isResource(z.c)) - Number(isResource(a.c)) ||
        z.c.cost - a.c.cost,
    );
  if (choices[0]) {
    const { c, index } = choices[0];
    return { type: "play", index, target: targetFor(b, c.effect, c.amount) };
  }
  for (const p of heroes(b.player)) {
    if (p.used === b.turn) continue;
    for (const ability of [2, 0, 1]) {
      const a = cardById[p.cardId].abilities[ability],
        target = targetFor(b, a.effect, a.amount);
      if (
        p.loyalty + a.loyalty >= 0 &&
        validateTarget(b, a.effect, target ?? null)
      )
        return { type: "hero", uid: p.uid, ability, target };
    }
  }
  return b.phase === "main" ? { type: "combat" } : { type: "end-turn" };
}
