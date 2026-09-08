import { test, expect } from "@playwright/test";
import { createGame, applyCommand, SAVE_KEY } from "../../src/sim/game";
import { presetDeck } from "../../src/sim/battle";

test("phone menu, local saving, notifications and reload keep progress", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open tavern menu" }).click();
  const menu = page.getByRole("dialog", { name: "Tavern menu" });
  await expect(menu).toBeVisible();
  await menu
    .getByRole("button", { name: "Open the shop", exact: true })
    .click();
  await menu.getByRole("button", { name: "Ledger", exact: true }).click();
  await expect(menu).toHaveCount(0);
  await page.getByRole("button", { name: "Save now", exact: true }).click();
  await expect(page.getByText(/Saved on this device/)).toBeVisible();
  const data = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    SAVE_KEY,
  );
  expect(data.open).toBe(true);
  await page.reload();
  await page.getByRole("button", { name: /Tavern notices/ }).click();
  const notices = page.getByRole("dialog", {
    name: "Tavern notices",
    exact: true,
  });
  await expect(notices.getByText(/The sign is turned/)).toBeVisible();
  await notices.getByRole("button", { name: "Mark all as read" }).click();
  await expect(notices.locator(".unread")).toHaveCount(0);
  await page.screenshot({ path: "test-results/mobile-notices.png" });
  await notices.getByRole("button", { name: "Close Tavern notices" }).click();
  await page.getByRole("button", { name: "Open tavern menu" }).click();
  await page.screenshot({ path: "test-results/mobile-station-menu.png" });
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Open tavern menu" }),
  ).toBeFocused();
  for (const station of [
    "Stockroom",
    "Card collection",
    "Booster packs",
    "Hospitality",
    "Duel table",
    "Chronicle",
  ]) {
    await page.getByRole("button", { name: station, exact: true }).click();
    const panel = page.locator(".game-panel");
    await expect(panel).toBeVisible();
    expect(
      await panel.evaluate((el) => el.scrollWidth <= el.clientWidth + 2),
    ).toBe(true);
    const close = page.getByRole("button", { name: "Return to tavern" });
    const box = await close.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    await close.click();
  }
});

test("recovery checkpoint and storage failures have visible safe behavior", async ({
  page,
}) => {
  const game = createGame();
  game.gold = 777;
  await page.addInitScript(
    ({ key, game }) => {
      localStorage.setItem(key, "broken");
      localStorage.setItem(key + "-recovery", JSON.stringify(game));
    },
    { key: SAVE_KEY, game },
  );
  await page.goto("/");
  await expect(page.getByTestId("gold")).toHaveText("777");
  await expect(
    page.getByRole("button", { name: "Open local save controls" }),
  ).toContainText("Saved");
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Full", "QuotaExceededError");
    };
  });
  await page.getByRole("button", { name: "Open local save controls" }).click();
  await page.getByRole("button", { name: "Save now", exact: true }).click();
  // Make a real state change; a no-op checkpoint needs no write.
  await page.getByRole("button", { name: /Open the shop/ }).click();
  await expect(page.getByRole("alert")).toContainText("Export your ledger");
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export ledger", exact: true })
    .click();
  expect((await download).suggestedFilename()).toContain(".json");
});

test("another tab cannot silently overwrite a newer local ledger", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Open local save controls" }),
  ).toContainText("Saved");
  const other = await context.newPage();
  await other.goto("/");
  await other.getByRole("button", { name: /Open the shop/ }).click();
  await expect(page.getByRole("alert")).toContainText("Another tab");
  await page.getByRole("button", { name: /Open the shop/ }).click();
  expect(
    await other.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).open,
      SAVE_KEY,
    ),
  ).toBe(true);
  await other.close();
});

test("winning at the table teaches a new recipe and enables it after collection", async ({
  page,
}) => {
  let game = createGame();
  for (const id of presetDeck("kiln"))
    game.collection[id] = Math.max(game.collection[id] ?? 0, 40);
  game = applyCommand(game, { type: "duel", opponent: "potter" });
  game.battle!.enemy.hp = 0;
  await page.addInitScript(
    ({ key, game }) => {
      if (!localStorage.getItem(key))
        localStorage.setItem(key, JSON.stringify(game));
    },
    { key: SAVE_KEY, game },
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Duel table", exact: true }).click();
  await page.getByRole("button", { name: "End turn", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key)!).unlockedRecipes,
        SAVE_KEY,
      ),
    )
    .toContain("kiln");
  await page.reload();
  await page.getByRole("button", { name: /Tavern notices/ }).click();
  await expect(
    page
      .getByRole("dialog", { name: "Tavern notices" })
      .getByText(/Learned The Kiln Wakes/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close Tavern notices" }).click();
  await page
    .getByRole("button", { name: "Card collection", exact: true })
    .click();
  await page.getByRole("button", { name: /Build deck/ }).click();
  await expect(
    page.getByRole("button", { name: /^The Kiln Wakes/ }),
  ).toBeEnabled();
});
