import { screenshotPath } from "./screenshots";
import { test, expect, type Page } from "@playwright/test";
import { createGame, applyCommand, type Game } from "../../src/sim/game";
import { cards } from "../../src/content/catalog";
import { duelists } from "../../src/content/tavern";
import type { Permanent } from "../../src/sim/battle";
const perm = (
  cardId: string,
  uid: number,
  extra: Partial<Permanent> = {},
): Permanent => ({
  uid,
  cardId,
  tapped: false,
  entered: 0,
  damage: 0,
  counters: 0,
  boost: 0,
  loyalty: 4,
  used: 0,
  ...extra,
});
const plain = cards.find(
  (c) =>
    c.type === "Creature" &&
    !c.keywords.length &&
    c.trigger === "none" &&
    c.effect === "none" &&
    c.attack === 2 &&
    c.health === 2,
)!;
const hero = cards.find((c) => c.type === "Hero")!;
async function restore(page: Page, g: Game) {
  page.once("dialog", (dialog) => dialog.accept());
  await page.goto("/");
  await page.getByRole("button", { name: "Chronicle", exact: true }).click();
  await page.locator("input[type=file]").setInputFiles({
    name: "combat.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(g)),
  });
  await page.getByRole("button", { name: "Duel table", exact: true }).click();
  const dismiss = page.getByRole("button", { name: "Dismiss notification" });
  if (await dismiss.isVisible()) await dismiss.click();
}
const saved = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("hearth-hollow-v1")!));

for (const [width, height] of [
  [1366, 768],
  [390, 844],
]) {
  test(`attackers pick their own destination and the keeper orders damage through a gang block at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    const courier = duelists.find((g) => g.profile === "defensive")!;
    const g = applyCommand(createGame(901), {
        type: "duel",
        opponent: courier.id,
      }),
      b = g.battle!;
    b.timed = false;
    b.turn = 5;
    b.nextId = 900;
    b.player.hand = [];
    b.enemy.hand = [];
    b.player.board = [
      perm(plain.id, 401, { counters: 1 }),
      perm(plain.id, 402),
    ];
    b.enemy.board = [
      perm(plain.id, 403),
      perm(plain.id, 404),
      perm(hero.id, 405, { loyalty: 2 }),
      perm(plain.id, 406),
    ];
    await restore(page, g);
    await page.getByRole("button", { name: "Begin combat" }).click();
    await page.getByRole("button", { name: "Attack with all" }).click();
    const destination = page.getByLabel(`Destination for ${plain.name}`);
    await expect(destination).toHaveCount(2);
    await destination.nth(1).selectOption("405");
    await page.getByRole("button", { name: /Declare 2 attackers/ }).click();
    const combat = (await saved(page)).battle.combat as {
      uid: number;
      hero: number | null;
      blockers: number[];
    }[];
    expect(combat.map((a) => a.hero)).toEqual([null, 405]);
    // The defensive guest trades with the Hero's attacker and gang-blocks the 3/3.
    expect(combat[1].blockers).toEqual([403]);
    expect(combat[0].blockers).toEqual([404, 406]);
    await expect(
      page.locator(".combat-link", { hasText: "2 blockers" }),
    ).toHaveCount(3);
    const order = page.getByLabel(`Damage order for ${plain.name}`);
    await expect(order).toHaveCount(1);
    await expect(order).toHaveValue("404");
    await order.selectOption("406");
    expect((await saved(page)).battle.combat[0].blockers).toEqual([406, 404]);
    await page.screenshot({
      path: screenshotPath(`gang-block-${width}.png`),
      animations: "disabled",
    });
    await page.getByRole("button", { name: "Deal combat damage" }).click();
    const after = (await saved(page)).battle;
    expect(after.enemy.board.map((p: Permanent) => p.uid)).toEqual([404, 405]);
    expect(after.enemy.board[0].damage).toBe(1);
    expect(after.enemy.board[1].loyalty).toBe(2);
    expect(after.player.board).toEqual([]);
    expect(after.enemy.hp).toBe(20);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
  });
}

test("the duel welcome names the guest's tactics and who opens the duel", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Duel table", exact: true }).click();
  const scholar = duelists.find((g) => g.id === "scholar")!;
  await page.getByLabel("Opponent strategy").selectOption("scholar");
  const plan = page.locator(".opponent-opening"),
    tactics = page.locator(".opponent-tactics"),
    voice = page.locator(".rival-voice");
  await expect(tactics).toContainText("Reactive tactics");
  await expect(tactics).toContainText("Lead with a lesser spell");
  await expect(voice).toContainText(scholar.rivalry.first);
  await expect(plan).toContainText("You open the duel.");
  let g = applyCommand(createGame(902), { type: "duel", opponent: "scholar" });
  g.battle!.enemy.hp = 0;
  g = applyCommand(g, { type: "pass" });
  g = applyCommand(g, { type: "leave-duel" });
  await page.getByRole("button", { name: "Return to tavern" }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Chronicle", exact: true }).click();
  await page.locator("input[type=file]").setInputFiles({
    name: "won.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(g)),
  });
  await page.getByRole("button", { name: "Duel table", exact: true }).click();
  await page.getByLabel("Opponent strategy").selectOption("scholar");
  await expect(plan).toContainText(
    `${scholar.name} opens this duel after losing your last meeting.`,
  );
  await expect(voice).toContainText(scholar.rivalry.lost);
  await page.locator(".rival-record").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: screenshotPath("rival-voice-1366.png"),
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator(".rival-record").scrollIntoViewIfNeeded();
  await expect(voice).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  await page.screenshot({
    path: screenshotPath("rival-voice-390.png"),
    animations: "disabled",
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: "Sit down & shuffle" }).click();
  await expect(page.locator(".battle-log")).toContainText("opens the duel");
});

test("a borrowed-recipe practice duel keeps crowns and the guestbook unchanged", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Duel table", exact: true }).click();
  const before = await saved(page);
  await page.getByLabel("Borrowed recipe").selectOption("binding");
  await page.getByLabel("Opponent strategy").selectOption("scholar");
  await page
    .getByRole("button", { name: "Practice with borrowed cards" })
    .click();
  await expect(page.getByRole("dialog", { name: "Duel table" })).toContainText(
    "A practice duel with borrowed cards",
  );
  const battle = (await saved(page)).battle;
  expect(battle.practice).toBe(true);
  expect(battle.timed).toBe(false);
  await page.getByText("Table options").click();
  await page.getByRole("button", { name: "Concede duel" }).click();
  await expect(
    page.getByRole("button", { name: "Practice with borrowed cards" }),
  ).toBeVisible();
  const after = await saved(page);
  expect(after.battle).toBeNull();
  expect(after.gold).toBe(before.gold);
  expect(after.rivals).toEqual({});
  expect(after.unlockedRecipes).toEqual(before.unlockedRecipes);
  expect(after.deck).toEqual(before.deck);
});
