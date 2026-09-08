import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { createGame, applyCommand } from "../../src/sim/game";
import { cards, cardById, sets } from "../../src/content/catalog";
import { presetDeck, type Permanent } from "../../src/sim/battle";
test.beforeEach(async ({ page }) => {
  page.on("pageerror", (error) => console.log("Browser error:", error.message));
  page.on("console", (message) => {
    if (message.type() === "error")
      console.log("Browser console:", message.text());
  });
  await page.goto("/");
});
test("immersive tavern keeps a persistent Three scene, lich, hotspots and customer movement", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await expect(page.locator("canvas")).toBeVisible();
  await expect(
    page.getByText("Erilian Kantonine", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.locator(".game-panel")).toBeHidden();
  await page.getByRole("button", { name: /Open the shop/ }).click();
  await expect(page.locator(".customer-label").first()).toBeVisible({
    timeout: 5000,
  });
  await page.waitForTimeout(1800);
  await mkdir("docs/screenshots", { recursive: true });
  await page.screenshot({
    path: "docs/screenshots/tavern-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  expect(errors).toEqual([]);
  const canvas = await page.locator("canvas").elementHandle();
  await page.getByRole("button", { name: "Stockroom", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Stockroom" })).toBeVisible();
  expect(await canvas!.evaluate((el) => el.isConnected)).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.locator(".game-panel")).toBeHidden();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollHeight <= innerHeight + 1,
    ),
  ).toBe(true);
});
test("ordering, actual customer checkout, delivery and save reload work", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Stockroom", exact: true }).click();
  await page
    .getByRole("button", { name: "Order 5 · 160 crowns" })
    .first()
    .click();
  await expect(page.getByTestId("gold")).toHaveText("700");
  await page.getByRole("button", { name: "Open shop", exact: true }).click();
  await expect(page.getByText("5 incoming", { exact: true })).not.toBeVisible({
    timeout: 18000,
  });
  await expect
    .poll(
      async () =>
        page.evaluate(
          () => JSON.parse(localStorage.getItem("hearth-hollow-v1")!).revenue,
        ),
      { timeout: 15000 },
    )
    .toBeGreaterThan(0);
  await page.reload();
  await expect(
    page.getByRole("button", { name: /Close the shop/ }),
  ).toBeVisible();
});
test("pack odds, 14-card reveal, foil persistence, rarity and catalog search work", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Booster packs", exact: true })
    .click();
  await page
    .getByText("The seal promises · pack contents & rarity chances")
    .click();
  await expect(
    page.getByText("At least one mythic: 14.24% per pack."),
  ).toBeVisible();
  await page.screenshot({
    path: "docs/screenshots/sealed-pack-table.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.getByRole("button", { name: "Break the seal" }).click();
  await expect(page.locator(".card-back")).toHaveCount(14);
  await expect(
    page.getByRole("button", { name: "Break the seal" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Reveal next card" }).click();
  await expect(page.locator(".reveal-grid .playing-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Reveal all cards" }).click();
  await expect(page.locator(".reveal-grid .playing-card")).toHaveCount(14);
  await expect(page.locator(".reveal-grid .full-art-card")).toHaveCount(14);
  await expect(page.locator(".reveal-grid .foil")).toHaveCount(1);
  await page.locator(".game-panel").evaluate((el) => {
    const section = el.querySelector(".reveal-section") as HTMLElement;
    el.scrollTop = section.offsetTop - 20;
  });
  await page.screenshot({
    path: "docs/screenshots/pack-opening.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.reload();
  await page
    .getByRole("button", { name: "Booster packs", exact: true })
    .click();
  await expect(page.locator(".reveal-grid .playing-card")).toHaveCount(14);
  await page
    .getByRole("button", { name: "Card collection", exact: true })
    .click();
  await page.getByRole("checkbox", { name: "Owned only" }).uncheck();
  await expect(page.getByText(/640 cards · page 1/)).toBeVisible();
  await expect(page.locator(".card-grid .playing-card")).toHaveCount(80);
  await page.screenshot({
    path: "docs/screenshots/card-binder.png",
    fullPage: true,
    animations: "disabled",
  });
  await page
    .getByRole("combobox", { name: "Filter rarity" })
    .selectOption("mythic");
  await expect(page.locator(".card-grid .playing-card")).toHaveCount(40);
  await page.getByRole("textbox", { name: "Search cards" }).fill("Ledgerbone");
  await expect(page.locator(".card-grid .playing-card")).toHaveCount(1);
  await page.getByRole("textbox", { name: "Search cards" }).fill("");
  await page
    .getByRole("combobox", { name: "Filter rarity" })
    .selectOption("all");
  await page
    .getByRole("combobox", { name: "Card holdings" })
    .selectOption("foils");
  await expect(page.locator(".card-grid .playing-card")).toHaveCount(1);
  await expect(page.locator(".card-grid .card-actions")).toContainText(
    "1 foil",
  );
});
test("100-card deck editing, paid mana, stack, Hero activation and save resume work", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Card collection", exact: true })
    .click();
  await page.getByRole("button", { name: "Build deck · 100/100" }).click();
  const card = page
    .locator(".card-grid .playing-card")
    .filter({
      has: page.getByRole("button", { name: /Remove /, disabled: false }),
    })
    .first();
  await card.getByRole("button", { name: /Remove / }).click();
  await expect(
    page.getByRole("heading", { name: "Your grimoire · 99/100" }),
  ).toBeVisible();
  await card.getByRole("button", { name: /Add / }).click();
  await expect(
    page.getByRole("heading", { name: "Your grimoire · 100/100" }),
  ).toBeVisible();
  // A deterministic saved midgame makes mana and Hero UI checks independent of draw order.
  const s = applyCommand(createGame(55), { type: "duel" }),
    b = s.battle!,
    hero = cards.find((c) => c.type === "Hero")!,
    spell = cards.find((c) => c.type === "Instant" && c.effect === "draw")!,
    basic = cards.find(
      (c) => c.type === "Basic Resource" && c.color === spell.color,
    )!;
  const p = (id: string, uid: number): Permanent => ({
    uid,
    cardId: id,
    tapped: false,
    entered: 0,
    damage: 0,
    counters: 0,
    boost: 0,
    loyalty: cardById[id].loyalty,
    used: 0,
  });
  b.player.hand = [spell.id];
  b.enemy.hand = [];
  b.player.board = [
    p(hero.id, 100),
    ...Array.from({ length: spell.cost }, (_, i) => p(basic.id, 101 + i)),
  ];
  b.nextId = 200;
  b.turn = 5;
  await page.getByRole("button", { name: "Chronicle", exact: true }).click();
  await page.locator("input[type=file]").setInputFiles({
    name: "test-ledger.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(s)),
  });
  await expect(page.getByText("Ledger restored. Welcome home.")).toBeVisible();
  await page.getByRole("button", { name: "Duel table", exact: true }).click();
  await page.getByRole("button", { name: "Cast spell", exact: true }).click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(page.locator(".spell-stack")).toBeVisible();
  await expect(page.locator(".resource-grid .tapped")).toHaveCount(spell.cost);
  await page.reload();
  await page.getByRole("button", { name: "Duel table", exact: true }).click();
  await expect(page.locator(".spell-stack")).toBeVisible();
  await page.getByRole("button", { name: "Resolve top of stack" }).click();
  await page
    .getByRole("button", { name: "+1: Gain 2 life.", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(page.getByText("5 devotion", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Resolve top of stack" }).click();
  await expect(page.locator(".player .hearth-status")).toContainText("22");
  await page.screenshot({ path: "docs/screenshots/duel.png", fullPage: true });
});
test("narrow layouts retain in-room controls and usable panels without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const name of [
    "Stockroom",
    "Card collection",
    "Booster packs",
    "Duel table",
    "Chronicle",
  ]) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(page.getByRole("dialog", { name })).toBeVisible();
    if (name === "Duel table") {
      await page.getByLabel("Opponent strategy").scrollIntoViewIfNeeded();
      await page.screenshot({
        path: "test-results/duel-setup-mobile.png",
        animations: "disabled",
      });
    }
    if (name === "Duel table") {
      // Stress native select intrinsic sizing across runner/browser fonts.
      await page.locator(".duel-welcome select").evaluateAll((elements) =>
        elements.forEach((el) => {
          (el as HTMLElement).style.fontSize = "18px";
        }),
      );
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      name,
    ).toBe(true);
    expect(
      await page
        .locator(".game-panel")
        .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
      name,
    ).toBe(true);
  }
  await page.getByRole("button", { name: "Return to tavern" }).click();
  await page.waitForTimeout(800);
  await page.screenshot({
    path: "docs/screenshots/tavern-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
});

test("set histories, card inspection, focus and inventory tools belong to the tavern", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Card collection", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Set histories", exact: true })
    .click();
  await expect(page.locator(".set-spines button")).toHaveCount(8);
  await page.getByRole("button", { name: /The Long Ash.*ASH/ }).click();
  await expect(
    page.getByText("What remains when no one is left to attest it?"),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Meet Ledgerbone, the Unerasable →" })
    .click();
  const detail = page.getByRole("dialog", {
    name: "Inspect Ledgerbone, the Unerasable",
  });
  await expect(detail).toBeVisible();
  await expect(detail).toContainText(
    "Erilian, your tavern’s keeper, is a different lich.",
  );
  await expect(
    page.getByRole("button", { name: "Close card inspection" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Close card inspection" }),
  ).toBeFocused();
  await page.screenshot({
    path: "docs/screenshots/card-inspection.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.keyboard.press("Escape");
  await expect(detail).not.toBeVisible();
  await expect(
    page.getByRole("dialog", { name: "Card collection", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Browse this volume" }).click();
  await expect(
    page.getByRole("combobox", { name: "Filter expansion" }),
  ).toHaveValue("ashfall");
  await page
    .getByRole("button", { name: "Set histories", exact: true })
    .click();
  await page.locator(".game-panel").evaluate((el) => el.scrollTo(0, 0));
  await page.screenshot({
    path: "docs/screenshots/set-library.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.getByRole("button", { name: "Stockroom", exact: true }).click();
  await expect(page.getByText("SEALED ON THE SHELVES")).toBeVisible();
  await page
    .getByRole("checkbox", { name: "Shelves running low (3 or fewer)" })
    .check();
  await expect(page.locator(".product")).toHaveCount(0);
  await expect(
    page.getByText("Every shelf has a little breathing room."),
  ).toBeVisible();
  await page
    .getByRole("checkbox", { name: "Shelves running low (3 or fewer)" })
    .uncheck();
  await page
    .getByRole("combobox", { name: "Restock quantity" })
    .selectOption("1");
  await page
    .getByRole("button", { name: "Order 1 · 32 crowns" })
    .first()
    .click();
  await expect(page.getByTestId("gold")).toHaveText("828");
  await expect(page.getByText("1 incoming", { exact: true })).toBeVisible();
  await page.screenshot({
    path: "docs/screenshots/inventory-ledger.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "Card collection", exact: true })
    .click();
  await page.getByRole("button", { name: /The Long Ash.*ASH/ }).click();
  await page
    .getByRole("button", { name: "Meet Ledgerbone, the Unerasable →" })
    .click();
  await expect(page.locator(".card-detail")).toBeVisible();
  expect(
    await page
      .locator(".card-detail")
      .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
  ).toBe(true);
  await page
    .locator(".card-detail")
    .evaluate((el) => el.scrollTo(0, el.scrollHeight));
  await expect(
    page.getByRole("button", { name: "Close card inspection" }),
  ).toBeVisible();
  await page.screenshot({
    path: "docs/screenshots/card-inspection-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
});

test("resource art, hidden opponent hand, drag-to-play and pausable decision windows work", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Duel table", exact: true }).click();
  await expect(
    page.locator('select[aria-label="Opponent strategy"] option'),
  ).toHaveCount(20);
  await page
    .getByRole("combobox", { name: "Opponent strategy" })
    .selectOption("smith");
  await expect(page.locator(".opponent-plan")).toContainText(
    "early creature offensive",
  );
  const s = applyCommand(createGame(102), { type: "duel", opponent: "smith" });
  const basic = cards.find((c) => c.type === "Basic Resource")!;
  s.battle!.player.hand = [basic.id, basic.id];
  s.battle!.secondsLeft = 35;
  await page.getByRole("button", { name: "Chronicle", exact: true }).click();
  await page.locator("input[type=file]").setInputFiles({
    name: "arena.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(s)),
  });
  await page.getByRole("button", { name: "Duel table", exact: true }).click();
  await expect(page.locator(".opponent-hand .table-card-back")).toHaveCount(7);
  await expect(page.locator(".opponent-hand")).not.toContainText(
    cardById[s.battle!.enemy.hand[0]].name,
  );
  await expect(page.locator(".hand img.full-card-art").first()).toBeVisible();
  expect(
    await page
      .locator(".hand img.full-card-art")
      .first()
      .evaluate(
        (el: HTMLImageElement) => el.complete && el.naturalWidth === 256,
      ),
  ).toBe(true);
  await page.getByRole("button", { name: "Pause clock" }).click();
  await expect(page.getByLabel("Action time remaining")).toContainText(
    "Untimed",
  );
  const handCard = page.locator(".hand-card").first();
  await handCard.dragTo(page.locator(".battle-side.player .battle-board"));
  await expect(page.locator(".hand-card")).toHaveCount(1);
  await expect(
    page.locator(".player .resource-grid .battle-permanent"),
  ).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "Play resource", exact: true }),
  ).toBeDisabled();
  await expect(
    page.locator(".player .resource-grid img.full-card-art"),
  ).toBeVisible();
  await page.locator(".game-panel").evaluate((el) => el.scrollTo(0, 0));
  await page.getByRole("button", { name: "Dismiss notification" }).click();
  await expect(page.locator(".player-hand-zone")).toBeInViewport();
  await page.screenshot({
    path: "docs/screenshots/battle-resources-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.getByRole("button", { name: "Resume clock" }).click();
  await page
    .getByRole("button", { name: `Select battlefield ${basic.name}` })
    .click();
  await expect(
    page.getByRole("button", { name: "Close card inspection" }),
  ).toBeVisible();
  const clock = await page.getByLabel("Action time remaining").innerText();
  await page.waitForTimeout(1300);
  await expect(page.getByLabel("Action time remaining")).toHaveText(clock);
  await page.getByRole("button", { name: "Close card inspection" }).click();
  await page.getByRole("button", { name: "Pause clock" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page
      .locator(".game-panel")
      .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
  ).toBe(true);
  await page.locator(".player-hand-zone").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: "docs/screenshots/battle-resources-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
});

test("named deck books, first-chapter rewards and full-art Hero inspection survive reload", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Card collection", exact: true })
    .click();
  await page.getByRole("button", { name: "Build deck · 100/100" }).click();
  await page
    .getByRole("textbox", { name: "Deck name", exact: true })
    .fill("Embers by the door");
  await page
    .getByRole("button", { name: "Save current deck", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Prepare Embers by the door",
      exact: true,
    }),
  ).toBeVisible();
  await page.locator(".deck-shelf").screenshot({
    path: "docs/screenshots/deck-shelf.png",
    animations: "disabled",
  });
  await page.reload();
  await page.getByRole("button", { name: "Chronicle", exact: true }).click();
  await page
    .getByRole("button", { name: "Claim 15 crowns", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Claim 15 crowns", exact: true }),
  ).toHaveCount(0);
  await page.locator(".keeper-journey").screenshot({
    path: "docs/screenshots/keeper-journal.png",
    animations: "disabled",
  });
  await page
    .getByRole("button", { name: "Card collection", exact: true })
    .click();
  await page.getByRole("button", { name: "Build deck · 100/100" }).click();
  await page
    .getByRole("button", { name: "Prepare Embers by the door", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Search cards" })
    .fill("First Witness");
  const card = page.locator(".card-grid .full-art-card").first();
  await expect(card).toBeVisible();
  expect(
    await card.evaluate((el) =>
      getComputedStyle(el).backgroundImage.includes(
        "/art/cards/first-oaths.16.png",
      ),
    ),
  ).toBe(false);
  await page
    .getByRole("button", { name: "Inspect First Witness", exact: true })
    .click();
  await expect(page.locator(".card-detail .full-art-card")).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator(".card-detail img.full-card-art")
        .evaluate(
          (el: HTMLImageElement) => el.complete && el.naturalWidth === 256,
        ),
    )
    .toBe(true);
  await page.screenshot({
    path: "docs/screenshots/full-art-inspection.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("button", { name: "Close card inspection" }),
  ).toBeInViewport();
  await page.screenshot({
    path: "docs/screenshots/full-art-inspection-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
});

test("every set displays 80 distinct full-art card faces with working images", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Card collection", exact: true })
    .click();
  await page.getByRole("checkbox", { name: "Owned only" }).uncheck();
  for (const set of sets) {
    await page
      .getByRole("combobox", { name: "Filter expansion" })
      .selectOption(set.id);
    const faces = page.locator(".card-grid .full-art-card");
    await expect(faces).toHaveCount(80);
    const results = await faces.evaluateAll(async (elements) =>
      Promise.all(
        elements.map(async (el) => {
          const img = el.querySelector("img.full-card-art") as HTMLImageElement;
          // Request the same card source even when it is below the viewport.
          img.loading = "eager";
          await img.decode();
          return {
            path: new URL(img.src).pathname,
            width: img.naturalWidth,
            height: img.naturalHeight,
            backed: getComputedStyle(el).backgroundImage.includes(
              new URL(img.src).pathname,
            ),
          };
        }),
      ),
    );
    expect(new Set(results.map((r) => r.path)).size).toBe(80);
    expect(
      results.every(
        (r) =>
          r.width === 256 &&
          r.height === 384 &&
          !r.backed &&
          r.path.startsWith(`/art/optimized/cards/${set.id}.`) &&
          r.path.endsWith(".webp"),
      ),
    ).toBe(true);
  }
  await page.screenshot({
    path: "docs/screenshots/full-art-rekindled-binder.png",
    fullPage: true,
    animations: "disabled",
  });
});

test("laptop table fits crowded rows, shows whole art and previews cards", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  const state = applyCommand(createGame(71), { type: "duel" });
  const b = state.battle!;
  b.timed = false;
  b.turn = 8;
  const body = cards.find((c) => c.type === "Creature")!;
  const resource = cards.find((c) => c.type === "Basic Resource")!;
  let uid = 100;
  const perm = (id: string): Permanent => ({
    uid: uid++,
    cardId: id,
    tapped: false,
    entered: 0,
    damage: 0,
    counters: 0,
    boost: 0,
    loyalty: 0,
    used: 0,
  });
  for (const side of [b.player, b.enemy])
    side.board = [
      ...Array.from({ length: 12 }, () => perm(body.id)),
      ...Array.from({ length: 14 }, () => perm(resource.id)),
    ];
  b.nextId = uid + 1;
  await page.getByRole("button", { name: "Chronicle", exact: true }).click();
  await page.locator("input[type=file]").setInputFiles({
    name: "crowded.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(state)),
  });
  await page.getByRole("button", { name: "Duel table", exact: true }).click();
  for (const side of ["player", "enemy"]) {
    const board = page.locator(`.${side} .battle-board`),
      resources = page.locator(`.${side} .resource-row`);
    await expect(board).toBeInViewport();
    expect(
      await board.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return [...el.querySelectorAll(".battle-permanent")].every((c) => {
          const p = c.getBoundingClientRect();
          return p.left >= r.left - 1 && p.right <= r.right + 1;
        });
      }),
    ).toBe(true);
    await expect(resources).toBeInViewport();
    expect((await resources.boundingBox())!.y).toBeGreaterThanOrEqual(
      (await board.boundingBox())!.y + (await board.boundingBox())!.height - 1,
    );
  }
  expect(
    await page
      .locator(".battlefield-scroll")
      .evaluate((el) => el.scrollHeight <= el.clientHeight + 1),
  ).toBe(true);
  await expect(page.locator(".player-hand-zone")).toBeInViewport();
  const face = page.locator(".player .battle-board .battle-permanent").first();
  await face.hover();
  await expect(page.getByLabel("Card preview")).toBeVisible();
  const img = page.locator(".card-hover-preview img.full-card-art");
  expect(await img.evaluate((el) => getComputedStyle(el).objectFit)).toBe(
    "contain",
  );
  expect(await img.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
  await page.screenshot({
    path: "docs/screenshots/laptop-crowded-table.png",
    animations: "disabled",
  });
});

test("prepared recipes unlock only when every copy is owned", async ({
  page,
}) => {
  await expect(page).toHaveTitle("Theandril: Hearth & Card");
  await page.getByRole("button", { name: "Duel table", exact: true }).click();
  const recipes = page.getByLabel("Prepared recipe");
  await expect(recipes.locator("option[value=relics]")).toHaveJSProperty(
    "disabled",
    true,
  );
  await expect(recipes.locator("option[value=fellowship]")).toHaveJSProperty(
    "disabled",
    false,
  );
  await recipes.selectOption("fellowship");
  const state = createGame(83);
  for (const id of presetDeck("relics")) state.collection[id] = 100;
  await page.getByRole("button", { name: "Chronicle", exact: true }).click();
  await page.locator("input[type=file]").setInputFiles({
    name: "owned.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(state)),
  });
  await page.getByRole("button", { name: "Duel table", exact: true }).click();
  await expect(recipes.locator("option[value=relics]")).toHaveJSProperty(
    "disabled",
    false,
  );
  await recipes.selectOption("relics");
});

test("direct spell targets, click attackers and blockers, and floating actions work on a laptop", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  const state = applyCommand(createGame(112), { type: "duel" });
  const b = state.battle!;
  b.timed = false;
  b.turn = 5;
  b.enemy.hand = [];
  const spell = cards.find(
    (c) => c.type === "Instant" && c.effect === "damage",
  )!;
  const basic = cards.find(
    (c) => c.type === "Basic Resource" && c.color === spell.color,
  )!;
  const body = cards.find(
    (c) =>
      c.type === "Creature" &&
      !c.keywords.includes("flying") &&
      !c.keywords.includes("trample") &&
      c.trigger === "none",
  )!;
  const make = (id: string, uid: number): Permanent => ({
    uid,
    cardId: id,
    tapped: false,
    entered: 0,
    damage: 0,
    counters: 0,
    boost: 0,
    loyalty: cardById[id].loyalty,
    used: 0,
  });
  b.player.hand = [spell.id];
  b.player.board = [
    make(body.id, 300),
    ...Array.from({ length: spell.cost }, (_, i) => make(basic.id, 310 + i)),
  ];
  b.enemy.board = [];
  b.nextId = 400;
  async function restore() {
    await page.getByRole("button", { name: "Chronicle", exact: true }).click();
    await page.locator("input[type=file]").setInputFiles({
      name: "direct.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(state)),
    });
    await page.getByRole("button", { name: "Duel table", exact: true }).click();
  }
  await restore();
  const tray = page.getByLabel("Battle actions");
  await expect(tray).toBeInViewport();
  expect((await tray.boundingBox())!.x).toBeGreaterThan(1000);
  await expect(page.getByLabel("player available resources")).toContainText(
    String(spell.cost),
  );
  await page.getByRole("button", { name: "Cast spell", exact: true }).click();
  await expect(page.locator(".enemy .hearth-life")).toHaveClass(/legal-target/);
  await page.getByRole("button", { name: "Cancel targeting" }).click();
  await expect(page.locator(".hand-card")).toHaveCount(1);
  await page.locator(".hand-card").dragTo(page.locator(".enemy .hearth-life"));
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(page.locator(".spell-stack")).toBeVisible();
  await tray.getByRole("button", { name: "Resolve top of stack" }).click();
  await expect(page.locator(".enemy .hearth-life")).toHaveText(
    `♥ ${20 - spell.amount}`,
  );
  await tray.getByRole("button", { name: "Begin combat" }).click();
  await page.locator(".player .battle-board .permanent-art").click();
  await expect(
    tray.getByRole("button", { name: "Declare 1 attackers" }),
  ).toBeVisible();
  await page.locator(".enemy .hearth-life").click();
  await tray.getByRole("button", { name: "Declare 1 attackers" }).click();
  await expect(page.locator(".player .combat-link")).toContainText("Clash 1");
  await tray.getByRole("button", { name: "Deal combat damage" }).click();
  b.active = "enemy";
  b.phase = "block";
  b.player.hand = [];
  b.player.board = [make(body.id, 300)];
  b.enemy.board = [make(body.id, 301)];
  b.combat = [{ uid: 301, hero: null, blocker: null, blocked: false }];
  await restore();
  await page.locator(".player .permanent-art").click();
  await expect(page.locator(".enemy .battle-permanent")).toHaveClass(
    /legal-target/,
  );
  await page.locator(".enemy .permanent-art").click();
  await expect(page.locator(".combat-link")).toHaveCount(2);
  await page.screenshot({
    path: "docs/screenshots/direct-combat-laptop.png",
    animations: "disabled",
  });
  await tray.getByRole("button", { name: "Deal combat damage" }).click();
  await expect(page.locator(".player .hearth-life")).toHaveText("♥ 20");
});

test("illuminated pack edition persists and reduced motion disables ornamental animation", async ({
  page,
}) => {
  let state = createGame(33);
  state.products.rekindled.stock = 200;
  do {
    state = applyCommand(state, { type: "open-pack", setId: "rekindled" });
  } while (
    !state.lastPackIlluminated[11] &&
    state.products.rekindled.stock > 0
  );
  expect(state.lastPackIlluminated[11]).toBe(true);
  await page.getByRole("button", { name: "Chronicle", exact: true }).click();
  await page.locator("input[type=file]").setInputFiles({
    name: "edition.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(state)),
  });
  await page
    .getByRole("button", { name: "Booster packs", exact: true })
    .click();
  await expect(page.locator(".revealed-card .illuminated")).toHaveCount(1);
  await expect(page.locator(".revealed-card .foil")).toHaveCount(1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await page
      .locator(".revealed-card")
      .first()
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
  await page.reload();
  await page
    .getByRole("button", { name: "Booster packs", exact: true })
    .click();
  await expect(page.locator(".revealed-card .illuminated")).toHaveCount(1);
  await page.locator(".pack-odds summary").click();
  await expect(page.locator(".pack-odds")).toContainText("5% per pack");
  await page.screenshot({
    path: "docs/screenshots/illuminated-pack.png",
    animations: "disabled",
  });
});

test("open-all haul supports selling, illumination, deck edits and persistent desktop/mobile review", async ({
  page,
}) => {
  const state = createGame(221);
  state.deck = [];
  state.products.rekindled.stock = 6;
  const trial = applyCommand(state, {
    type: "open-all-packs",
    setId: "rekindled",
  });
  const id = Object.keys(trial.lastBulkOpening!.cards).find(
    (id) => cardById[id].type === "Creature",
  )!;
  state.collection[id] = 20;
  state.foils[id] = 1;
  state.illuminated[id] = 0;
  const expected = applyCommand(state, {
    type: "open-all-packs",
    setId: "rekindled",
  });
  await page.getByRole("button", { name: "Chronicle", exact: true }).click();
  await page.locator("input[type=file]").setInputFiles({
    name: "haul.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(state)),
  });
  await page
    .getByRole("button", { name: "Booster packs", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: /^Open all packs of / }),
  ).toHaveCount(8);
  await page
    .getByRole("button", {
      name: "Open all packs of Rekindled Hearths",
      exact: true,
    })
    .click();
  const dialog = page.getByRole("dialog", { name: /Your haul/ });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("6 packs · 84 cards collected · 6 foil");
  await expect(
    dialog.getByRole("button", { name: "Close opening results" }),
  ).toBeFocused();
  expect(
    await dialog
      .getByLabel("Collected cards")
      .evaluate((el) => el.scrollHeight > el.clientHeight),
  ).toBe(true);
  const firstArt = dialog.locator("img.full-card-art").first();
  await expect(firstArt).toBeVisible();
  await firstArt.evaluate(async (el) => {
    await (el as HTMLImageElement).decode();
  });
  expect(await firstArt.evaluate((el) => getComputedStyle(el).objectFit)).toBe(
    "contain",
  );
  expect(await firstArt.evaluate((el) => getComputedStyle(el).opacity)).toBe(
    "1",
  );
  expect(
    await firstArt.evaluate((el) => el.getBoundingClientRect().width),
  ).toBeGreaterThan(100);
  expect(
    await firstArt.evaluate(
      (el) =>
        el.getBoundingClientRect().height <=
        el.parentElement!.getBoundingClientRect().height + 1,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "docs/screenshots/bulk-opening-desktop.png",
    animations: "disabled",
  });
  await dialog.getByLabel("Search opening results").fill(cardById[id].name);
  const row = dialog.getByRole("region", {
    name: `Opening result ${cardById[id].name}`,
    exact: true,
  });
  await row.getByRole("button", { name: /^Illuminate ·/ }).click();
  await expect(row.locator(".bulk-owned-count")).toContainText(
    `${expected.collection[id] - 4} owned`,
  );
  await expect(row.locator(".bulk-owned-count")).toContainText(
    `${(expected.illuminated[id] ?? 0) + 1} Illuminated`,
  );
  await row.getByRole("button", { name: "Add to deck", exact: true }).click();
  await expect(row.locator(".bulk-owned-count")).toContainText("1 in deck");
  await row.getByRole("button", { name: /^Sell 1 spare ·/ }).click();
  await expect(row.locator(".bulk-owned-count")).toContainText(
    `${expected.collection[id] - 5} owned`,
  );
  await row
    .getByRole("button", { name: "Remove from deck", exact: true })
    .click();
  await expect(row.locator(".bulk-owned-count")).toContainText("0 in deck");
  await row
    .getByRole("button", { name: `Inspect ${cardById[id].name}`, exact: true })
    .click();
  await expect(
    page.getByRole("dialog", {
      name: `Inspect ${cardById[id].name}`,
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close card inspection" }).click();
  await dialog.getByRole("button", { name: "Close opening results" }).click();
  await expect(
    page.getByRole("button", {
      name: "Open all packs of Rekindled Hearths",
      exact: true,
    }),
  ).toBeDisabled();
  await page.reload();
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "Booster packs", exact: true })
    .click();
  await page.getByRole("button", { name: /^Review last haul/ }).click();
  await expect(dialog).toContainText("84 cards collected");
  await dialog.getByLabel("Search opening results").fill(cardById[id].name);
  await expect(row.locator(".bulk-owned-count")).toContainText(
    `${expected.collection[id] - 5} owned`,
  );
  await expect(row.locator(".bulk-owned-count")).toContainText(
    `${(expected.illuminated[id] ?? 0) + 1} Illuminated`,
  );
  expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true,
  );
  await expect(
    dialog.getByRole("button", { name: "Close opening results" }),
  ).toBeInViewport();
  await row
    .getByRole("button", { name: /^Sell \d+ ordinary spares/ })
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: "docs/screenshots/bulk-opening-mobile.png",
    animations: "disabled",
  });
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});

// Explicitly accept the player-facing confirmation in import fixtures.
test.beforeEach(async ({ page }) => {
  page.on("dialog", (dialog) => dialog.accept());
});
