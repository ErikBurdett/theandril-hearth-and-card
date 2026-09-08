import { test, expect } from "@playwright/test";
import { createGame, applyCommand } from "../../src/sim/game";
test("faction folios retain chronology and open their connected full-art cards", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Card collection", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Set histories", exact: true })
    .click();
  await expect(page.locator(".faction-entry")).toHaveCount(12);
  await page
    .locator(".faction-entry summary")
    .filter({ hasText: "Sable Steppe" })
    .click();
  await expect(
    page.getByText(/Temporary use is not permanent surrender/),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Sallow Reach Last-light Rider →",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Inspect Sallow Reach Last-light Rider" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Faction connections" }),
  ).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/faction-card-reading.png" });
  await page.keyboard.press("Escape");
  await page
    .locator(".set-spines button")
    .filter({ hasText: "The Paper Sea" })
    .click();
  await expect(page.locator(".faction-folio")).toContainText(
    "collapsed League",
  );
  await expect(page.locator(".faction-entry")).toHaveCount(2);
  await page
    .locator(".faction-entry summary")
    .filter({ hasText: "Saltwind Remnant" })
    .click();
  await page.screenshot({ path: "docs/screenshots/faction-folio.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator(".faction-folio").scrollIntoViewIfNeeded();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "docs/screenshots/faction-folio-mobile.png" });
});
test("tavern camera pans and zooms without moving the keeper; reset and transformed walking work", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.setViewportSize({ width: 1366, height: 768 });
  let g = createGame();
  for (const id of ["hall", "kitchen", "bar"])
    g = applyCommand(g, { type: "upgrade-tavern", id });
  await page.getByRole("button", { name: "Chronicle", exact: true }).click();
  await page.locator("input[type=file]").setInputFiles({
    name: "camera-ledger.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(g)),
  });
  // Historical upgrade notices must not replace the import confirmation.
  expect(g.notices.length).toBeGreaterThan(0);
  await expect(page.getByText("Ledger restored. Welcome home.")).toBeVisible();
  await page.keyboard.press("Escape");
  const world = page.locator(".world");
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect(world).toHaveAttribute("data-camera-zoom", "1.20");
  await page.getByRole("button", { name: "Pan right", exact: true }).click();
  await expect(world).toHaveAttribute("data-camera-x", "140");
  await page.mouse.move(650, 470);
  await page.mouse.down();
  await page.mouse.move(740, 510, { steps: 8 });
  await page.mouse.up();
  expect(await world.getAttribute("data-camera-x")).not.toBe("140");
  await expect(world).toHaveAttribute("data-player-node", "east");
  await page.mouse.wheel(0, -100);
  await expect
    .poll(async () => Number(await world.getAttribute("data-camera-zoom")))
    .toBeGreaterThan(1.2);
  await page.screenshot({ path: "docs/screenshots/tavern-camera-zoom.png" });
  await page.getByRole("button", { name: "Fit tavern", exact: true }).click();
  await expect(world).toHaveAttribute("data-camera-zoom", "1.00");
  await expect(world).toHaveAttribute("data-camera-x", "0");
  // At 1366x768 the world uses a centered 1536x1024 plate scaled to 0.75.
  await page.mouse.click(683 + (580 - 768) * 0.75, 384 + (650 - 512) * 0.75);
  await expect(world).toHaveAttribute("data-player-node", "dining", {
    timeout: 12000,
  });
  await page.screenshot({ path: "docs/screenshots/tavern-stair-arrival.png" });
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await page
    .getByRole("button", { name: "Dining wing and kitchen", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Hospitality", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Fit tavern", exact: true }).click();
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await page.getByRole("button", { name: "Pan left", exact: true }).click();
  await page.screenshot({ path: "docs/screenshots/tavern-camera-mobile.png" });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

// Explicitly accept the player-facing confirmation in import fixtures.
test.beforeEach(async ({ page }) => {
  page.on("dialog", (dialog) => dialog.accept());
});
