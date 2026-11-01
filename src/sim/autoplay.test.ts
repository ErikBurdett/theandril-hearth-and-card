import { it, expect } from "vitest";
import { createGame, applyCommand, decodeSave } from "./game";
import { autoplayCommand, autoplayProfile } from "./autoplay";
import { battleCommand, createBattle, deckProfile, presetDeck } from "./battle";
import { roomNodes } from "../content/tavern";
import { cardById, cards } from "../content/catalog";
function ready(seed = 19) {
  let g = applyCommand(createGame(seed), { type: "duel" });
  g = applyCommand(g, { type: "autoplay", enabled: true });
  g.room.player = {
    node: "table",
    route: [],
    x: roomNodes.table.x,
    y: roomNodes.table.y,
  };
  return g;
}
it("autoplay walks to the table, waits to arrive, and rejects manual battle commands atomically", () => {
  let g = applyCommand(applyCommand(createGame(), { type: "duel" }), {
    type: "autoplay",
    enabled: true,
  });
  expect(g.room.player.route.at(-1)).toBe("table");
  const b = structuredClone(g.battle);
  g = applyCommand(g, { type: "auto-step" });
  expect(g.battle).toEqual(b);
  const before = structuredClone(g);
  expect(() => applyCommand(g, { type: "end-turn" })).toThrow(/Take control/);
  expect(g).toEqual(before);
  expect(
    applyCommand(g, { type: "walk", destination: "book" }).room.player,
  ).toEqual(g.room.player);
});
it("autoplay decisions do not depend on hidden opponent hand or library contents", () => {
  const g = ready(),
    b = g.battle!,
    other = structuredClone(b);
  other.enemy.hand = Array(7).fill("reckoning.80");
  other.enemy.draw = Array(70).fill("first-oaths.73");
  expect(autoplayCommand(other)).toEqual(autoplayCommand(b));
});
it("save continuation and taking control preserve a live response stack", () => {
  let g = ready();
  const b = g.battle!,
    spell = cards.find((c) => c.type === "Instant" && c.effect === "draw")!;
  b.player.hand = [spell.id];
  b.mulligans = 1; // the redraw is spent; a one-card hand would otherwise take it
  b.enemy.hand = [];
  b.player.mana = { dawn: 20, tide: 20, grave: 20, ember: 20, grove: 20 };
  g = applyCommand(g, { type: "auto-step" });
  expect(g.battle!.stack).toHaveLength(1);
  const loaded = decodeSave(JSON.stringify(g));
  expect(applyCommand(g, { type: "auto-step" })).toEqual(
    applyCommand(loaded, { type: "auto-step" }),
  );
  const before = structuredClone(g.battle);
  g = applyCommand(g, { type: "autoplay", enabled: false });
  expect({ ...g.battle, autoplay: true }).toEqual(before);
  expect(applyCommand(g, { type: "auto-step" })).toEqual(g);
  g = applyCommand(g, { type: "pass" });
  expect(g.battle!.stack).toHaveLength(0);
});
it("autoplay can finish duels without illegal moves, persists completion and pays victories once", () => {
  let wins = 0;
  for (let seed = 1; seed <= 12; seed++) {
    let g = ready(seed),
      steps = 0;
    const start = g.gold,
      previous = g.battle!.opponent;
    while (!g.progression.lastDuel && steps++ < 1800)
      g = applyCommand(g, { type: "auto-step" });
    expect(g.progression.lastDuel, `seed ${seed}`).not.toBeNull();
    const records = Object.values(g.rivals);
    expect(records).toHaveLength(1);
    expect(records[0].wins + records[0].losses + records[0].draws).toBe(1);
    expect(records[0].wins).toBe(Number(g.progression.lastDuel!.won));
    expect(records[0].concessions).toBe(0);
    expect(g.battle!.result).toBe("playing");
    expect(g.battle!.autoplay).toBe(true);
    expect(g.battle!.opponent.split(" · ")[0]).not.toBe(
      previous.split(" · ")[0],
    );
    expect(g.battle!.opponent.split(" · ")[1]).not.toBe(
      previous.split(" · ")[1],
    );
    if (g.progression.lastDuel!.won) {
      wins++;
      expect(g.gold).toBe(start + 35);
      expect(g.battle!.rewarded).toBe(false);
    } else expect(g.gold).toBe(start);
    g = applyCommand(g, { type: "autoplay", enabled: false });
    expect(
      applyCommand(decodeSave(JSON.stringify(g)), { type: "auto-step" }),
    ).toEqual(g);
  }
  expect(wins).toBeGreaterThan(0);
}, 30000);
it("older schema-three battles default to manual control", () => {
  const g = ready();
  delete (g.battle as Partial<NonNullable<typeof g.battle>>).autoplay;
  expect(decodeSave(JSON.stringify(g)).battle!.autoplay).toBe(false);
});

it("a stale staged hand position cannot cast a replacement card or spend mana", () => {
  let g = ready();
  g = applyCommand(g, { type: "autoplay", enabled: false });
  g.battle!.player.hand = ["first-oaths.73"];
  const before = structuredClone(g);
  expect(() =>
    applyCommand(g, {
      type: "play",
      index: 0,
      expectedCardId: "first-oaths.75",
    }),
  ).toThrow(/hand position changed/);
  expect(g).toEqual(before);
});

it("autoplay pilots each recipe in the style its cards suggest", () => {
  const styles = {
    cinder: "aggressive",
    kiln: "aggressive",
    "beacon-to-beacon": "aggressive",
    witness: "reactive",
    tempo: "reactive",
    recursion: "recursive",
    embers: "recursive",
    candlewatch: "evasive",
    fellowship: "defensive",
    // Balance pass 3 gave Lanternwatch Company Skyborne and Hearthbond bodies; its
    // courier still pilots it defensively, the keeper's autoplay reads it as evasive.
    lantern: "evasive",
    funeral: "defensive",
  } as const;
  for (const [recipe, style] of Object.entries(styles))
    expect(deckProfile(presetDeck(recipe)), recipe).toBe(style);
  const b = createBattle(presetDeck("cinder"), presetDeck("witness"));
  expect(autoplayProfile(b)).toBe("aggressive");
});

it("autoplay blocks by the shared scored planner: no chump at full health, a block against lethal, gang blocks when two fell one", () => {
  const plain = (attack: number, health: number) =>
    cards.find(
      (c) =>
        c.type === "Creature" &&
        !c.keywords.length &&
        c.trigger === "none" &&
        c.effect === "none" &&
        c.attack === attack &&
        c.health === health,
    )!;
  const perm = (cardId: string, uid: number, counters = 0) => ({
    uid,
    cardId,
    tapped: false,
    entered: 0,
    damage: 0,
    counters,
    boost: 0,
    loyalty: 0,
    used: 0,
  });
  const table = () => {
    const b = createBattle(presetDeck(), presetDeck("tempo"));
    b.turn = 4;
    b.active = "enemy";
    b.phase = "block";
    b.enemy.board = [perm(plain(2, 2).id, 50, 1)];
    b.combat = [
      { uid: 50, hero: null, blocker: null, blockers: [], blocked: false },
    ];
    return b;
  };
  const full = table();
  full.player.board = [perm(plain(1, 2).id, 60)];
  expect(autoplayCommand(full)).toEqual({ type: "damage" });
  const pressed = table();
  pressed.player.board = [perm(plain(1, 2).id, 60)];
  pressed.player.hp = 3;
  expect(autoplayCommand(pressed)).toEqual({
    type: "block",
    attacker: 50,
    blocker: 60,
  });
  const gang = table();
  gang.player.board = [perm(plain(2, 2).id, 61), perm(plain(2, 2).id, 62)];
  const first = autoplayCommand(gang);
  expect(first).toEqual({ type: "block", attacker: 50, blocker: 61 });
  battleCommand(gang, first);
  const second = autoplayCommand(gang);
  expect(second).toEqual({ type: "block", attacker: 50, blocker: 62 });
  battleCommand(gang, second);
  expect(autoplayCommand(gang)).toEqual({ type: "damage" });
});

it("autoplay casts, holds responses and aims attacks with the rivals' scored planners in its recipe's style", () => {
  const find = (test: (c: (typeof cards)[number]) => boolean) =>
    cards.find(test)!;
  const plain = (attack: number, health: number) =>
    find(
      (c) =>
        c.type === "Creature" &&
        !c.keywords.length &&
        c.trigger === "none" &&
        c.effect === "none" &&
        c.attack === attack &&
        c.health === health,
    );
  const destroy = find((c) => c.type === "Sorcery" && c.effect === "destroy"),
    color = destroy.color,
    counter = find(
      (c) =>
        c.type === "Instant" && c.effect === "counter" && c.color === color,
    ),
    creature = find(
      (c) =>
        c.type === "Creature" &&
        c.color === color &&
        c.cost === 3 &&
        c.effect === "none",
    ),
    basic = find((c) => c.type === "Basic Resource" && c.produces[0] === color),
    hero = find((c) => c.type === "Hero");
  let uid = 200;
  const perm = (id: string, extra = {}) => ({
    uid: uid++,
    cardId: id,
    tapped: false,
    entered: 0,
    damage: 0,
    counters: 0,
    boost: 0,
    loyalty: 0,
    used: 0,
    ...extra,
  });
  /** The keeper's main phase on turn 3 with a chosen recipe in the library and `mana` untapped resources. */
  const table = (recipe: string, mana: number) => {
    const b = createBattle(presetDeck(recipe), presetDeck("tempo"));
    b.turn = 3;
    b.active = "player";
    b.player.landDrops = 1;
    b.player.draw = presetDeck(recipe);
    b.player.grave = [];
    b.player.board = Array.from({ length: mana }, () => perm(basic.id));
    b.enemy.board = [];
    return b;
  };
  // Reactive recipes hold counter mana while the rival still holds cards.
  const held = table("witness", 3);
  expect(autoplayProfile(held)).toBe("reactive");
  held.player.hand = [creature.id, counter.id];
  expect(autoplayCommand(held)).toEqual({ type: "combat" });
  held.enemy.hand = [];
  expect(autoplayCommand(held)).toEqual({ type: "play", index: 0 });
  // Reactive recipes remove the biggest threat before developing; aggressive ones develop first.
  for (const [recipe, expected] of [
    ["witness", 1],
    ["cinder", 0],
  ] as const) {
    const b = table(recipe, 4);
    b.enemy.hand = [];
    b.player.hand = [creature.id, destroy.id];
    const big = perm(plain(2, 2).id, { counters: 2 });
    b.enemy.board.push(perm(plain(1, 2).id), big);
    const cmd = autoplayCommand(b);
    expect(cmd.type, recipe).toBe("play");
    expect(cmd.type === "play" && cmd.index, recipe).toBe(expected);
    if (expected === 1)
      expect(cmd.type === "play" && cmd.target).toEqual({
        side: "enemy",
        kind: "creature",
        uid: big.uid,
      });
  }
  // A cautious recipe spends one attacker on a Hero it can fell instead of the hearth.
  const attack = table("fellowship", 0);
  expect(autoplayProfile(attack)).toBe("defensive");
  attack.phase = "attack";
  attack.player.hand = [];
  const striker = perm(plain(2, 2).id),
    foe = perm(hero.id, { loyalty: 2 });
  attack.player.board = [striker];
  attack.enemy.board = [foe];
  expect(autoplayCommand(attack)).toEqual({
    type: "declare",
    attackers: [striker.uid],
    hero: undefined,
    destinations: [{ uid: striker.uid, hero: foe.uid }],
  });
  battleCommand(attack, autoplayCommand(attack));
  expect(attack.combat[0]).toMatchObject({ uid: striker.uid, hero: foe.uid });
});

it("autoplay takes the free redraw only on a hand with fewer than two or more than five resources", () => {
  const b = createBattle(presetDeck("tempo"), presetDeck("fellowship")),
    resource = b.player.draw.find(
      (id) => cardById[id].type === "Basic Resource",
    )!,
    spell = b.player.draw.find((id) => cardById[id].type === "Creature")!;
  const hand = (resources: number) => {
    b.player.hand = [
      ...Array(resources).fill(resource),
      ...Array(7 - resources).fill(spell),
    ];
    return autoplayCommand(b).type;
  };
  expect(hand(0)).toBe("mulligan");
  expect(hand(1)).toBe("mulligan");
  expect(hand(2)).not.toBe("mulligan");
  expect(hand(5)).not.toBe("mulligan");
  expect(hand(6)).toBe("mulligan");
  b.player.hand = Array(7).fill(spell);
  battleCommand(b, autoplayCommand(b));
  expect(b.mulligans).toBe(1);
  expect(b.player.hand).toHaveLength(7);
  expect(autoplayCommand(b).type).not.toBe("mulligan");
});
