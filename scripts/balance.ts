import { writeFile, mkdir } from "node:fs/promises";
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
/** The in-game autoplay pilots the keeper's seat: public information, the rivals' planners in the recipe's own style, Heroes included. */
function pilot(b: Battle) {
  battleCommand(b, autoplayCommand(b));
}
const report: {
  generated: string;
  notes: string;
  openings: unknown[];
  duels: unknown[];
  seating?: unknown;
  recipes?: unknown[];
  tactics?: unknown[];
} = {
  generated: new Date().toISOString(),
  notes: "",
  openings: [],
  duels: [],
};
// BALANCE_RECIPES=cinder,kiln limits the keeper's recipes for a quick tuning pass;
// BALANCE_OPPONENTS=fellowship,witness names the rival recipes instead of the
// next BALANCE_MATCHUPS (default 3) recipes in the list, and BALANCE_MATCHUPS=all
// is the round robin (every recipe meets every other recipe, both seats); BALANCE_SEEDS
// and BALANCE_OUT adjust the sample and the report path.
const ROUND_ROBIN = process.env.BALANCE_MATCHUPS === "all",
  MATCHUPS = ROUND_ROBIN ? 0 : Number(process.env.BALANCE_MATCHUPS ?? 3),
  SEEDS = Number(process.env.BALANCE_SEEDS ?? 10),
  only = process.env.BALANCE_RECIPES?.split(",").filter(Boolean),
  rivals = process.env.BALANCE_OPPONENTS?.split(",").filter(Boolean),
  out = process.env.BALANCE_OUT ?? "docs/reports/balance.json",
  seats = ["player", "enemy"] as const,
  unknown = [...(only ?? []), ...(rivals ?? [])].filter(
    (id) => !presets.some((p) => p.id === id),
  );
if (unknown.length) throw Error(`Unknown recipe ids: ${unknown.join(", ")}`);
report.notes = `Diagnostic only: fixed seeds, the in-game autoplay in the keeper's seat versus the in-game rival personalities, ${
  ROUND_ROBIN
    ? "every recipe against every other recipe from both seats (round robin)"
    : "each recipe against the next three recipes from both seats"
}. Not human balance certification: both seats use the same public-table planners, the keeper's in the style its recipe suggests. No hidden opponent hand or library used in decisions. The recipes summary reads each recipe from both sides of the matrix: as the keeper's recipe and as the rival's recipe under the guest personality that pilots it, with the opponents it met, so a figure is never read without its opposition.`;
if (
  !Number.isInteger(MATCHUPS) ||
  (!ROUND_ROBIN && MATCHUPS < 1) ||
  !Number.isInteger(SEEDS) ||
  SEEDS < 1
)
  throw Error("BALANCE_MATCHUPS and BALANCE_SEEDS must be positive integers.");
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
  const opponents = rivals
    ? presets.filter((o) => rivals.includes(o.id) && o.id !== p.id)
    : ROUND_ROBIN
      ? presets.filter((o) => o.id !== p.id)
      : Array.from(
          { length: MATCHUPS },
          (_, i) => presets[(presets.indexOf(p) + i + 1) % presets.length],
        );
  for (const opponent of opponents) {
    const guest = duelists.find((d) => d.deck === opponent.id);
    for (const first of seats) {
      let wins = 0,
        losses = 0,
        draws = 0,
        unfinished = 0,
        turns = 0;
      for (let seed = 1; seed <= SEEDS; seed++) {
        // The shuffle depends on the seed alone, so each ordered pairing takes its own
        // seeds: neither recipe meets every opponent with the same few openings.
        const state = fixture(
          seed +
            100 +
            1000 *
              (presets.indexOf(p) * presets.length + presets.indexOf(opponent)),
          p.id,
        );
        // Recipes without a tavern guest meet the steady pilot directly.
        const b = guest
          ? applyCommand(state, { type: "duel", opponent: guest.id, first })
              .battle!
          : createBattle(
              shuffle(state, state.deck),
              shuffle(state, presetDeck(opponent.id)),
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
// Read every recipe from both sides of the matrix, and every personality from the rival's seat.
type Duel = {
  deck: string;
  opponent: string;
  guest: string | null;
  tactics: string;
  games: number;
  wins: number;
  losses: number;
  draws: number;
};
const duels = report.duels as Duel[],
  tally = (rows: Duel[], mine: (d: Duel) => number) => {
    const games = rows.reduce((n, d) => n + d.games, 0),
      wins = rows.reduce((n, d) => n + mine(d), 0);
    return {
      games,
      wins,
      rate: games ? Math.round((1000 * wins) / games) / 10 : null,
    };
  },
  names = (rows: Duel[], key: "deck" | "opponent") => [
    ...new Set(rows.map((d) => d[key])),
  ];
report.recipes = presets
  .map((p) => {
    const asKeeper = duels.filter((d) => d.deck === p.name),
      asRival = duels.filter((d) => d.opponent === p.name),
      guest = duelists.find((d) => d.deck === p.id);
    if (!asKeeper.length && !asRival.length) return null;
    return {
      recipe: p.name,
      guest: guest?.name ?? null,
      tactics: guest?.profile ?? "steady",
      asKeeper: {
        ...tally(asKeeper, (d) => d.wins),
        against: names(asKeeper, "opponent"),
      },
      asRival: {
        ...tally(asRival, (d) => d.losses),
        against: names(asRival, "deck"),
      },
    };
  })
  .filter(Boolean);
report.tactics = [...new Set(duels.map((d) => d.tactics))].map((tactics) => {
  const rows = duels.filter((d) => d.tactics === tactics);
  return {
    tactics,
    recipes: names(rows, "opponent"),
    keeper: tally(rows, (d) => d.wins),
  };
});
await mkdir("docs/reports", { recursive: true });
await writeFile(out, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
