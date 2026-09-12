import { test, expect, type Page } from "@playwright/test";

async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
}

test("development overview, roadmap and changes leave the local ledger untouched", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 400)
      errors.push(`${response.status()} ${response.url()}`);
  });
  await page.addInitScript(() =>
    localStorage.setItem("hearth-hollow-v1", "preserve-this-existing-ledger"),
  );
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("updates/");
  await expect(
    page.getByRole("heading", { name: /A little tavern/ }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator(".dev-hero img")
        .evaluate(
          (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
        ),
    )
    .toBe(true);
  await noOverflow(page);
  await page.screenshot({
    path: "docs/screenshots/development-overview-desktop.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: /Explore the roadmap/ }).click();
  await expect(
    page.getByRole("heading", { name: "The development roadmap" }),
  ).toBeVisible();
  await page.getByLabel("Status", { exact: true }).selectOption("completed");
  await expect(
    page.locator('.dev-checkpoint:not([data-status="completed"])'),
  ).toHaveCount(0);
  await expect(page.locator("#local-saves .dev-check")).toHaveText("✓");
  await page.getByLabel("Search roadmap").fill("local ledger");
  await expect(page.locator(".dev-checkpoint")).toHaveCount(1);
  await page.reload();
  await expect(page.getByLabel("Status", { exact: true })).toHaveValue(
    "completed",
  );
  await expect(page.locator(".dev-checkpoint")).toHaveCount(1);
  await page.getByLabel("Search roadmap").fill("unfindable-checkpoint");
  await expect(
    page.getByRole("heading", { name: "No matching checkpoints" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reset filters" }).click();
  await page.getByLabel("Status", { exact: true }).selectOption("pending");
  await expect(
    page.locator('.dev-checkpoint:not([data-status="pending"])'),
  ).toHaveCount(0);
  await page
    .getByRole("navigation", { name: "Development navigation" })
    .getByRole("link", { name: "Change ledger" })
    .click();
  await page.getByLabel("Search changes").fill("save");
  await expect(page.locator(".dev-changes > li").first()).toBeVisible();
  await page.locator(".dev-changes summary").first().click();
  await expect(
    page.getByRole("link", { name: /View exact commit/ }).first(),
  ).toHaveAttribute(
    "href",
    /^https:\/\/github.com\/ErikBurdett\/theandril-hearth-and-card\/commit\/[0-9a-f]{40}$/,
  );
  await page.getByLabel("Search changes").fill("no-such-change-123");
  await expect(
    page.getByRole("heading", { name: "No matching changes" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("hearth-hollow-v1")),
  ).toBe("preserve-this-existing-ledger");
  expect(errors).toEqual([]);
});

test("roadmap supports direct links, keyboard, narrow screens and enlarged text", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("updates/roadmap/#duel-tutorials");
  await expect(page.locator("#duel-tutorials")).toBeInViewport();
  await page.locator("#duel-tutorials summary").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#duel-tutorials details")).toHaveAttribute(
    "open",
    "",
  );
  await noOverflow(page);
  await page
    .getByRole("heading", { name: "The development roadmap" })
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: "docs/screenshots/development-roadmap-mobile.png",
  });
  await page.setViewportSize({ width: 360, height: 740 });
  await page.addStyleTag({ content: "html { font-size: 200%; }" });
  await noOverflow(page);
  await page.getByRole("button", { name: "Reset filters" }).click();
  await page.getByLabel("Status", { exact: true }).selectOption("in-progress");
  await expect(
    page.locator('.dev-checkpoint:not([data-status="in-progress"])'),
  ).toHaveCount(0);
  await page.reload();
  await expect(page.getByLabel("Status", { exact: true })).toHaveValue(
    "in-progress",
  );
  await noOverflow(page);
});

test("the game ledger exposes the development helper at the deployment base", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Chronicle", exact: true }).click();
  await page
    .getByRole("link", { name: "Development journal & roadmap" })
    .click();
  await expect(
    page.getByRole("heading", { name: /A little tavern/ }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Play the demo" }).click();
  await expect(
    page.getByRole("button", { name: "Card collection", exact: true }),
  ).toBeVisible();
});
