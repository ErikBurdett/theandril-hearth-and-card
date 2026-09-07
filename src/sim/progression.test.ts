import { expect, it } from "vitest";
import { createGame, applyCommand, decodeSave } from "./game";
import {
  earnXP,
  keeperLevel,
  xpThreshold,
  branches,
  mission,
} from "./progression";

it("older saves acquire an empty endless chronicle without altering inventory", () => {
  const original = createGame(321),
    old = JSON.parse(JSON.stringify(original));
  delete old.progression;
  const loaded = decodeSave(JSON.stringify(old));
  expect(loaded).toEqual(original);
});
it("XP thresholds scale without a designed final level and award every crossed level once", () => {
  for (const level of [2, 5, 100, 100000]) {
    expect(keeperLevel(xpThreshold(level))).toBe(level);
    expect(keeperLevel(xpThreshold(level) - 1)).toBe(level - 1);
  }
  const g = createGame(),
    before = g.gold;
  earnXP(g, xpThreshold(5));
  expect(keeperLevel(g.progression.xp)).toBe(5);
  expect(g.gold - before).toBe(30 + 35 + 40 + 45);
  expect(
    Object.values(g.progression.lastReward!.cards).reduce((a, b) => a + b, 0),
  ).toBe(10);
  const saved = decodeSave(JSON.stringify(g));
  earnXP(saved, 0);
  expect(saved).toEqual(g);
});
it("all mission branches require new activity, reject early and duplicate claims, and grow indefinitely", () => {
  for (const branch of branches)
    for (const choice of ["steady", "bold"] as const) {
      let g = createGame();
      Object.keys(g.progression.totals).forEach(
        (k) =>
          (g.progression.totals[k as keyof typeof g.progression.totals] = 100),
      );
      g = applyCommand(g, { type: "choose-mission", branch, choice });
      const snapshot = structuredClone(g);
      expect(() => applyCommand(g, { type: "claim-mission", branch })).toThrow(
        /not complete/,
      );
      expect(g).toEqual(snapshot);
      expect(() =>
        applyCommand(g, { type: "choose-mission", branch, choice }),
      ).toThrow();
      for (const k of Object.keys(g.progression.totals))
        g.progression.totals[k as keyof typeof g.progression.totals] += 1000;
      const before = g.gold;
      g = applyCommand(g, { type: "claim-mission", branch });
      expect(g.gold).toBeGreaterThan(before);
      expect(g.progression.missions[branch].tier).toBe(2);
      expect(() =>
        applyCommand(g, { type: "claim-mission", branch }),
      ).toThrow();
      g.progression.missions[branch].tier = 10000;
      g = applyCommand(g, { type: "choose-mission", branch, choice });
      expect(mission(g.progression, branch).target).toBeGreaterThan(10000);
      expect(decodeSave(JSON.stringify(g))).toEqual(g);
    }
});
