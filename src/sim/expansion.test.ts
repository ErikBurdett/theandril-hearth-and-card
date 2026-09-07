import { it, expect } from "vitest";
import { cards, cardById, sets } from "../content/catalog";
import {
  createBattle,
  presetDeck,
  battleCommand,
  canBlock,
  combatForecast,
  validateTarget,
  zeroMana,
  type Battle,
  type Permanent,
} from "./battle";
import { createGame, decodeSave, applyCommand } from "./game";
function fresh() {
  const b = createBattle(presetDeck(), presetDeck(), "Test");
  b.player.board = [];
  b.enemy.board = [];
  b.player.hand = [];
  b.enemy.hand = [];
  b.player.mana = { dawn: 30, tide: 30, grave: 30, ember: 30, grove: 30 };
  b.enemy.mana = zeroMana();
  b.turn = 4;
  b.timed = false;
  return b;
}
const p = (id: string, uid: number): Permanent => ({
  uid,
  cardId: id,
  tapped: false,
  entered: 1,
  damage: 0,
  counters: 0,
  boost: 0,
  loyalty: 4,
  used: 0,
});
function cast(
  b: Battle,
  id: string,
  target?: { side: "player" | "enemy"; kind: "creature"; uid: number },
) {
  b.player.hand.push(id);
  battleCommand(b, { type: "play", index: b.player.hand.length - 1, target });
  battleCommand(b, { type: "pass" });
}
it("each set adds all eight types without changing the original collector IDs", () => {
  for (const s of sets) {
    const added = cards.filter((c) => c.setId === s.id && c.number > 72);
    expect(added).toHaveLength(8);
    expect(new Set(added.map((c) => c.type)).size).toBe(8);
    expect(added.every((c) => c.rules.length > 15)).toBe(true);
    expect(
      added.find((c) => c.type === "Special Resource")!.produces,
    ).toHaveLength(2);
  }
  expect(new Set(cards.map((c) => c.id)).size).toBe(640);
});
it("binding survives saves, skips exactly one ready step and Renew removes it", () => {
  let g = createGame();
  g.battle = fresh();
  g.battle.enemy.board = [p("first-oaths.1", 101)];
  cast(g.battle, "witness-roads.76", {
    side: "enemy",
    kind: "creature",
    uid: 101,
  });
  expect(g.battle.enemy.board[0].bound).toBe(1);
  g = decodeSave(JSON.stringify(g));
  battleCommand(g.battle!, { type: "end-turn" });
  expect(g.battle!.enemy.board[0].tapped).toBe(true);
  expect(g.battle!.enemy.board[0].bound).toBe(0);
  const b = fresh();
  b.player.board = [{ ...p("first-oaths.1", 102), tapped: true, bound: 1 }];
  cast(b, "first-oaths.76", { side: "player", kind: "creature", uid: 102 });
  expect(b.player.board[0].tapped).toBe(false);
  expect(b.player.board[0].bound).toBe(0);
});
it("Rootfast rejects bounce atomically while Daunt checks actual defender power", () => {
  let g = createGame();
  g.battle = fresh();
  g.battle.enemy.board = [p("first-oaths.75", 101)];
  const bounce = cards.find(
    (c) => c.type === "Instant" && c.effect === "bounce",
  )!;
  g.battle.player.hand = [bounce.id];
  const before = structuredClone(g);
  expect(() =>
    applyCommand(g, {
      type: "play",
      index: 0,
      target: { side: "enemy", kind: "creature", uid: 101 },
    }),
  ).toThrow();
  expect(g).toEqual(before);
  expect(
    validateTarget(g.battle, "destroy", {
      side: "enemy",
      kind: "creature",
      uid: 101,
    }),
  ).toBe(true);
  const b = fresh(),
    attacker = p("saltwind.75", 102),
    defender = p("first-oaths.1", 103);
  b.enemy.board = [defender];
  expect(canBlock(b, attacker, defender)).toBe(false);
  defender.counters = 2;
  expect(canBlock(b, attacker, defender)).toBe(true);
});
it("Welcome excludes itself and Recordwork pays once per turn, including after reload", () => {
  let g = createGame();
  g.battle = fresh();
  const b = g.battle;
  b.player.board = [p("first-oaths.75", 101), p("witness-roads.79", 102)];
  const hp = b.player.hp;
  cast(b, "first-oaths.75");
  expect(b.player.hp).toBe(hp + 1);
  const count = b.player.hand.length;
  cast(b, "first-oaths.78");
  expect(b.player.hand.length).toBe(count + 1);
  g = decodeSave(JSON.stringify(g));
  const after = g.battle!.player.hand.length;
  cast(g.battle!, "first-oaths.78");
  expect(g.battle!.player.hand.length).toBe(after);
});
it("rally expires at turn end and drain heals only damage that passes shields", () => {
  const b = fresh();
  b.player.board = [p("first-oaths.1", 101), p("first-oaths.2", 102)];
  cast(b, "first-oaths.77");
  expect(b.player.board.every((p) => p.boost === 2)).toBe(true);
  b.enemy.shield = 2;
  const hp = b.player.hp,
    enemy = b.enemy.hp;
  cast(b, "reckoning.77");
  expect(b.player.hp).toBe(hp + 1);
  expect(b.enemy.hp).toBe(enemy - 1);
  battleCommand(b, { type: "end-turn" });
  expect(b.player.board.every((p) => p.boost === 0)).toBe(true);
});
it("combat forecast uses visible effects and leaves state and hidden hands untouched", () => {
  const b = fresh();
  b.phase = "block";
  b.player.board = [p("saltwind.75", 101)];
  b.combat = [{ uid: 101, hero: null, blocker: null, blocked: false }];
  const before = structuredClone(b),
    f = combatForecast(b)!;
  expect(f.enemyLife).toBe(cardById["saltwind.75"].attack);
  expect(b).toEqual(before);
  battleCommand(b, { type: "damage" });
  expect(before.enemy.hp - b.enemy.hp).toBe(f.enemyLife);
});

it("archive checks hand size before the ordinary draw and watchfires respect shields", () => {
  const b = fresh();
  b.active = "enemy";
  b.phase = "second-main";
  b.player.hand = ["first-oaths.1", "first-oaths.2", "first-oaths.3"];
  b.player.board = [p("first-oaths.78", 101), p("iron-covenant.78", 102)];
  b.enemy.shield = 1;
  const hp = b.enemy.hp;
  battleCommand(b, { type: "pass" });
  expect(b.player.hand).toHaveLength(5);
  expect(b.enemy.hp).toBe(hp);
  expect(b.enemy.shield).toBe(0);
});
it("new Heroes pay devotion once and bind through the same response stack", () => {
  const b = fresh();
  b.player.board = [p("witness-roads.80", 101)];
  b.enemy.board = [p("first-oaths.1", 102)];
  battleCommand(b, {
    type: "hero",
    uid: 101,
    ability: 1,
    target: { side: "enemy", kind: "creature", uid: 102 },
  });
  expect(b.player.board[0].loyalty).toBe(2);
  expect(b.enemy.board[0].bound).toBeUndefined();
  battleCommand(b, { type: "pass" });
  expect(b.enemy.board[0].bound).toBe(1);
  expect(() =>
    battleCommand(b, { type: "hero", uid: 101, ability: 0 }),
  ).toThrow();
});
