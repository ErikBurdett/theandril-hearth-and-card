import type { Battle, Owner } from "../sim/battle";

/**
 * Authored action motion is derived from the public battle events and the
 * table before and after a command: which permanent paid, which sources woke
 * a trigger, who struck and who parried, which hearth took the hit, which
 * stack item just arrived. The cues name elements only; the stylesheet owns
 * the motion and honors reduced motion. Nothing here changes the rules.
 */
export type PermanentAction =
  "payment" | "trigger" | "strike" | "parry" | "impact";
export type HearthAction = "impact" | "heal";
export type ActionCues = {
  permanents: Record<number, PermanentAction>;
  hearth: Partial<Record<Owner, HearthAction>>;
  stack: { uid: number; kind: "cast" | "response" | "trigger" } | null;
};
export function actionCues(
  before: Battle | null,
  after: Battle,
): ActionCues | null {
  if (!before) return null;
  // A fresh duel at the same table restarts its count: nothing to compare.
  if (after.eventSequence < before.eventSequence || after.turn < before.turn)
    return null;
  const cues: ActionCues = { permanents: {}, hearth: {}, stack: null };
  let any = false;
  const onTable = (uid: number) =>
    after.player.board.some((p) => p.uid === uid) ||
    after.enemy.board.some((p) => p.uid === uid);
  for (const e of after.events ?? []) {
    if (e.id <= before.eventSequence) continue;
    if (e.kind === "payment" && e.owner && e.cardId) {
      const paid = after[e.owner].board
        .filter((p) => p.cardId === e.cardId)
        .sort((a, z) => z.uid - a.uid)[0];
      if (paid) {
        cues.permanents[paid.uid] = "payment";
        any = true;
      }
    }
    if (e.kind === "trigger" && e.owner && e.cardId) {
      const item = [...after.stack]
        .reverse()
        .find((s) => s.trigger && s.owner === e.owner && s.cardId === e.cardId);
      if (item) {
        for (const uid of item.sources ?? [])
          if (onTable(uid)) cues.permanents[uid] = "trigger";
        cues.stack = { uid: item.uid, kind: "trigger" };
        any = true;
      }
    }
    if ((e.kind === "cast" || e.kind === "response") && e.owner) {
      const item = [...after.stack]
        .reverse()
        .find((s) => !s.trigger && s.owner === e.owner);
      if (item) {
        cues.stack = { uid: item.uid, kind: e.kind };
        any = true;
      }
    }
    if (e.kind === "combat") {
      for (const a of before.combat) {
        if (onTable(a.uid)) cues.permanents[a.uid] = "strike";
        const blockers = a.blockers?.length
          ? a.blockers
          : a.blocker !== null
            ? [a.blocker]
            : [];
        for (const uid of blockers)
          if (onTable(uid)) cues.permanents[uid] = "parry";
      }
      any = true;
    }
  }
  for (const owner of ["player", "enemy"] as const) {
    if (after[owner].hp < before[owner].hp) {
      cues.hearth[owner] = "impact";
      any = true;
    } else if (after[owner].hp > before[owner].hp) {
      cues.hearth[owner] = "heal";
      any = true;
    }
    for (const p of after[owner].board) {
      const was = before[owner].board.find((x) => x.uid === p.uid);
      if (was && p.loyalty < was.loyalty) {
        cues.permanents[p.uid] = "impact";
        any = true;
      }
    }
  }
  return any ? cues : null;
}
