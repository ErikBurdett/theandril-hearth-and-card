import { createGame, decodeSave, SAVE_KEY, type Game } from "./game";
export const BACKUP_KEY = `${SAVE_KEY}-recovery`;
export class SaveConflict extends Error {}
export function readLocalSave(storage: Pick<Storage, "getItem">) {
  let raw: string | null = null;
  try {
    raw = storage.getItem(SAVE_KEY);
    if (raw) {
      try {
        return { game: decodeSave(raw), raw, error: "", blocked: false };
      } catch {
        const backup = storage.getItem(BACKUP_KEY);
        if (backup)
          return {
            game: decodeSave(backup),
            raw,
            error:
              "Recovered your previous local checkpoint. Export a backup from the Ledger.",
            blocked: false,
          };
        throw Error("Unreadable ledger");
      }
    }
    return { game: createGame(), raw, error: "", blocked: false };
  } catch {
    return {
      game: createGame(),
      raw,
      error:
        "Your local ledger could not be read. Saving is paused to preserve it. Open the Ledger to export or import a backup.",
      blocked: true,
    };
  }
}
/** Compare before writing so stale tabs cannot silently replace another session. */
export function writeLocalSave(
  storage: Pick<Storage, "getItem" | "setItem">,
  game: Game,
  expected: string | null,
  replace = false,
) {
  const current = storage.getItem(SAVE_KEY);
  if (!replace && current !== expected)
    throw new SaveConflict(
      "Another tab changed this ledger. Reload to continue from its progress, or export this session first.",
    );
  const raw = JSON.stringify(game);
  if (current === raw) return raw;
  if (current) {
    let valid = false;
    try {
      decodeSave(current);
      valid = true;
    } catch {
      /* Preserve the last valid recovery copy. */
    }
    if (valid) storage.setItem(BACKUP_KEY, current);
  }
  storage.setItem(SAVE_KEY, raw);
  return raw;
}
