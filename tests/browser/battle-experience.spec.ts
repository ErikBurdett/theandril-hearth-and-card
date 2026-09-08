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

// Explicitly accept the player-facing confirmation in import fixtures.
test.beforeEach(async ({ page }) => {
  page.on("dialog", (dialog) => dialog.accept());
});

test("compact battle keeps the hand separate from actions and persists full control", async ({
  page,
}) => {
  const g = applyCommand(createGame(990), { type: "duel" }),
    b = g.battle!;
  b.timed = false;
  b.turn = 5;
  b.nextId = 999;
  b.player.board = Array.from({ length: 8 }, (_, i) =>
    perm("first-oaths.75", 600 + i),
  );
  b.enemy.board = Array.from({ length: 8 }, (_, i) =>
    perm("saltwind.75", 700 + i),
  );
  await restore(page, g);
  for (const [width, height] of [
    [360, 800],
    [844, 390],
    [1366, 768],
  ]) {
    await page.setViewportSize({ width, height });
    await page
      .getByRole("button", { name: "Begin combat", exact: true })
      .click({ trial: true });
    const actions = page.getByLabel("Battle actions"),
      hand = page.locator(".hand");
    for (const board of await page.locator(".battle-board").all())
      expect((await board.boundingBox())!.height).toBeGreaterThanOrEqual(40);
    await expect(actions).toBeInViewport();
    await expect(hand).toBeInViewport();
    const a = (await actions.boundingBox())!,
      h = (await hand.boundingBox())!;
    expect(a.y >= h.y + h.height - 1 || a.x >= h.x + h.width - 1).toBe(true);
    expect(
      await page
        .locator(".arena")
        .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
    ).toBe(true);
    await page.screenshot({
      path: `docs/screenshots/battle-polish-${width}.png`,
      animations: "disabled",
    });
  }
  await page.locator(".table-options > summary").click();
  await page.getByRole("button", { name: "Full control: Off" }).click();
  await expect(page.locator(".battle-status-strip")).toContainText(
    "Full control",
  );
  await page.reload();
  await page.getByRole("button", { name: "Duel table", exact: true }).click();
  await expect(page.locator(".battle-status-strip")).toContainText(
    "Full control",
  );
});

test("pointer lift stages a spell without spending and cleanup uses card selection", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-09-08T00:00:00Z") });
  const g = applyCommand(createGame(991), { type: "duel" }),
    b = g.battle!;
  b.timed = false;
  b.turn = 4;
  b.nextId = 900;
  b.enemy.hand = [];
  b.player.hand = ["witness-roads.76"];
  b.player.mana = { dawn: 20, tide: 20, ember: 20, grove: 20, grave: 20 };
  b.enemy.board = [perm("first-oaths.75", 701)];
  await restore(page, g);
  await page.locator(".hand-card .card-art-button").click({ trial: true });
  const art = page.locator(".hand-card .card-art-button"),
    target = page.locator(".enemy .permanent-art"),
    r = (await target.boundingBox())!;
  // Control gesture time so a slow runner does not turn a drag into a long press.
  await page.clock.pauseAt(new Date("2026-09-08T01:00:00Z"));
  // Real browser touch input exercises capture and the vertical lift gesture.
  const start = (await art.boundingBox())!,
    cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { x: start.x + start.width / 2, y: start.y + start.height / 2 },
    ],
  });
  for (let i = 1; i <= 8; i++)
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        {
          x:
            start.x +
            start.width / 2 +
            ((r.x + 10 - start.x - start.width / 2) * i) / 8,
          y:
            start.y +
            start.height / 2 +
            ((r.y + 10 - start.y - start.height / 2) * i) / 8,
        },
      ],
    });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await page.clock.resume();
  await expect(
    page.getByRole("button", { name: "Confirm", exact: true }),
  ).toBeEnabled();
  await expect(page.locator(".payment-preview")).toContainText("Spend");
  expect((await saved(page)).battle.player.hand).toEqual(b.player.hand);
  await page.keyboard.press("Escape");
  await expect(page.locator(".arena")).toBeVisible();
  await art.click({ trial: true });
  const held = (await art.boundingBox())!;
  await page.clock.pauseAt(new Date("2026-09-08T02:00:00Z"));
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: held.x + held.width / 2, y: held.y + held.height / 2 }],
  });
  await page.clock.runFor(500);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await page.clock.resume();
  await expect(
    page.getByRole("button", { name: "Close card inspection", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Close card inspection", exact: true })
    .click();
  b.phase = "cleanup";
  b.player.hand = cards.slice(0, 9).map((c) => c.id);
  await restore(page, g);
  await page.locator(".hand-card .card-art-button").nth(1).click();
  await page.locator(".hand-card .card-art-button").nth(7).click();
  await expect(
    page.getByRole("button", { name: "Put away 2 cards" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Put away 2 cards" }).click();
  expect((await saved(page)).battle.player.grave).toContain(cards[1].id);
  expect((await saved(page)).battle.player.grave).toContain(cards[7].id);
});
