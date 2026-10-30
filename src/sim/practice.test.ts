import { describe, expect, it } from "vitest";
import { applyCommand, createGame, decodeSave, type Game } from "./game";
import {
  practiceCards,
  practiceChoices,
  practiceStatus,
  lessonIds,
  type LessonId,
} from "./practice";
import { availableResources, stats } from "./battle";

const start = (lesson: LessonId) =>
  applyCommand(createGame(), { type: "practice-start", lesson });
const act = (g: Game, action: string) =>
  applyCommand(g, { type: "practice-act", action });
const outsidePractice = (g: Game) => {
  const { practice: _practice, ...rest } = g;
  return rest;
};
const paths = {
  mana: ["resource", "cast", "resolve"],
  responses: ["counter", "resolve"],
  blocking: ["block", "resolve"],
  protection: ["protect", "resolve", "resolve", "finish"],
} as const;

describe("borrowed-card practice", () => {
  it("protects the chosen companion through damage and clears both damage and boost at turn end", () => {
    let g = start("protection");
    const before = outsidePractice(g);
    g = act(g, "protect");
    let b = g.practice.active!.battle;
    expect(b.stack.map((item) => item.target?.uid)).toEqual([10, 10]);
    expect(b.player.board.find((p) => p.uid === 10)!.boost).toBe(0);
    expect(availableResources(b.player).total).toBe(0);
    g = act(g, "resolve");
    b = g.practice.active!.battle;
    expect(
      stats(
        b.player,
        b.player.board.find((p) => p.uid === 10)!,
      ),
    ).toEqual({ power: 5, toughness: 6 });
    expect(b.stack).toHaveLength(1);
    expect(g.practice.completed).toEqual([]);
    g = act(g, "resolve");
    b = g.practice.active!.battle;
    expect(b.player.board.find((p) => p.uid === 10)!.damage).toBe(3);
    expect(b.enemy.grave).toContain(practiceCards.damage);
    expect(g.practice.completed).toEqual([]);
    g = act(g, "finish");
    b = g.practice.active!.battle;
    const companion = b.player.board.find((p) => p.uid === 10)!;
    expect(companion).toMatchObject({ damage: 0, boost: 0 });
    expect(stats(b.player, companion)).toEqual({ power: 2, toughness: 3 });
    expect(practiceStatus(g.practice.active!)).toBe("complete");
    expect(g.practice.completed).toEqual(["protection"]);
    expect(outsidePractice(g)).toEqual(before);
    expect(() => act(g, "finish")).toThrow(/available/);
  });

  it("fails when damage resolves unanswered or protection targets the other companion", () => {
    const startGame = start("protection");
    const unanswered = act(startGame, "pass");
    expect(practiceStatus(unanswered.practice.active!)).toBe("retry");
    let wrong = act(startGame, "other");
    wrong = act(wrong, "resolve");
    expect(
      wrong.practice.active!.battle.player.board.find((p) => p.uid === 11)!
        .boost,
    ).toBe(3);
    wrong = act(wrong, "resolve");
    expect(practiceStatus(wrong.practice.active!)).toBe("retry");
    expect(wrong.practice.active!.battle.player.grave).toContain(
      practiceCards.companion,
    );
    expect(
      wrong.practice.active!.battle.player.board.find((p) => p.uid === 11),
    ).toBeDefined();
    expect(wrong.practice.completed).toEqual([]);
    expect(outsidePractice(wrong)).toEqual(outsidePractice(startGame));
    expect(decodeSave(JSON.stringify(wrong))).toEqual(wrong);
    expect(() => act(wrong, "finish")).toThrow(/available/);
    const replay = applyCommand(wrong, {
      type: "practice-start",
      lesson: "protection",
    });
    expect(replay).toEqual(startGame);
  });

  it("retains existing three-lesson checkpoints and checkmarks without granting the fourth", () => {
    for (const lesson of ["mana", "responses", "blocking"] as const) {
      const old = act(start(lesson), paths[lesson][0]);
      old.practice.completed = ["mana", "responses", "blocking"];
      expect(decodeSave(JSON.stringify(old))).toEqual(old);
      const next = applyCommand(old, {
        type: "practice-start",
        lesson: "protection",
      });
      expect(next.practice.completed).toEqual(old.practice.completed);
      expect(outsidePractice(next)).toEqual(outsidePractice(old));
    }
    const invalid = start("protection");
    invalid.practice.active!.step = 5;
    expect(() => decodeSave(JSON.stringify(invalid))).toThrow();
  });
  it("teaches one resource per turn and actual two-source payment before resolution", () => {
    let g = start("mana");
    const original = JSON.stringify(g);
    expect(() => act(g, "cast")).toThrow(/mana/i);
    expect(JSON.stringify(g)).toBe(original);
    expect(availableResources(g.practice.active!.battle.player).total).toBe(1);
    g = act(g, "resource");
    expect(availableResources(g.practice.active!.battle.player).total).toBe(2);
    const paid = JSON.stringify(g);
    expect(() => act(g, "resource")).toThrow(/already played/i);
    expect(JSON.stringify(g)).toBe(paid);
    g = act(g, "cast");
    expect(availableResources(g.practice.active!.battle.player).total).toBe(0);
    expect(g.practice.active!.battle.player.board).toHaveLength(2);
    expect(g.practice.active!.battle.stack[0].cardId).toBe(
      practiceCards.companion,
    );
    expect(g.practice.completed).toEqual([]);
    g = act(g, "resolve");
    expect(g.practice.active!.battle.player.board.at(-1)!.cardId).toBe(
      practiceCards.companion,
    );
    expect(g.practice.completed).toEqual(["mana"]);
  });

  it("teaches LIFO countering and permits a failed attempt without rewarding it", () => {
    const g = start("responses");
    const failed = act(g, "pass");
    expect(practiceStatus(failed.practice.active!)).toBe("retry");
    expect(failed.practice.active!.battle.player.hp).toBe(0);
    expect(failed.practice.completed).toEqual([]);
    expect(outsidePractice(failed)).toEqual(outsidePractice(createGame()));
    let next = act(g, "counter");
    expect(
      next.practice.active!.battle.stack.map((item) => item.cardId),
    ).toEqual([practiceCards.damage, practiceCards.counter]);
    expect(
      next.practice.active!.battle.player.board.every((p) => p.tapped),
    ).toBe(true);
    next = act(next, "resolve");
    expect(next.practice.active!.battle.player.hp).toBe(3);
    expect(next.practice.active!.battle.enemy.grave).toContain(
      practiceCards.damage,
    );
    expect(practiceStatus(next.practice.active!)).toBe("complete");
  });

  it("teaches an assigned blocker before simultaneous damage and lets an unblocked attack fail", () => {
    const g = start("blocking");
    expect(practiceStatus(act(g, "unblocked").practice.active!)).toBe("retry");
    let blocked = act(g, "block");
    expect(blocked.practice.active!.battle.combat[0].blocker).toBe(10);
    expect(blocked.practice.completed).toEqual([]);
    blocked = act(blocked, "resolve");
    const b = blocked.practice.active!.battle;
    expect(b.player.hp).toBe(2);
    expect(b.player.board[0].damage).toBe(2);
    expect(b.enemy.board[0].damage).toBe(2);
    expect(practiceStatus(blocked.practice.active!)).toBe("complete");
  });

  it("resumes every decision exactly and conserves the entire non-practice state on success, replay and exit", () => {
    let g = createGame();
    const before = outsidePractice(g);
    for (const lesson of lessonIds) {
      for (let replay = 0; replay < 2; replay++) {
        g = applyCommand(g, { type: "practice-start", lesson });
        for (const action of paths[lesson]) {
          const restored = decodeSave(JSON.stringify(g));
          expect(restored).toEqual(g);
          const next = act(g, action);
          expect(act(restored, action)).toEqual(next);
          expect(outsidePractice(next)).toEqual(before);
          g = next;
        }
        expect(practiceChoices(g.practice.active!)).toEqual([]);
        expect(() => act(g, "resolve")).toThrow();
        g = applyCommand(g, { type: "practice-exit" });
        expect(outsidePractice(g)).toEqual(before);
      }
    }
    expect(g.practice.completed).toEqual(lessonIds);
    expect(decodeSave(JSON.stringify(g))).toEqual(g);
  });

  it("keeps active duels separate and rejects out-of-stage actions without mutation", () => {
    const duel = applyCommand(createGame(), {
      type: "duel",
      opponent: "potter",
    });
    const before = JSON.stringify(duel);
    expect(() =>
      applyCommand(duel, { type: "practice-start", lesson: "mana" }),
    ).toThrow(/guest selection/);
    expect(JSON.stringify(duel)).toBe(before);
    const g = start("mana"),
      snapshot = JSON.stringify(g);
    expect(() => applyCommand(g, { type: "duel" })).toThrow(/Leave practice/);
    expect(() => act(g, "resolve")).toThrow(/available/);
    expect(() => applyCommand(g, { type: "play", index: 0 })).toThrow(
      /No active duel/,
    );
    expect(JSON.stringify(g)).toBe(snapshot);
    const exited = applyCommand(g, { type: "practice-exit" });
    expect(applyCommand(exited, { type: "duel" }).battle).not.toBeNull();
  });

  it("defaults old saves to no practice and rejects malformed or competing lesson states", () => {
    const old = JSON.parse(JSON.stringify(createGame()));
    delete old.practice;
    expect(decodeSave(JSON.stringify(old))).toEqual(createGame());
    for (const change of [
      (g: any) => {
        g.practice.active.lesson = "unknown";
      },
      (g: any) => {
        g.practice.active.step = -1;
      },
      (g: any) => {
        g.practice.active.lesson = "blocking";
        g.practice.active.step = 3;
      },
      (g: any) => {
        g.practice.active.battle.autoplay = true;
      },
      (g: any) => {
        g.practice.completed = ["mana", "mana"];
      },
      (g: any) => {
        g.battle = g.practice.active.battle;
      },
      (g: any) => {
        g.practice.active.battle.player.hand = ["unknown-card"];
      },
    ]) {
      const invalid = start("mana");
      change(invalid);
      expect(() => decodeSave(JSON.stringify(invalid))).toThrow();
    }
  });
});
