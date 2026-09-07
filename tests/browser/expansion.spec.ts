import { test, expect, type Page } from "@playwright/test";
import { createGame, applyCommand, type Game } from "../../src/sim/game";
import { type Permanent } from "../../src/sim/battle";
import { customerTypes } from "../../src/content/tavern";
const permanent = (id: string, uid: number): Permanent => ({
  uid,
  cardId: id,
  tapped: false,
  entered: 0,
  damage: 0,
  counters: 0,
  boost: 0,
  loyalty: 4,
  used: 0,
});
async function restore(page: Page, state: Game) {
  await page.getByRole("button", { name: "Chronicle", exact: true }).click();
  await page.locator("input[type=file]").setInputFiles({
    name: "expansion.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(state)),
  });
  await page.getByRole("button", { name: "Duel table", exact: true }).click();
  const dismiss = page.getByRole("button", { name: "Dismiss notification" });
  if (await dismiss.isVisible()) await dismiss.click();
}
test("binding drag, unavailable reasons and attack shortcuts give a visible combat forecast", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/");
  const state = applyCommand(createGame(904), { type: "duel" });
  const b = state.battle!;
  b.timed = false;
  b.turn = 5;
  b.nextId = 500;
  b.player.hand = ["witness-roads.76", "witness-roads.76"];
  b.player.mana = { dawn: 20, grove: 20, grave: 20, tide: 20, ember: 20 };
  b.enemy.hand = [];
  b.player.board = [
    permanent("saltwind.75", 201),
    permanent("first-oaths.75", 202),
  ];
  b.enemy.board = [permanent("first-oaths.1", 203)];
  await restore(page, state);
  await page
    .locator(".hand-card")
    .first()
    .dragTo(page.locator(".enemy .permanent-art"));
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await page.getByRole("button", { name: "Resolve top of stack" }).click();
  await expect(page.locator(".enemy .battle-board")).toContainText("Bound");
  const tray = page.getByLabel("Battle actions");
  await tray.getByRole("button", { name: "Begin combat" }).click();
  await expect(page.locator(".hand-card")).toHaveAttribute(
    "title",
    /Needs 2 mana/,
  );
  await tray.getByRole("button", { name: "Attack with all" }).click();
  await expect(
    tray.getByRole("button", { name: "Declare 2 attackers" }),
  ).toBeVisible();
  await tray.getByRole("button", { name: "Clear", exact: true }).click();
  await tray.getByRole("button", { name: "Attack with all" }).click();
  await tray.getByRole("button", { name: "Declare 2 attackers" }).click();
  await expect(page.locator(".combat-forecast")).toContainText("theirs −5");
  await expect(page.locator(".phase-track [aria-current=step]")).toHaveText(
    "Defend",
  );
  await expect(tray).toBeInViewport();
  await expect(page.locator(".player-hand-zone")).toBeInViewport();
  await page.screenshot({
    path: "docs/screenshots/expansion-combat-laptop.png",
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(tray).toBeInViewport();
  expect(
    await page
      .locator(".game-panel")
      .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
  ).toBe(true);
  await page.screenshot({
    path: "docs/screenshots/expansion-combat-mobile.png",
    animations: "disabled",
  });
  await tray.getByRole("button", { name: "Deal combat damage" }).click();
  await expect(page.locator(".enemy .hearth-life")).toHaveText("♥ 15");
});
test("every visitor has a distinct loaded portrait and the new recipes remain ownership gated", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Duel table", exact: true }).click();
  const paths = new Set<string>();
  for (const guest of customerTypes) {
    await page.getByLabel("Opponent strategy").selectOption(guest.id);
    const portrait = page.locator(".duel-portrait");
    await expect
      .poll(() =>
        portrait.evaluate(
          (img: HTMLImageElement) => img.complete && img.naturalWidth === 128,
        ),
      )
      .toBe(true);
    paths.add((await portrait.getAttribute("src")) as string);
  }
  expect(paths.size).toBe(14);
  for (const id of ["shelter", "binding"])
    await expect(
      page.getByLabel("Prepared recipe").locator(`option[value=${id}]`),
    ).toHaveJSProperty("disabled", true);
  await page.screenshot({
    path: "docs/screenshots/new-visitor-portrait.png",
    animations: "disabled",
  });
});
