import { describe, expect, it } from "vitest";
import { cards } from "../content/catalog";
import { battleCommand, createBattle, presetDeck } from "../sim/battle";
import { actionCues } from "./action-cues";

const find = (test: (c: (typeof cards)[number]) => boolean) =>
  cards.find(test)!;
function table() {
  const b = createBattle(presetDeck(), presetDeck(), "Cues");
  b.timed = false;
  b.turn = 4;
  b.nextId = 900;
  b.player.hand = [];
  b.enemy.hand = [];
  b.player.board = [];
  b.enemy.board = [];
  b.player.landDrops = 0;
  b.player.mana = { dawn: 9, tide: 9, grave: 9, ember: 9, grove: 9 };
  return b;
}
const perm = (cardId: string, uid: number) => ({
  uid,
  cardId,
  tapped: false,
  entered: 1,
  damage: 0,
  counters: 0,
  boost: 0,
  loyalty: 0,
  used: 0,
});

describe("action cues", () => {
  it("name the paid resource and the sources a trigger woke", () => {
    const b = table(),
      gather = find((c) => c.type === "Creature" && c.trigger === "gather"),
      resource = find((c) => c.type === "Basic Resource");
    b.player.board = [perm(gather.id, 901)];
    b.player.hand = [resource.id];
    const before = structuredClone(b);
    battleCommand(b, { type: "play", index: 0 });
    const cues = actionCues(before, b)!;
    const paid = b.player.board.find((p) => p.cardId === resource.id)!;
    expect(cues.permanents[paid.uid]).toBe("payment");
    expect(cues.permanents[901]).toBe("trigger");
    expect(cues.stack).toEqual({ uid: b.stack[0].uid, kind: "trigger" });
  });
  it("mark strikers, parries and the hearth that took the hit", () => {
    const b = table(),
      plain = find(
        (c) =>
          c.type === "Creature" &&
          !c.keywords.length &&
          c.trigger === "none" &&
          c.effect === "none",
      );
    b.player.board = [perm(plain.id, 901), perm(plain.id, 902)];
    b.enemy.board = [perm(plain.id, 903)];
    battleCommand(b, { type: "combat" });
    battleCommand(b, { type: "declare", attackers: [901, 902] });
    b.combat[0].blockers = [903];
    b.combat[0].blocker = 903;
    b.combat[0].blocked = true;
    b.phase = "damage";
    const before = structuredClone(b);
    battleCommand(b, { type: "damage" });
    const cues = actionCues(before, b)!;
    expect(cues.permanents[902]).toBe("strike");
    expect(cues.permanents[901] ?? "fallen").toMatch(/strike|fallen/);
    expect(cues.hearth.enemy).toBe("impact");
    expect(cues.hearth.player).toBeUndefined();
  });
  it("stay quiet for a clock tick and for a fresh duel at the same table", () => {
    const b = table();
    const before = structuredClone(b);
    b.secondsLeft = 59;
    expect(actionCues(before, b)).toBeNull();
    const fresh = createBattle(presetDeck(), presetDeck(), "Again");
    expect(actionCues(b, fresh)).toBeNull();
    expect(actionCues(null, b)).toBeNull();
  });
});
