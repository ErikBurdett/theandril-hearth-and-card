import { it, expect } from "vitest";
import { cards, type Card } from "../content/catalog";
import { duelists } from "../content/tavern";
import {
  battleCommand,
  battleSchema,
  createBattle,
  presetDeck,
  orderedBlockers,
  type Battle,
  type Permanent,
} from "./battle";

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
const trampler = find(
  (c) =>
    c.type === "Creature" &&
    c.keywords.includes("trample") &&
    !c.keywords.includes("deathtouch") &&
    c.attack >= 4,
);
const hero = find((c) => c.type === "Hero");
let uid = 300;
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
function table(active: "player" | "enemy", profile?: string) {
  const b = createBattle(presetDeck(), presetDeck("tempo"), "x", {
    opponentId: profile
      ? duelists.find((g) => g.profile === profile)!.id
      : null,
  });
  b.turn = 3;
  b.active = active;
  b.enemy.hand = [];
  b.player.board = [];
  b.enemy.board = [];
  return b;
}
const alive = (b: Battle, p: Permanent) =>
  [...b.player.board, ...b.enemy.board].some((x) => x.uid === p.uid);

it("each attacker chooses its own destination and damage lands where it was aimed", () => {
  const b = table("player");
  const champion = perm(hero, { loyalty: 4 }),
    big = perm(plain(2, 2), { counters: 1 }),
    small = perm(plain(2, 2));
  b.enemy.board.push(champion);
  b.player.board.push(big, small);
  b.phase = "attack";
  expect(() =>
    battleCommand(b, {
      type: "declare",
      attackers: [big.uid],
      destinations: [{ uid: big.uid, hero: 999 }],
    }),
  ).toThrow(/Hero/);
  expect(b.phase).toBe("attack");
  battleCommand(b, {
    type: "declare",
    attackers: [big.uid, small.uid],
    destinations: [{ uid: big.uid, hero: champion.uid }],
  });
  expect(b.combat.map((a) => a.hero)).toEqual([champion.uid, null]);
  battleCommand(b, { type: "damage" });
  expect(champion.loyalty).toBe(1);
  expect(b.enemy.hp).toBe(18);
});

it("cautious rivals spend one attacker on a Hero they can fell; racers keep pressure on the hearth", () => {
  for (const [profile, expected] of [
    ["reactive", 1],
    ["aggressive", 0],
  ] as const) {
    const b = table("enemy", profile);
    const champion = perm(hero, { loyalty: 2 });
    b.player.board.push(champion);
    b.enemy.board.push(perm(plain(2, 2)), perm(plain(2, 2), { counters: 2 }));
    battleCommand(b, { type: "pass" });
    expect(b.phase).toBe("block");
    expect(
      b.combat.filter((a) => a.hero === champion.uid),
      profile,
    ).toHaveLength(expected);
    if (expected)
      expect(
        b.enemy.board.find(
          (p) => p.uid === b.combat.find((a) => a.hero !== null)!.uid,
        )!.counters,
      ).toBe(0);
  }
});

it("several blockers share an attacker, blocks toggle, and damage follows the attacker's order", () => {
  const b = table("enemy");
  const attacker = perm(plain(2, 2), { counters: 1 }),
    first = perm(plain(2, 2)),
    second = perm(plain(2, 2)),
    third = perm(plain(1, 2));
  b.enemy.board.push(attacker);
  b.player.board.push(first, second, third);
  b.phase = "block";
  b.combat = [
    {
      uid: attacker.uid,
      hero: null,
      blocker: null,
      blockers: [],
      blocked: false,
    },
  ];
  battleCommand(b, {
    type: "block",
    attacker: attacker.uid,
    blocker: first.uid,
  });
  battleCommand(b, {
    type: "block",
    attacker: attacker.uid,
    blocker: second.uid,
  });
  expect(b.combat[0].blockers).toEqual([first.uid, second.uid]);
  expect(b.combat[0].blocker).toBe(first.uid);
  battleCommand(b, {
    type: "block",
    attacker: attacker.uid,
    blocker: second.uid,
  });
  expect(b.combat[0].blockers).toEqual([first.uid]);
  battleCommand(b, {
    type: "block",
    attacker: attacker.uid,
    blocker: second.uid,
  });
  battleCommand(b, {
    type: "block",
    attacker: attacker.uid,
    blocker: third.uid,
  });
  expect(b.combat[0].blockers).toHaveLength(3);
  // The rival orders by the public table: it fells the cheapest kills first.
  expect(orderedBlockers(b, b.combat[0])).toEqual([
    first.uid,
    second.uid,
    third.uid,
  ]);
  battleCommand(b, { type: "damage" });
  expect(alive(b, attacker)).toBe(false);
  expect(alive(b, first)).toBe(false);
  expect(second.damage).toBe(1);
  expect(third.damage).toBe(0);
  expect(b.player.hp).toBe(20);
});

it("the keeper orders damage among the rival's gang block and rejected orders change nothing", () => {
  const b = table("player", "defensive");
  const attacker = perm(plain(2, 2), { counters: 1 }),
    one = perm(plain(2, 2)),
    two = perm(plain(2, 2));
  b.player.board.push(attacker);
  b.enemy.board.push(one, two);
  b.phase = "attack";
  battleCommand(b, { type: "declare", attackers: [attacker.uid] });
  expect(b.phase).toBe("damage");
  expect(b.combat[0].blockers).toEqual([one.uid, two.uid]);
  const before = structuredClone(b);
  expect(() =>
    battleCommand(b, {
      type: "damage-order",
      attacker: attacker.uid,
      blockers: [one.uid],
    }),
  ).toThrow();
  expect(() =>
    battleCommand(b, {
      type: "damage-order",
      attacker: attacker.uid,
      blockers: [one.uid, 999],
    }),
  ).toThrow();
  expect(b).toEqual(before);
  battleCommand(b, {
    type: "damage-order",
    attacker: attacker.uid,
    blockers: [two.uid, one.uid],
  });
  expect(b.combat[0].blocker).toBe(two.uid);
  battleCommand(b, { type: "damage" });
  expect(alive(b, two)).toBe(false);
  expect(alive(b, one)).toBe(true);
  expect(one.damage).toBe(1);
  expect(alive(b, attacker)).toBe(false);
});

it("Overrun assigns lethal damage through every blocker before spilling to the hearth", () => {
  const b = table("enemy");
  const attacker = perm(trampler, { counters: 6 - trampler.attack }),
    one = perm(plain(1, 2)),
    two = perm(plain(1, 2));
  b.enemy.board.push(attacker);
  b.player.board.push(one, two);
  b.phase = "block";
  b.combat = [
    {
      uid: attacker.uid,
      hero: null,
      blocker: null,
      blockers: [],
      blocked: false,
    },
  ];
  battleCommand(b, { type: "block", attacker: attacker.uid, blocker: one.uid });
  battleCommand(b, { type: "block", attacker: attacker.uid, blocker: two.uid });
  battleCommand(b, { type: "damage" });
  expect(alive(b, one)).toBe(false);
  expect(alive(b, two)).toBe(false);
  expect(b.player.hp).toBe(18);
});

it("older saves with a single blocker load as one-entry blocker lists and survive a round trip", () => {
  const b = table("enemy");
  const attacker = perm(plain(2, 2)),
    blocker = perm(plain(2, 2), { counters: 1 });
  b.enemy.board.push(attacker);
  b.player.board.push(blocker);
  b.phase = "damage";
  const legacy = JSON.parse(JSON.stringify(b));
  legacy.combat = [
    { uid: attacker.uid, hero: null, blocker: blocker.uid, blocked: true },
  ];
  const loaded = battleSchema.parse(legacy);
  expect(loaded.combat[0].blockers).toEqual([]);
  battleCommand(loaded, { type: "damage" });
  expect(loaded.player.hp).toBe(20);
  expect(loaded.enemy.board.some((p) => p.uid === attacker.uid)).toBe(false);
  const saved = battleSchema.parse(JSON.parse(JSON.stringify(loaded)));
  expect(saved).toEqual(loaded);
});

it("an explicit hearth destination overrides the default Hero target", () => {
  const b = table("player");
  const champion = perm(hero, { loyalty: 4 }),
    one = perm(plain(2, 2)),
    two = perm(plain(2, 2));
  b.enemy.board.push(champion);
  b.player.board.push(one, two);
  b.phase = "attack";
  battleCommand(b, {
    type: "declare",
    attackers: [one.uid, two.uid],
    hero: champion.uid,
    destinations: [{ uid: two.uid, hero: null }],
  });
  expect(b.combat.map((a) => a.hero)).toEqual([champion.uid, null]);
  battleCommand(b, { type: "damage" });
  expect(champion.loyalty).toBe(2);
  expect(b.enemy.hp).toBe(18);
});

it("a rival that sees lethal aims every attacker at the hearth, not the Hero", () => {
  const b = table("enemy", "hero");
  b.player.board.push(perm(hero, { loyalty: 6 }));
  b.player.hp = 3;
  b.enemy.board.push(perm(plain(2, 2)), perm(plain(2, 2)));
  battleCommand(b, { type: "pass" });
  expect(b.phase).toBe("block");
  expect(b.combat.map((a) => a.hero)).toEqual([null, null]);
  battleCommand(b, { type: "damage" });
  expect(b.result).toBe("lost");
});
