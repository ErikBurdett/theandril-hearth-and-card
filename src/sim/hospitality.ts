import { note } from "./notices";
import { z } from "zod";
import type { Game } from "./game";
import { ingredients, recipes, skills, upgrades } from "../content/hospitality";
const natural = z.number().int().min(0).max(1_000_000_000);
const itemId = z
  .string()
  .refine((id) => [...ingredients, ...recipes].some((i) => i.id === id));
export const hospitalitySchema = z
  .object({
    bell: natural.default(0),
    auto: z.boolean().default(false),
    xp: natural.default(0),
    skills: z
      .array(
        z.enum([
          "organized",
          "warehouse",
          "welcome",
          "fame",
          "cook",
          "cellarer",
        ]),
      )
      .max(6)
      .default([]),
    upgrades: z
      .array(z.enum(["hall", "kitchen", "bar", "pantry", "oven", "cellar"]))
      .max(6)
      .default([]),
    pantry: z.record(itemId, natural).default({}),
    batches: z
      .array(
        z.object({
          recipe: z
            .string()
            .refine((id) => recipes.some((r) => r.id === id && r.bells > 0)),
          readyAt: natural,
          quantity: z.number().int().min(1).max(20),
        }),
      )
      .max(6)
      .default([]),
    mealsSold: natural.default(0),
    drinksSold: natural.default(0),
  })
  .superRefine((s, ctx) => {
    for (const list of [s.skills, s.upgrades])
      if (new Set(list).size !== list.length)
        ctx.addIssue({
          code: "custom",
          message: "Duplicate progression unlock",
        });
    for (const def of [...skills, ...upgrades]) {
      const owned = [...s.skills, ...s.upgrades] as string[];
      if (
        owned.includes(def.id) &&
        def.requires &&
        !owned.includes(def.requires)
      )
        ctx.addIssue({
          code: "custom",
          message: "Missing progression prerequisite",
        });
    }
    if (
      skills
        .filter((k) => s.skills.includes(k.id))
        .reduce((n, k) => n + k.cost, 0) >
      2 + Math.floor(s.xp / 5)
    )
      ctx.addIssue({ code: "custom", message: "Skill points overspent" });
    if (s.batches.length && !s.upgrades.includes("bar"))
      ctx.addIssue({ code: "custom", message: "Brewing requires a bar" });
  });
export type Hospitality = z.infer<typeof hospitalitySchema>;
export const initialHospitality = (): Hospitality =>
  hospitalitySchema.parse({});
export const hasSkill = (g: Game, id: string) =>
  (g.hospitality.skills as string[]).includes(id);
export const hasUpgrade = (g: Game, id: string) =>
  (g.hospitality.upgrades as string[]).includes(id);
export const CYCLE_BELLS = 48;
export const DAYLIGHT_BELLS = 38;
export const nightIntensity = (g: Game) => {
  const bell = g.hospitality.bell % CYCLE_BELLS;
  return bell < 34
    ? 0
    : bell < 38
      ? (bell - 34) / 4
      : bell < 46
        ? 1
        : (48 - bell) / 2;
};
export const clockPhase = (g: Game) => {
  const bell = g.hospitality.bell % 48;
  return bell < 4
    ? "Dawn"
    : bell < 34
      ? "Daylight"
      : bell < DAYLIGHT_BELLS
        ? "Dusk"
        : "Night";
};
export const skillPoints = (g: Game) =>
  2 +
  Math.floor(g.hospitality.xp / 5) -
  skills.filter((k) => hasSkill(g, k.id)).reduce((n, k) => n + k.cost, 0);
export const stockCapacity = (g: Game) =>
  100 +
  (hasUpgrade(g, "hall") ? 80 : 0) +
  (hasUpgrade(g, "pantry") ? 100 : 0) +
  (hasSkill(g, "organized") ? 100 : 0) +
  (hasSkill(g, "warehouse") ? 200 : 0);
export const stockUsage = (g: Game) =>
  Object.values(g.products).reduce((n, p) => n + p.stock, 0) +
  g.orders.reduce((n, o) => n + o.quantity, 0);
export const pantryCapacity = (g: Game) =>
  60 +
  (hasUpgrade(g, "hall") ? 40 : 0) +
  (hasUpgrade(g, "bar") ? 60 : 0) +
  (hasUpgrade(g, "pantry") ? 120 : 0) +
  (hasUpgrade(g, "cellar") ? 80 : 0) +
  (hasSkill(g, "organized") ? 40 : 0) +
  (hasSkill(g, "warehouse") ? 80 : 0);
export const pantryUsage = (g: Game) =>
  Object.values(g.hospitality.pantry).reduce((a, n) => a + n, 0) +
  g.hospitality.batches.reduce((n, b) => n + b.quantity, 0);
export const guestCapacity = (g: Game) =>
  6 +
  (hasUpgrade(g, "hall") ? 2 : 0) +
  (hasUpgrade(g, "bar") ? 2 : 0) +
  (hasSkill(g, "fame") ? 2 : 0);
export const arrivalSteps = (g: Game) =>
  hasSkill(g, "fame") ? 40 : hasSkill(g, "welcome") ? 60 : 85;
export const sellingPrice = (g: Game, id: string) => {
  const r = recipes.find((r) => r.id === id)!;
  return (
    r.price +
    (r.type === "meal"
      ? (hasSkill(g, "cook") ? 3 : 0) + (hasUpgrade(g, "oven") ? 2 : 0)
      : 0)
  );
};
export const brewingVessels = (g: Game) =>
  2 + (hasSkill(g, "cellarer") ? 2 : 0) + (hasUpgrade(g, "cellar") ? 2 : 0);
export const brewingBells = (g: Game, bells: number) =>
  Math.max(
    12,
    bells -
      (hasSkill(g, "cellarer") ? 8 : 0) -
      (hasUpgrade(g, "cellar") ? 8 : 0),
  );
export function recipeSupplies(g: Game, id: string) {
  const r = recipes.find((r) => r.id === id);
  if (!r) throw Error("Unknown recipe.");
  const missing = Object.entries(r.inputs)
    .filter(([id, n]) => (g.hospitality.pantry[id] ?? 0) < n)
    .map(([id, n]) => ({ id, quantity: n - (g.hospitality.pantry[id] ?? 0) }));
  const purchases = missing.filter((m) =>
    ingredients.some((i) => i.id === m.id),
  );
  return {
    missing,
    purchases,
    cost: purchases.reduce(
      (sum, m) =>
        sum + m.quantity * ingredients.find((i) => i.id === m.id)!.price,
      0,
    ),
    space: purchases.reduce((sum, m) => sum + m.quantity, 0),
  };
}
export type HospitalityCommand =
  | { type: "auto-shop"; enabled: boolean }
  | { type: "learn-skill"; id: string }
  | { type: "upgrade-tavern"; id: string }
  | { type: "buy-ingredient"; id: string; quantity: number }
  | { type: "craft-recipe"; id: string }
  | { type: "buy-recipe-supplies"; id: string };

export function hospitalityCommand(g: Game, cmd: HospitalityCommand) {
  const h = g.hospitality;
  if (cmd.type === "auto-shop") {
    h.auto = cmd.enabled;
    if (h.auto) {
      g.open = h.bell % CYCLE_BELLS < DAYLIGHT_BELLS;
      if (g.open) g.room.spawnIn = 0;
    }
  }
  if (cmd.type === "learn-skill") {
    const k = skills.find((k) => k.id === cmd.id);
    if (
      !k ||
      hasSkill(g, k.id) ||
      (k.requires && !hasSkill(g, k.requires)) ||
      k.cost > skillPoints(g)
    )
      throw Error(
        "That skill needs its prerequisite and enough unspent points.",
      );
    h.skills.push(k.id);
    note(g, `Learned ${k.name}.`);
  }
  if (cmd.type === "upgrade-tavern") {
    const u = upgrades.find((u) => u.id === cmd.id);
    if (
      !u ||
      hasUpgrade(g, u.id) ||
      (u.requires && !hasUpgrade(g, u.requires)) ||
      g.gold < u.cost
    )
      throw Error("That upgrade needs its earlier wing and enough crowns.");
    g.gold -= u.cost;
    h.upgrades.push(u.id);
    note(g, `${u.name} is ready. The tavern grows.`);
  }
  if (cmd.type === "buy-ingredient") {
    const i = ingredients.find((i) => i.id === cmd.id);
    if (
      !i ||
      !Number.isInteger(cmd.quantity) ||
      cmd.quantity < 1 ||
      cmd.quantity > 50
    )
      throw Error("Buy 1–50 ingredients.");
    if (g.gold < i.price * cmd.quantity)
      throw Error("Not enough crowns for these ingredients.");
    if (pantryUsage(g) + cmd.quantity > pantryCapacity(g))
      throw Error("The pantry is full. Craft supplies or expand storage.");
    g.gold -= i.price * cmd.quantity;
    h.pantry[i.id] = (h.pantry[i.id] ?? 0) + cmd.quantity;
  }
  if (cmd.type === "buy-recipe-supplies") {
    const r = recipes.find((r) => r.id === cmd.id);
    if (!r || !hasUpgrade(g, r.requires))
      throw Error("Equip the required kitchen first.");
    const supplies = recipeSupplies(g, cmd.id);
    if (!supplies.purchases.length)
      throw Error("No market ingredients are missing.");
    if (g.gold < supplies.cost)
      throw Error("Not enough crowns for these supplies.");
    if (pantryUsage(g) + supplies.space > pantryCapacity(g))
      throw Error("Make pantry space for the supplies.");
    g.gold -= supplies.cost;
    for (const i of supplies.purchases)
      h.pantry[i.id] = (h.pantry[i.id] ?? 0) + i.quantity;
  }
  if (cmd.type === "craft-recipe") {
    const r = recipes.find((r) => r.id === cmd.id);
    if (!r || !hasUpgrade(g, r.requires))
      throw Error("Equip the required kitchen or bar first.");
    if (Object.entries(r.inputs).some(([id, n]) => (h.pantry[id] ?? 0) < n))
      throw Error("Ingredients are missing for that recipe.");
    if (r.bells && h.batches.length >= brewingVessels(g))
      throw Error("All brewing vessels are occupied.");
    const consumed = Object.values(r.inputs).reduce((a, n) => a + n, 0);
    if (pantryUsage(g) - consumed + r.yield > pantryCapacity(g))
      throw Error("Make pantry space for the finished batch.");
    for (const [id, n] of Object.entries(r.inputs)) h.pantry[id] -= n;
    if (r.bells)
      h.batches.push({
        recipe: r.id,
        readyAt: h.bell + brewingBells(g, r.bells),
        quantity: r.yield,
      });
    else {
      h.pantry[r.id] = (h.pantry[r.id] ?? 0) + r.yield;
      g.progression.totals.crafted++;
    }
    note(
      g,
      r.bells
        ? `${r.name} is fermenting through the coming bells.`
        : `Prepared ${r.yield} servings of ${r.name}.`,
    );
  }
}
export function advanceHospitality(g: Game) {
  const h = g.hospitality;
  h.bell++;
  if (h.bell % 48 === 0) {
    g.day++;
    note(g, "Dawn beside the Sallow. A new day begins.");
  }
  if (h.bell % CYCLE_BELLS === DAYLIGHT_BELLS) {
    g.open = false;
    note(g, "Nightfall. The doors close while the cellar continues its work.");
  }
  if (h.auto && h.bell % 48 === 0) {
    g.open = true;
    g.room.spawnIn = 0;
  }
  for (const batch of h.batches.filter((b) => b.readyAt <= h.bell)) {
    g.progression.totals.crafted++;
    g.progression.totals.brewed++;
    h.pantry[batch.recipe] = (h.pantry[batch.recipe] ?? 0) + batch.quantity;
    note(
      g,
      `${batch.quantity} ${recipes.find((r) => r.id === batch.recipe)!.name} finished fermenting.`,
    );
  }
  h.batches = h.batches.filter((b) => b.readyAt > h.bell);
}

export const roomUnlocked = (g: Game, id: string) =>
  id === "bar" || id === "serving"
    ? hasUpgrade(g, "bar")
    : id === "kitchen"
      ? hasUpgrade(g, "kitchen")
      : id === "dining"
        ? hasUpgrade(g, "hall")
        : true;
