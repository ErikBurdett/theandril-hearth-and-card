import { test, expect, type Page } from "@playwright/test";
import { createGame, applyCommand, type Game } from "../../src/sim/game";
import { cards, cardById } from "../../src/content/catalog";
import { roomNodes } from "../../src/content/tavern";
import type { Permanent } from "../../src/sim/battle";
const perm = (cardId: string, uid: number): Permanent => ({
  uid,
  cardId,
  tapped: false,
  entered: 0,
  damage: 0,
  counters: 0,
  boost: 0,
  loyalty: 4,
  used: 0,
});
async function restore(page: Page, g: Game) {
  await page.goto("/");
  await page.getByRole("button", { name: "Chronicle", exact: true }).click();
  await page.locator("input[type=file]").setInputFiles({
    name: "interaction.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(g)),
  });
  await page.getByRole("button", { name: "Duel table", exact: true }).click();
  const dismiss = page.getByRole("button", { name: "Dismiss notification" });
  if (await dismiss.isVisible()) await dismiss.click();
}
const saved = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("hearth-hollow-v1")!));
test("drag, retarget, cancel and confirm preserve costs; sorceries and instants share direct targeting", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  const g = applyCommand(createGame(802), { type: "duel" }),
    b = g.battle!;
  const sorcery = cards.find(
    (c) => c.type === "Sorcery" && c.effect === "destroy",
  )!;
  b.timed = false;
  b.turn = 5;
  b.nextId = 900;
  b.player.hand = ["witness-roads.76", sorcery.id];
  b.enemy.hand = [];
  b.player.mana = { dawn: 20, grove: 20, tide: 20, grave: 20, ember: 20 };
  b.enemy.board = [perm("first-oaths.75", 301), perm("saltwind.75", 302)];
  b.player.board = [perm("deepfen.75", 303)];
  await restore(page, g);
  const card = page.locator(".hand-card").first(),
    targets = page.locator(".enemy .permanent-art");
  await card.dragTo(targets.first());
  await expect(
    page.getByRole("button", { name: "Confirm", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "End turn", exact: true }),
  ).toHaveCount(0);
  expect((await saved(page)).battle.player.mana).toEqual(b.player.mana);
  await expect(page.locator(".spell-stack")).toHaveCount(0);
  await targets.nth(1).click();
  await expect(page.locator(".casting-ribbon")).toContainText(
    "Weatherline Corsair",
  );
  await page.keyboard.press("Escape");
  await expect(page.locator(".casting-ribbon")).toHaveCount(0);
  await expect(page.locator(".arena")).toBeVisible();
  await expect(page.locator(".hand-card")).toHaveCount(2);
  await card.locator(".card-art-button").click();
  await targets.first().click();
  expect(
    await page
      .locator(".confirm-action")
      .evaluate((el) => getComputedStyle(el, "::before").animationName),
  ).toBe("hearth-orbit");
  await page.screenshot({
    path: "docs/screenshots/confirm-casting-laptop.png",
    animations: "disabled",
  });
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(page.locator(".hand-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Resolve top of stack" }).click();
  await expect(page.locator(".binding-badge")).toBeVisible();
  await page.locator(".hand-card").dragTo(targets.nth(1));
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await page.getByRole("button", { name: "Resolve top of stack" }).click();
  await expect(
    page.locator(".enemy .battle-board .battle-permanent"),
  ).toHaveCount(1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await page
      .locator(".end-turn-action")
      .evaluate((el) => getComputedStyle(el, "::before").animationName),
  ).toBe("none");
});
test("autoplay watches the table, can be dragged and paused, and hands control back without restarting", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  const g = applyCommand(createGame(813), { type: "duel" });
  g.battle!.timed = false;
  g.room.player = { node: "table", route: [], ...roomNodes.table };
  await restore(page, g);
  await page.getByRole("button", { name: "Autoplay at the tavern" }).click();
  const window = page.getByLabel("Autobattle watch window");
  await expect(window).toBeVisible();
  await expect(page.locator(".game-panel")).toBeHidden();
  await expect
    .poll(async () => (await saved(page)).battle.player.board.length)
    .toBeGreaterThan(0);
  await page
    .getByRole("button", { name: "Pause autoplay", exact: true })
    .click();
  const paused = (await saved(page)).battle;
  await page.waitForTimeout(1100);
  expect((await saved(page)).battle).toEqual(paused);
  expect((await saved(page)).room.player.node).toBe("table");
  const before = (await window.boundingBox())!,
    handle = page.getByRole("button", { name: "Move battle window" });
  const rect = (await handle.boundingBox())!;
  await page.mouse.move(rect.x + 50, rect.y + 12);
  await page.mouse.down();
  await page.mouse.move(rect.x + 320, rect.y + 95, { steps: 10 });
  await page.mouse.up();
  expect((await window.boundingBox())!.x).toBeGreaterThan(before.x + 150);
  expect(
    await window
      .locator(".mini-card img")
      .evaluateAll((imgs) =>
        imgs.every(
          (img) =>
            (img as HTMLImageElement).complete &&
            (img as HTMLImageElement).naturalWidth === 256,
        ),
      ),
  ).toBe(true);
  await page.screenshot({
    path: "docs/screenshots/autobattle-tavern.png",
    animations: "disabled",
  });
  await page
    .getByRole("button", { name: "Open battle and take control", exact: true })
    .click();
  await expect(page.locator(".arena")).toBeVisible();
  expect((await saved(page)).battle).toEqual(paused);
  await page.getByRole("button", { name: "Autoplay at the tavern" }).click();
  await expect(window).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(window).toBeInViewport();
  expect(
    (await window.boundingBox())!.x + (await window.boundingBox())!.width,
  ).toBeLessThanOrEqual(390);
  await page.screenshot({
    path: "docs/screenshots/autobattle-mobile.png",
    animations: "disabled",
  });
  await page.reload();
  await expect(window).toBeVisible();
  expect((await saved(page)).battle.autoplay).toBe(true);
});
