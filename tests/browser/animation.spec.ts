import { roomNodes, type RoomNode } from "../../src/content/tavern";
import { test, expect } from "@playwright/test";
import { PNG } from "pngjs";
import { createGame, applyCommand } from "../../src/sim/game";
import { cards } from "../../src/content/catalog";
test("reviewed sprite clips play in the room and ornate menu sprites respect reduced motion", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/");
  const host = page.locator("[data-player-animation]");
  await expect(host).toHaveAttribute("data-player-animation", "idle");
  const first = await host.getAttribute("data-player-frame");
  await expect
    .poll(() => host.getAttribute("data-player-frame"))
    .not.toBe(first);
  await page
    .getByRole("button", { name: "Start autobattles", exact: true })
    .click();
  await expect(host).toHaveAttribute("data-player-animation", "walk");
  await expect
    .poll(() => host.getAttribute("data-player-animation"), { timeout: 10000 })
    .toBe("idle");
  await page
    .getByRole("button", { name: "Pause autoplay", exact: true })
    .click();
  await page.screenshot({ path: "test-results/hearth-animated-tavern.png" });
  await page
    .getByRole("button", { name: "Card collection", exact: true })
    .hover();
  await expect
    .poll(() =>
      page
        .locator(".game-dock .ornament-book")
        .first()
        .evaluate((el) => getComputedStyle(el).backgroundPositionX),
    )
    .toBe("100%");
  await page
    .getByRole("button", { name: "Card collection", exact: true })
    .click();
  await expect(page.locator(".tome-ornaments")).toBeAttached();
  await page.screenshot({
    path: "test-results/hearth-ornate-binder.png",
    animations: "disabled",
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(() => host.getAttribute("data-player-frame")).toBe("0");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/hearth-ornate-mobile.png" });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  expect(errors).toEqual([]);
});
test("foil inspection keeps most painting pixels unchanged and uses a narrow reflection", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const g = createGame(),
    c = cards[0];
  g.collection[c.id] = 2;
  g.foils[c.id] = 1;
  await page.getByRole("button", { name: "Chronicle", exact: true }).click();
  await page.locator("input[type=file]").setInputFiles({
    name: "foil.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(g)),
  });
  await page
    .getByRole("button", { name: "Card collection", exact: true })
    .click();
  await page
    .getByRole("button", { name: `Inspect ${c.name}`, exact: true })
    .first()
    .click();
  const art = page.locator(".card-detail .card-illustration");
  await expect(art.locator("canvas")).toBeVisible();
  const foil = PNG.sync.read(await art.screenshot());
  await page.screenshot({ path: "test-results/hearth-crisp-foil.png" });
  await page.addStyleTag({
    content:
      ".foil-shader{visibility:hidden!important}.playing-card.foil .card-illustration::after{display:none!important}",
  });
  const plain = PNG.sync.read(await art.screenshot());
  let preserved = 0,
    total = foil.width * foil.height;
  for (let i = 0; i < foil.data.length; i += 4) {
    let difference = 0;
    for (let k = 0; k < 3; k++)
      difference += Math.abs(foil.data[i + k] - plain.data[i + k]);
    if (difference < 12) preserved++;
  }
  expect(preserved / total).toBeGreaterThan(0.9);
});

test("expanded kitchen and brewing sprites fit the tavern with visiting characters", async ({
  page,
}) => {
  let g = createGame();
  for (const id of ["hall", "kitchen", "bar"])
    g = applyCommand(g, { type: "upgrade-tavern", id });
  g.hospitality.pantry = { grain: 3, water: 2, herbs: 1 };
  g = applyCommand(g, { type: "craft-recipe", id: "ale" });
  g.room.nextId = 8;
  g.room.spawnIn = 100;
  g.room.customers = (
    [
      "dining",
      "east",
      "north",
      "west",
      "middle",
      "serving",
      "hearth",
    ] as RoomNode[]
  ).map((node, i) => ({
    id: i + 1,
    kind: i * 2,
    setId: "first-oaths",
    purpose: "cards" as const,
    itemId: null,
    phase: "browsing" as const,
    wait: 100,
    purchased: false,
    saleAmount: 0,
    node,
    x: roomNodes[node].x,
    y: roomNodes[node].y,
    route: [],
  }));
  await page.goto("/");
  await page.getByRole("button", { name: "Chronicle", exact: true }).click();
  await page.locator("input[type=file]").setInputFiles({
    name: "tavern-art.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(g)),
  });
  await page
    .getByRole("button", { name: "Return to tavern", exact: true })
    .click();
  await expect(page.locator("[data-player-animation]")).toHaveAttribute(
    "data-player-animation",
    "idle",
  );
  await page.getByRole("button", { name: "Fit tavern", exact: true }).click();
  await page.screenshot({
    path: "test-results/hearth-animated-expanded.png",
    animations: "disabled",
  });
  await page
    .getByRole("button", { name: "Booster packs", exact: true })
    .click();
  await page.screenshot({
    path: "test-results/hearth-ornate-boosters.png",
    animations: "disabled",
  });
});

test("tome cards use one fitted painting and dark readable ink", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Card collection", exact: true })
    .click();
  const card = page.locator(".card-grid .full-art-card").first();
  await expect(card).toBeVisible();
  expect(
    await card
      .locator(".card-name-button")
      .evaluate((el) => getComputedStyle(el).color),
  ).toBe("rgb(53, 38, 25)");
  expect(await card.locator("img.full-card-art").count()).toBe(1);
  expect(
    await card.evaluate((el) =>
      getComputedStyle(el).backgroundImage.includes("/art/cards/"),
    ),
  ).toBe(false);
  expect(
    await card
      .locator("img.full-card-art")
      .evaluate((el) => getComputedStyle(el).objectFit),
  ).toBe("contain");
  await page.screenshot({
    path: "docs/screenshots/tome-materials-binder.png",
    animations: "disabled",
  });
  await page
    .getByRole("button", { name: "Inspect Cold Ford Keeper", exact: true })
    .first()
    .click();
  await page.screenshot({
    path: "docs/screenshots/tome-card-reader.png",
    animations: "disabled",
  });
});

// Explicitly accept the player-facing confirmation in import fixtures.
test.beforeEach(async ({ page }) => {
  page.on("dialog", (dialog) => dialog.accept());
});
