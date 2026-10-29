import { writeFile, mkdir } from "node:fs/promises";
import { createGame, applyCommand, random, type Game } from "../src/sim/game";
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
/** The in-game autoplay pilots the keeper's seat: public information, steady tactics, Heroes included. */
function pilot(b: Battle) {
  battleCommand(b, autoplayCommand(b));
}
function shuffled(state: Game, deck: string[]) {
  const list = [...deck];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(random(state) * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}
const report: {
  generated: string;
  notes: string;
  openings: unknown[];
  duels: unknown[];
  seating?: unknown;
} = {
  generated: new Date().toISOString(),
  notes:
    "Diagnostic only: fixed seeds, simple public-state player pilot versus the in-game rival personalities, each recipe against the next three recipes from both seats. Not human balance certification: the keeper's seat is the in-game autoplay (steady tactics). No hidden opponent hand or library used in decisions.",
  openings: [],
  duels: [],
};
// BALANCE_RECIPES=cinder,kiln limits the keeper's recipes for a quick tuning pass;
// BALANCE_SEEDS and BALANCE_OUT adjust the sample and the report path.
const MATCHUPS = 3,
  SEEDS = Number(process.env.BALANCE_SEEDS ?? 10),
  only = process.env.BALANCE_RECIPES?.split(",").filter(Boolean),
  out = process.env.BALANCE_OUT ?? "docs/reports/balance.json",
  seats = ["player", "enemy"] as const;
for (const p of presets) {
  if (only && !only.includes(p.id)) continue;
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
// Matchup matrix: each recipe meets the next three recipes from both seats,
// against the guest personality that actually pilots that recipe in the tavern.
const bySeat = {
  player: { wins: 0, losses: 0, draws: 0 },
  enemy: { wins: 0, losses: 0, draws: 0 },
};
for (const p of presets) {
  if (only && !only.includes(p.id)) continue;
  for (let offset = 1; offset <= MATCHUPS; offset++) {
    const opponent = presets[(presets.indexOf(p) + offset) % presets.length];
    const guest = duelists.find((d) => d.deck === opponent.id);
    for (const first of seats) {
      let wins = 0,
        losses = 0,
        draws = 0,
        unfinished = 0,
        turns = 0;
      for (let seed = 1; seed <= SEEDS; seed++) {
        const state = fixture(seed + 100, p.id);
        // Recipes without a tavern guest meet the steady pilot directly.
        const b = guest
          ? applyCommand(state, { type: "duel", opponent: guest.id, first })
              .battle!
          : createBattle(
              shuffled(state, state.deck),
              shuffled(state, presetDeck(opponent.id)),
              opponent.name,
              { first },
            );
        for (let action = 0; action < 4000 && b.result === "playing"; action++)
          pilot(b);
        wins += Number(b.result === "won");
        losses += Number(b.result === "lost");
        draws += Number(b.result === "drawn");
        unfinished += Number(b.result === "playing");
        turns += b.turn;
      }
      bySeat[first].wins += wins;
      bySeat[first].losses += losses;
      bySeat[first].draws += draws;
      report.duels.push({
        deck: p.name,
        opponent: opponent.name,
        guest: guest?.name ?? null,
        tactics: guest?.profile ?? "steady",
        opens: first === "player" ? "keeper" : "guest",
        games: SEEDS,
        wins,
        losses,
        draws,
        unfinished,
        averageTurns: turns / SEEDS,
      });
    }
  }
}
report.seating = {
  keeperOpens: bySeat.player,
  guestOpens: bySeat.enemy,
};
await mkdir("docs/reports", { recursive: true });
await writeFile(out, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
