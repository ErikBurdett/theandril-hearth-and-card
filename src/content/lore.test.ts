import { it, expect } from "vitest";
import { existsSync } from "node:fs";
import { cards, sets } from "./catalog";
import { cardLore, setCompletion, setLore } from "./lore";
it("every card has readable lore and each set points to a retained historical chapter", () => {
  for (const s of sets) {
    expect(
      existsSync(`docs/lore/theandril/The Book of Broken Roads/${s.chapter}`),
    ).toBe(true);
    expect(setLore[s.id]).toBeDefined();
  }
  for (const c of cards) {
    const lore = cardLore(c);
    expect(lore.flavor.length).toBeGreaterThan(20);
    expect(lore.chapter.length).toBeGreaterThan(3);
    expect(lore.uncertainty.length).toBeGreaterThan(20);
  }
});
it("set completion counts distinct owned cards, not duplicates or unrelated copies", () => {
  expect(
    setCompletion(
      { "first-oaths.1": 50, "first-oaths.2": 0, "rekindled.1": 3 },
      "first-oaths",
    ),
  ).toEqual({ owned: 1, total: 80, percent: 1 });
  expect(
    setCompletion(
      Object.fromEntries(
        cards.filter((c) => c.setId === "first-oaths").map((c) => [c.id, 1]),
      ),
      "first-oaths",
    ).percent,
  ).toBe(100);
});

it("twelve registered cultures have valid card lenses and every era distinguishes modern continuity", async () => {
  const { factions, setFactions, setContinuities, loreRevision } =
    await import("./factions");
  const { collectorNotes } = await import("./collector-notes");
  expect(factions).toHaveLength(12);
  expect(new Set(factions.map((f) => f.id)).size).toBe(12);
  expect(loreRevision).toBe("b17900d");
  const source = await import("node:fs/promises").then((fs) =>
    fs.readFile("docs/lore/theandril/FACTION_BIBLE.md", "utf8"),
  );
  const registered = source.split("## Part II")[0];
  for (const f of factions) {
    expect(registered).toContain(f.id);
    expect(f.cards.length).toBeGreaterThanOrEqual(3);
    for (const id of f.cards) expect(cards.some((c) => c.id === id)).toBe(true);
  }
  for (const set of sets) {
    expect(setContinuities[set.id].length).toBeGreaterThan(100);
    expect(
      setFactions[set.id].every((id) => factions.some((f) => f.id === id)),
    ).toBe(true);
    expect(
      Object.keys(collectorNotes).filter((id) => id.startsWith(set.id + ".")),
    ).toHaveLength(4);
  }
  expect(
    factions.some((f) => (f.id as string) === "faction.margin_observance"),
  ).toBe(false);
  expect(
    cardLore(cards.find((c) => c.id === "rekindled.24")!).factions[0].name,
  ).toBe("Sable Steppe");
});
