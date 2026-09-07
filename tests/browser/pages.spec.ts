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
  expect(
    await art.evaluate(
      (i: HTMLImageElement) => i.complete && i.naturalWidth === 256,
    ),
  ).toBe(true);
  await expect(art).toHaveAttribute(
    "src",
    /^\/theandril-hearth-and-card\/art\/optimized\//,
  );
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
  expect(failures).toEqual([]);
});
