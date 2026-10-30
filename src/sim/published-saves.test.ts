import { expect, it } from "vitest";
import { applyCommand, decodeSave } from "./game";
import { readLocalSave, writeLocalSave } from "./local-save";
// One save per published build, captured from that build's simulation after a
// day of trade, a delivery, a pack, a skill, a prepared recipe and a duel in
// progress. Every later build must load each one unchanged or migrate it on
// purpose, which a failing fixture here makes visible.
const published = import.meta.glob("./fixtures/published-*-save.json", {
  eager: true,
  import: "default",
}) as Record<string, unknown>;
it("loads every published build's save and keeps playing from it", () => {
  expect(Object.keys(published).length).toBeGreaterThan(0);
  for (const [file, raw] of Object.entries(published)) {
    const game = decodeSave(JSON.stringify(raw));
    expect(game, file).toEqual(raw);
    const store = new Map<string, string>(),
      storage = {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
      };
    writeLocalSave(storage, game, null);
    expect(readLocalSave(storage).game, file).toEqual(game);
    const later = applyCommand(applyCommand(game, { type: "tick" }), {
      type: "auto-step",
    });
    expect(later.battle?.result, file).toBe("playing");
    expect(later.day, file).toBeGreaterThanOrEqual(game.day);
  }
});
