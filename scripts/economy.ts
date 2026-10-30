import { mkdir, writeFile } from "node:fs/promises";
import { applyCommand, createGame, type Game } from "../src/sim/game";
import { sets } from "../src/content/catalog";
import { upgrades } from "../src/content/hospitality";
import {
  CYCLE_BELLS,
  hasSkill,
  hasUpgrade,
  skillPoints,
  stockCapacity,
  stockUsage,
} from "../src/sim/hospitality";
import { keeperLevel } from "../src/sim/progression";
// Long-session shop diagnostic: simple keeper policies run the card shop for
// many in-game days through the public commands at the pace the interface
// uses (one bell every 4 s, one room step every 100 ms, so forty steps per
// bell) and record income, costs, stock, missed sales and progression per
// day. Diagnostic only: it does not model a human's pack opening, duels or
// hospitality cooking. ECONOMY_DAYS, ECONOMY_SEEDS and ECONOMY_OUT adjust it.
const DAYS = Number(process.env.ECONOMY_DAYS ?? 30),
  SEEDS = Number(process.env.ECONOMY_SEEDS ?? 3),
  STEPS_PER_BELL = 40,
  out = process.env.ECONOMY_OUT ?? "docs/reports/economy.json";
type Keeper = {
  id: string;
  price: number;
  restockTo: number;
  grow: boolean;
  note: string;
};
const keepers: Keeper[] = [
  {
    id: "steady",
    price: 48,
    restockTo: 8,
    grow: false,
    note: "Default price, keeps eight packs of every set on the shelf, never expands.",
  },
  {
    id: "thrifty",
    price: 40,
    restockTo: 8,
    grow: false,
    note: "Prices packs at 40 crowns so nearly every browser buys.",
  },
  {
    id: "premium",
    price: 56,
    restockTo: 8,
    grow: false,
    note: "Prices packs at 56 crowns and accepts walk-aways.",
  },
  {
    id: "growing",
    price: 48,
    restockTo: 12,
    grow: true,
    note: "Default price; buys the dining wing, storage and welcome skills when affordable, keeping a 300-crown reserve.",
  },
];
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0),
  RESERVE = 300,
  hallCost = upgrades.find((u) => u.id === "hall")!.cost,
  openingPurse = createGame(1).gold;
function dawn(s: Game, k: Keeper) {
  // Pricing and restocking happen once per day at dawn, through the same
  // commands the interface sends; rejected commands leave the state untouched.
  for (const set of sets)
    if (s.products[set.id].price !== k.price)
      s = applyCommand(s, { type: "price", setId: set.id, price: k.price });
  if (k.grow) {
    for (const id of ["organized", "welcome", "fame", "warehouse"])
      if (!hasSkill(s, id))
        try {
          s = applyCommand(s, { type: "learn-skill", id });
        } catch {
          // Needs more points or a prerequisite.
        }
    if (!hasUpgrade(s, "hall") && s.gold >= hallCost + RESERVE)
      s = applyCommand(s, { type: "upgrade-tavern", id: "hall" });
  }
  for (const set of sets) {
    const p = s.products[set.id],
      incoming = sum(
        s.orders.filter((o) => o.setId === set.id).map((o) => o.quantity),
      ),
      want = Math.min(20, k.restockTo - p.stock - incoming);
    if (want <= 0) continue;
    try {
      s = applyCommand(s, { type: "order", setId: set.id, quantity: want });
    } catch {
      // Not enough crowns or shelf room; the day runs with what is there.
    }
  }
  return s;
}
function run(k: Keeper, seed: number) {
  let s = applyCommand(createGame(seed), { type: "auto-shop", enabled: true });
  const days: unknown[] = [];
  let seen = s.noticeSequence,
    spent = 0;
  for (let day = 1; day <= DAYS; day++) {
    const goldBefore = s.gold,
      revenueBefore = s.revenue,
      visitorsBefore = s.visitors,
      soldBefore = sum(Object.values(s.products).map((p) => p.sold));
    const before = s.gold;
    s = dawn(s, k);
    spent += before - s.gold;
    let empty = 0,
      steep = 0,
      full = 0;
    for (let bell = 0; bell < CYCLE_BELLS; bell++) {
      for (let step = 0; step < STEPS_PER_BELL; step++) {
        s = applyCommand(s, { type: "room-step" });
        for (const n of s.notices)
          if (n.id > seen) {
            if (n.text.includes("shelf is empty")) empty++;
            if (n.text.includes("steep")) steep++;
          }
        seen = s.noticeSequence;
      }
      if (s.room.customers.length >= 6) full++;
      s = applyCommand(s, { type: "tick" });
    }
    const sold = sum(Object.values(s.products).map((p) => p.sold));
    days.push({
      day,
      gold: s.gold,
      net: s.gold - goldBefore,
      revenue: s.revenue - revenueBefore,
      sales: sold - soldBefore,
      visitors: s.visitors - visitorsBefore,
      emptyShelf: empty,
      tooSteep: steep,
      bellsAtCapacity: full,
      stock: sum(Object.values(s.products).map((p) => p.stock)),
      storage: `${stockUsage(s)}/${stockCapacity(s)}`,
      reputation: s.reputation,
      level: keeperLevel(s.progression.xp),
      skillPoints: skillPoints(s),
      upgrades: [...s.hospitality.upgrades],
    });
  }
  return { seed, spent, days };
}
const report = {
  generated: new Date().toISOString(),
  notes:
    "Diagnostic only: scripted keepers run the card shop through public commands at the interface's pace (40 room steps per bell, 48 bells per day, doors open for 38) for the stated days. No pack opening, duels, cooking or human pricing; not a pacing certification.",
  pace: { stepsPerBell: STEPS_PER_BELL, bellsPerDay: CYCLE_BELLS, days: DAYS },
  keepers: [] as unknown[],
};
for (const k of keepers) {
  const runs = Array.from({ length: SEEDS }, (_, i) => run(k, 1 + i * 7));
  const last = runs.map(
    (r) => r.days.at(-1) as { gold: number; level: number; reputation: number },
  );
  const perDay = (key: string) =>
    sum(
      runs.flatMap((r) =>
        r.days.map((d) => (d as Record<string, number>)[key]),
      ),
    ) /
    (SEEDS * DAYS);
  const summary = {
    id: k.id,
    note: k.note,
    price: k.price,
    endGold: sum(last.map((d) => d.gold)) / SEEDS,
    endLevel: sum(last.map((d) => d.level)) / SEEDS,
    endReputation: sum(last.map((d) => d.reputation)) / SEEDS,
    netPerDay: perDay("net"),
    revenuePerDay: perDay("revenue"),
    salesPerDay: perDay("sales"),
    visitorsPerDay: perDay("visitors"),
    emptyShelfPerDay: perDay("emptyShelf"),
    tooSteepPerDay: perDay("tooSteep"),
    bellsAtCapacityPerDay: perDay("bellsAtCapacity"),
    firstDayBelowStart: Math.min(
      ...runs.map(
        (r) =>
          (
            r.days.find((d) => (d as { gold: number }).gold < openingPurse) as
              { day: number } | undefined
          )?.day ?? Infinity,
      ),
    ),
    runs,
  };
  report.keepers.push(summary);
  console.log(
    `${k.id.padEnd(8)} price ${k.price}  net/day ${summary.netPerDay.toFixed(0).padStart(4)}  sales/day ${summary.salesPerDay.toFixed(1)}  visitors/day ${summary.visitorsPerDay.toFixed(1)}  empty/day ${summary.emptyShelfPerDay.toFixed(1)}  steep/day ${summary.tooSteepPerDay.toFixed(1)}  end gold ${summary.endGold.toFixed(0)}  level ${summary.endLevel.toFixed(1)}  rep ${summary.endReputation.toFixed(0)}`,
  );
}
await mkdir("docs/reports", { recursive: true });
await writeFile(out, JSON.stringify(report, null, 2) + "\n");
