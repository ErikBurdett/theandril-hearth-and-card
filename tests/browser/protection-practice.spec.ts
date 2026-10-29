import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { createGame, SAVE_KEY } from "../../src/sim/game";
import { screenshotPath } from "./screenshots";

for (const width of [1366, 390]) {
  test(`protection practice teaches target choice, survival and cleanup at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 768 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const original = createGame();
    original.practice.completed = ["mana", "responses", "blocking"];
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
    await expect(
      page.getByRole("button", {
        name: "Protect your hearth · Completed",
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Save a companion", exact: true })
      .click();
    const practice = page.getByRole("region", {
      name: "Practice table",
      exact: true,
    });
    const guidance = practice.getByRole("region", { name: "Lesson guidance" });
    const stack = practice.getByRole("region", { name: "Practice stack" });
    const listener = practice.getByRole("article", {
      name: "Pool-court Listener",
      exact: true,
    });
    const other = practice.getByRole("article", {
      name: "Outlying Gatekeeper",
      exact: true,
    });
    const action = (name: string) =>
      practice.getByRole("button", { name, exact: true }).click();
    await expect(stack).toContainText("targets Pool-court Listener");
    await action("Let the damage spell resolve");
    await expect(guidance).toContainText("Try this position again");
    await action("Replay lesson");
    await action("Strengthen Outlying Gatekeeper");
    await expect(stack.locator("li").first()).toContainText(
      "targets Outlying Gatekeeper",
    );
    await action("Resolve your protection spell");
    await expect(guidance).toContainText("left the Listener in danger");
    await expect(other).toContainText("5/6 · 0 damage · +3/+3 this turn");
    await action("Resolve the incoming damage");
    await expect(guidance).toContainText("Try this position again");
    await expect(listener).toHaveCount(0);
    await action("Replay lesson");
    await action("Strengthen Pool-court Listener");
    await page.reload();
    await openTable();
    await expect(guidance).toContainText("Step 2 of 4");
    await expect(stack.locator("li")).toHaveCount(2);
    await expect(stack).not.toContainText("targets your hearth");
    await expect(listener).toContainText("2/3 · 0 damage · Incoming damage");
    await action("Resolve your protection spell");
    await expect(listener).toContainText(
      "5/6 · 0 damage · +3/+3 this turn · Incoming damage",
    );
    await expect(other).toContainText("2/3 · 0 damage");

    await page.getByRole("button", { name: "Chronicle", exact: true }).click();
    const downloading = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Export ledger", exact: true })
      .click();
    const backup = await readFile((await (await downloading).path())!, "utf8");
    const saved = JSON.parse(backup);
    expect(
      saved.practice.active.battle.player.board.find(
        (p: { uid: number }) => p.uid === 10,
      ).boost,
    ).toBe(3);
    expect(saved.practice.completed).toEqual(original.practice.completed);
    page.once("dialog", (dialog) => dialog.accept());
    await page.locator("input[type=file]").setInputFiles({
      name: "protection.json",
      mimeType: "application/json",
      buffer: Buffer.from(backup),
    });
    await expect(page.locator(".toast")).toContainText("Ledger restored");
    await page.reload();
    await openTable();
    await expect(guidance).toContainText("Step 3 of 4");
    await action("Resolve the incoming damage");
    await expect(guidance).toContainText("3 marked damage against 6 toughness");
    await expect(listener).toContainText("5/6 · 3 damage · +3/+3 this turn");
    await expect(listener).not.toContainText("Incoming damage");
    await listener.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        listener
          .locator("img")
          .evaluate(
            (el) =>
              (el as HTMLImageElement).complete &&
              (el as HTMLImageElement).naturalWidth > 0,
          ),
      )
      .toBe(true);
    expect(await listener.locator("img").count()).toBe(1);
    await page.screenshot({
      path: screenshotPath(`practice-protection-board-${width}.png`),
      animations: "disabled",
    });
    const finish = practice.getByRole("button", {
      name: "End turn and clear damage",
      exact: true,
    });
    expect((await finish.boundingBox())!.height).toBeGreaterThanOrEqual(43.9);
    await finish.click();
    await expect(guidance).toContainText("Lesson complete");
    await expect(guidance.getByRole("heading")).toBeFocused();
    await expect(listener).toContainText("2/3 · 0 damage");
    await expect(listener).not.toContainText("this turn");
    expect(
      await page
        .locator(".game-panel")
        .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
    ).toBe(true);
    await page.screenshot({
      path: screenshotPath(`practice-protection-complete-${width}.png`),
      animations: "disabled",
    });
    await action("Return to guest selection");
    await expect(
      page.getByRole("button", {
        name: "Save a companion · Completed",
        exact: true,
      }),
    ).toBeVisible();
    const completed = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!),
      SAVE_KEY,
    );
    expect(completed.practice.completed).toEqual([
      "mana",
      "responses",
      "blocking",
      "protection",
    ]);
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
      expect(completed[key]).toEqual(original[key]);
    expect(errors).toEqual([]);
  });
}
