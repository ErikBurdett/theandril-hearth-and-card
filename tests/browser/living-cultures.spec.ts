import { test, expect } from "@playwright/test";
import { livingSets, livingFactions } from "../../src/content/living-cultures";
import { setCoverId } from "../../src/content/catalog";
import { createGame, SAVE_KEY } from "../../src/sim/game";
import { presetDeck } from "../../src/sim/battle";
import oldSave from "../../src/sim/fixtures/pre-living-cultures-save.json" with { type: "json" };

test("all four folios expose their three cultures, source boundaries and reviewed cover paintings", async ({
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
  await expect(page.locator(".faction-entry")).toHaveCount(24);
  await expect(page.locator(".set-spines button")).toHaveCount(12);
  for (const set of livingSets) {
    await page
      .locator(".set-spines button")
      .filter({ hasText: set.name })
      .click();
    await expect(page.locator(".faction-entry")).toHaveCount(3);
    await expect(page.locator(".set-record")).toContainText("RR 2447");
    await expect(page.locator(".faction-folio")).toContainText(
      "does not establish an alliance",
    );
    for (const faction of livingFactions.filter((f) =>
      f.cards[0].startsWith(set.id + "."),
    ))
      await expect(
        page
          .locator(".faction-entry summary")
          .filter({ hasText: faction.name }),
      ).toBeVisible();
    await page.locator(".set-record .text-link").click();
    const reader = page.getByRole("dialog", { name: /^Inspect / });
    await expect(reader).toContainText("Faction Bible · Part II");
    await expect(reader).toContainText("New Hearth & Card adaptation");
    const art = reader.locator("img.full-card-art");
    await expect(art).toHaveCount(1);
    await expect(art).toHaveAttribute(
      "src",
      new RegExp(`${setCoverId(set).replace(".", "\\.")}\\.webp$`),
    );
    await expect
      .poll(() =>
        art.evaluate(
          (image: HTMLImageElement) =>
            image.complete && image.naturalWidth === 256,
        ),
      )
      .toBe(true);
    await page.keyboard.press("Escape");
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .locator(".set-spines button")
    .filter({ hasText: "The Unclaimed Ways" })
    .click();
  await page
    .locator(".faction-entry summary")
    .filter({ hasText: "Manytrack Moot" })
    .click();
  await page.locator(".faction-folio").scrollIntoViewIfNeeded();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "docs/screenshots/living-cultures-mobile.png",
  });
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.locator(".set-record").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: "docs/screenshots/living-cultures-desktop.png",
  });
  expect(errors).toEqual([]);
});

test("an old ledger can order a new folio, open it and retain its cards on a phone", async ({
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
  await page
    .getByRole("button", { name: "Booster packs", exact: true })
    .click();
  await page
    .locator(".pack-set-row > button:first-child")
    .filter({ hasText: "The Shared Measure" })
    .click();
  await expect(
    page.getByRole("button", { name: "Break the seal" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Stockroom", exact: true }).click();
  await page.getByLabel("Restock quantity").selectOption("1");
  const product = page.locator(".product").filter({
    has: page.getByRole("heading", {
      name: "The Shared Measure",
      exact: true,
    }),
  });
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
    .filter({ hasText: "The Shared Measure" })
    .click();
  await page.locator(".pack-odds summary").click();
  await expect(page.locator(".pack-odds")).toContainText(
    "24 cards in a focused folio",
  );
  await expect(page.locator(".pack-odds")).toContainText("1.4583%");
  await page.getByRole("button", { name: "Break the seal" }).click();
  await page.getByRole("button", { name: /Reveal all/ }).click();
  await expect(page.locator(".reveal-grid .full-art-card")).toHaveCount(14);
  await page.screenshot({
    path: "docs/screenshots/living-cultures-pack-mobile.png",
    animations: "disabled",
  });
  await page.reload();
  await page
    .getByRole("button", { name: "Booster packs", exact: true })
    .click();
  await expect(page.locator(".reveal-grid .full-art-card")).toHaveCount(14);
  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    SAVE_KEY,
  );
  expect(saved.products["shared-measure"].stock).toBe(0);
  expect(
    saved.lastPack.every((id: string) => id.startsWith("shared-measure.")),
  ).toBe(true);
  expect(Object.keys(saved.products)).toHaveLength(12);
});

test("a collected folio recipe prepares through the grimoire and survives a duel reload", async ({
  page,
}) => {
  const game = createGame(62),
    recipe = "provisional-answer";
  for (const id of presetDeck(recipe))
    game.collection[id] = (game.collection[id] ?? 0) + 1;
  await page.addInitScript(
    ({ key, save }) => {
      if (!localStorage.getItem(key))
        localStorage.setItem(key, JSON.stringify(save));
    },
    { key: SAVE_KEY, save: game },
  );
  await page.goto("/");
  await page
    .getByRole("button", { name: "Card collection", exact: true })
    .click();
  await page.getByRole("button", { name: /Build deck/ }).click();
  await page.getByRole("button", { name: /^Leave Room for an Answer/ }).click();
  await page.getByRole("button", { name: "Duel table", exact: true }).click();
  await page
    .getByRole("button", { name: "Sit down & shuffle", exact: true })
    .click();
  await expect(page.locator(".hand-card")).toHaveCount(7);
  await page.screenshot({
    path: "docs/screenshots/living-cultures-battle.png",
    animations: "disabled",
  });
  await page.reload();
  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!),
    SAVE_KEY,
  );
  expect(saved.deck).toEqual(presetDeck(recipe));
  expect(saved.battle).not.toBeNull();
});
