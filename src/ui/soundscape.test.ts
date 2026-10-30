import { describe, expect, it } from "vitest";
import { cards } from "../content/catalog";
import { createBattle, presetDeck } from "../sim/battle";
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
    const resource = cards.find((c) => c.type === "Basic Resource")!,
      creature = cards.find((c) => c.type === "Creature")!;
    next("notice", `You played ${resource.name}.`);
    next("notice", `Rival played ${creature.name}.`);
    next("combat", "Combat damage is dealt simultaneously.");
    b.enemy.hp -= 3;
    expect(cuesSince(before, b)).toEqual([
      "cast",
      "resolve",
      "payment",
      "arrival",
      "combat",
      "hurt",
    ]);
    const mid = tableSnapshot(b);
    next("notice", "Rival’s turn: untap, upkeep, draw.");
    b.player.hp += 2;
    b.result = "won";
    expect(cuesSince(mid, b)).toEqual(["turn", "heal", "won"]);
  });
  it("hear a response when a spell lands on a waiting stack", () => {
    const b = fresh(),
      before = tableSnapshot(b);
    const entry = (uid: number, owner: "player" | "enemy") => ({
      uid,
      owner,
      cardId: presetDeck("tempo")[40 + uid],
      effect: "draw",
      amount: 1,
      target: null,
      ability: false,
    });
    b.stack = [entry(1, "enemy"), entry(2, "player")];
    b.eventSequence += 1;
    b.events = [
      {
        id: b.eventSequence,
        kind: "cast",
        text: "You cast X. A response may be played.",
      },
    ];
    expect(cuesSince(before, b)).toEqual(["response"]);
  });
});
