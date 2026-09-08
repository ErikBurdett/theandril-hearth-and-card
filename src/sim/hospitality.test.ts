import { it, expect } from "vitest";
import {
  createGame,
  applyCommand,
  decodeSave,
  gameSchema,
  type Game,
} from "./game";
import {
  stockCapacity,
  clockPhase,
  nightIntensity,
  stockUsage,
  pantryCapacity,
  pantryUsage,
  skillPoints,
  arrivalSteps,
  guestCapacity,
} from "./hospitality";
import { roomNodes } from "../content/tavern";
const bells = (g: Game, n: number) => {
  for (let i = 0; i < n; i++) g = applyCommand(g, { type: "tick" });
  return g;
};
const equipped = () => {
  let g = createGame();
  for (const id of ["hall", "kitchen", "bar"])
    g = applyCommand(g, { type: "upgrade-tavern", id });
  return g;
};
it("automatic hours close at night, reopen at dawn and survive reload; manual sign overrides", () => {
  let g = applyCommand(createGame(), { type: "auto-shop", enabled: true });
  expect(g.open).toBe(true);
  g = bells(g, 38);
  expect(g.open).toBe(false);
  expect(g.day).toBe(1);
  g = decodeSave(JSON.stringify(g));
  g = bells(g, 10);
  expect(g.open).toBe(true);
  expect(g.day).toBe(2);
  g = applyCommand(g, { type: "toggle" });
  expect(g.hospitality.auto).toBe(false);
  g = bells(g, 48);
  expect(g.open).toBe(false);
});
it("legacy schema-three saves gain a clock without losing inventory, money or day", () => {
  const g = createGame();
  g.day = 17;
  const old = JSON.parse(JSON.stringify(g));
  delete old.hospitality;
  const loaded = decodeSave(JSON.stringify(old));
  expect(loaded.day).toBe(17);
  expect(loaded.gold).toBe(g.gold);
  expect(loaded.collection).toEqual(g.collection);
  expect(loaded.hospitality.bell).toBe(0);
});
it("fermentation reserves output capacity, advances while closed and produces exactly once after reload", () => {
  let g = equipped();
  g.hospitality.pantry = { grain: 3, water: 2, herbs: 1 };
  g = applyCommand(g, { type: "craft-recipe", id: "ale" });
  expect(g.hospitality.pantry.grain).toBe(0);
  expect(pantryUsage(g)).toBe(4);
  g = bells(g, 47);
  expect(g.hospitality.pantry.ale).toBeUndefined();
  g = decodeSave(JSON.stringify(g));
  g = bells(g, 1);
  expect(g.hospitality.pantry.ale).toBe(4);
  expect(g.hospitality.batches).toHaveLength(0);
  g = bells(g, 48);
  expect(g.hospitality.pantry.ale).toBe(4);
  expect(g.open).toBe(false);
  g.hospitality.pantry.flour = 2;
  g.hospitality.pantry.vegetables = 2;
  g = applyCommand(g, { type: "craft-recipe", id: "pie" });
  expect(g.hospitality.pantry.ale).toBe(3);
  expect(g.hospitality.pantry.pie).toBe(2);
});
it("rejected purchases, recipes, upgrades and skills conserve state and enforce prerequisites", () => {
  const g = createGame(),
    before = structuredClone(g);
  for (const cmd of [
    { type: "upgrade-tavern", id: "bar" },
    { type: "learn-skill", id: "warehouse" },
    { type: "craft-recipe", id: "bread" },
    { type: "buy-ingredient", id: "flour", quantity: -1 },
    { type: "walk", destination: "bar" },
  ] as const)
    expect(() => applyCommand(g, cmd)).toThrow();
  expect(g).toEqual(before);
  const full = equipped();
  full.hospitality.pantry.water = pantryCapacity(full);
  expect(() =>
    applyCommand(full, { type: "buy-ingredient", id: "water", quantity: 1 }),
  ).toThrow();
});
it("skill branches unlock capacity, visits and shorter fermentation with earned points", () => {
  let g = equipped();
  g.hospitality.xp = 35;
  for (const id of [
    "organized",
    "warehouse",
    "welcome",
    "fame",
    "cook",
    "cellarer",
  ])
    g = applyCommand(g, { type: "learn-skill", id });
  expect(skillPoints(g)).toBe(0);
  expect(stockCapacity(g)).toBe(480);
  expect(pantryCapacity(g)).toBe(280);
  expect(arrivalSteps(g)).toBe(40);
  expect(guestCapacity(g)).toBe(12);
  g.hospitality.pantry = { grain: 12, water: 8, herbs: 4 };
  for (let i = 0; i < 4; i++)
    g = applyCommand(g, { type: "craft-recipe", id: "ale" });
  expect(g.hospitality.batches).toHaveLength(4);
  expect(g.hospitality.batches[0].readyAt).toBe(40);
  expect(gameSchema.safeParse(g).success).toBe(true);
});
it("orders reserve sealed storage and an older overcapacity collection is preserved", () => {
  let g = createGame();
  const id = Object.keys(g.products)[0];
  g.gold = 10000;
  g.products[id].stock += stockCapacity(g) - stockUsage(g) - 2;
  g = applyCommand(g, { type: "order", setId: id, quantity: 2 });
  expect(stockUsage(g)).toBe(stockCapacity(g));
  expect(() =>
    applyCommand(g, { type: "order", setId: id, quantity: 1 }),
  ).toThrow();
  g.products[id].stock += 100;
  expect(decodeSave(JSON.stringify(g)).products[id].stock).toBe(
    g.products[id].stock,
  );
});
it("meal and drink checkouts consume one serving and award income and experience only once", () => {
  for (const [purpose, item] of [
    ["meal", "stew"],
    ["drink", "ale"],
  ] as const) {
    let g = equipped();
    g.open = true;
    g.room.spawnIn = 100;
    g.room.nextId = 2;
    g.hospitality.pantry[item] = 2;
    g.hospitality.xp = 4;
    g.room.customers = [
      {
        id: 1,
        kind: 0,
        setId: Object.keys(g.products)[0],
        purpose,
        itemId: item,
        phase: "checkout",
        wait: 0,
        purchased: false,
        saleAmount: 0,
        node: "dining",
        ...roomNodes.dining,
        route: [],
      },
    ];
    const gold = g.gold;
    g = applyCommand(g, { type: "room-step" });
    expect(g.hospitality.pantry[item]).toBe(1);
    expect(g.gold).toBeGreaterThan(gold);
    expect(g.hospitality.xp).toBe(5);
    expect(skillPoints(g)).toBe(3);
    expect(g.progression.xp).toBe(18);
    expect(g.progression.totals.servings).toBe(1);
    expect(g.progression.totals.meals).toBe(purpose === "meal" ? 1 : 0);
    const paid = g.gold;
    g = applyCommand(g, { type: "room-step" });
    expect(g.gold).toBe(paid);
    expect(g.progression.xp).toBe(18);
    expect(g.hospitality.xp).toBe(5);
    expect(decodeSave(JSON.stringify(g)).hospitality).toEqual(g.hospitality);
  }
});
it("invalid food references and overspent skill saves are rejected", () => {
  const g = createGame();
  g.hospitality.skills = ["warehouse"];
  expect(gameSchema.safeParse(g).success).toBe(false);
  const h = equipped();
  h.room.nextId = 2;
  h.room.customers = [
    {
      id: 1,
      kind: 0,
      setId: Object.keys(h.products)[0],
      purpose: "meal",
      itemId: "water",
      phase: "checkout",
      wait: 0,
      purchased: false,
      saleAmount: 0,
      node: "dining",
      ...roomNodes.dining,
      route: [],
    },
  ];
  expect(gameSchema.safeParse(h).success).toBe(false);
});

it("equipment benefits and recipe supplies preserve money, prerequisites, reservations and saves", () => {
  let g = equipped();
  g.gold = 5000;
  const oldCapacity = pantryCapacity(g);
  for (const id of ["pantry", "oven", "cellar"])
    g = applyCommand(g, { type: "upgrade-tavern", id });
  expect(pantryCapacity(g)).toBe(oldCapacity + 200);
  expect(stockCapacity(g)).toBe(280);
  g.hospitality.pantry = { flour: 1 };
  const before = g.gold;
  g = applyCommand(g, { type: "buy-recipe-supplies", id: "honey-tart" });
  expect(g.gold).toBe(before - 10);
  expect(g.hospitality.pantry).toEqual({ flour: 2, butter: 1, honey: 1 });
  g = applyCommand(g, { type: "craft-recipe", id: "honey-tart" });
  expect(g.hospitality.pantry["honey-tart"]).toBe(4);
  expect(g.progression.totals.crafted).toBe(1);
  expect(decodeSave(JSON.stringify(g))).toEqual(g);
  const full = structuredClone(g);
  full.hospitality.pantry.water = pantryCapacity(full);
  expect(() =>
    applyCommand(full, { type: "buy-recipe-supplies", id: "honey-tart" }),
  ).toThrow(/space/);
  expect(full.gold).toBe(g.gold);
  const poor = structuredClone(g);
  poor.gold = 0;
  expect(() =>
    applyCommand(poor, { type: "buy-recipe-supplies", id: "honey-tart" }),
  ).toThrow(/crowns/);
  expect(poor.hospitality).toEqual(g.hospitality);
  const partial = applyCommand(g, {
    type: "buy-recipe-supplies",
    id: "cider-cake",
  });
  expect(partial.hospitality.pantry.cider).toBeUndefined();
  expect(() =>
    applyCommand(partial, { type: "craft-recipe", id: "cider-cake" }),
  ).toThrow(/missing/);
});

it("new cellar recipes award crafting missions on completion once and keep active old missions", () => {
  let g = equipped();
  g.gold = 5000;
  g = applyCommand(g, { type: "upgrade-tavern", id: "cellar" });
  g = applyCommand(g, {
    type: "choose-mission",
    branch: "craft",
    choice: "bold",
  });
  for (let i = 0; i < 3; i++) {
    g = applyCommand(g, { type: "buy-recipe-supplies", id: "berry-cordial" });
    g = applyCommand(g, { type: "craft-recipe", id: "berry-cordial" });
  }
  expect(g.hospitality.batches).toHaveLength(3);
  expect(g.hospitality.batches[0].readyAt).toBe(52);
  expect(g.progression.totals.brewed).toBe(0);
  g = bells(g, 51);
  g = decodeSave(JSON.stringify(g));
  g = bells(g, 1);
  expect(g.progression.totals.brewed).toBe(3);
  expect(g.hospitality.pantry["berry-cordial"]).toBe(12);
  g = applyCommand(g, { type: "claim-mission", branch: "craft" });
  expect(g.progression.missions.craft.tier).toBe(2);
  g = bells(g, 60);
  expect(g.progression.totals.brewed).toBe(3);
  const old = JSON.parse(JSON.stringify(g));
  old.progression.missions.tavern = { tier: 5, choice: "bold", baseline: 19 };
  delete old.progression.missions.craft;
  delete old.progression.totals.crafted;
  delete old.progression.totals.brewed;
  const loaded = decodeSave(JSON.stringify(old));
  expect(loaded.progression.missions.tavern).toEqual(
    old.progression.missions.tavern,
  );
  expect(loaded.progression.missions.craft).toEqual({
    tier: 1,
    choice: null,
    baseline: 0,
  });
});

it("long daylight and short nights share their lighting and preserve the 48-bell cycle", () => {
  const g = createGame();
  for (const [bell, phase] of [
    [0, "Dawn"],
    [4, "Daylight"],
    [33, "Daylight"],
    [34, "Dusk"],
    [37, "Dusk"],
    [38, "Night"],
    [47, "Night"],
    [48, "Dawn"],
  ] as const) {
    g.hospitality.bell = bell;
    expect(clockPhase(g)).toBe(phase);
  }
  g.hospitality.bell = 24;
  expect(nightIntensity(g)).toBe(0);
  g.hospitality.bell = 42;
  expect(nightIntensity(g)).toBe(1);
});
