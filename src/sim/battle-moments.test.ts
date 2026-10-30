import { describe, expect, it } from "vitest";
import { cards, type Card } from "../content/catalog";
import { applyCommand, createGame, decodeSave } from "./game";
import { type Permanent } from "./battle";
import { publicTable } from "./battle-moments";

const creature = cards.find(
  (c) =>
    c.type === "Creature" &&
    c.attack >= 2 &&
    c.trigger === "none" &&
    !c.keywords.length,
)!;
const find = (effect: string) =>
  cards.find((c) => c.type === "Instant" && c.effect === effect)!;
const permanent = (c: Card, uid: number): Permanent => ({
  uid,
  cardId: c.id,
  tapped: false,
  entered: 0,
  damage: 0,
  counters: 0,
  boost: 0,
  loyalty: c.loyalty,
  used: 0,
});
function game() {
  const g = applyCommand(createGame(), { type: "duel", opponent: "potter" });
  g.battle!.enemy.hand = [];
  g.battle!.timed = false;
  return g;
}
function combat() {
  const g = game(),
    b = g.battle!;
  b.player.board = [permanent(creature, 90)];
  b.enemy.hp = creature.attack - 1;
  b.enemy.shield = 1;
  b.phase = "block";
  b.combat = [{ uid: 90, hero: null, blocker: null, blocked: false }];
  return g;
}
describe("public duel moments", () => {
  it("settles autoplay moments before starting a fresh guest's battle", () => {
    let g = applyCommand(combat(), { type: "autoplay", enabled: true });
    g.room.player.node = "table";
    g.room.player.route = [];
    const saved = decodeSave(JSON.stringify(g));
    g = applyCommand(g, { type: "auto-step" });
    expect(applyCommand(saved, { type: "auto-step" })).toEqual(g);
    expect(g.rivals.potter.last.moments[0].facts).toContain(
      "Your victory ended the duel.",
    );
    expect(g.battle!.opponentId).not.toBe("potter");
    expect(g.battle!.moments).toEqual([]);
    expect(decodeSave(JSON.stringify(g))).toEqual(g);
  });
  it("records shield-aware lethal combat once and retains it through settlement and rematch", () => {
    const start = combat(),
      before = JSON.stringify(start);
    const won = applyCommand(start, { type: "damage" });
    expect(JSON.stringify(start)).toBe(before);
    expect(won.battle!.result).toBe("won");
    expect(won.battle!.moments).toEqual([
      {
        turn: 1,
        title: "Your attack · simultaneous combat",
        facts: [
          `Opposing hearth: ${creature.attack - 1} → 0 health.`,
          "Opposing shield: 1 → 0.",
          "Your victory ended the duel.",
        ],
      },
    ]);
    expect(applyCommand(decodeSave(before), { type: "damage" })).toEqual(won);
    expect(won.rivals.potter.last.moments).toEqual(won.battle!.moments);
    const next = applyCommand(
      applyCommand(decodeSave(JSON.stringify(won)), { type: "leave-duel" }),
      { type: "duel", opponent: "potter" },
    );
    expect(next.battle!.moments).toEqual([]);
    expect(next.rivals).toEqual(won.rivals);
    expect(() => applyCommand(won, { type: "damage" })).toThrow();
    expect(won.rivals.potter.wins).toBe(1);
  });

  it("reports actual combat departures and simultaneous mourning draws", () => {
    const g = game(),
      b = g.battle!;
    const mourner = cards.find(
      (c) => c.type === "Creature" && c.trigger === "mourning",
    )!;
    b.player.hp = b.enemy.hp = 1;
    b.player.board = [permanent(creature, 90), permanent(mourner, 92)];
    b.enemy.board = [permanent(creature, 91), permanent(mourner, 93)];
    b.player.board[0].damage = b.enemy.board[0].damage = creature.health - 1;
    b.phase = "block";
    b.combat = [{ uid: 90, hero: null, blocker: 91, blocked: true }];
    const next = applyCommand(g, { type: "damage" });
    expect(next.battle!.result).toBe("drawn");
    expect(next.battle!.moments[0].facts).toEqual([
      "Your hearth: 1 → 0 health.",
      `Your table lost 1 card: ${creature.name}.`,
      "Opposing hearth: 1 → 0 health.",
      `Opposing table lost 1 card: ${creature.name}.`,
      "Both hearths fell; the duel ended in a draw.",
    ]);
  });

  it("records a paid response counter without revealing hidden hands or consuming RNG", () => {
    let g = game();
    const spell = find("damage"),
      counter = find("counter");
    g.battle!.player.hand = [spell.id, counter.id];
    g.battle!.player.mana[spell.color] = 20;
    g.battle!.player.mana[counter.color] = 20;
    g = applyCommand(g, {
      type: "play",
      index: 0,
      target: { side: "enemy", kind: "hearth" },
    });
    g = applyCommand(g, {
      type: "play",
      index: 0,
      target: { side: "player", kind: "stack", uid: g.battle!.stack[0].uid },
    });
    const hidden = structuredClone(g);
    hidden.battle!.enemy.hand = [creature.id];
    hidden.battle!.enemy.draw.reverse();
    expect(publicTable(hidden.battle!)).toEqual(publicTable(g.battle!));
    const next = applyCommand(g, { type: "pass" });
    expect(next.battle!.moments).toEqual(
      applyCommand(hidden, { type: "pass" }).battle!.moments,
    );
    expect(next.battle!.moments[0].facts).toEqual([
      `${spell.name} was countered before it could resolve.`,
    ]);
    expect(next.battle!.enemy.hp).toBe(20);
    expect(next.rng).toBe(g.rng);
    expect(
      applyCommand(decodeSave(JSON.stringify(g)), { type: "pass" }),
    ).toEqual(next);
  });

  it("explains a removed target without claiming the original effect succeeded", () => {
    let g = game();
    const spell = find("damage"),
      bounce = find("bounce");
    g.battle!.enemy.board = [permanent(creature, 90)];
    g.battle!.player.hand = [spell.id, bounce.id];
    g.battle!.player.mana[spell.color] = 20;
    g.battle!.player.mana[bounce.color] = 20;
    const target = { side: "enemy", kind: "creature", uid: 90 } as const;
    g = applyCommand(g, { type: "play", index: 0, target });
    g = applyCommand(g, { type: "play", index: 0, target });
    g = applyCommand(g, { type: "pass" });
    expect(g.battle!.moments[0].facts).toEqual([
      `Opposing table lost 1 card: ${creature.name}.`,
    ]);
    g = applyCommand(g, { type: "pass" });
    expect(g.battle!.moments.at(-1)!.facts).toEqual([
      "The target was no longer legal; the effect did not resolve.",
    ]);
    expect(g.battle!.enemy.grave).not.toContain(creature.id);
  });

  it("attributes Hero effects and public devotion damage without inventing private information", () => {
    let g = game();
    const hero = cards.find(
      (c) => c.type === "Hero" && c.abilities.some((a) => a.effect === "heal"),
    )!;
    g.battle!.player.hp = 10;
    g.battle!.player.board = [permanent(hero, 90)];
    const ability = hero.abilities.findIndex((a) => a.effect === "heal");
    g = applyCommand(g, { type: "hero", uid: 90, ability });
    g = applyCommand(g, { type: "pass" });
    expect(g.battle!.moments.at(-1)!.title).toBe(
      `Your ${hero.name} · Hero ability`,
    );
    expect(g.battle!.moments.at(-1)!.facts).toContain(
      `Your hearth: 10 → ${10 + hero.abilities[ability].amount} health.`,
    );
    const damage = find("damage");
    g.battle!.enemy.board = [
      { ...permanent(hero, 91), loyalty: damage.amount + 2 },
    ];
    g.battle!.player.hand = [damage.id];
    g.battle!.player.mana[damage.color] = 20;
    g = applyCommand(g, {
      type: "play",
      index: 0,
      target: { side: "enemy", kind: "hero", uid: 91 },
    });
    g = applyCommand(g, { type: "pass" });
    expect(g.battle!.moments.at(-1)!.facts).toContain(
      `Opposing ${hero.name}: ${damage.amount + 2} → 2 devotion.`,
    );
  });

  it("keeps five exchanges, preserves them on concession and explains empty libraries", () => {
    let g = game();
    const heal = find("heal");
    for (let i = 0; i < 7; i++) {
      g.battle!.turn = i + 1;
      g.battle!.player.hand = [heal.id];
      g.battle!.player.mana[heal.color] = 20;
      g = applyCommand(g, { type: "play", index: 0 });
      g = applyCommand(g, { type: "pass" });
    }
    expect(g.battle!.moments.map((m) => m.turn)).toEqual([3, 4, 5, 6, 7]);
    const conceded = applyCommand(g, { type: "leave-duel" });
    expect(conceded.rivals.potter.last.moments).toEqual(g.battle!.moments);
    expect(decodeSave(JSON.stringify(conceded))).toEqual(conceded);
    g.battle!.enemy.draw = [];
    g = applyCommand(g, { type: "end-turn" });
    expect(g.battle!.moments.at(-1)!.title).toBe("An empty library");
    expect(g.battle!.moments.at(-1)!.facts[0]).toContain(
      "Your opponent needed to draw from an empty library",
    );
    expect(g.rivals.potter.last.moments).toEqual(g.battle!.moments);
  });

  it("defaults old moments to empty, validates bounded receipts and conserves rejected actions", () => {
    const g = applyCommand(combat(), { type: "damage" });
    const old = JSON.parse(JSON.stringify(g));
    delete old.battle.moments;
    delete old.rivals.potter.last.moments;
    const restored = decodeSave(JSON.stringify(old));
    expect(restored.battle!.moments).toEqual([]);
    expect(restored.rivals.potter.last.moments).toEqual([]);
    expect(restored.gold).toBe(g.gold);
    expect(restored.rng).toBe(g.rng);
    expect(restored.collection).toEqual(g.collection);
    const invalid = structuredClone(g);
    invalid.rivals.potter.last.moments = Array(6).fill(g.battle!.moments[0]);
    expect(() => decodeSave(JSON.stringify(invalid))).toThrow();
    const active = combat(),
      before = JSON.stringify(active);
    expect(() => applyCommand(active, { type: "end-turn" })).toThrow();
    expect(JSON.stringify(active)).toBe(before);
  });
});
