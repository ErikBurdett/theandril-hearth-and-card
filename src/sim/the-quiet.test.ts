import { it, expect } from "vitest";
import {
  cards,
  cardById,
  setById,
  isResource,
  copyLimit,
  PACK_SIZE,
  type Card,
} from "../content/catalog";
import { cardLore } from "../content/lore";
import { collectorNotes } from "../content/collector-notes";
import { quietRecipes, quietSet } from "../content/the-quiet";
import { createGame, applyCommand, decodeSave } from "./game";
import {
  battleCommand,
  canBlock,
  createBattle,
  presetDeck,
  presets,
  stats,
  zeroMana,
  type Battle,
  type Permanent,
} from "./battle";
import { autoplayCommand } from "./autoplay";

const pool = cards.filter((c) => c.setId === "the-quiet");
const count = (list: Card[], key: (c: Card) => string) =>
  list.reduce<Record<string, number>>(
    (a, c) => ((a[key(c)] = (a[key(c)] ?? 0) + 1), a),
    {},
  );

it("adds The Quiet as a thirteenth 80-card volume from Book chapter VII", () => {
  expect(setById["the-quiet"]).toBe(quietSet);
  expect(quietSet.folio).toBeUndefined();
  expect(pool.map((c) => c.number)).toEqual(
    Array.from({ length: 80 }, (_, i) => i + 1),
  );
  expect(count(pool, (c) => c.type)).toEqual({
    Creature: 30,
    Instant: 12,
    Sorcery: 10,
    Artifact: 9,
    Enchantment: 4,
    Hero: 5,
    "Basic Resource": 6,
    "Special Resource": 4,
  });
  // Ember/Grove was the only two-aspect pair without a primary set.
  const colors = count(
    pool.filter((c) => !isResource(c)),
    (c) => c.color,
  );
  expect(Object.keys(colors).sort()).toEqual(["ember", "grove"]);
  expect(
    pool
      .filter((c) => c.type === "Hero")
      .every((c) => c.abilities.length === 3),
  ).toBe(true);
  // Three strands carry the set's traditions.
  for (const [from, to, tradition] of [
    [1, 21, "Oath"],
    [23, 43, "Verdancy"],
    [45, 65, "Flame"],
  ] as const)
    expect(
      pool
        .filter((c) => c.number >= from && c.number <= to)
        .every((c) => c.tradition === tradition),
    ).toBe(true);
});

it("uses only executable engine features and readable authored lore", () => {
  for (const c of pool) {
    expect(c.rules.length, c.id).toBeGreaterThan(5);
    expect(c.rules, c.id).not.toMatch(/undefined|NaN/);
    expect(c.flavor.length, c.id).toBeGreaterThan(60);
    expect(cardLore(c).flavor, c.id).toBe(c.flavor);
    expect(cardLore(c).chapter).toBe("VII. The Failing and the Ashfall");
    if (c.type === "Creature") expect(c.attack + c.health).toBeGreaterThan(2);
    if (!isResource(c)) expect(c.colored).toBeLessThanOrEqual(c.cost);
  }
  expect(
    Object.keys(collectorNotes).filter((id) => id.startsWith("the-quiet.")),
  ).toHaveLength(4);
  const names = new Set(cards.map((c) => c.name.toLowerCase()));
  expect(names.size).toBe(cards.length);
});

const permanent = (cardId: string, uid: number): Permanent => ({
  cardId,
  uid,
  tapped: false,
  entered: 1,
  damage: 0,
  counters: 0,
  boost: 0,
  loyalty: 4,
  used: 0,
});
function table(): Battle {
  const b = createBattle(presetDeck(), presetDeck(), "Quiet test");
  b.turn = 5;
  b.timed = false;
  b.nextId = 500;
  b.player.board = [];
  b.enemy.board = [];
  b.enemy.hand = [];
  b.player.hand = [];
  b.player.landDrops = 0;
  b.player.mana = { dawn: 30, tide: 30, grove: 30, grave: 30, ember: 30 };
  b.enemy.mana = zeroMana();
  return b;
}
function cast(b: Battle, id: string) {
  b.player.hand.push(id);
  battleCommand(b, { type: "play", index: b.player.hand.length - 1 });
  battleCommand(b, { type: "pass" });
}

it("executes the local-bargain line: Gather, Rootfast, Daunt and a wide rally", () => {
  const b = table();
  b.player.board = [
    permanent("the-quiet.3", 101), // Hand-clasp Elder, Gather
    permanent("the-quiet.1", 102), // Stone-side Night Keeper, Rootfast
  ];
  b.player.hand = ["the-quiet.71"];
  battleCommand(b, { type: "play", index: 0 });
  expect(b.player.board.find((p) => p.uid === 101)!.counters).toBe(1);
  expect(b.player.board.find((p) => p.uid === 102)!.counters).toBe(0);
  // Only one resource per turn; the rejected play changes nothing.
  b.player.hand = ["the-quiet.72"];
  const before = structuredClone(b);
  expect(() => battleCommand(b, { type: "play", index: 0 })).toThrow();
  expect(b).toEqual(before);
  // Daunt: a 2-power outrider cannot be blocked by the 1-power keeper.
  const outrider = permanent("the-quiet.46", 201);
  expect(canBlock(b, outrider, b.player.board[1])).toBe(false);
  expect(canBlock(b, outrider, b.player.board[0])).toBe(true);
  // Every Bargain Local gives each companion +3/+3 until end of turn.
  const elder = b.player.board[0],
    power = stats(b.player, elder).power;
  cast(b, "the-quiet.78");
  expect(stats(b.player, elder).power).toBe(power + 3);
});

it("offers two ordinary-card recipes that prepare from owned copies", () => {
  expect(quietRecipes.map((r) => r.id)).toEqual([
    "near-fields",
    "beacon-to-beacon",
  ]);
  for (const recipe of quietRecipes) {
    expect(presets.some((p) => p.id === recipe.id)).toBe(true);
    const deck = presetDeck(recipe.id);
    expect(deck).toHaveLength(100);
    expect(deck.filter((id) => isResource(cardById[id]))).toHaveLength(40);
    expect(deck.every((id) => recipe.colors.includes(cardById[id].color))).toBe(
      true,
    );
    expect(deck.every((id) => cardById[id].rarity !== "mythic")).toBe(true);
    expect(new Set(deck.map((id) => cardById[id].setId))).toEqual(
      new Set(recipe.sets),
    );
    const game = createGame(),
      before = structuredClone(game);
    expect(() =>
      applyCommand(game, { type: "preset", preset: recipe.id }),
    ).toThrow();
    expect(game).toEqual(before);
    for (const id of new Set(deck)) {
      const copies = deck.filter((c) => c === id).length;
      expect(copies).toBeLessThanOrEqual(copyLimit(cardById[id]));
      game.collection[id] = copies;
    }
    const prepared = applyCommand(game, { type: "preset", preset: recipe.id });
    expect(prepared.deck).toEqual(deck);
    expect(decodeSave(JSON.stringify(prepared)).deck).toEqual(deck);
  }
});

it("opens deterministic Quiet boosters whose sheets reach all 80 cards", () => {
  let game = createGame(2311);
  game.products["the-quiet"].stock = 400;
  const replay = applyCommand(structuredClone(game), {
    type: "open-pack",
    setId: "the-quiet",
  });
  const seen = new Set<string>();
  for (let i = 0; i < 400; i++) {
    game = applyCommand(game, { type: "open-pack", setId: "the-quiet" });
    if (i === 0) expect(game.lastPack).toEqual(replay.lastPack);
    expect(game.lastPack).toHaveLength(PACK_SIZE);
    expect(game.lastPack.every((id) => id.startsWith("the-quiet."))).toBe(true);
    expect(["rare", "mythic"]).toContain(cardById[game.lastPack[11]].rarity);
    for (const id of game.lastPack) seen.add(id);
  }
  expect(seen.size).toBe(80);
  expect(game.products["the-quiet"].stock).toBe(0);
});

it("finishes full AI duels for both recipes in both seats", () => {
  for (const recipe of quietRecipes)
    for (const seat of ["player", "enemy"] as const) {
      const [mine, theirs] =
        seat === "player"
          ? [recipe.id, "fellowship"]
          : ["fellowship", recipe.id];
      const run = () => {
        const b = createBattle(presetDeck(mine), presetDeck(theirs), "Rival");
        for (let step = 0; step < 5000 && b.result === "playing"; step++)
          battleCommand(b, autoplayCommand(b));
        return b;
      };
      const first = run();
      expect(first.result, `${recipe.id} as ${seat}`).not.toBe("playing");
      expect(run().log).toEqual(first.log);
    }
});
