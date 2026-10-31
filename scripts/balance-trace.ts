import { createGame, applyCommand, shuffle } from "../src/sim/game";
import { duelists } from "../src/content/tavern";
import { autoplayCommand } from "../src/sim/autoplay";
import { cardById, isResource } from "../src/content/catalog";
import {
  battleCommand,
  createBattle,
  presets,
  presetDeck,
  type Battle,
} from "../src/sim/battle";
// Why does a recipe lose? `node --import tsx scripts/balance-trace.ts every-threshold`
// plays the recipe against every other recipe from both seats with the matrix's own
// seeds (BALANCE_SEEDS, default 2; BALANCE_OPPONENTS=fellowship,witness narrows the
// panel) and prints the losses' end states: resources on both sides, cards never
// cast, the rival's remaining health, and the cards most often left in hand.
// TRACE=1 also prints a turn-by-turn line for every lost duel. Diagnostic only.
const SEEDS = Number(process.env.BALANCE_SEEDS ?? 2),
  rivals = process.env.BALANCE_OPPONENTS?.split(",").filter(Boolean),
  ids = process.argv.slice(2),
  unknown = [...ids, ...(rivals ?? [])].filter(
    (id) => !presets.some((p) => p.id === id),
  );
if (!ids.length) throw Error("Name at least one recipe id.");
if (unknown.length) throw Error(`Unknown recipe ids: ${unknown.join(", ")}`);
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
const side = (s: Battle["player"]) => {
  const res = s.board.filter((p) => isResource(cardById[p.cardId])).length,
    companions = s.board.filter((p) => cardById[p.cardId].type === "Creature"),
    power = companions.reduce(
      (n, p) => n + cardById[p.cardId].attack + p.boost + p.counters,
      0,
    );
  return `hp ${s.hp} res ${res} companions ${companions.length} (${power} power) hand ${s.hand.length}`;
};
for (const id of ids) {
  const p = presets.find((x) => x.id === id)!,
    opponents = presets.filter(
      (o) => o.id !== id && (!rivals || rivals.includes(o.id)),
    ),
    dead: Record<string, number> = {},
    deadByCost: Record<number, number> = {};
  let won = 0,
    lost = 0,
    turns = 0,
    lostTurns = 0,
    res = 0,
    rivalRes = 0,
    starved = 0,
    hand = 0,
    rivalHp = 0;
  for (const opponent of opponents) {
    const guest = duelists.find((d) => d.deck === opponent.id);
    for (const first of ["player", "enemy"] as const)
      for (let seed = 1; seed <= SEEDS; seed++) {
        const state = fixture(
          seed +
            100 +
            1000 *
              (presets.indexOf(p) * presets.length + presets.indexOf(opponent)),
          id,
        );
        const b = guest
          ? applyCommand(state, { type: "duel", opponent: guest.id, first })
              .battle!
          : createBattle(
              shuffle(state, state.deck),
              shuffle(state, presetDeck(opponent.id)),
              opponent.name,
              { first },
            );
        const lines: string[] = [];
        let turn = 0;
        for (let i = 0; i < 4000 && b.result === "playing"; i++) {
          if (process.env.TRACE && b.turn !== turn) {
            turn = b.turn;
            lines.push(
              `    turn ${turn} (${b.active === "player" ? "keeper" : "rival"}) keeper ${side(b.player)} | rival ${side(b.enemy)}`,
            );
          }
          battleCommand(b, autoplayCommand(b));
        }
        turns += b.turn;
        if (b.result === "won") won++;
        if (b.result !== "lost") continue;
        lost++;
        lostTurns += b.turn;
        const mine = b.player.board.filter((x) =>
          isResource(cardById[x.cardId]),
        ).length;
        res += mine;
        starved += Number(mine <= 3);
        rivalRes += b.enemy.board.filter((x) =>
          isResource(cardById[x.cardId]),
        ).length;
        hand += b.player.hand.length;
        rivalHp += b.enemy.hp;
        for (const cardId of b.player.hand) {
          const c = cardById[cardId];
          if (isResource(c)) continue;
          dead[c.name] = (dead[c.name] ?? 0) + 1;
          deadByCost[c.cost] = (deadByCost[c.cost] ?? 0) + 1;
        }
        if (process.env.TRACE)
          console.log(
            `  lost to ${opponent.name} (${guest?.profile ?? "steady"}, ${first === "player" ? "keeper opens" : "guest opens"}, seed ${seed}) on turn ${b.turn}\n${lines.join("\n")}`,
          );
      }
  }
  const games = won + lost || 1,
    L = lost || 1;
  console.log(
    `${p.name}: ${won} won, ${lost} lost of ${games} (${Math.round((100 * won) / games)}%), ${(turns / games).toFixed(1)} turns on average`,
  );
  console.log(
    `  in losses: turn ${(lostTurns / L).toFixed(1)}, keeper resources ${(res / L).toFixed(1)} (three or fewer in ${starved}), rival resources ${(rivalRes / L).toFixed(1)}, cards left in hand ${(hand / L).toFixed(1)}, rival health ${(rivalHp / L).toFixed(1)}`,
  );
  console.log(`  cards left in hand by cost: ${JSON.stringify(deadByCost)}`);
  console.log(
    `  cards most often left in hand: ${Object.entries(dead)
      .sort((a, z) => z[1] - a[1])
      .slice(0, 8)
      .map(([n, k]) => `${n} ×${k}`)
      .join(", ")}`,
  );
}
