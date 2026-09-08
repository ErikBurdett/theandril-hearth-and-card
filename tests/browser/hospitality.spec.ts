import { test, expect } from "@playwright/test";
import { createGame, applyCommand, type Game } from "../../src/sim/game";
import { roomNodes } from "../../src/content/tavern";
const key = "hearth-hollow-v1";
test("tavern progression, market, recipes, skills and expanded architecture work on desktop and mobile", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.getByRole("button", { name: "Hospitality", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "A home for hungry travelers" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Build Timber dining wing" }).click();
  await expect(page.locator(".world")).toHaveAttribute(
    "data-tavern-size",
    "hall",
  );
  await page.keyboard.press("Escape");
  await page.screenshot({ path: "docs/screenshots/hospitality-hall.png" });
  await expect(
    page.getByRole("button", { name: "Hospitality", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("5");
  await page.getByRole("button", { name: "Build Hearth kitchen" }).click();
  await page.getByRole("button", { name: "Build Brewer’s bar" }).click();
  await expect(page.locator(".world")).toHaveAttribute(
    "data-tavern-size",
    "bar",
  );
  await page.getByRole("button", { name: "Skill tree", exact: true }).click();
  await page.getByRole("button", { name: "Learn Careful shelving" }).click();
  await page.getByRole("button", { name: "Learn Warm welcome" }).click();
  await page.getByRole("button", { name: "Marketplace", exact: true }).click();
  for (const name of ["Milled flour", "Spring water", "Barley", "Garden herbs"])
    await page.getByRole("button", { name: `Buy 5 ${name}` }).click();
  await page
    .getByRole("button", { name: "Kitchen & cellar", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Cook Hearth bread", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Brew Amber hearth ale", exact: true })
    .click();
  await expect(
    page.getByText("3 ready · sells for 7 crowns each", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Cellar watch · 1/2 vessels" }),
  ).toBeVisible();
  await page.screenshot({ path: "docs/screenshots/hospitality-kitchen.png" });
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Hospitality", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("5");
  await page
    .getByRole("button", { name: "Kitchen & cellar", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Cellar watch · 1/2 vessels" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Brewer’s bar and cellar" }),
  ).toBeVisible();
  for (const id of ["hall", "bar"]) {
    expect(
      await page.evaluate(async (id) => {
        const i = new Image();
        i.src = `/art/optimized/tavern-${id}.webp`;
        await i.decode();
        return [i.naturalWidth, i.naturalHeight];
      }, id),
    ).toEqual([1536, 1024]);
  }
  await page.screenshot({ path: "docs/screenshots/hospitality-expanded.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Hospitality", exact: true }).click();
  await page.getByRole("button", { name: "Marketplace", exact: true }).click();
  await page
    .getByRole("button", { name: "Buy 5 Hedgerow berries" })
    .scrollIntoViewIfNeeded();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "docs/screenshots/hospitality-mobile.png" });
  expect(errors).toEqual([]);
});
test("automatic dusk/dawn and overnight brewing persist; meal guests pay at their table", async ({
  page,
}) => {
  let g = createGame();
  for (const id of ["hall", "kitchen", "bar"])
    g = applyCommand(g, { type: "upgrade-tavern", id });
  g.hospitality.bell = 23;
  g.hospitality.pantry = { grain: 3, water: 2, herbs: 1, stew: 2 };
  g = applyCommand(g, { type: "craft-recipe", id: "ale" });
  g = applyCommand(g, { type: "auto-shop", enabled: true });
  const install = async (g: Game) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Chronicle", exact: true }).click();
    await page.locator("input[type=file]").setInputFiles({
      name: "tavern-test.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(g)),
    });
    await expect(
      page.getByText("Ledger restored. Welcome home."),
    ).toBeVisible();
    await page.keyboard.press("Escape");
  };
  await install(g);
  await expect(page.locator(".world")).toHaveAttribute(
    "data-time-phase",
    "Night",
    { timeout: 6500 },
  );
  await expect(
    page.getByRole("button", { name: /Open the shop/ }),
  ).toBeVisible();
  for (let i = 0; i < 13; i++) g = applyCommand(g, { type: "tick" });
  await install(g);
  await page.screenshot({ path: "docs/screenshots/hospitality-night.png" });
  g.hospitality.bell = 47;
  g.hospitality.batches[0].readyAt = 48;
  g.open = false;
  await install(g);
  await expect(
    page.getByRole("button", { name: /Close the shop/ }),
  ).toBeVisible({ timeout: 6500 });
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Hospitality", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("5");
  await page
    .getByRole("button", { name: "Kitchen & cellar", exact: true })
    .click();
  await expect(
    page.getByText("4 ready · sells for 12 crowns each", { exact: true }),
  ).toBeVisible();
  g.room.nextId = 2;
  g.room.spawnIn = 100;
  g.open = true;
  g.room.customers = [
    {
      id: 1,
      kind: 0,
      setId: Object.keys(g.products)[0],
      purpose: "meal",
      itemId: "stew",
      phase: "checkout",
      wait: 3,
      purchased: false,
      saleAmount: 0,
      node: "dining",
      ...roomNodes.dining,
      route: [],
    },
  ];
  await install(g);
  await expect
    .poll(() =>
      page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key)!).hospitality.mealsSold,
        key,
      ),
    )
    .toBe(1);
  await expect(page.getByText("+14 crowns", { exact: true })).toBeVisible();
});

test("parchment workshop supports equipment, recipe shopping, filters and artisan missions", async ({
  page,
}) => {
  let g = createGame();
  g.gold = 5000;
  for (const id of ["hall", "kitchen", "bar"])
    g = applyCommand(g, { type: "upgrade-tavern", id });
  await page.addInitScript(
    ({ g, key }) => localStorage.setItem(key, JSON.stringify(g)),
    { g, key },
  );
  await page.goto("/");
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.getByRole("button", { name: "Hospitality", exact: true }).click();
  for (const name of [
    "Oak pantry cabinets",
    "Stone baking oven",
    "Cooper’s cellar racks",
  ])
    await page.getByRole("button", { name: `Build ${name}` }).click();
  await page
    .getByRole("button", { name: "Kitchen & cellar", exact: true })
    .click();
  await page.getByLabel("Find a recipe").fill("honey hearth");
  const recipe = page.locator(".recipe-list .recipe");
  await expect(recipe).toHaveCount(1);
  await expect(recipe).toContainText("Missing:");
  await recipe.getByRole("button", { name: "Buy missing supplies" }).click();
  await expect(
    recipe.getByRole("button", { name: "Cook Honey hearth tarts" }),
  ).toBeEnabled();
  await recipe.getByRole("button", { name: "Cook Honey hearth tarts" }).click();
  await expect(recipe).toContainText("4 ready");
  await expect(recipe).toContainText("17 crowns each");
  await page.getByLabel("Find a recipe").fill("no such dish");
  await expect(page.locator(".recipe-empty")).toBeVisible();
  await page.getByLabel("Find a recipe").fill("");
  await page.getByLabel("Recipe filter").selectOption("drink");
  await expect(page.locator(".recipe-list .recipe")).toHaveCount(5);
  const materials = await page.evaluate(async () =>
    Promise.all(
      ["parchment", "wood"].map(
        (id) =>
          new Promise<boolean>((resolve) => {
            const i = new Image();
            i.onload = () => resolve(i.naturalWidth === 512);
            i.onerror = () => resolve(false);
            i.src = `/art/optimized/materials/${id}.webp`;
          }),
      ),
    ),
  );
  expect(materials).toEqual([true, true]);
  await page.screenshot({
    path: "docs/screenshots/parchment-workshop-desktop.png",
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByLabel("Find a recipe").fill("berry cordial");
  await recipe.scrollIntoViewIfNeeded();
  expect(
    await page
      .locator(".game-panel")
      .evaluate((e) => e.scrollWidth <= e.clientWidth + 1),
  ).toBe(true);
  await page.screenshot({
    path: "docs/screenshots/parchment-workshop-mobile.png",
    animations: "disabled",
  });
  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    key,
  );
  expect(saved.hospitality.upgrades).toContain("oven");
  expect(saved.hospitality.pantry["honey-tart"]).toBe(4);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Chronicle", exact: true }).click();
  const artisan = page.getByRole("article", { name: "craft mission branch" });
  await artisan
    .getByRole("button", { name: /The well-used recipe book/ })
    .click();
  await expect(artisan.getByLabel("craft mission progress")).toHaveAttribute(
    "value",
    "0",
  );
});

// Explicitly accept the player-facing confirmation in import fixtures.
test.beforeEach(async ({ page }) => {
  page.on("dialog", (dialog) => dialog.accept());
});
