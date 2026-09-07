import { it, expect } from "vitest";
import { tableWords } from "./wording";
it("renames combat skills without rewriting Sallow Reach card names in battle logs", () => {
  expect(tableWords("Reach. Flying or reach can block flying.")).toBe(
    "Highguard. Skyborne or Highguard can block Skyborne.",
  );
  expect(tableWords("Sallow Reach Dawnfield entered tapped.")).toBe(
    "Sallow Reach Dawnfield entered exhausted.",
  );
  expect(
    tableWords("Haste, vigilance, lifelink, deathtouch, trample; 3 loyalty."),
  ).toBe("Quickstep, Steadfast, Hearthbond, Doommarked, Overrun; 3 devotion.");
});
