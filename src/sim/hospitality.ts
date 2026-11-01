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
    if (spentSkillCost(s.skills) > skillBudget(s.xp))
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
/** The bell at which dusk begins; night deepens until the doors close at DAYLIGHT_BELLS. */
export const DUSK_BELLS = 34;
/** Unspent skill points: a budget of two plus one per five hospitality XP, less the cost of every learned skill. One definition for the command and the save schema. */
export function skillBudget(xp: number) {
  return 2 + Math.floor(xp / 5);
}
export function spentSkillCost(learned: readonly string[]) {
  return skills
    .filter((k) => learned.includes(k.id))
    .reduce((n, k) => n + k.cost, 0);
}
/** Open the doors: the sign turns and the first guest may arrive at once. Shared by the sign, automatic hours and dawn. */
export function openDoors(g: Game) {
  if (!g.open) g.room.spawnIn = 0;
  g.open = true;
}
export const nightIntensity = (g: Game) => {
  const bell = g.hospitality.bell % CYCLE_BELLS;
  return bell < DUSK_BELLS
    ? 0
    : bell < DAYLIGHT_BELLS
      ? (bell - DUSK_BELLS) / (DAYLIGHT_BELLS - DUSK_BELLS)
      : bell < 46
        ? 1
        : (CYCLE_BELLS - bell) / 2;
};
export const clockPhase = (g: Game) => {
  const bell = g.hospitality.bell % CYCLE_BELLS;
  return bell < 4
    ? "Dawn"
    : bell < DUSK_BELLS
      ? "Daylight"
      : bell < DAYLIGHT_BELLS
        ? "Dusk"
        : "Night";
};
export const skillPoints = (g: Game) =>
  skillBudget(g.hospitality.xp) - spentSkillCost(g.hospitality.skills);
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
    // Automatic hours set the sign by the clock; an open shop stays open without a fresh arrival.
    if (h.auto) {
      if (h.bell % CYCLE_BELLS < DAYLIGHT_BELLS) openDoors(g);
      else g.open = false;
    }
  }
  if (cmd.type === "learn-skill") {
    const k = skills.find((k) => k.id === cmd.id);
    if (!k) throw Error("Unknown skill.");
    if (hasSkill(g, k.id)) throw Error(`${k.name} is already learned.`);
    if (k.requires && !hasSkill(g, k.requires))
      throw Error(
        `${k.name} needs ${skills.find((p) => p.id === k.requires)?.name ?? k.requires} first.`,
      );
    if (k.cost > skillPoints(g))
      throw Error(`${k.name} needs ${k.cost} unspent skill points.`);
    h.skills.push(k.id);
    note(g, `Learned ${k.name}.`);
  }
  if (cmd.type === "upgrade-tavern") {
    const u = upgrades.find((u) => u.id === cmd.id);
    if (!u) throw Error("Unknown wing.");
    if (hasUpgrade(g, u.id)) throw Error(`${u.name} is already built.`);
    if (u.requires && !hasUpgrade(g, u.requires))
      throw Error(
        `${u.name} needs ${upgrades.find((p) => p.id === u.requires)?.name ?? u.requires} first.`,
      );
    if (g.gold < u.cost) throw Error(`${u.name} costs ${u.cost} crowns.`);
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
  if (h.bell % CYCLE_BELLS === 0) {
    g.day++;
    note(g, "Dawn beside the Sallow. A new day begins.");
  }
  // Nightfall closes the doors whatever the sign says; the notice is for a shop that was open. Dawn reopens only under automatic hours.
  if (g.open && h.bell % CYCLE_BELLS === DAYLIGHT_BELLS) {
    g.open = false;
    note(g, "Nightfall. The doors close while the cellar continues its work.");
  }
  if (h.auto && h.bell % CYCLE_BELLS === 0) openDoors(g);
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
