import type { Game } from "./game";
/** Record events at their source, even when successive events have identical text. */
export function note(game: Game, text: string) {
  game.journal = [text, ...game.journal].slice(0, 20);
  if (text.includes("has arrived at the tavern")) return;
  game.noticeSequence = (game.noticeSequence ?? 0) + 1;
  game.notices = [
    { id: game.noticeSequence, day: game.day, text, read: false },
    ...(game.notices ?? []),
  ].slice(0, 60);
}
