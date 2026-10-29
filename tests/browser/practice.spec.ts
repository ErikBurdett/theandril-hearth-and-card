import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { createGame, SAVE_KEY } from "../../src/sim/game";
import { screenshotPath } from "./screenshots";

for (const width of [1366, 390]) {
  test(`practice teaches mana, responses and blocking with saved progress at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 768 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const original = createGame();
    await page.addInitScript(
      ({ key, game }) => {
        if (!localStorage.getItem(key))
          localStorage.setItem(key, JSON.stringify(game));
      },
      { key: SAVE_KEY, game: original },
    );
    await page.goto("/");
    const openTable = () =>
      page.getByRole("button", { name: "Duel table", exact: true }).click();
    await openTable();
    await page
      .getByRole("button", { name: "Pay for a companion", exact: true })
      .click();
    const practice = page.getByRole("region", {
      name: "Practice table",
      exact: true,
    });
    const guidance = practice.getByRole("region", { name: "Lesson guidance" });
    await expect(guidance.getByRole("heading")).toBeFocused();
    await practice
      .getByRole("button", { name: "Cast Pool-court Listener", exact: true })
      .click();
    await expect(page.locator(".toast")).toContainText(/mana/i);
    await expect(guidance).toContainText("Step 1 of 3");
    await page
      .getByRole("button", { name: "Dismiss notification", exact: true })
      .click();
    await practice
      .getByRole("button", { name: "Play Cold Ford Dawnfield", exact: true })
      .click();
    await practice
      .getByRole("button", { name: "Try a second resource", exact: true })
      .click();
    await expect(page.locator(".toast")).toContainText(/already played/i);
    await page
      .getByRole("button", { name: "Dismiss notification", exact: true })
      .click();
    await practice
      .getByRole("button", { name: "Cast Pool-court Listener", exact: true })
      .click();
    await page.reload();
    await openTable();
    await expect(guidance).toContainText("Step 3 of 3");
    await practice
      .getByRole("button", { name: "Resolve your companion", exact: true })
      .click();
    await expect(guidance).toContainText("Lesson complete");
    await expect(guidance).toContainText("two resources paid");
    await practice
      .getByRole("button", { name: "Return to guest selection", exact: true })
      .click();
    await expect(
      page.getByRole("button", {
        name: "Pay for a companion · Completed",
        exact: true,
      }),
    ).toBeVisible();

    await page
      .getByRole("button", { name: "Answer a spell", exact: true })
      .click();
    await practice
      .getByRole("button", {
        name: "Let the incoming spell resolve",
        exact: true,
      })
      .click();
    await expect(guidance).toContainText("Try this position again");
    await practice
      .getByRole("button", { name: "Replay lesson", exact: true })
      .click();
    await practice
      .getByRole("button", { name: "Counter the incoming spell", exact: true })
      .click();
    await expect(
      practice.getByRole("region", { name: "Practice stack" }).locator("li"),
    ).toHaveCount(2);
    await expect(guidance.getByRole("heading")).toBeFocused();
    expect(
      await page
        .locator(".game-panel")
        .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
    ).toBe(true);
    expect(
      (await practice
        .getByRole("button", { name: "Resolve your counterspell", exact: true })
        .boundingBox())!.height,
    ).toBeGreaterThanOrEqual(43.9);
    await page.screenshot({
      path: screenshotPath(`practice-response-${width}.png`),
      animations: "disabled",
    });
    await practice
      .getByRole("button", { name: "Resolve your counterspell", exact: true })
      .click();
    await expect(guidance).toContainText("Lesson complete");
    await practice
      .getByRole("button", { name: "Return to guest selection", exact: true })
      .click();

    await page
      .getByRole("button", { name: "Protect your hearth", exact: true })
      .click();
    await practice
      .getByRole("button", { name: "Take the attack unblocked", exact: true })
      .click();
    await expect(guidance).toContainText("Try this position again");
    await practice
      .getByRole("button", { name: "Replay lesson", exact: true })
      .click();
    const read = practice
      .getByRole("region", { name: "Your practice board" })
      .getByRole("button", { name: "Read Pool-court Listener", exact: true });
    await read.click();
    await page.keyboard.press("Escape");
    await expect(read).toBeFocused();
    await practice
      .getByRole("button", {
        name: "Block with Pool-court Listener",
        exact: true,
      })
      .click();
    await page.getByRole("button", { name: "Chronicle", exact: true }).click();
    const downloading = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Export ledger", exact: true })
      .click();
    const backup = await readFile((await (await downloading).path())!, "utf8");
    expect(JSON.parse(backup).practice.active.battle.combat[0].blocker).toBe(
      10,
    );
    page.once("dialog", (dialog) => dialog.accept());
    await page.locator("input[type=file]").setInputFiles({
      name: "practice.json",
      mimeType: "application/json",
      buffer: Buffer.from(backup),
    });
    await expect(page.locator(".toast")).toContainText("Ledger restored");
    await page.reload();
    await openTable();
    await expect(guidance).toContainText("Step 2 of 2");
    await practice
      .getByRole("button", { name: "Deal combat damage", exact: true })
      .click();
    await expect(guidance).toContainText("Lesson complete");
    await expect(practice.locator(".practice-score")).toContainText(
      "Your hearth: 2",
    );
    await expect(guidance.getByRole("heading")).toBeFocused();
    await page.screenshot({
      path: screenshotPath(`practice-blocking-${width}.png`),
      animations: "disabled",
    });
    const board = practice.getByRole("region", { name: "Your practice board" });
    await board.scrollIntoViewIfNeeded();
    await expect(board).toContainText("2/3 · 2 damage");
    await expect
      .poll(() =>
        board
          .locator(".full-card-art")
          .evaluate(
            (el) =>
              (el as HTMLImageElement).complete &&
              (el as HTMLImageElement).naturalWidth > 0,
          ),
      )
      .toBe(true);
    expect(await board.locator(".practice-card img").count()).toBe(1);
    await page.screenshot({
      path: screenshotPath(`practice-board-${width}.png`),
      animations: "disabled",
    });
    await practice
      .getByRole("button", { name: "Return to guest selection", exact: true })
      .click();
    const saved = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!),
      SAVE_KEY,
    );
    expect(saved.practice.completed).toEqual(["mana", "responses", "blocking"]);
    for (const key of [
      "collection",
      "gold",
      "rng",
      "wins",
      "rivals",
      "progression",
      "deck",
      "products",
    ] as const)
      expect(saved[key]).toEqual(original[key]);
    await page
      .getByRole("button", { name: "Sit down & shuffle", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "End turn", exact: true }),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });
}
