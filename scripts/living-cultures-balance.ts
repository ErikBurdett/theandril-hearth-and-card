import { mkdir, writeFile } from "node:fs/promises";
import { createGame, applyCommand, random } from "../src/sim/game";
import { cards, cardById, isResource, buyback } from "../src/content/catalog";
import { livingRecipes, fullLivingRecipes } from "../src/content/living-cards";
import { livingSets } from "../src/content/living-cultures";
import { presetDeck, battleCommand, createBattle } from "../src/sim/battle";
import { autoplayCommand } from "../src/sim/autoplay";

function fixture(seed: number, recipe: string, opponent: string) {
  let game = createGame(seed);
  for (const id of new Set(presetDeck(recipe)))
    game.collection[id] = Math.max(
      game.collection[id] ?? 0,
      presetDeck(recipe).filter((c) => c === id).length,
    );
  game = applyCommand(game, { type: "preset", preset: recipe });
  const shuffle = (deck: string[]) => {
    const list = [...deck];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(random(game) * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  };
  // Directly supply both recipes: new collection recipes have no associated
  // visitor, so routing them through the guest picker would select a fallback.
  game.battle = createBattle(
    shuffle(game.deck),
    shuffle(presetDeck(opponent)),
    opponent,
  );
  for (const id of [...game.battle.enemy.hand, ...game.battle.enemy.draw])
    if (!presetDeck(opponent).includes(id))
      throw Error("Diagnostic selected the wrong opponent deck.");
  return game;
}
const fullSets = process.argv.includes("--full-sets");
const recipes = fullSets
  ? fullLivingRecipes
  : livingRecipes.filter((r) => !fullLivingRecipes.some((f) => f.id === r.id));
const openings = [],
  matchups = [],
  packs = [];
for (const recipe of recipes) {
  let healthy = 0,
    both = 0,
    resourceTotal = 0,
    earlyPlay = 0;
  for (let seed = 1; seed <= 2000; seed++) {
    const hand = fixture(seed, recipe.id, "fellowship").battle!.player.hand.map(
      (id) => cardById[id],
    );
    const resources = hand.filter(isResource);
    resourceTotal += resources.length;
    healthy += Number(resources.length >= 2 && resources.length <= 5);
    both += Number(
      recipe.colors.every((color) =>
        resources.some((c) => c.produces.includes(color)),
      ),
    );
    earlyPlay += Number(
      hand.some(
        (c) =>
          !isResource(c) &&
          c.cost <= 2 &&
          resources.some((r) => r.produces.includes(c.color)),
      ),
    );
  }
  openings.push({
    recipe: recipe.id,
    seeds: 2000,
    averageResources: resourceTotal / 2000,
    twoToFiveResources: healthy / 2000,
    bothAspects: both / 2000,
    earlySpellWithSource: earlyPlay / 2000,
  });
  for (const rival of ["fellowship", "tempo", "recursion"]) {
    for (const seat of ["player", "enemy"]) {
      let wins = 0,
        losses = 0,
        draws = 0,
        unfinished = 0,
        turns = 0;
      for (let seed = 101; seed <= 112; seed++) {
        const game = fixture(
          seed,
          seat === "player" ? recipe.id : rival,
          seat === "player" ? rival : recipe.id,
        );
        const battle = game.battle!;
        for (let step = 0; step < 5000 && battle.result === "playing"; step++)
          battleCommand(battle, autoplayCommand(battle));
        wins += Number(battle.result === (seat === "player" ? "won" : "lost"));
        losses += Number(
          battle.result === (seat === "player" ? "lost" : "won"),
        );
        draws += Number(battle.result === "drawn");
        unfinished += Number(battle.result === "playing");
        turns += battle.turn;
      }
      matchups.push({
        recipe: recipe.id,
        rival,
        seat,
        games: 12,
        wins,
        losses,
        draws,
        unfinished,
        averageTurns: turns / 12,
      });
    }
  }
}
for (const set of livingSets) {
  let game = createGame(8123),
    mythic = 0,
    illuminated = 0,
    value = 0;
  game.products[set.id].stock = 10000;
  const seen = new Set<string>();
  for (let i = 0; i < 10000; i++) {
    game = applyCommand(game, { type: "open-pack", setId: set.id });
    mythic += Number(cardById[game.lastPack[11]].rarity === "mythic");
    illuminated += Number(game.lastPackIlluminated[11]);
    for (const id of game.lastPack) {
      seen.add(id);
      value += buyback(cardById[id]);
    }
  }
  packs.push({
    set: set.id,
    samples: 10000,
    rareSlotMythic: mythic / 10000,
    illuminatedSlot: illuminated / 10000,
    meanOrdinaryBuyback: value / 10000,
    uniqueSeen: seen.size,
    total: cards.filter((c) => c.setId === set.id).length,
  });
}
const report = {
  generated: new Date().toISOString(),
  limitation:
    "Diagnostic only. The public-information autoplay pilot plays the player seat; the in-game AI plays the opposing seat. Both seating orders, twelve seeds and three established archetypes per new recipe. This is not human balance certification or individual rival AI.",
  openings,
  matchups,
  packs,
};
await mkdir("docs/reports", { recursive: true });
await writeFile(
  fullSets
    ? "docs/reports/living-cultures-80-balance.json"
    : "docs/reports/living-cultures-balance.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
if (matchups.some((m) => m.unfinished)) process.exitCode = 1;
