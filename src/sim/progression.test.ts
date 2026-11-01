import { expect, it } from "vitest";
import { createGame, applyCommand, decodeSave } from "./game";
import {
  earnXP,
  missionPrize,
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

it("a mission claim that crosses a keeper level reports both on one receipt, and old shop wins reach the chronicle", () => {
  const g = createGame();
  g.progression.xp = xpThreshold(2) - 1;
  g.progression.missions.battle = { tier: 1, choice: "steady", baseline: 0 };
  g.progression.totals.wins = 3;
  const claimed = applyCommand(g, { type: "claim-mission", branch: "battle" });
  const receipt = claimed.progression.lastReward!;
  expect(receipt.label).toContain("Keeper level 2");
  expect(receipt.label).toContain("chapter 1");
  expect(receipt.crowns).toBe(30 + missionPrize(1).crowns);
  expect(() => earnXP(createGame(), -1)).toThrow();
  expect(() => earnXP(createGame(), 1.5)).toThrow();
  const old = JSON.parse(JSON.stringify(createGame(7)));
  old.wins = 4;
  delete old.progression;
  expect(decodeSave(JSON.stringify(old)).progression.totals.wins).toBe(4);
});
