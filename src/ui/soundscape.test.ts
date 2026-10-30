import { describe, expect, it } from "vitest";
import { cardById } from "../content/catalog";
import { battleCommand, createBattle, presetDeck } from "../sim/battle";
import {
  cuesSince,
  defaultSoundSettings,
  readSoundSettings,
  tableSnapshot,
  writeSoundSettings,
} from "./soundscape";

describe("tavern sound preferences", () => {
  it("round-trip through storage, clamp levels and tolerate junk", () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    };
    expect(readSoundSettings(storage)).toEqual(defaultSoundSettings);
    writeSoundSettings(storage, {
      enabled: true,
      cards: 2,
      hearth: -1,
      room: 0.3,
    });
    expect(readSoundSettings(storage)).toEqual({
      enabled: true,
      cards: 1,
      hearth: 0,
      room: 0.3,
    });
    storage.setItem("hearth-card.sound", "{not json");
    expect(readSoundSettings(storage)).toEqual(defaultSoundSettings);
    expect(readSoundSettings(null)).toEqual(defaultSoundSettings);
  });
});

describe("table cues", () => {
  const fresh = () =>
    createBattle(presetDeck("fellowship"), presetDeck("tempo"), "Rival");
  it("derive from public events and state changes only", () => {
    const b = fresh(),
      before = tableSnapshot(b);
    expect(cuesSince(null, b)).toEqual([]);
    expect(cuesSince(before, b)).toEqual([]);
    const next = (kind: string, text: string) => {
      b.eventSequence += 1;
      b.events = [...b.events, { id: b.eventSequence, kind, text }];
    };
    next("cast", "You cast Something. A response may be played.");
    next("resolve", "Something resolved.");
    next("payment", "You played a resource.");
    next("combat", "Combat damage is dealt simultaneously.");
    b.enemy.hp -= 3;
    expect(cuesSince(before, b)).toEqual([
      "cast",
      "resolve",
      "payment",
      "combat",
      "hurt",
    ]);
    const mid = tableSnapshot(b);
    next("notice", "Rival’s turn: untap, upkeep, draw.");
    b.player.hp += 2;
    b.result = "won";
    expect(cuesSince(mid, b)).toEqual(["turn", "heal", "won"]);
  });
  it("hear a response from the event itself and reset at a fresh duel", () => {
    const b = fresh(),
      before = tableSnapshot(b);
    b.eventSequence += 1;
    b.events = [{ id: b.eventSequence, kind: "response", text: "You cast X." }];
    expect(cuesSince(before, b)).toEqual(["response"]);
    // A new duel at the same table starts its count over: no cues, no echoes
    // of the previous duel's hearth or board.
    const ended = {
      ...tableSnapshot(b),
      sequence: 40,
      hp: [3, 0] as [number, number],
      result: "won" as const,
    };
    expect(cuesSince(ended, fresh())).toEqual([]);
  });
  it("the engine marks payments, casts and responses on the events", () => {
    const b = fresh();
    const resource = b.player.hand.findIndex(
      (id) => cardById[id].type === "Basic Resource",
    );
    if (resource >= 0) {
      battleCommand(b, { type: "play", index: resource });
      expect(b.events.at(-1)).toMatchObject({
        kind: "payment",
        owner: "player",
      });
    }
  });
});
