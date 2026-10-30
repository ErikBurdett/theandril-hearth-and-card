import { z } from "zod";
import { cardById } from "../content/catalog";
import type { Battle, Owner } from "./battle";

export const battleMomentsSchema = z
  .array(
    z.object({
      turn: z.number().int().nonnegative(),
      title: z.string().min(1).max(200),
      facts: z.array(z.string().min(1).max(800)).min(1).max(16),
    }),
  )
  .max(5)
  .default([]);
export type BattleMoment = z.infer<typeof battleMomentsSchema>[number];

/** Only public table state enters this projection. Never copy hands or libraries. */
export function publicTable(b: Battle) {
  const side = (owner: Owner) => ({
    hp: b[owner].hp,
    shield: b[owner].shield,
    board: b[owner].board.map(({ uid, cardId, loyalty }) => ({
      uid,
      cardId,
      loyalty,
    })),
  });
  return { player: side("player"), enemy: side("enemy"), result: b.result };
}

export function rememberMoment(b: Battle, title: string, facts: string[]) {
  if (!facts.length) return;
  b.moments = [...(b.moments ?? []), { turn: b.turn, title, facts }].slice(-5);
}

/** Describe observed consequences, without claiming a best move or hidden intent. */
export function rememberExchange(
  b: Battle,
  before: ReturnType<typeof publicTable>,
  title: string,
  facts: string[] = [],
) {
  for (const owner of ["player", "enemy"] as const) {
    const label = owner === "player" ? "Your" : "Opposing";
    const was = before[owner],
      now = b[owner];
    if (was.hp !== now.hp)
      facts.push(`${label} hearth: ${was.hp} → ${now.hp} health.`);
    if (was.shield !== now.shield)
      facts.push(`${label} shield: ${was.shield} → ${now.shield}.`);
    const left = was.board.filter(
      (p) => !now.board.some((q) => q.uid === p.uid),
    );
    if (left.length) {
      const names = left
        .slice(0, 3)
        .map((p) => cardById[p.cardId].name)
        .join(", ");
      facts.push(
        `${label} table lost ${left.length} ${left.length === 1 ? "card" : "cards"}: ${names}${left.length > 3 ? ` and ${left.length - 3} more` : ""}.`,
      );
    }
    const heroes = was.board.filter((p) => cardById[p.cardId].type === "Hero");
    for (const p of heroes.slice(0, 3)) {
      const current = now.board.find((q) => q.uid === p.uid);
      if (current && current.loyalty !== p.loyalty)
        facts.push(
          `${label} ${cardById[p.cardId].name}: ${p.loyalty} → ${current.loyalty} devotion.`,
        );
    }
  }
  if (before.result === "playing" && b.result !== "playing")
    facts.push(
      b.result === "won"
        ? "Your victory ended the duel."
        : b.result === "lost"
          ? "The opposing victory ended the duel."
          : "Both hearths fell; the duel ended in a draw.",
    );
  rememberMoment(b, title, facts);
}
