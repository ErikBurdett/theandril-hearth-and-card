import {
  cardById,
  isResource,
  type Card,
  type Effect,
} from "../content/catalog";
import {
  affordable,
  canAttack,
  canBlock,
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
export function autoplayCommand(b: Battle): BattleCommand {
  if (b.stack.length) {
    const index = b.player.hand.findIndex(
      (id) =>
        cardById[id].type === "Instant" &&
        cardById[id].effect === "counter" &&
        useful(b, cardById[id]),
    );
    return index >= 0
      ? { type: "play", index, target: targetFor(b, "counter") }
      : { type: "pass" };
  }
  if (b.active === "enemy") {
    if (b.phase === "block") {
      for (const attack of b.combat.filter((a) => !a.blocked)) {
        const p = b.enemy.board.find((p) => p.uid === attack.uid);
        if (!p) continue;
        const defender = creatures(b.player)
          .filter(
            (d) =>
              !b.combat.some((a) => a.blocker === d.uid) && canBlock(b, p, d),
          )
          .sort(
            (a, z) =>
              stats(b.player, z).toughness - stats(b.player, a).toughness,
          )[0];
        if (defender)
          return { type: "block", attacker: p.uid, blocker: defender.uid };
      }
      return { type: "damage" };
    }
    return { type: "pass" };
  }
  if (b.phase === "attack")
    return {
      type: "declare",
      attackers: creatures(b.player)
        .filter((p) => canAttack(b, p))
        .map((p) => p.uid),
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
