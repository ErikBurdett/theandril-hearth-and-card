import { test, expect, type Page } from "@playwright/test";
import { createGame, applyCommand, type Game } from "../../src/sim/game";
import { roomNodes } from "../../src/content/tavern";
import { cards } from "../../src/content/catalog";
const saved = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("hearth-hollow-v1")!));
async function restore(page: Page, g: Game) {
  await page.goto("/");
  await page.getByRole("button", { name: "Chronicle", exact: true }).click();
  await page.locator("input[type=file]").setInputFiles({
    name: "progression.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(g)),
  });
}
test("start at the tavern table, loop to a different opponent, pause, and claim an endless chapter", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Start autobattles", exact: true })
    .click();
  await expect(page.locator(".auto-battle-window")).toBeVisible();
  await expect.poll(async () => (await saved(page)).battle.autoplay).toBe(true);
  await page
    .getByRole("button", { name: "Pause autoplay", exact: true })
    .click();
  let g = applyCommand(createGame(72), { type: "duel" });
  g = applyCommand(g, {
    type: "choose-mission",
    branch: "battle",
    choice: "bold",
  });
  g.progression.totals.wins = 1;
  g.progression.xp = 90;
  g.battle!.enemy.hp = 0;
  g.room.player = {
    node: "table",
    route: [],
    x: roomNodes.table.x,
    y: roomNodes.table.y,
  };
  const old = g.battle!.opponent;
  await restore(page, g);
  await page
    .getByRole("button", { name: "Return to tavern", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Resume autobattles", exact: true })
    .click();
  await expect
    .poll(async () => (await saved(page)).progression.totals.wins)
    .toBe(2);
  await page
    .getByRole("button", { name: "Pause autoplay", exact: true })
    .click();
  const next = await saved(page);
  expect(next.battle.opponent.split(" · ")[0]).not.toBe(old.split(" · ")[0]);
  expect(next.battle.opponent.split(" · ")[1]).not.toBe(old.split(" · ")[1]);
  await expect(page.locator(".circuit-controls")).toContainText("2 wins");
  await page.screenshot({ path: "test-results/hearth-circuit-desktop.png" });
  await page.getByRole("button", { name: "Open XP and missions" }).click();
  await expect(
    page.getByRole("heading", { name: "Keeper level 2", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Claim battle mission", exact: true })
    .click();
  await expect(page.getByLabel("battle mission branch")).toContainText(
    "Chapter 2",
  );
  const claimed = await saved(page);
  expect(claimed.gold).toBeGreaterThan(next.gold);
  await expect(page.locator(".auto-battle-window")).toHaveCount(0);
  await page.screenshot({ path: "test-results/hearth-missions-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/hearth-missions-mobile.png" });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.reload();
  await page.getByRole("button", { name: "Open XP and missions" }).click();
  expect((await saved(page)).progression.missions.battle.tier).toBe(2);
});
test("foil lighting responds to the pointer and inspection mounts the shader without graphics errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  const g = createGame(32),
    card = cards[0];
  g.collection[card.id] = 2;
  g.foils[card.id] = 1;
  await restore(page, g);
  await page
    .getByRole("button", { name: "Card collection", exact: true })
    .click();
  await page
    .getByRole("button", { name: `Inspect ${card.name}`, exact: true })
    .first()
    .click();
  const foil = page.locator(".card-detail .playing-card.foil");
  await expect(foil).toBeVisible();
  await foil.hover({ position: { x: 30, y: 60 } });
  await expect(page.locator(".foil-shader canvas")).toBeVisible();
  expect(
    await foil.evaluate((el) =>
      (el as HTMLElement).style.getPropertyValue("--foil-x"),
    ),
  ).not.toBe("");
  await page.screenshot({ path: "test-results/hearth-foil-desktop.png" });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/hearth-foil-mobile.png" });
  expect(errors.filter((e) => /shader|WebGL|TypeError/i.test(e))).toEqual([]);
});
