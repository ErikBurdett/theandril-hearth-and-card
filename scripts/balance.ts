import { writeFile, mkdir } from "node:fs/promises";
import { createGame, applyCommand } from "../src/sim/game";
import { cardById, isResource, type Card } from "../src/content/catalog";
import {
  validateTarget,
  affordable,
  battleCommand,
  canAttack,
  creatures,
  presets,
  presetDeck,
  stats,
  type Battle,
  type Target,
} from "../src/sim/battle";
// Diagnostic fixtures know and own every tested recipe; players earn challenge recipes.
function fixture(seed: number, preset: string) {
  const state = createGame(seed);
  state.unlockedRecipes = presets.map((p) => p.id);
  const deck = presetDeck(preset);
  for (const id of new Set(deck))
    state.collection[id] = Math.max(
      state.collection[id] ?? 0,
      deck.filter((c) => c === id).length,
    );
  return applyCommand(state, { type: "preset", preset });
}
function target(b: Battle, c: Card): Target | undefined {
  const enemy = creatures(b.enemy).sort(
    (a, z) => stats(b.enemy, z).power - stats(b.enemy, a).power,
  );
  if (c.effect === "counter") {
    const top = [...b.stack].reverse().find((s) => s.owner === "enemy");
    return top ? { side: top.owner, kind: "stack", uid: top.uid } : undefined;
  }
  if (c.effect === "damage") return { side: "enemy", kind: "hearth" };
  if (["destroy", "bounce", "bind"].includes(c.effect)) {
    const p = enemy.find((p) =>
      validateTarget(b, c.effect, {
        side: "enemy",
        kind: "creature",
        uid: p.uid,
      }),
    );
    return p ? { side: "enemy", kind: "creature", uid: p.uid } : undefined;
  }
  if (c.effect === "renew") {
    const p = creatures(b.player).find((p) => p.tapped || p.bound);
    return p ? { side: "player", kind: "creature", uid: p.uid } : undefined;
  }
  if (c.effect === "pump") {
    const p = creatures(b.player).find((p) => canAttack(b, p));
    return p ? { side: "player", kind: "creature", uid: p.uid } : undefined;
  }
}
function pilot(b: Battle) {
  if (b.phase === "cleanup") {
    battleCommand(b, {
      type: "discard",
      indices: Array.from({ length: b.player.hand.length - 7 }, (_, i) => i),
    });
    return;
  }
  if (b.stack.length) {
    const counter = b.player.hand.findIndex(
      (id) =>
        cardById[id].effect === "counter" &&
        cardById[id].type === "Instant" &&
        affordable(b.player, cardById[id]) &&
        target(b, cardById[id]),
    );
    if (counter >= 0) {
      battleCommand(b, {
        type: "play",
        index: counter,
        target: target(b, cardById[b.player.hand[counter]]),
      });
      return;
    }
    battleCommand(b, { type: "pass" });
    return;
  }
  if (b.active === "enemy") {
    if (b.phase === "block") {
      for (const a of b.combat) {
        const attacker = b.enemy.board.find((p) => p.uid === a.uid);
        if (!attacker) continue;
        for (const p of creatures(b.player)) {
          try {
            battleCommand(b, {
              type: "block",
              attacker: a.uid,
              blocker: p.uid,
            });
            break;
          } catch {}
        }
      }
      battleCommand(b, { type: "damage" });
    } else battleCommand(b, { type: "pass" });
    return;
  }
  if (b.phase === "attack") {
    battleCommand(b, {
      type: "declare",
      attackers: creatures(b.player)
        .filter((p) => canAttack(b, p))
        .map((p) => p.uid),
    });
    return;
  }
  if (b.phase === "damage") {
    battleCommand(b, { type: "damage" });
    return;
  }
  const candidates = b.player.hand
    .map((id, index) => ({ c: cardById[id], index }))
    .filter(
      ({ c }) =>
        affordable(b.player, c) &&
        c.effect !== "counter" &&
        (!["damage", "destroy", "bounce", "pump", "bind", "renew"].includes(
          c.effect,
        ) ||
          target(b, c)),
    )
    .sort(
      (a, z) =>
        Number(isResource(z.c)) - Number(isResource(a.c)) ||
        z.c.cost - a.c.cost,
    );
  if (candidates[0]) {
    const { c, index } = candidates[0];
    battleCommand(b, { type: "play", index, target: target(b, c) });
    return;
  }
  battleCommand(
    b,
    b.phase === "main" ? { type: "combat" } : { type: "end-turn" },
  );
}
const report: {
  generated: string;
  notes: string;
  openings: unknown[];
  duels: unknown[];
} = {
  generated: new Date().toISOString(),
  notes:
    "Diagnostic only: fixed seeds, simple public-state player pilot versus the in-game AI. Not human balance certification; pilot does not activate Heroes. No hidden opponent hand or library used in decisions.",
  openings: [],
  duels: [],
};
for (const p of presets) {
  let healthy = 0,
    both = 0,
    resources = 0;
  for (let seed = 1; seed <= 2000; seed++) {
    const s = applyCommand(fixture(seed, p.id), { type: "duel" }),
      hand = s.battle!.player.hand.map((id) => cardById[id]),
      n = hand.filter(isResource).length;
    resources += n;
    if (n >= 2 && n <= 5) healthy++;
    if (
      p.colors.every((color) =>
        hand.some((c) => isResource(c) && c.produces.includes(color)),
      )
    )
      both++;
  }
  report.openings.push({
    deck: p.name,
    seeds: 2000,
    averageOpeningResources: resources / 2000,
    twoToFiveResources: healthy / 2000,
    bothColors: both / 2000,
  });
}
for (const p of presets) {
  const opponent = presets[(presets.indexOf(p) + 1) % presets.length];
  let wins = 0,
    losses = 0,
    draws = 0,
    unfinished = 0,
    turns = 0;
  for (let seed = 1; seed <= 30; seed++) {
    const b = applyCommand(fixture(seed + 100, p.id), {
      type: "duel",
      opponent: opponent.id,
    }).battle!;
    for (let action = 0; action < 4000 && b.result === "playing"; action++)
      pilot(b);
    wins += Number(b.result === "won");
    losses += Number(b.result === "lost");
    draws += Number(b.result === "drawn");
    unfinished += Number(b.result === "playing");
    turns += b.turn;
  }
  report.duels.push({
    deck: p.name,
    opponent: opponent.name,
    games: 30,
    wins,
    losses,
    draws,
    unfinished,
    averageTurns: turns / 30,
  });
}
await mkdir("docs/reports", { recursive: true });
await writeFile(
  "docs/reports/balance.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
