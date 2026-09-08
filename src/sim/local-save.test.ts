import { describe, it, expect } from "vitest";
import {
  readLocalSave,
  writeLocalSave,
  BACKUP_KEY,
  SaveConflict,
} from "./local-save";
import { createGame, SAVE_KEY } from "./game";
function memory() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}
describe("local ledger", () => {
  it("saves, reloads and recovers the previous valid checkpoint without replacing a bad save on read", () => {
    const storage = memory(),
      game = createGame();
    const first = writeLocalSave(storage, game, null);
    game.gold -= 32;
    writeLocalSave(storage, game, first);
    expect(readLocalSave(storage).game.gold).toBe(game.gold);
    expect(storage.getItem(BACKUP_KEY)).toBe(first);
    storage.setItem(SAVE_KEY, "broken json");
    const recovered = readLocalSave(storage);
    expect(recovered.game.gold).toBe(game.gold + 32);
    expect(recovered.blocked).toBe(false);
    expect(storage.getItem(SAVE_KEY)).toBe("broken json");
    writeLocalSave(storage, recovered.game, recovered.raw);
    expect(storage.getItem(BACKUP_KEY)).toBe(first);
  });
  it("rejects stale tabs without modifying either copy", () => {
    const storage = memory(),
      game = createGame();
    const first = writeLocalSave(storage, game, null);
    game.gold -= 20;
    const second = writeLocalSave(storage, game, first);
    expect(() => writeLocalSave(storage, createGame(), first)).toThrow(
      SaveConflict,
    );
    expect(storage.getItem(SAVE_KEY)).toBe(second);
    expect(storage.getItem(BACKUP_KEY)).toBe(first);
  });
  it("reports unavailable storage and preserves unreadable ledgers", () => {
    expect(
      readLocalSave({
        getItem() {
          throw Error("blocked");
        },
      }).blocked,
    ).toBe(true);
    const storage = memory();
    storage.setItem(SAVE_KEY, "invalid");
    expect(readLocalSave(storage).blocked).toBe(true);
    expect(storage.getItem(SAVE_KEY)).toBe("invalid");
    expect(() =>
      writeLocalSave(
        {
          ...storage,
          setItem() {
            throw Error("quota");
          },
        },
        createGame(),
        "invalid",
      ),
    ).toThrow("quota");
  });
});
