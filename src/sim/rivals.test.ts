import { describe, expect, it } from "vitest";
import { applyCommand, createGame, decodeSave, type Game } from "./game";
import { rivalForBattle } from "./rivals";

function finish(game: Game, result: "won" | "lost" | "drawn") {
  const candidate = structuredClone(game);
  candidate.battle!.timed = false;
  if (result !== "lost") candidate.battle!.enemy.hp = 0;
  if (result !== "won") candidate.battle!.player.hp = 0;
  return applyCommand(candidate, { type: "end-turn" });
}

describe("rival guestbook", () => {
  it("records a victory and recipe once, independently for guests sharing a deck", () => {
    const start = applyCommand(createGame(), {
      type: "duel",
      opponent: "potter",
    });
    const before = JSON.stringify(start);
    const won = finish(start, "won");
    expect(JSON.stringify(start)).toBe(before);
    expect(finish(start, "won")).toEqual(won);
    expect(won.rivals.potter).toMatchObject({
      wins: 1,
      losses: 0,
      draws: 0,
      concessions: 0,
      last: {
        result: "won",
        day: 1,
        crowns: 35,
        renown: 5,
        xp: 60,
        learnedRecipe: "kiln",
      },
    });
    expect(won.gold - start.gold).toBe(35);
    expect(won.progression.xp - start.progression.xp).toBe(60);
    const loaded = decodeSave(JSON.stringify(won));
    const reviewed = applyCommand(loaded, {
      type: "battle-controls",
      fullControl: true,
    });
    expect(reviewed.rivals).toEqual(won.rivals);
    expect(reviewed.gold).toBe(won.gold);
    expect(reviewed.progression).toEqual(won.progression);
    const unchanged = JSON.stringify(loaded);
    expect(() => applyCommand(loaded, { type: "end-turn" })).toThrow();
    expect(JSON.stringify(loaded)).toBe(unchanged);
    let next = applyCommand(loaded, { type: "leave-duel" });
    expect(next.rivals).toEqual(won.rivals);
    next = finish(
      applyCommand(next, { type: "duel", opponent: "potter" }),
      "won",
    );
    expect(next.rivals.potter.wins).toBe(2);
    expect(next.rivals.potter.last.learnedRecipe).toBeNull();
    expect(next.unlockedRecipes).toEqual(["kiln"]);

    let shared = finish(
      applyCommand(createGame(), { type: "duel", opponent: "smith" }),
      "won",
    );
    shared = applyCommand(shared, { type: "leave-duel" });
    shared = finish(
      applyCommand(shared, { type: "duel", opponent: "knight" }),
      "lost",
    );
    expect(shared.rivals.smith.wins).toBe(1);
    expect(shared.rivals.knight.losses).toBe(1);
    expect(Object.keys(shared.rivals)).toHaveLength(2);
  });

  it("keeps defeat, draw and concession separate without changing their rewards", () => {
    const start = applyCommand(createGame(), {
      type: "duel",
      opponent: "potter",
    });
    for (const result of ["lost", "drawn"] as const) {
      const game = finish(start, result);
      expect(game.rivals.potter[result === "lost" ? "losses" : "draws"]).toBe(
        1,
      );
      expect(game.rivals.potter.last).toMatchObject({
        result,
        crowns: 0,
        renown: 0,
        xp: 25,
        learnedRecipe: null,
      });
      expect(game.gold).toBe(start.gold);
      expect(game.unlockedRecipes).toEqual([]);
      expect(
        game.progression.totals[result === "lost" ? "losses" : "draws"],
      ).toBe(1);
      expect(decodeSave(JSON.stringify(game)).rivals).toEqual(game.rivals);
    }
    const conceded = applyCommand(start, { type: "leave-duel" });
    expect(conceded.rivals.potter).toMatchObject({
      wins: 0,
      losses: 0,
      draws: 0,
      concessions: 1,
      last: {
        result: "conceded",
        crowns: 0,
        renown: 0,
        xp: 0,
        learnedRecipe: null,
      },
    });
    expect(conceded.progression).toEqual(start.progression);
    expect(conceded.gold).toBe(start.gold);
    expect(conceded.collection).toEqual(start.collection);
    expect(conceded.rng).toBe(start.rng);
    expect(applyCommand(conceded, { type: "leave-duel" }).rivals).toEqual(
      conceded.rivals,
    );
  });

  it("settles the old rival before autoplay changes opponents, and trusts IDs over labels", () => {
    let game = applyCommand(createGame(), { type: "duel", opponent: "potter" });
    game = applyCommand(game, { type: "autoplay", enabled: true });
    game.room.player.node = "table";
    game.room.player.route = [];
    game.battle!.enemy.hp = 0;
    game.battle!.opponent = "A changed display name";
    const restored = decodeSave(JSON.stringify(game));
    const next = applyCommand(restored, { type: "auto-step" });
    expect(next.rivals.potter.wins).toBe(1);
    expect(next.rivals.potter.last.learnedRecipe).toBe("kiln");
    expect(next.battle!.autoplay).toBe(true);
    expect(next.battle!.opponentId).not.toBe("potter");
    expect(rivalForBattle(next.battle!)!.id).toBe(next.battle!.opponentId);
    expect(next.rivals[next.battle!.opponentId!]).toBeUndefined();
    expect(decodeSave(JSON.stringify(next)).rivals).toEqual(next.rivals);
  });

  it("migrates active old battles without inventing earlier meetings or replaying settled ones", () => {
    const original = applyCommand(createGame(), {
      type: "duel",
      opponent: "potter",
    });
    const old = JSON.parse(JSON.stringify(original));
    delete old.rivals;
    delete old.battle.opponentId;
    const migrated = decodeSave(JSON.stringify(old));
    expect(migrated.rivals).toEqual({});
    expect(migrated.gold).toBe(original.gold);
    expect(migrated.rng).toBe(original.rng);
    expect(migrated.collection).toEqual(original.collection);
    expect(migrated.deck).toEqual(original.deck);
    expect(migrated.battle).toEqual({ ...old.battle, opponentId: null });
    expect(finish(migrated, "won").rivals.potter.wins).toBe(1);

    const settled = JSON.parse(JSON.stringify(finish(original, "won")));
    delete settled.rivals;
    delete settled.battle.opponentId;
    const loaded = decodeSave(JSON.stringify(settled));
    expect(applyCommand(loaded, { type: "leave-duel" }).rivals).toEqual({});
    expect(loaded.wins).toBe(1);
    migrated.battle!.opponent = "An unrecognized old guest";
    expect(finish(migrated, "won").rivals).toEqual({});
  });

  it("rejects invalid guest IDs and history fields while preserving valid JSON backups", () => {
    const game = finish(
      applyCommand(createGame(), { type: "duel", opponent: "potter" }),
      "won",
    );
    expect(decodeSave(JSON.stringify(game))).toEqual(game);
    for (const change of [
      (g: any) => {
        g.rivals.potter.wins = -1;
      },
      (g: any) => {
        g.rivals.potter.last.xp = 0.5;
      },
      (g: any) => {
        g.rivals.potter.last.learnedRecipe = "unknown";
      },
      (g: any) => {
        g.rivals.unknown = g.rivals.potter;
      },
      (g: any) => {
        g.battle.opponentId = "unknown";
      },
    ]) {
      const invalid = structuredClone(game);
      change(invalid);
      expect(() => decodeSave(JSON.stringify(invalid))).toThrow();
    }
  });
});
