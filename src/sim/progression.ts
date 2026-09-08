import { z } from "zod";
import { cards, cardById } from "../content/catalog";
const natural = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const branch = z.object({
  tier: natural.min(1).default(1),
  choice: z.enum(["steady", "bold"]).nullable().default(null),
  baseline: natural.default(0),
});
export const progressionSchema = z.object({
  xp: natural.default(0),
  totals: z
    .object({
      wins: natural.default(0),
      losses: natural.default(0),
      draws: natural.default(0),
      sales: natural.default(0),
      revenue: natural.default(0),
      servings: natural.default(0),
      meals: natural.default(0),
      crafted: natural.default(0),
      brewed: natural.default(0),
    })
    .default({
      wins: 0,
      losses: 0,
      draws: 0,
      sales: 0,
      revenue: 0,
      servings: 0,
      meals: 0,
      crafted: 0,
      brewed: 0,
    }),
  missions: z
    .object({
      battle: branch,
      trade: branch,
      tavern: branch,
      craft: branch.default({ tier: 1, choice: null, baseline: 0 }),
    })
    .default({
      battle: { tier: 1, choice: null, baseline: 0 },
      trade: { tier: 1, choice: null, baseline: 0 },
      tavern: { tier: 1, choice: null, baseline: 0 },
      craft: { tier: 1, choice: null, baseline: 0 },
    }),
  lastReward: z
    .object({
      label: z.string(),
      crowns: natural,
      cards: z.record(
        z.string().refine((id) => !!cardById[id], "Unknown reward card"),
        natural,
      ),
    })
    .nullable()
    .default(null),
  lastDuel: z
    .object({
      opponent: z.string(),
      won: z.boolean(),
      drawn: z.boolean().optional(),
    })
    .nullable()
    .default(null),
});
export type Progression = z.infer<typeof progressionSchema>;
export const initialProgression = () => progressionSchema.parse({});
export type Branch = "battle" | "trade" | "tavern" | "craft";
export const branches: Branch[] = ["battle", "trade", "tavern", "craft"];
export const xpThreshold = (level: number) =>
  25 * (level - 1) * (level - 1) + 75 * (level - 1);
export const keeperLevel = (xp: number) =>
  Math.floor((-75 + Math.sqrt(5625 + 100 * xp)) / 50) + 1;
type Ledger = {
  progression: Progression;
  gold: number;
  collection: Record<string, number>;
};
function reward(
  s: Ledger,
  label: string,
  crowns: number,
  quantity: number,
  seed: number,
  rarity: string,
) {
  const pool = cards.filter((c) => c.rarity === rarity),
    card = pool[(seed * 37) % pool.length];
  s.gold += crowns;
  s.collection[card.id] = (s.collection[card.id] ?? 0) + quantity;
  const receipt = s.progression.lastReward;
  if (receipt) {
    receipt.label = label;
    receipt.crowns += crowns;
    receipt.cards[card.id] = (receipt.cards[card.id] ?? 0) + quantity;
  } else
    s.progression.lastReward = {
      label,
      crowns,
      cards: { [card.id]: quantity },
    };
}
export function earnXP(s: Ledger, amount: number) {
  const before = keeperLevel(s.progression.xp);
  s.progression.xp += amount;
  const after = keeperLevel(s.progression.xp);
  if (after > before) {
    s.progression.lastReward = null;
    for (let level = before + 1; level <= after; level++)
      reward(
        s,
        `Keeper level ${after}`,
        20 + level * 5,
        1 + Math.floor(Math.log2(level)),
        level,
        level % 10 === 0 ? "mythic" : level % 5 === 0 ? "rare" : "uncommon",
      );
  }
}
export function mission(
  p: Progression,
  key: Branch,
  choice = p.missions[key].choice ?? "steady",
) {
  const tier = p.missions[key].tier,
    t = p.totals;
  if (key === "craft")
    return choice === "steady"
      ? {
          title: "The well-used recipe book",
          detail: "Finish batches of food or drink",
          target: 3 + 2 * tier,
          current: t.crafted,
        }
      : {
          title: "Patience in the cellar",
          detail: "Finish fermented batches",
          target: 1 + 2 * tier,
          current: t.brewed,
        };
  if (key === "battle")
    return choice === "steady"
      ? {
          title: "Stories across the table",
          detail: "Finish friendly duels",
          target: 2 + tier,
          current: t.wins + t.losses + t.draws,
        }
      : {
          title: "A winning chronicle",
          detail: "Win friendly duels",
          target: 1 + tier,
          current: t.wins,
        };
  if (key === "trade")
    return choice === "steady"
      ? {
          title: "A bustling counter",
          detail: "Sell boosters to guests",
          target: 3 + 2 * tier,
          current: t.sales,
        }
      : {
          title: "The honest ledger",
          detail: "Earn crowns from guest purchases",
          target: 100 + 50 * tier,
          current: t.revenue,
        };
  return choice === "steady"
    ? {
        title: "A welcome at every table",
        detail: "Serve meals or drinks to guests",
        target: 2 + tier,
        current: t.servings,
      }
    : {
        title: "Feasts remembered",
        detail: "Serve meals to guests",
        target: 1 + tier,
        current: t.meals,
      };
}
export function chooseMission(
  s: Ledger,
  key: Branch,
  choice: "steady" | "bold",
) {
  if (!branches.includes(key) || !["steady", "bold"].includes(choice))
    throw Error("Choose an available mission branch.");
  const b = s.progression.missions[key];
  if (b.choice)
    throw Error("Finish your active mission before choosing the next branch.");
  b.choice = choice;
  b.baseline = mission(s.progression, key, choice).current;
}
export function claimMission(s: Ledger, key: Branch) {
  if (!branches.includes(key))
    throw Error("Choose an available mission branch.");
  const b = s.progression.missions[key],
    m = mission(s.progression, key);
  if (!b.choice || m.current - b.baseline < m.target)
    throw Error("This mission is not complete.");
  const tier = b.tier;
  b.tier++;
  b.choice = null;
  b.baseline = 0;
  s.progression.lastReward = null;
  earnXP(s, 40 + 20 * tier);
  reward(
    s,
    `${m.title} · chapter ${tier}`,
    30 + 10 * tier,
    1 + Math.floor(tier / 5),
    tier * 3 + branches.indexOf(key),
    tier % 10 === 0 ? "mythic" : tier % 5 === 0 ? "rare" : "uncommon",
  );
}
