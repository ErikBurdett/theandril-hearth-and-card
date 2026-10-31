// Capture the save fixture for a published build: a representative game played
// through the public commands of this source tree (which is the build's source
// when run at the published commit). Writes
// src/sim/fixtures/published-<sha>-save.json; src/sim/published-saves.test.ts
// then loads it on every later build.
//   npx tsx scripts/capture-save.ts [sha]   (default: the short HEAD commit)
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import {
  applyCommand,
  createGame,
  type Command,
  type Game,
} from "../src/sim/game";

const sha =
  process.argv[2] ??
  execFileSync("git", ["rev-parse", "--short", "HEAD"]).toString().trim();
const STEPS_PER_BELL = 40;
let s: Game = createGame(2447);
const done: string[] = [];
function must(label: string, cmd: Command) {
  s = applyCommand(s, cmd);
  done.push(label);
}
function may(label: string, cmd: Command) {
  try {
    must(label, cmd);
  } catch (error) {
    done.push(`${label} skipped: ${(error as Error).message}`);
  }
}
const setId = Object.keys(s.products)[0];
must("order", { type: "order", setId, quantity: 8 });
if (!s.open) must("open shop", { type: "toggle" });
for (let bell = 0; bell < 12; bell++) {
  for (let step = 0; step < STEPS_PER_BELL; step++)
    s = applyCommand(s, { type: "room-step" });
  s = applyCommand(s, { type: "tick" });
}
done.push(
  `traded 12 bells: ${s.visitors} visitors, ${s.revenue} crowns of revenue`,
);
if (s.orders.length) throw new Error("The delivery never arrived.");
must("open a pack", { type: "open-pack", setId });
may("learn welcome", { type: "learn-skill", id: "welcome" });
may("prepare a recipe", { type: "preset", preset: "fellowship" });
must("walk to the table", { type: "walk", destination: "table" });
for (let i = 0; i < 400 && s.room.player.node !== "table"; i++)
  s = applyCommand(s, { type: "room-step" });
if (s.room.player.node !== "table") throw new Error("Never reached the table.");
must("sit down", { type: "duel" });
must("autoplay", { type: "autoplay", enabled: true });
for (let i = 0; i < 10 && s.battle?.result === "playing"; i++)
  s = applyCommand(s, { type: "auto-step" });
if (s.battle?.result !== "playing") throw new Error("The duel ended too soon.");
done.push(`duel turn ${s.battle.turn}, ${s.battle.events.length} events`);
const path = `src/sim/fixtures/published-${sha}-save.json`;
writeFileSync(path, JSON.stringify(s, null, 2) + "\n");
execFileSync("npx", ["prettier", "--write", path], { stdio: "ignore" });
console.log(done.join("\n"));
console.log(`wrote ${path} (day ${s.day}, ${s.gold} crowns)`);
