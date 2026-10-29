import { it, expect } from "vitest";
import { applyCommand, createGame, gameSchema } from "./game";
import { presetDeck } from "./battle";

it("a borrowed-recipe practice duel settles nothing and leaves ownership rules untouched", () => {
  let game = createGame(11);
  // Letters of Restraint is not owned by a new keeper; practice may still borrow it.
  expect(() =>
    applyCommand(createGame(11), { type: "preset", preset: "binding" }),
  ).toThrow();
  const before = structuredClone(game);
  game = applyCommand(game, {
    type: "duel",
    opponent: "scholar",
    practice: { recipe: "binding" },
  });
  const b = game.battle!;
  expect(b.practice).toBe(true);
  expect(b.timed).toBe(false);
  expect([...b.player.hand, ...b.player.draw].sort()).toEqual(
    [...presetDeck("binding")].sort(),
  );
  expect(game.deck).toEqual(before.deck);
  b.enemy.hp = 0;
  game = applyCommand(game, { type: "pass" });
  expect(game.battle!.result).toBe("won");
  expect(game.battle!.rewarded).toBe(true);
  expect(game.gold).toBe(before.gold);
  expect(game.wins).toBe(before.wins);
  expect(game.reputation).toBe(before.reputation);
  expect(game.progression.totals).toEqual(before.progression.totals);
  expect(game.progression.xp).toBe(before.progression.xp);
  expect(game.unlockedRecipes).toEqual(before.unlockedRecipes);
  expect(game.rivals).toEqual({});
  expect(game.journal.at(-1) ?? game.journal[0]).toBeDefined();
  game = applyCommand(game, { type: "leave-duel" });
  expect(game.battle).toBeNull();
  expect(game.rivals).toEqual({});
  // A real duel afterwards still pays and records as usual.
  game = applyCommand(game, { type: "duel", opponent: "scholar" });
  expect(game.battle!.practice).toBe(false);
  game.battle!.enemy.hp = 0;
  game = applyCommand(game, { type: "pass" });
  expect(game.gold).toBe(before.gold + 35);
  expect(game.rivals.scholar.wins).toBe(1);
});

it("conceding a practice duel records nothing, practice rejects unknown recipes and old saves default to real duels", () => {
  let game = applyCommand(createGame(12), {
    type: "duel",
    opponent: "smith",
    practice: { recipe: "cinder" },
  });
  game = applyCommand(game, { type: "leave-duel" });
  expect(game.rivals).toEqual({});
  expect(() =>
    applyCommand(createGame(12), {
      type: "duel",
      opponent: "smith",
      practice: { recipe: "nope" },
    }),
  ).toThrow(/Unknown practice recipe/);
  const real = applyCommand(createGame(13), {
    type: "duel",
    opponent: "smith",
  });
  const raw = JSON.parse(JSON.stringify(real));
  delete raw.battle.practice;
  expect(gameSchema.parse(raw).battle!.practice).toBe(false);
});
