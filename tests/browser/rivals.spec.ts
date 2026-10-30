import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { applyCommand, createGame, SAVE_KEY } from "../../src/sim/game";
import { presetDeck, missingDeckCopies } from "../../src/sim/battle";
import { cardById } from "../../src/content/catalog";
import { docScreenshot, reviewCases } from "./screenshots";

for (const width of reviewCases([1366, 390], [390])) {
  test(`rival history, recipe shortfalls and rematches survive reload at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 768 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    let game = createGame();
    const missing = presetDeck("kiln").find((id) => !game.deck.includes(id))!;
    game.collection[missing] = 0;
    const missingCount = missingDeckCopies(game.collection, "kiln");
    game = applyCommand(game, { type: "duel", opponent: "potter" });
    game.battle!.timed = false;
    game.battle!.enemy.hp = 0;
    await page.addInitScript(
      ({ key, game }) => {
        if (!localStorage.getItem(key))
          localStorage.setItem(key, JSON.stringify(game));
      },
      { key: SAVE_KEY, game },
    );
    await page.goto("/");
    await page.getByRole("button", { name: "Duel table", exact: true }).click();
    await page.getByRole("button", { name: "End turn", exact: true }).click();
    const record = page.getByRole("region", {
      name: "Table history with Jory Claythumb",
    });
    await expect(record).toContainText(
      "Wins 1 · Losses 0 · Draws 0 · Conceded 0",
    );
    await expect(record).toContainText(
      "Duel reward: 35 crowns · 5 renown · 60 keeper XP",
    );
    await expect(record).toContainText(
      "Learned The Kiln Wakes at this meeting",
    );
    const recap = page.locator(".duel-recap");
    await recap.scrollIntoViewIfNeeded();
    const notice = page.locator(".toast");
    await expect(notice).toBeVisible();
    expect((await notice.boundingBox())!.height).toBeLessThan(160);
    await expect(
      recap.getByRole("button", { name: "Choose a rematch" }),
    ).toBeInViewport();
    await docScreenshot(page, `rival-result-${width}.png`, {
      animations: "disabled",
    });
    await page.reload();
    await page.getByRole("button", { name: "Duel table", exact: true }).click();
    await expect(record).toContainText("Wins 1 · Losses 0");
    await page
      .getByRole("button", { name: "Choose a rematch", exact: true })
      .click();
    await expect(page.getByLabel("Opponent strategy")).toHaveValue("potter");
    await expect(record).toContainText(`${missingCount} missing copies`);
    await expect(
      record.getByRole("button", { name: "Prepare The Kiln Wakes" }),
    ).toBeDisabled();
    await record
      .getByText(`View missing cards (${missingCount} copies)`)
      .click();
    await expect(
      record.locator("li").filter({ hasText: cardById[missing].name }),
    ).toBeVisible();
    await record.evaluate((el) => el.scrollIntoView({ block: "start" }));
    expect(
      await page
        .locator(".game-panel")
        .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
    ).toBe(true);
    await docScreenshot(page, `rival-guestbook-${width}.png`, {
      animations: "disabled",
    });

    await page
      .getByRole("button", { name: "Sit down & shuffle", exact: true })
      .click();
    await page.getByText("Table options", { exact: true }).click();
    await page
      .getByRole("button", { name: "Concede duel", exact: true })
      .click();
    await expect(record).toContainText(
      "Wins 1 · Losses 0 · Draws 0 · Conceded 1",
    );
    await expect(record).toContainText("No duel reward for conceding");
    await expect(record).not.toContainText("at this meeting");
    await page.getByLabel("Opponent strategy").selectOption("smith");
    await expect(
      page.getByRole("region", { name: "Table history with Bera Kilnhand" }),
    ).toContainText("No meetings recorded");

    await page.getByRole("button", { name: "Chronicle", exact: true }).click();
    const downloadReady = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Export ledger", exact: true })
      .click();
    const download = await downloadReady;
    const backup = await readFile((await download.path())!, "utf8");
    expect(JSON.parse(backup).rivals.potter.concessions).toBe(1);
    page.once("dialog", (dialog) => dialog.accept());
    await page.locator("input[type=file]").setInputFiles({
      name: "guestbook.json",
      mimeType: "application/json",
      buffer: Buffer.from(backup),
    });
    await expect(page.locator(".toast")).toContainText("Ledger restored");
    await page.reload();
    await page.getByRole("button", { name: "Duel table", exact: true }).click();
    await page.getByLabel("Opponent strategy").selectOption("potter");
    await expect(record).toContainText(
      "Wins 1 · Losses 0 · Draws 0 · Conceded 1",
    );
    // An imported collection with the exact required copies can prepare the
    // earned recipe through the new control; preparing grants no extra cards.
    const collected = JSON.parse(backup);
    for (const id of presetDeck("kiln"))
      collected.collection[id] = Math.max(
        collected.collection[id] ?? 0,
        presetDeck("kiln").filter((card) => card === id).length,
      );
    await page.getByRole("button", { name: "Chronicle", exact: true }).click();
    page.once("dialog", (dialog) => dialog.accept());
    await page.locator("input[type=file]").setInputFiles({
      name: "collected-guestbook.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(collected)),
    });
    await expect(page.locator(".toast")).toContainText("Ledger restored");
    await page.getByRole("button", { name: "Duel table", exact: true }).click();
    await page.getByLabel("Opponent strategy").selectOption("potter");
    await expect(record).toContainText("You own every required copy");
    await record
      .getByRole("button", { name: "Prepare The Kiln Wakes" })
      .click();
    const prepared = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!),
      SAVE_KEY,
    );
    expect(prepared.deck).toEqual(presetDeck("kiln"));
    expect(prepared.collection).toEqual(collected.collection);
    expect(prepared.gold).toBe(collected.gold);
    expect(prepared.rivals).toEqual(collected.rivals);
    expect(errors).toEqual([]);
  });
}
