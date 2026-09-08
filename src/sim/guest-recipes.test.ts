import { expect, it } from "vitest";
import { createGame, applyCommand, decodeSave } from "./game";
import {
  challengeRecipes,
  presets,
  presetDeck,
  recipeUnlocked,
} from "./battle";
import { cardById, copyLimit, isResource } from "../content/catalog";
import { customerTypes, duelists } from "../content/tavern";
it("twenty guests have legal, distinct new challenge lists and authored identities", () => {
  expect(customerTypes.length).toBe(20);
  const lists = presets.map((p) => JSON.stringify(presetDeck(p.id).sort()));
  for (const p of challengeRecipes) {
    const deck = presetDeck(p.id);
    expect(deck.length).toBe(100);
    expect(deck.filter((id) => isResource(cardById[id])).length).toBe(40);
    for (const id of new Set(deck))
      expect(deck.filter((c) => c === id).length).toBeLessThanOrEqual(
        copyLimit(cardById[id]),
      );
    expect(
      lists.filter((list) => list === JSON.stringify([...deck].sort())).length,
    ).toBe(1);
    expect(duelists.some((d) => d.deck === p.id)).toBe(true);
  }
});
it("victory unlocks a recipe once, survives saves, and still requires ownership", () => {
  let game = createGame();
  expect(() => applyCommand(game, { type: "preset", preset: "kiln" })).toThrow(
    "Defeat",
  );
  game = applyCommand(game, { type: "duel", opponent: "potter" });
  game.battle!.enemy.hp = 0;
  game = applyCommand(game, { type: "end-turn" });
  expect(recipeUnlocked(game, "kiln")).toBe(true);
  expect(
    game.notices.some((n) => n.text.includes("Learned The Kiln Wakes")),
  ).toBe(true);
  game = decodeSave(JSON.stringify(game));
  expect(game.unlockedRecipes).toEqual(["kiln"]);
  const missing = presetDeck("kiln").find((id) => !game.deck.includes(id))!;
  game.collection[missing] = 0;
  expect(() => applyCommand(game, { type: "preset", preset: "kiln" })).toThrow(
    "missing copies",
  );
  for (const id of presetDeck("kiln"))
    game.collection[id] = Math.max(game.collection[id] ?? 0, 40);
  game = applyCommand(game, { type: "preset", preset: "kiln" });
  expect(game.deck).toEqual(presetDeck("kiln"));
  game = applyCommand(game, { type: "leave-duel" });
  game = applyCommand(game, { type: "duel", opponent: "potter" });
  game.battle!.enemy.hp = 0;
  game = applyCommand(game, { type: "end-turn" });
  expect(game.unlockedRecipes).toEqual(["kiln"]);
});
it("concession and losses do not unlock recipes; old saves retain original recipes", () => {
  let game = applyCommand(createGame(), { type: "duel", opponent: "potter" });
  game = applyCommand(game, { type: "leave-duel" });
  expect(game.unlockedRecipes).toEqual([]);
  game = applyCommand(game, { type: "duel", opponent: "potter" });
  game.battle!.player.hp = 0;
  game = applyCommand(game, { type: "end-turn" });
  expect(game.unlockedRecipes).toEqual([]);
  const old = JSON.parse(JSON.stringify(createGame()));
  delete old.unlockedRecipes;
  delete old.notices;
  delete old.noticeSequence;
  const migrated = decodeSave(JSON.stringify(old));
  expect(recipeUnlocked(migrated, "binding")).toBe(true);
  expect(migrated.notices).toEqual([]);
});
it("notification history is bounded, read state persists, rejected actions do not create notices", () => {
  let game = createGame();
  for (let i = 0; i < 70; i++) game = applyCommand(game, { type: "toggle" });
  expect(game.notices.length).toBe(60);
  expect(new Set(game.notices.map((n) => n.id)).size).toBe(60);
  game = applyCommand(game, { type: "read-notices" });
  expect(decodeSave(JSON.stringify(game)).notices.every((n) => n.read)).toBe(
    true,
  );
  const before = JSON.stringify(game);
  expect(() =>
    applyCommand(game, { type: "preset", preset: "kiln" }),
  ).toThrow();
  expect(JSON.stringify(game)).toBe(before);
});

it("autoplay teaches the defeated guest's recipe before looping to another opponent", () => {
  let game = applyCommand(createGame(), { type: "duel", opponent: "potter" });
  game = applyCommand(game, { type: "autoplay", enabled: true });
  game.room.player.node = "table";
  game.room.player.route = [];
  game.battle!.enemy.hp = 0;
  game = applyCommand(game, { type: "auto-step" });
  expect(game.unlockedRecipes).toContain("kiln");
  expect(game.battle!.autoplay).toBe(true);
  expect(game.battle!.opponent).not.toContain("Jory Claythumb");
  expect(decodeSave(JSON.stringify(game)).unlockedRecipes).toContain("kiln");
});
