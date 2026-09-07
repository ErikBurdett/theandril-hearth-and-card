import { it, expect } from "vitest";
import { createGame, applyCommand, decodeSave } from "./game";
import { autoplayCommand } from "./autoplay";
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
