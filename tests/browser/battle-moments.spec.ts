import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { applyCommand, createGame, SAVE_KEY } from "../../src/sim/game";
import { cards } from "../../src/content/catalog";
import { screenshotPath } from "./screenshots";

for (const width of [1366, 390]) {
  test(`public duel moments survive rematch and backup at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 768 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const game = applyCommand(createGame(), {
      type: "duel",
      opponent: "potter",
    });
    const b = game.battle!;
    const c = cards.find(
      (card) =>
        card.type === "Creature" &&
        card.attack >= 2 &&
        card.trigger === "none" &&
        !card.keywords.length,
    )!;
    b.timed = false;
    b.enemy.hp = c.attack - 1;
    b.enemy.shield = 1;
    b.player.board = [
      {
        uid: 90,
        cardId: c.id,
        entered: 0,
        tapped: true,
        damage: 0,
        counters: 0,
        boost: 0,
        loyalty: 0,
        used: 0,
      },
    ];
    b.nextId = 91;
    b.phase = "block";
    b.combat = [{ uid: 90, hero: null, blocker: null, blocked: false }];
    await page.addInitScript(
      ({ key, game }) => {
        if (!localStorage.getItem(key))
          localStorage.setItem(key, JSON.stringify(game));
      },
      { key: SAVE_KEY, game },
    );
    await page.goto("/");
    await page.getByRole("button", { name: "Duel table", exact: true }).click();
    await page
      .getByRole("button", { name: "Deal combat damage", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Dismiss notification", exact: true })
      .click();
    const record = page.getByRole("region", {
      name: "Table history with Jory Claythumb",
    });
    const moments = record.locator(".battle-moments");
    await moments.locator("summary").click();
    await expect(moments).toContainText("Your attack · simultaneous combat");
    await expect(moments).toContainText(
      `Opposing hearth: ${c.attack - 1} → 0 health.`,
    );
    await expect(moments).toContainText("Opposing shield: 1 → 0.");
    await moments
      .getByText("Your victory ended the duel.", { exact: true })
      .scrollIntoViewIfNeeded();
    await expect(
      moments.getByText("Your victory ended the duel.", { exact: true }),
    ).toBeInViewport();
    await page
      .getByRole("button", { name: "Choose a rematch", exact: true })
      .click();
    await expect(page.getByLabel("Opponent strategy")).toHaveValue("potter");
    await moments.locator("summary").click();
    await moments.scrollIntoViewIfNeeded();
    expect(
      (await moments.locator("summary").boundingBox())!.height,
    ).toBeGreaterThanOrEqual(44);
    expect(
      await page
        .locator(".game-panel")
        .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
    ).toBe(true);
    await page.screenshot({
      path: screenshotPath(`battle-moments-${width}.png`),
      animations: "disabled",
    });
    await page.getByRole("button", { name: "Chronicle", exact: true }).click();
    const downloading = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Export ledger", exact: true })
      .click();
    const backup = await readFile((await (await downloading).path())!, "utf8");
    expect(JSON.parse(backup).rivals.potter.last.moments[0].facts).toContain(
      "Your victory ended the duel.",
    );
    page.once("dialog", (dialog) => dialog.accept());
    await page.locator("input[type=file]").setInputFiles({
      name: "moments.json",
      mimeType: "application/json",
      buffer: Buffer.from(backup),
    });
    await expect(page.locator(".toast")).toContainText("Ledger restored");
    await page.reload();
    await page.getByRole("button", { name: "Duel table", exact: true }).click();
    await page.getByLabel("Opponent strategy").selectOption("potter");
    await moments.locator("summary").click();
    await expect(moments).toContainText("Your victory ended the duel.");
    await expect(record).toContainText("Wins 1 · Losses 0");
    expect(errors).toEqual([]);
  });
}
