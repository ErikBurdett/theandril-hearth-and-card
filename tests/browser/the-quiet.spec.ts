import { test, expect } from "@playwright/test";
import { quietSet } from "../../src/content/the-quiet";
import { cards, sets } from "../../src/content/catalog";
import { SAVE_KEY } from "../../src/sim/game";
import oldSave from "../../src/sim/fixtures/pre-living-cultures-save.json" with { type: "json" };

test("The Quiet reads as a Book chapter VII volume with its cover painting and authored scene", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page
    .getByRole("button", { name: "Card collection", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Set histories", exact: true })
    .click();
  await expect(page.locator(".set-spines button")).toHaveCount(sets.length);
  await page
    .locator(".set-spines button")
    .filter({ hasText: quietSet.name })
    .click();
  const record = page.locator(".set-record");
  await expect(record).toContainText("RR 2311–2313");
  await expect(record).toContainText("what can a neighbor still promise");
  await expect(record).toContainText("not a cause");
  await record.locator(".text-link").click();
  const reader = page.getByRole("dialog", { name: /^Inspect / });
  await expect(reader).toContainText("VII. The Failing and the Ashfall");
  await expect(reader).toContainText("The Keeper Who Stayed");
  await expect(reader).toContainText("witnessing her neighbors' bargains");
  const art = reader.locator("img.full-card-art");
  await expect(art).toHaveAttribute("src", /the-quiet\.22\.webp$/);
  await expect
    .poll(() =>
      art.evaluate(
        (image: HTMLImageElement) =>
          image.complete && image.naturalWidth === 256,
      ),
    )
    .toBe(true);
  await page.screenshot({ path: "docs/screenshots/the-quiet-reader.png" });
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 390, height: 844 });
  await record.scrollIntoViewIfNeeded();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "docs/screenshots/the-quiet-mobile.png" });
  expect(errors).toEqual([]);
});

test("the binder shows all 80 Quiet cards with loaded individual paintings", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Card collection", exact: true })
    .click();
  await page.getByLabel("Filter expansion").selectOption("the-quiet");
  // A new ledger owns none of the set; show the whole catalog page.
  await page.getByLabel("Owned only").uncheck();
  await expect(page.getByText(/^80 cards · page 1 of 1/)).toBeVisible();
  const faces = page.locator(".card-grid .full-art-card");
  await expect(faces).toHaveCount(80);
  const images = page.locator(".card-grid .full-art-card img");
  await expect(images).toHaveCount(80);
  const sources = await images.evaluateAll((list) =>
    list.map((image) => (image as HTMLImageElement).getAttribute("src")),
  );
  expect(new Set(sources).size).toBe(80);
  expect(
    sources.every((src) =>
      /\/art\/optimized\/cards\/the-quiet\.\d+\.webp$/.test(src!),
    ),
  ).toBe(true);
  for (const index of [0, 39, 79]) {
    const image = images.nth(index);
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        image.evaluate(
          (element: HTMLImageElement) =>
            element.complete && element.naturalWidth === 256,
        ),
      )
      .toBe(true);
  }
  await faces.first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: "docs/screenshots/the-quiet-binder.png" });
  expect(cards.filter((c) => c.setId === "the-quiet")).toHaveLength(80);
});

test("an older ledger gains an empty Quiet shelf, orders a pack and keeps its cards on a phone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(
    ({ key, save }) => {
      if (!localStorage.getItem(key))
        localStorage.setItem(key, JSON.stringify(save));
    },
    { key: SAVE_KEY, save: oldSave },
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Stockroom", exact: true }).click();
  await page.getByLabel("Restock quantity").selectOption("1");
  const product = page.locator(".product").filter({
    has: page.getByRole("heading", { name: quietSet.name, exact: true }),
  });
  await expect(product).toContainText("0 in stock");
  await product.getByRole("button", { name: "Order 1 · 32 crowns" }).click();
  await expect(product).toContainText("1 incoming");
  await page.getByRole("button", { name: "Open shop", exact: true }).click();
  await expect(product).toContainText("1 in stock", { timeout: 16000 });
  await page.getByRole("button", { name: "Close shop", exact: true }).click();
  await page
    .getByRole("button", { name: "Booster packs", exact: true })
    .click();
  await page
    .locator(".pack-set-row > button:first-child")
    .filter({ hasText: quietSet.name })
    .click();
  await page.getByRole("button", { name: "Break the seal" }).click();
  await page.getByRole("button", { name: /Reveal all/ }).click();
  await expect(page.locator(".reveal-grid .full-art-card")).toHaveCount(14);
  await page.screenshot({
    path: "docs/screenshots/the-quiet-pack-mobile.png",
    animations: "disabled",
  });
  await page.reload();
  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    SAVE_KEY,
  );
  expect(saved.products["the-quiet"].stock).toBe(0);
  expect(
    saved.lastPack.every((id: string) => id.startsWith("the-quiet.")),
  ).toBe(true);
  for (const id of saved.lastPack)
    expect(saved.collection[id]).toBeGreaterThan(0);
});
