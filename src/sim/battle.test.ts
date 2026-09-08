import { it, expect } from "vitest";
import { cards, cardById, isResource, type Card } from "../content/catalog";
import {
  createGame,
  applyCommand,
  decodeSave,
  gameSchema,
  type Command,
} from "./game";
import {
  createBattle,
  presetDeck,
  battleCommand,
  stats,
  zeroMana,
  availableResources,
  paymentPreview,
  battleSchema,
  plannedAttackers,
  type Permanent,
  type Battle,
} from "./battle";
const find = (test: (c: Card) => boolean) => cards.find(test)!;
const creature = find(
  (c) =>
    c.type === "Creature" &&
    !c.keywords.includes("flying") &&
    !c.keywords.includes("deathtouch") &&
    !c.keywords.includes("reach") &&
    !c.keywords.includes("haste") &&
    !c.keywords.includes("lifelink") &&
    c.trigger === "none" &&
    c.cost === 2,
);
const vanilla = find(
  (c) =>
    c.type === "Creature" &&
    c.keywords.includes("reach") &&
    c.trigger === "none",
);
const perm = (
  c: Card,
  uid: number,
  extra: Partial<Permanent> = {},
): Permanent => ({
  uid,
  cardId: c.id,
  tapped: false,
  entered: 0,
  damage: 0,
  counters: 0,
  boost: 0,
  loyalty: c.loyalty,
  used: 0,
  ...extra,
});
function battle() {
  const b = createBattle(presetDeck(), presetDeck("tempo"));
  b.enemy.hand = [];
  b.turn = 3;
  return b;
}
function resources(b: Battle, c: Card) {
  b.player.mana = zeroMana();
  b.player.mana[c.color] = 20;
}
it("uses a seven-card hand and 93-card library for each player", () => {
  const b = createBattle(presetDeck(), presetDeck());
  expect(b.player.hand).toHaveLength(7);
  expect(b.enemy.draw).toHaveLength(93);
  expect(b.player.hp).toBe(20);
});
it("pays colored costs with resources, limits resource drops and rejects untappable sources", () => {
  const b = battle(),
    c = find((c) => c.type === "Creature" && c.cost === 2),
    resource = find((x) => x.type === "Basic Resource" && x.color === c.color);
  b.player.hand = [resource.id, resource.id, c.id];
  battleCommand(b, { type: "play", index: 0 });
  expect(() => battleCommand(b, { type: "play", index: 0 })).toThrow(
    /already played/,
  );
  expect(() => battleCommand(b, { type: "play", index: 1 })).toThrow();
  b.player.board.push(perm(resource, 99));
  battleCommand(b, { type: "play", index: 1 });
  expect(b.player.board.every((p) => p.tapped)).toBe(true);
  expect(b.stack).toHaveLength(1);
  expect(() =>
    battleCommand(b, { type: "tap", uid: 99, color: resource.color }),
  ).toThrow();
  battleCommand(b, { type: "pass" });
  expect(b.player.board.some((p) => p.cardId === c.id)).toBe(true);
});
it("wrong colored mana cannot pay pips and rejected commands leave the game unchanged", () => {
  const s = applyCommand(createGame(), { type: "duel" }),
    b = s.battle!,
    c = find((c) => c.type === "Instant" && c.effect === "draw");
  b.player.hand = [c.id];
  b.player.mana = zeroMana();
  b.player.mana[c.color === "grove" ? "ember" : "grove"] = 20;
  const before = structuredClone(s);
  expect(() => applyCommand(s, { type: "play", index: 0 })).toThrow();
  expect(s).toEqual(before);
});
it("dual resources enter tapped and choose one color per tap", () => {
  const b = battle(),
    c = find((c) => c.type === "Special Resource");
  b.player.hand = [c.id];
  battleCommand(b, { type: "play", index: 0 });
  const p = b.player.board[0];
  expect(p.tapped).toBe(true);
  p.tapped = false;
  battleCommand(b, { type: "tap", uid: p.uid, color: c.produces[1] });
  expect(b.player.mana[c.produces[1]]).toBe(1);
  expect(b.player.mana[c.produces[0]]).toBe(0);
});
it("counterspells resolve LIFO, move the countered card to its graveyard and survive save/load", () => {
  let s = applyCommand(createGame(), { type: "duel" }),
    b = s.battle!;
  b.enemy.hand = [];
  const spell = find((c) => c.type === "Sorcery" && c.effect === "damage"),
    counter = find((c) => c.type === "Instant" && c.effect === "counter");
  b.player.hand = [spell.id, counter.id];
  b.player.mana[spell.color] = 20;
  b.player.mana[counter.color] = 20;
  s = applyCommand(s, {
    type: "play",
    index: 0,
    target: { side: "enemy", kind: "hearth" },
  });
  s = applyCommand(s, {
    type: "play",
    index: 0,
    target: { side: "player", kind: "stack", uid: s.battle!.stack[0].uid },
  });
  expect(s.battle!.stack).toHaveLength(2);
  const restored = decodeSave(JSON.stringify(s));
  s = applyCommand(s, { type: "pass" });
  expect(applyCommand(restored, { type: "pass" })).toEqual(s);
  expect(s.battle!.enemy.hp).toBe(20);
  expect(s.battle!.player.grave).toContain(spell.id);
  expect(s.battle!.stack).toHaveLength(0);
});
it("AI counters using its own paid mana and exposes the response on the stack", () => {
  const b = battle(),
    counter = find((c) => c.type === "Instant" && c.effect === "counter");
  b.enemy.hand = [counter.id];
  b.enemy.mana[counter.color] = 5;
  b.player.hand = [creature.id];
  resources(b, creature);
  battleCommand(b, { type: "play", index: 0 });
  expect(b.stack).toHaveLength(2);
  expect(b.stack[1].owner).toBe("enemy");
  expect(b.enemy.mana[counter.color]).toBe(5 - counter.cost);
  battleCommand(b, { type: "pass" });
  expect(b.player.grave).toContain(creature.id);
});
it("non-instant spells cannot interrupt and removed targets are rechecked on resolution", () => {
  const b = battle(),
    damage = find((c) => c.type === "Instant" && c.effect === "damage"),
    bounce = find((c) => c.type === "Instant" && c.effect === "bounce");
  b.player.hand = [damage.id, bounce.id, creature.id];
  b.player.mana[damage.color] = 20;
  b.player.mana[bounce.color] = 20;
  b.enemy.board = [perm(creature, 99)];
  battleCommand(b, {
    type: "play",
    index: 0,
    target: { side: "enemy", kind: "creature", uid: 99 },
  });
  expect(() => battleCommand(b, { type: "play", index: 1 })).toThrow(
    /Only instants/,
  );
  battleCommand(b, {
    type: "play",
    index: 0,
    target: { side: "enemy", kind: "creature", uid: 99 },
  });
  battleCommand(b, { type: "pass" });
  battleCommand(b, { type: "pass" });
  expect(b.enemy.hand).toContain(creature.id);
  expect(b.enemy.hp).toBe(20);
  expect(b.log.some((x) => x.includes("no longer legal"))).toBe(true);
});
it("summoning sickness prevents attacks but haste allows them", () => {
  const b = battle(),
    hasty = find((c) => c.type === "Creature" && c.keywords.includes("haste"));
  b.player.board = [
    perm(creature, 91, { entered: b.turn }),
    perm(hasty, 92, { entered: b.turn }),
  ];
  battleCommand(b, { type: "combat" });
  expect(() =>
    battleCommand(b, { type: "declare", attackers: [91] }),
  ).toThrow();
  battleCommand(b, { type: "declare", attackers: [92] });
  expect(b.combat[0].uid).toBe(92);
});
it("flying attackers require flying or reach blockers and tapped blockers are illegal", () => {
  const b = battle(),
    fly = find((c) => c.type === "Creature" && c.keywords.includes("flying"));
  b.active = "enemy";
  b.phase = "block";
  b.enemy.board = [perm(fly, 90)];
  b.player.board = [perm(creature, 91), perm(vanilla, 92, { tapped: true })];
  b.combat = [{ uid: 90, hero: null, blocker: null, blocked: false }];
  expect(() =>
    battleCommand(b, { type: "block", attacker: 90, blocker: 91 }),
  ).toThrow();
  expect(() =>
    battleCommand(b, { type: "block", attacker: 90, blocker: 92 }),
  ).toThrow();
  b.player.board[1].tapped = false;
  battleCommand(b, { type: "block", attacker: 90, blocker: 92 });
  expect(b.combat[0].blocker).toBe(92);
});
it("blocked attackers remain blocked after the blocker is destroyed", () => {
  const b = battle(),
    a = find((c) => c.type === "Creature" && !c.keywords.includes("trample"));
  b.player.board = [perm(a, 91)];
  b.enemy.board = [];
  b.phase = "damage";
  b.combat = [{ uid: 91, hero: null, blocker: 92, blocked: true }];
  battleCommand(b, { type: "damage" });
  expect(b.enemy.hp).toBe(20);
});
it("combat applies simultaneous damage, trample spill, and end-of-turn cleanup", () => {
  const b = battle(),
    trample = find(
      (c) => c.type === "Creature" && c.keywords.includes("trample"),
    );
  const a = perm(trample, 91, { counters: 6 }),
    d = perm(creature, 92);
  b.player.board = [a];
  b.enemy.board = [d];
  b.phase = "damage";
  b.combat = [{ uid: 91, hero: null, blocker: 92, blocked: true }];
  const power = stats(b.player, a).power,
    back = stats(b.enemy, d).power,
    tough = stats(b.enemy, d).toughness;
  battleCommand(b, { type: "damage" });
  expect(b.enemy.hp).toBe(20 - Math.max(0, power - tough));
  expect(b.player.board[0].damage).toBe(back);
  expect(b.enemy.grave).toContain(creature.id);
  battleCommand(b, { type: "end-turn" });
  expect(b.player.board[0].damage).toBe(0);
});
it("Hero abilities pay loyalty on activation, use the stack, and activate only once a turn", () => {
  const b = battle(),
    hero = find((c) => c.type === "Hero");
  b.player.board = [perm(hero, 91)];
  battleCommand(b, { type: "hero", uid: 91, ability: 0 });
  expect(b.player.board[0].loyalty).toBe(5);
  expect(b.player.hp).toBe(20);
  battleCommand(b, { type: "pass" });
  expect(b.player.hp).toBe(22);
  expect(() =>
    battleCommand(b, { type: "hero", uid: 91, ability: 0 }),
  ).toThrow();
});
it("a Hero ultimate persists on the stack when its loyalty cost sends it to the graveyard", () => {
  const b = battle(),
    hero = find((c) => c.type === "Hero");
  b.player.board = [perm(hero, 91, { loyalty: 6 })];
  battleCommand(b, {
    type: "hero",
    uid: 91,
    ability: 2,
    target: { side: "enemy", kind: "hearth" },
  });
  expect(b.player.board).toHaveLength(0);
  expect(b.stack).toHaveLength(1);
  battleCommand(b, { type: "pass" });
  expect(b.enemy.hp).toBe(12);
});
it("attackers can defeat Heroes without damaging the opposing hearth", () => {
  const b = battle(),
    hero = find((c) => c.type === "Hero");
  b.player.board = [perm(creature, 91, { counters: 10 })];
  b.enemy.board = [perm(hero, 92)];
  battleCommand(b, { type: "combat" });
  battleCommand(b, { type: "declare", attackers: [91], hero: 92 });
  battleCommand(b, { type: "damage" });
  expect(b.enemy.hp).toBe(20);
  expect(b.enemy.grave).toContain(hero.id);
});
it("gather, spellcraft, lifegain and mourning connect separate card types", () => {
  const b = battle(),
    gather = find((c) => c.trigger === "gather"),
    spellcraft = find((c) => c.trigger === "spellcraft"),
    fellow = find((c) => c.trigger === "lifegain"),
    mourner = find((c) => c.trigger === "mourning"),
    resource = find((c) => c.type === "Basic Resource"),
    heal = find((c) => c.type === "Instant" && c.effect === "heal"),
    destroy = find((c) => c.type === "Instant" && c.effect === "destroy");
  b.player.board = [perm(gather, 91), perm(spellcraft, 92), perm(fellow, 93)];
  b.player.hand = [resource.id, heal.id, destroy.id];
  b.player.mana[heal.color] = 20;
  b.player.mana[destroy.color] = 20;
  b.enemy.board = [perm(mourner, 94), perm(creature, 95)];
  battleCommand(b, { type: "play", index: 0 });
  expect(b.player.board[0].counters).toBe(1);
  battleCommand(b, { type: "play", index: 0 });
  battleCommand(b, { type: "pass" });
  expect(b.player.board[1].counters).toBe(1);
  expect(b.player.board[2].counters).toBe(1);
  battleCommand(b, {
    type: "play",
    index: 0,
    target: { side: "enemy", kind: "creature", uid: 95 },
  });
  const hp = b.player.hp;
  battleCommand(b, { type: "pass" });
  expect(b.player.hp).toBe(hp - 1);
});
it("recursion returns the most recent creature, leaving spells in the graveyard", () => {
  const b = battle(),
    recall = find((c) => c.type === "Sorcery" && c.effect === "recall"),
    spell = find((c) => c.type === "Instant");
  b.player.grave = [creature.id, vanilla.id, spell.id];
  b.player.hand = [recall.id];
  resources(b, recall);
  battleCommand(b, { type: "play", index: 0 });
  battleCommand(b, { type: "pass" });
  expect(b.player.hand).toContain(vanilla.id);
  expect(b.player.grave).toContain(spell.id);
});
it("one free redraw is available only before the first play", () => {
  const b = createBattle(presetDeck(), presetDeck()),
    before = [...b.player.hand];
  battleCommand(b, { type: "mulligan" });
  expect(b.player.hand).toHaveLength(7);
  expect(b.player.draw.slice(-7)).toEqual(before);
  expect(() => battleCommand(b, { type: "mulligan" })).toThrow();
});
it("victory rewards are applied once and finished battles reject further commands", () => {
  let s = applyCommand(createGame(), { type: "duel" });
  const b = s.battle!,
    damage = find((c) => c.type === "Instant" && c.effect === "damage");
  b.enemy.hp = 1;
  b.enemy.hand = [];
  b.player.hand = [damage.id];
  resources(b, damage);
  s = applyCommand(s, {
    type: "play",
    index: 0,
    target: { side: "enemy", kind: "hearth" },
  });
  s = applyCommand(s, { type: "pass" });
  expect(s.battle!.result).toBe("won");
  expect(s.gold).toBe(895);
  expect(s.wins).toBe(1);
  expect(() => applyCommand(s, { type: "pass" })).toThrow();
  expect(applyCommand(s, { type: "leave-duel" }).gold).toBe(895);
});
it("AI completes a duel using ordinary draws and paid sources, with valid save state", () => {
  let s = applyCommand(createGame(42), { type: "duel", opponent: "tempo" });
  for (let i = 0; i < 1500 && s.battle!.result === "playing"; i++) {
    const b = s.battle!;
    if (b.phase === "cleanup") {
      s = applyCommand(s, {
        type: "discard",
        indices: Array.from({ length: b.player.hand.length - 7 }, (_, i) => i),
      });
      continue;
    }
    const cmd: Command = b.stack.length
      ? { type: "pass" }
      : b.active === "player"
        ? { type: "end-turn" }
        : ["block", "damage"].includes(b.phase)
          ? { type: "damage" }
          : { type: "pass" };
    s = applyCommand(s, cmd);
  }
  expect(s.battle!.result).toBe("lost");
  expect(gameSchema.safeParse(s).success).toBe(true);
});

it("uses a saved decision clock, pauses without losing time, and advances safely on expiry", () => {
  let s = applyCommand(createGame(918), { type: "duel" });
  s.battle!.secondsLeft = 2;
  const prior = JSON.stringify(s);
  const ticked = applyCommand(s, { type: "battle-tick" });
  expect(JSON.stringify(s)).toBe(prior);
  expect(ticked.battle!.secondsLeft).toBe(1);
  s = applyCommand(ticked, { type: "battle-clock", timed: false });
  expect(applyCommand(s, { type: "battle-tick" }).battle).toEqual(s.battle);
  s = decodeSave(JSON.stringify(s));
  expect(s.battle!.timed).toBe(false);
  expect(s.battle!.secondsLeft).toBe(1);
  s = applyCommand(s, { type: "battle-clock", timed: true });
  s = applyCommand(s, { type: "battle-tick" });
  expect(s.battle!.turn).toBeGreaterThan(1);
  expect(s.battle!.secondsLeft).toBe(60);
  expect(s.battle!.player.board).toHaveLength(0);
});
it("clock expiry resolves one stack item and accepts no attackers without spending a card", () => {
  const b = battle();
  const spell = find((c) => c.type === "Instant" && c.effect === "draw");
  resources(b, spell);
  b.player.hand = [spell.id];
  battleCommand(b, { type: "play", index: 0 });
  b.secondsLeft = 1;
  battleCommand(b, { type: "battle-tick" });
  expect(b.stack).toHaveLength(0);
  expect(b.player.hand).toHaveLength(spell.amount);
  battleCommand(b, { type: "combat" });
  b.secondsLeft = 1;
  battleCommand(b, { type: "battle-tick" });
  expect(b.phase).toBe("second-main");
  expect(b.combat).toEqual([]);
});
it("old schema-three battles receive a clock without changing existing cards or routes", () => {
  const s = applyCommand(createGame(123), { type: "duel" });
  const raw = JSON.parse(JSON.stringify(s));
  delete raw.battle.secondsLeft;
  delete raw.battle.timed;
  const loaded = decodeSave(JSON.stringify(raw));
  expect(loaded.battle!.secondsLeft).toBe(60);
  expect(loaded.battle!.player.hand).toEqual(s.battle!.player.hand);
  expect(loaded.room).toEqual(s.room);
});

it("resource counters include floating mana and report flexible sources without doubling the total", () => {
  const b = battle(),
    dual = find(
      (c) => c.type === "Special Resource" && c.produces.length === 2,
    );
  const basic = find(
    (c) => c.type === "Basic Resource" && c.color === dual.produces[0],
  );
  b.player.board = [perm(dual, 300), perm(basic, 301)];
  b.player.mana = zeroMana();
  b.player.mana[basic.color] = 2;
  let counts = availableResources(b.player);
  expect(counts.total).toBe(4);
  expect(counts.flexible).toBe(1);
  expect(counts.colors[basic.color]).toBe(4);
  expect(counts.colors[dual.produces[1]]).toBe(1);
  battleCommand(b, { type: "tap", uid: 300, color: dual.produces[1] });
  counts = availableResources(b.player);
  expect(counts.total).toBe(4);
  expect(counts.flexible).toBe(0);
  expect(counts.colors[basic.color]).toBe(3);
  expect(counts.colors[dual.produces[1]]).toBe(1);
});

it("full control retains a response and a saved counter chain resolves in order", () => {
  const b = battle(),
    spell = find((c) => c.type === "Sorcery" && c.effect === "draw"),
    counter = find((c) => c.type === "Instant" && c.effect === "counter");
  b.player.hand = [spell.id, counter.id];
  b.enemy.hand = [counter.id];
  for (const side of [b.player, b.enemy])
    side.mana = { dawn: 30, tide: 30, grove: 30, grave: 30, ember: 30 };
  battleCommand(b, { type: "battle-controls", fullControl: true });
  battleCommand(b, { type: "play", index: 0 });
  expect(b.stack).toHaveLength(1);
  expect(b.enemy.hand).toHaveLength(1);
  expect(b.passes).toBe(0);
  const resumed = battleSchema.parse(JSON.parse(JSON.stringify(b)));
  battleCommand(resumed, { type: "pass" });
  expect(resumed.stack).toHaveLength(2);
  expect(resumed.stack.at(-1)?.owner).toBe("enemy");
  battleCommand(resumed, {
    type: "play",
    index: 0,
    target: { side: "enemy", kind: "stack", uid: resumed.stack.at(-1)!.uid },
  });
  expect(resumed.passes).toBe(0);
  battleCommand(resumed, { type: "pass" });
  expect(resumed.stack).toHaveLength(1);
  battleCommand(resumed, { type: "pass" });
  expect(resumed.stack).toHaveLength(0);
  expect(resumed.player.hand.length).toBeGreaterThan(0);
});
it("payment preview preserves an aspect and exactly matches the committed payment", () => {
  const b = battle(),
    c = find(
      (c) => c.type === "Creature" && c.cost > c.colored && c.colored > 0,
    );
  const reserve = c.color === "grove" ? "ember" : "grove";
  const source = find(
    (c) => c.type === "Basic Resource" && c.color === reserve,
  );
  const otherSource = find(
    (c) => c.type === "Basic Resource" && c.color !== reserve,
  );
  b.player.hand = [c.id];
  b.player.mana = zeroMana();
  b.player.mana[c.color] = c.colored;
  b.player.board = [
    perm(source, 900),
    ...Array.from({ length: c.cost - c.colored }, (_, i) =>
      perm(otherSource, 901 + i),
    ),
  ];
  battleCommand(b, { type: "battle-controls", reserveColor: reserve });
  const before = structuredClone(b),
    preview = paymentPreview(b, c);
  expect(b).toEqual(before);
  expect(preview.error).toBe("");
  expect(preview.tapped).not.toContain(900);
  battleCommand(b, { type: "play", index: 0 });
  expect(b.player.board.filter((p) => p.tapped).map((p) => p.uid)).toEqual(
    preview.tapped,
  );
  expect(availableResources(b.player)).toEqual(preview.remaining);
});
it("manual taps can be reversed only before committing an action", () => {
  const b = battle(),
    resource = find((c) => c.type === "Basic Resource");
  b.player.board = [perm(resource, 900)];
  const before = structuredClone(b.player);
  battleCommand(b, { type: "tap", uid: 900, color: resource.color });
  battleCommand(b, { type: "undo-tap" });
  expect(b.player).toEqual(before);
  battleCommand(b, { type: "tap", uid: 900, color: resource.color });
  battleCommand(b, { type: "combat" });
  expect(() => battleCommand(b, { type: "undo-tap" })).toThrow(/reversible/);
});
it("cleanup persists the hand until the player chooses exactly the excess cards", () => {
  const b = battle();
  b.enemy.board = [perm(creature, 950)];
  b.player.hand = cards.slice(0, 9).map((c) => c.id);
  const hand = [...b.player.hand];
  battleCommand(b, { type: "end-turn" });
  expect(b.phase).toBe("cleanup");
  expect(b.player.hand).toEqual(hand);
  const resumed = battleSchema.parse(JSON.parse(JSON.stringify(b)));
  expect(() =>
    battleCommand(resumed, { type: "discard", indices: [0, 0] }),
  ).toThrow(/exactly/);
  expect(resumed.player.hand).toEqual(hand);
  battleCommand(resumed, { type: "discard", indices: [1, 7] });
  expect(resumed.player.hand).toEqual(
    hand.filter((_, i) => i !== 1 && i !== 7),
  );
  expect(resumed.player.grave).toEqual([hand[7], hand[1]]);
  expect(resumed.active).toBe("enemy");
});
it("simultaneous defeat is a draw and legacy battle fields receive defaults", () => {
  const b = battle();
  b.player.hp = 0;
  b.enemy.hp = 0;
  battleCommand(b, { type: "combat" });
  expect(b.result).toBe("drawn");
  const old = JSON.parse(JSON.stringify(battle()));
  for (const key of [
    "fullControl",
    "priority",
    "passes",
    "reserveColor",
    "tapHistory",
    "events",
    "eventSequence",
  ])
    delete old[key];
  const restored = battleSchema.parse(old);
  expect(restored.fullControl).toBe(false);
  expect(restored.priority).toBe("player");
  expect(restored.events).toEqual([]);
});
it("the shared attack evaluator declines an isolated losing trade without reading the enemy hand", () => {
  const b = battle();
  b.player.board = [perm(creature, 901)];
  b.enemy.board = [perm(creature, 902, { counters: 10 })];
  expect(plannedAttackers(b, "player")).toEqual([]);
  b.enemy.hand = cards.slice(0, 20).map((c) => c.id);
  expect(plannedAttackers(b, "player")).toEqual([]);
});
