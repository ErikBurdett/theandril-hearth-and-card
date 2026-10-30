import { z } from "zod";
import { duelists } from "../content/tavern";
import { presets, type Battle } from "./battle";
import type { Game } from "./game";
import { battleMomentsSchema } from "./battle-moments";

const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const rivalHistorySchema = z.record(
  z.string().refine((id) => duelists.some((guest) => guest.id === id)),
  z.object({
    wins: count,
    losses: count,
    draws: count,
    concessions: count,
    last: z.object({
      result: z.enum(["won", "lost", "drawn", "conceded"]),
      day: count.min(1),
      turns: count,
      crowns: count,
      renown: count,
      xp: count,
      moments: battleMomentsSchema,
      learnedRecipe: z
        .string()
        .refine((id) => presets.some((recipe) => recipe.id === id))
        .nullable(),
    }),
  }),
);

/** IDs own new records. Only older battles need the original display-name match. */
export function rivalForBattle(
  battle: Pick<Battle, "opponentId" | "opponent">,
) {
  return battle.opponentId
    ? duelists.find((guest) => guest.id === battle.opponentId)
    : duelists.find((guest) => battle.opponent.startsWith(guest.name + " · "));
}

/** Called by the same one-time settlement that awards a completed duel. */
export function recordRivalDuel(
  game: Game,
  result: "won" | "lost" | "drawn" | "conceded",
  learnedRecipe: string | null = null,
) {
  const battle = game.battle;
  if (!battle) return;
  const guest = rivalForBattle(battle);
  if (!guest) return; // Never attribute an unrecognized old duel to a different guest.
  const previous = game.rivals[guest.id];
  const record = {
    wins: previous?.wins ?? 0,
    losses: previous?.losses ?? 0,
    draws: previous?.draws ?? 0,
    concessions: previous?.concessions ?? 0,
    last: {
      result,
      day: game.day,
      turns: battle.turn,
      crowns: result === "won" ? 35 : 0,
      renown: result === "won" ? 5 : 0,
      xp: result === "conceded" ? 0 : result === "won" ? 60 : 25,
      learnedRecipe,
      moments: structuredClone(battle.moments ?? []),
    },
  };
  const counter = {
    won: "wins",
    lost: "losses",
    drawn: "draws",
    conceded: "concessions",
  } as const;
  record[counter[result]]++;
  game.rivals[guest.id] = record;
}
