import { it, expect } from "vitest";
import { cardById, cards, isResource, type Card } from "../content/catalog";
import { duelists, rivalProfiles } from "../content/tavern";
import {
  battleCommand,
  battleSchema,
  createBattle,
  plannedAttackers,
  presetDeck,
  rivalProfile,
  deckProfile,
  rivalProfileCounterplay,
  redrawAvailable,
  type Battle,
  type Permanent,
} from "./battle";
import { applyCommand, createGame, opensDuel } from "./game";

const find = (test: (c: Card) => boolean) => cards.find(test)!;
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
const flier = find(
  (c) =>
    c.type === "Creature" &&
    c.keywords.length === 1 &&
    c.keywords[0] === "flying" &&
    c.trigger === "none" &&
    c.attack === 2,
);
const destroy = find((c) => c.type === "Sorcery" && c.effect === "destroy"),
  color = destroy.color,
  counter = find(
    (c) => c.type === "Instant" && c.effect === "counter" && c.color === color,
  ),
  pump = find((c) => c.type === "Instant" && c.effect === "pump"),
  burn = find(
    (c) =>
      c.type === "Instant" &&
      c.effect === "damage" &&
      c.amount === 3 &&
      c.cost <= 2,
  ),
  hero = find((c) => c.type === "Hero" && c.abilities[1].effect === "damage"),
  basic = (of: Card["color"]) =>
    find((c) => c.type === "Basic Resource" && c.produces[0] === of);
let uid = 100;
const perm = (c: Card, extra: Partial<Permanent> = {}): Permanent => ({
  uid: uid++,
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
const guest = (profile: string) => duelists.find((g) => g.profile === profile)!;
/** An empty-handed, resource-rich table on turn 3 for a named guest. */
function table(profile: string, active: "player" | "enemy" = "enemy") {
  const b = createBattle(presetDeck(), presetDeck("tempo"), "x", {
    opponentId: guest(profile).id,
  });
  b.turn = 3;
  b.active = active;
  b.enemy.hand = [];
  b.enemy.landDrops = 1;
  b.player.landDrops = 1;
  for (const side of [b.player, b.enemy]) side.board = [];
  return b;
}
const grant = (b: Battle, side: "player" | "enemy", n: number, of = color) =>
  b[side].board.push(
    ...Array.from({ length: n }, () => perm(basic(of), { tapped: false })),
  );
const untapped = (b: Battle) =>
  b.enemy.board.filter(
    (p) => !p.tapped && cards.find((c) => c.id === p.cardId)!.produces.length,
  ).length;

it("maps every guest to one of the six personalities and pilots a guestless rival in its deck's style", () => {
  const profiles = new Set(duelists.map((g) => g.profile));
  for (const p of rivalProfiles.filter((p) => p !== "steady"))
    expect(profiles.has(p), p).toBe(true);
  expect(duelists.every((g) => rivalProfiles.includes(g.profile))).toBe(true);
  const scholar = duelists.find((g) => g.id === "scholar")!,
    empty = createBattle([], []).enemy;
  expect(
    rivalProfile({ opponentId: "scholar", opponent: "", enemy: empty }),
  ).toBe("reactive");
  expect(
    rivalProfile({
      opponentId: null,
      opponent: `${scholar.name} · Deck`,
      enemy: empty,
    }),
  ).toBe("reactive");
  // No guest and no cards: the steady pilot. No guest and a recipe: the recipe's own style, as the keeper's autoplay reads it.
  expect(
    rivalProfile({ opponentId: null, opponent: "Old duel", enemy: empty }),
  ).toBe("steady");
  expect(
    rivalProfile(
      createBattle(presetDeck(), presetDeck(), "Nobody", { redraw: false }),
    ),
  ).toBe(deckProfile(presetDeck()));
  expect(deckProfile(presetDeck())).toBe("defensive");
});

it("reactive rivals remove the biggest threat before developing; aggressive ones develop first", () => {
  const creature = find(
    (c) =>
      c.type === "Creature" &&
      c.color === color &&
      c.cost <= 3 &&
      c.effect === "none",
  );
  for (const [profile, expected] of [
    ["reactive", destroy.id],
    ["aggressive", creature.id],
  ] as const) {
    const b = table(profile);
    grant(b, "enemy", 4);
    b.enemy.hand = [creature.id, destroy.id];
    const big = perm(plain(2, 2), { counters: 2 }),
      small = perm(plain(1, 2));
    b.player.board.push(small, big);
    battleCommand(b, { type: "pass" });
    expect(b.stack.at(-1)?.cardId, profile).toBe(expected);
    if (profile === "reactive")
      expect(b.stack.at(-1)?.target).toEqual({
        side: "player",
        kind: "creature",
        uid: big.uid,
      });
  }
  // Without a worthwhile target the reactive rival holds its removal.
  const b = table("reactive");
  grant(b, "enemy", 4);
  b.enemy.hand = [creature.id, destroy.id];
  b.player.board.push(perm(plain(1, 2)));
  battleCommand(b, { type: "pass" });
  expect(b.stack.at(-1)?.cardId).toBe(creature.id);
});

it("reactive rivals keep counter mana while the keeper holds cards; aggressive rivals spend it", () => {
  const creature = find(
    (c) =>
      c.type === "Creature" &&
      c.color === color &&
      c.cost === 3 &&
      c.effect === "none",
  );
  const play = (profile: string, handSize: number) => {
    const b = table(profile);
    grant(b, "enemy", 3);
    b.enemy.hand = [creature.id, counter.id];
    b.player.hand = b.player.hand.slice(0, handSize);
    battleCommand(b, { type: "pass" });
    return b;
  };
  const held = play("reactive", 5);
  expect(held.stack).toHaveLength(0);
  expect(held.enemy.hand).toContain(counter.id);
  expect(untapped(held)).toBe(3);
  expect(play("reactive", 0).stack.at(-1)?.cardId).toBe(creature.id);
  expect(play("aggressive", 5).stack.at(-1)?.cardId).toBe(creature.id);
});

it("defensive rivals protect a threatened companion with a trick; reactive ones counter the spell", () => {
  for (const [profile, expected] of [
    ["defensive", pump.id],
    ["reactive", counter.id],
  ] as const) {
    const b = table(profile, "player");
    grant(b, "player", 4, burn.color);
    grant(b, "enemy", 2, pump.color);
    grant(b, "enemy", 2, counter.color);
    const companion = perm(plain(2, 2));
    b.enemy.board.push(companion);
    b.enemy.hand = [pump.id, counter.id];
    b.player.hand = [burn.id];
    battleCommand(b, {
      type: "play",
      index: 0,
      target: { side: "enemy", kind: "creature", uid: companion.uid },
    });
    expect(b.stack.at(-1)?.cardId, profile).toBe(expected);
    if (profile === "defensive")
      expect(b.stack.at(-1)?.target).toEqual({
        side: "enemy",
        kind: "creature",
        uid: companion.uid,
      });
    for (let i = 0; i < 2; i++) battleCommand(b, { type: "pass" });
    expect(
      b.enemy.board.some((p) => p.uid === companion.uid),
      profile,
    ).toBe(true);
  }
});

it("every personality swings with everything when the public board shows lethal", () => {
  for (const profile of ["defensive", "reactive", "evasive"]) {
    const b = table(profile);
    b.enemy.board.push(perm(plain(2, 2)), perm(plain(2, 2)), perm(plain(2, 2)));
    b.player.board.push(perm(plain(2, 2), { counters: 3 }));
    b.player.hp = 20;
    expect(plannedAttackers(b, "enemy"), profile).toEqual([]);
    b.player.hp = 4;
    expect(plannedAttackers(b, "enemy"), profile).toHaveLength(3);
  }
});

it("defensive rivals block to win or absorb; aggressive rivals chump only against lethal", () => {
  const attack = (profile: string, hp: number, defenders: Permanent[]) => {
    const b = table(profile, "player");
    const attacker = perm(plain(2, 2));
    b.player.board.push(attacker);
    b.enemy.board.push(...defenders);
    b.enemy.hp = hp;
    b.phase = "attack";
    battleCommand(b, { type: "declare", attackers: [attacker.uid] });
    return { b, blocker: b.combat[0].blocker };
  };
  const wall = perm(plain(2, 2), { counters: 1 }),
    chump = perm(plain(1, 2));
  expect(attack("defensive", 20, [chump, wall]).blocker).toBe(wall.uid);
  expect(attack("aggressive", 20, [perm(plain(1, 2))]).blocker).toBeNull();
  expect(attack("aggressive", 2, [perm(plain(1, 2))]).blocker).not.toBeNull();
  // Even trades suit both; a dearer companion is not traded away by the aggressive rival.
  expect(attack("recursive", 20, [perm(plain(2, 2))]).blocker).not.toBeNull();
  expect(attack("aggressive", 20, [perm(plain(2, 2))]).blocker).not.toBeNull();
  expect(
    attack("aggressive", 20, [perm(plain(3, 2), { counters: 0 })]).blocker,
  ).toBeNull();
  expect(attack("recursive", 20, [perm(plain(3, 2))]).blocker).not.toBeNull();
  // A companion that survives and kills always blocks.
  expect(attack("aggressive", 20, [perm(plain(2, 3))]).blocker).not.toBeNull();
});

it("evasive rivals press with Skyborne attackers and keep ground companions out of bad trades", () => {
  const b = table("evasive");
  const bird = perm(flier),
    walker = perm(plain(2, 2));
  b.enemy.board.push(bird, walker);
  b.player.board.push(perm(plain(2, 2), { counters: 2 }));
  expect(plannedAttackers(b, "enemy")).toEqual([bird.uid]);
});

it("hero-minded rivals cast Heroes first and use the ability that answers the table", () => {
  const b = table("hero");
  grant(b, "enemy", 6, hero.color);
  const cheap = find(
    (c) => c.type === "Creature" && c.color === hero.color && c.cost <= 2,
  );
  b.enemy.hand = [cheap.id, hero.id];
  battleCommand(b, { type: "pass" });
  expect(b.stack.at(-1)?.cardId).toBe(hero.id);
  battleCommand(b, { type: "pass" });
  expect(b.enemy.board.some((p) => p.cardId === hero.id)).toBe(true);
  b.enemy.hand = [];
  const target = perm(plain(2, 3));
  b.player.board.push(target);
  battleCommand(b, { type: "pass" });
  expect(b.stack.at(-1)).toMatchObject({
    ability: true,
    effect: "damage",
    target: { side: "player", kind: "creature", uid: target.uid },
  });
});

it("rival decisions never depend on the keeper's hidden hand or library", () => {
  const b = table("reactive");
  grant(b, "enemy", 5);
  b.enemy.hand = [destroy.id, counter.id, plain(2, 2).id];
  b.player.board.push(perm(plain(2, 2), { counters: 2 }));
  const twin = structuredClone(b);
  twin.player.hand = twin.player.draw.slice(0, b.player.hand.length);
  twin.player.draw = [...twin.player.draw].reverse();
  for (const copy of [b, twin]) {
    battleCommand(copy, { type: "pass" });
    battleCommand(copy, { type: "pass" });
  }
  expect(twin.enemy).toEqual(b.enemy);
  expect(twin.stack).toEqual(b.stack);
  expect(twin.combat).toEqual(b.combat);
  expect(twin.log).toEqual(b.log);
});

it("the guest who lost the last meeting opens the next one, and the opening survives a save", () => {
  let game = createGame(7);
  expect(opensDuel(game, "smith")).toBe("player");
  game = applyCommand(game, { type: "duel", opponent: "smith" });
  expect(game.battle!.active).toBe("player");
  expect(game.battle!.turn).toBe(1);
  game.battle!.enemy.hp = 0;
  game = applyCommand(game, { type: "pass" });
  expect(game.battle!.result).toBe("won");
  game = applyCommand(game, { type: "leave-duel" });
  expect(opensDuel(game, "smith")).toBe("enemy");
  game = applyCommand(game, { type: "duel", opponent: "smith" });
  const smith = duelists.find((g) => g.id === "smith")!;
  expect(game.battle!.log.join("\n")).toContain(`${smith.name} · `);
  expect(game.battle!.log.join("\n")).toContain("opens the duel.");
  expect(
    game.battle!.enemy.landDrops + game.battle!.enemy.board.length,
  ).toBeGreaterThan(0);
  const saved = battleSchema.parse(JSON.parse(JSON.stringify(game.battle)));
  expect(saved).toEqual(game.battle);
  // An explicit seating overrides the rule, and the same seed replays identically.
  const again = applyCommand(createGame(7), {
    type: "duel",
    opponent: "smith",
    first: "enemy",
  });
  expect(again.battle!.log.join("\n")).toContain("opens the duel.");
  expect(
    applyCommand(createGame(7), {
      type: "duel",
      opponent: "smith",
      first: "enemy",
    }).battle,
  ).toEqual(again.battle);
});

it("every guest carries four distinct rivalry lines and every personality explains its counterplay", () => {
  const all = duelists.flatMap((g) => Object.values(g.rivalry));
  expect(all).toHaveLength(80);
  expect(new Set(all).size).toBe(80);
  for (const line of all) expect(line.length).toBeGreaterThan(20);
  for (const profile of rivalProfiles)
    expect(rivalProfileCounterplay[profile].length).toBeGreaterThan(40);
});

it("the free redraw survives a guest opening the duel", () => {
  let game = applyCommand(createGame(21), {
    type: "duel",
    opponent: "smith",
    first: "enemy",
  });
  // Let the guest finish its opening turn.
  for (let i = 0; i < 12 && game.battle!.active !== "player"; i++)
    game = applyCommand(game, { type: "pass" });
  const b = game.battle!;
  expect(b.active).toBe("player");
  expect(b.turn).toBe(2);
  expect(redrawAvailable(b)).toBe(true);
  const size = b.player.hand.length;
  game = applyCommand(game, { type: "mulligan" });
  expect(game.battle!.player.hand).toHaveLength(size);
  expect(game.battle!.mulligans).toBe(1);
  expect(redrawAvailable(game.battle!)).toBe(false);
  expect(() => applyCommand(game, { type: "mulligan" })).toThrow();
});

it("rivals use a second main phase after combat and put away their costliest cards at cleanup", () => {
  // A recursive rival trades its companion in combat, then reclaims it after combat
  // rather than ending the turn with the recall still in hand.
  const recall = find((c) => c.type === "Sorcery" && c.effect === "recall");
  const b = table("recursive");
  grant(b, "enemy", recall.cost, recall.color);
  const attacker = perm(plain(2, 2)),
    blocker = perm(plain(2, 2));
  b.enemy.board.push(attacker);
  b.player.board.push(blocker);
  b.enemy.hand = [recall.id];
  battleCommand(b, { type: "pass" });
  expect(b.phase).toBe("block");
  expect(b.combat.map((a) => a.uid)).toEqual([attacker.uid]);
  battleCommand(b, {
    type: "block",
    attacker: attacker.uid,
    blocker: blocker.uid,
  });
  battleCommand(b, { type: "damage" });
  expect(b.enemy.grave).toContain(attacker.cardId);
  expect(b.phase).toBe("second-main");
  battleCommand(b, { type: "pass" });
  expect(b.active).toBe("enemy");
  expect(b.stack.at(-1)?.cardId).toBe(recall.id);
  // With nothing to cast and nobody to attack, a rival holding nine cards keeps
  // the seven cheapest, as the keeper's autoplay does, not the first seven.
  const costly = find((c) => c.type === "Creature" && c.cost === 5),
    cheap = find((c) => c.type === "Creature" && c.cost === 1),
    land = basic(color).id,
    full = table("aggressive");
  full.enemy.hand = [
    costly.id,
    land,
    land,
    cheap.id,
    land,
    land,
    land,
    land,
    land,
  ];
  battleCommand(full, { type: "pass" });
  expect(full.active).toBe("player");
  expect(full.enemy.hand).toEqual(Array(7).fill(land));
  expect(full.enemy.grave).toEqual([costly.id, cheap.id]);
});

it("a rival takes the keeper's one free opening redraw on a resource-poor hand, except in practice lessons", () => {
  const deck = presetDeck("tempo"),
    spellsFirst = [
      ...deck.filter((id) => !isResource(cardById[id])),
      ...deck.filter((id) => isResource(cardById[id])),
    ],
    // createBattle keeps the given array as the library, so each duel takes a copy.
    redrawn = createBattle(presetDeck(), [...spellsFirst], "Daven Greyquay"),
    kept = createBattle(presetDeck(), [...spellsFirst], "Daven Greyquay", {
      redraw: false,
    });
  expect(kept.enemy.hand).toEqual(spellsFirst.slice(0, 7));
  expect(kept.log.some((l) => l.includes("free opening redraw"))).toBe(false);
  expect(redrawn.enemy.hand).toEqual(spellsFirst.slice(7, 14));
  expect(redrawn.enemy.draw.slice(-7)).toEqual(spellsFirst.slice(0, 7));
  expect(redrawn.log[0]).toBe(
    "Daven Greyquay took their one free opening redraw.",
  );
  // A hand with two to five resources is kept.
  const balanced = [
    ...spellsFirst.slice(0, 4),
    ...deck.filter((id) => isResource(cardById[id])).slice(0, 3),
    ...spellsFirst.slice(4),
  ];
  const steadyHand = createBattle(
    presetDeck(),
    [...balanced],
    "Daven Greyquay",
  );
  expect(steadyHand.enemy.hand).toEqual(balanced.slice(0, 7));
  expect(steadyHand.log.some((l) => l.includes("redraw"))).toBe(false);
});
