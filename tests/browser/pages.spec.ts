import { test, expect } from "@playwright/test";
test("production project-path deployment loads the tavern, card art and materials", async ({
  page,
}) => {
  const failures: string[] = [];
  page.on("pageerror", (e) => failures.push(e.message));
  page.on("response", (r) => {
    if (r.status() >= 400) failures.push(`${r.status()} ${r.url()}`);
  });
  await page.goto("./");
  expect(failures).toEqual([]);
  await expect(
    page.getByRole("button", { name: "Card collection", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Card collection", exact: true })
    .click();
  const art = page.locator(".card-grid img.full-card-art").first();
  await expect(art).toBeVisible();
  await expect
    .poll(() =>
      art.evaluate(
        (i: HTMLImageElement) => i.complete && i.naturalWidth === 256,
      ),
    )
    .toBe(true);
  await expect(art).toHaveAttribute(
    "src",
    /^\/theandril-hearth-and-card\/art\/optimized\//,
  );
  await page.getByRole("checkbox", { name: "Owned only" }).uncheck();
  for (const setId of [
    "shared-measure",
    "terms-of-shelter",
    "unclaimed-ways",
    "unfinished-answer",
  ]) {
    await page
      .getByRole("combobox", { name: "Filter expansion" })
      .selectOption(setId);
    const paintings = page.locator(".card-grid img.full-card-art");
    await expect(paintings).toHaveCount(24);
    const loaded = await paintings.evaluateAll(async (images) =>
      Promise.all(
        images.map(async (element) => {
          const image = element as HTMLImageElement;
          image.loading = "eager";
          await image.decode();
          return image.naturalWidth === 256 && image.naturalHeight === 384;
        }),
      ),
    );
    expect(loaded.every(Boolean)).toBe(true);
    await expect(paintings.first()).toHaveAttribute(
      "src",
      new RegExp(`/theandril-hearth-and-card/art/optimized/cards/${setId}\\.`),
    );
  }
  for (const file of [
    "materials/parchment.png",
    "materials/wood.png",
    "animation/sprites.png",
    "tavern.png",
  ]) {
    const r = await page.request.get(
      `art/optimized/${file.replace(/\.png$/, ".webp")}`,
    );
    expect(r.ok()).toBe(true);
    expect(r.headers()["content-type"]).toContain("image/webp");
  }
  await page.screenshot({ path: "test-results/pages-project-path.png" });
  await page.getByRole("button", { name: "Return to tavern" }).click();
  await page.getByRole("button", { name: /Open the shop/ }).click();
  await expect(
    page.getByRole("button", { name: "Open local save controls" }),
  ).toContainText("Saved");
  await page.reload();
  await page.getByRole("button", { name: /Tavern notices/ }).click();
  await expect(
    page
      .getByRole("dialog", { name: "Tavern notices" })
      .getByText(/The sign is turned/),
  ).toBeVisible();
  expect(failures).toEqual([]);
});

// Explicitly accept the player-facing confirmation in import fixtures.
test.beforeEach(async ({ page }) => {
  page.on("dialog", (dialog) => dialog.accept());
});
