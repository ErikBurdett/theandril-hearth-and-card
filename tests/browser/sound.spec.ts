import { test, expect } from "@playwright/test";

test("tavern sounds are a device preference that never touches the save", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Duel table", exact: true }).click();
  await page.getByLabel("Borrowed recipe").selectOption("binding");
  await page
    .getByRole("button", { name: "Practice with borrowed cards" })
    .click();
  await page.getByText("Table options").click();
  const key = await page.evaluate(() =>
    Object.keys(localStorage).find((k) =>
      localStorage.getItem(k)?.includes('"battle"'),
    ),
  );
  const before = await page.evaluate((k) => localStorage.getItem(k!), key);
  const toggle = page.getByRole("button", { name: /Tavern sounds/ }).first();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await page.getByLabel("Room sound volume").first().fill("0.8");
  await expect
    .poll(() =>
      page.evaluate(() =>
        JSON.parse(localStorage.getItem("hearth-card.sound")!),
      ),
    )
    .toEqual({ enabled: true, cards: 0.5, hearth: 0.4, room: 0.8 });
  // Playing a turn with sounds on changes nothing about how the duel resolves.
  await page.getByRole("button", { name: "End turn", exact: true }).click();
  await expect(page.locator(".battle-log")).toContainText("turn");
  expect(await page.evaluate((k) => localStorage.getItem(k!), key)).not.toBe(
    before,
  );
  await page.reload();
  await page.getByRole("button", { name: "Duel table", exact: true }).click();
  await page.getByText("Table options").click();
  await expect(
    page.getByRole("button", { name: "Tavern sounds: On" }).first(),
  ).toBeVisible();
});
