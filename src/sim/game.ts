import {
  progressionSchema,
  initialProgression,
  earnXP,
  chooseMission,
  claimMission,
  type Branch,
} from "./progression";
import { autoplayCommand } from "./autoplay";
import { recipes } from "../content/hospitality";
import {
  hospitalitySchema,
  initialHospitality,
  roomUnlocked,
  hospitalityCommand,
  advanceHospitality,
  hasUpgrade,
  stockCapacity,
  stockUsage,
  guestCapacity,
  arrivalSteps,
  sellingPrice,
  type HospitalityCommand,
} from "./hospitality";
import { milestones } from "../content/milestones";
import {
  battleSchema,
  battleCommand,
  createBattle,
  presetDeck,
  presets,
  type BattleCommand,
} from "./battle";
import { z } from "zod";
import {
  roomNodes,
  customerTypes,
  duelists,
  type RoomNode,
} from "../content/tavern";
import {
  roomSchema,
  initialRoom,
  walkTo,
  advanceWalker,
  customerName,
} from "./room";
import {
  cards,
  cardById,
  sets,
  setById,
  DECK_SIZE,
  copyLimit,
  PACK_SLOTS,
  PACK_SIZE,
  ILLUMINATED_CHANCE,
  buyback,
} from "../content/catalog";
const count = z.number().int().min(0).max(1_000_000_000);
const id = z.string().refine((x) => Object.hasOwn(cardById, x), "Unknown card");
const setId = z
  .string()
  .refine((x) => Object.hasOwn(setById, x), "Unknown set");
const productSchema = z.object({
  stock: count,
  price: z.number().int().min(1).max(60),
  sold: count,
});
export const gameSchema = z
  .object({
    version: z.literal(3),
    progression: progressionSchema.default(initialProgression),
    hospitality: hospitalitySchema.default(initialHospitality),
    claimedMilestones: z
      .array(z.enum(["first-pack", "first-deck", "first-sale", "first-win"]))
      .max(4)
      .default([]),
    room: roomSchema,
    rng: z.number().int().min(0).max(4294967295),
    gold: count,
    day: z.number().int().min(1),
    tick: count,
    open: z.boolean(),
    reputation: count,
    revenue: count,
    visitors: count,
    wins: count,
    products: z.record(setId, productSchema),
    orders: z
      .array(
        z.object({
          setId,
          quantity: z.number().int().min(1).max(20),
          due: count,
        }),
      )
      .max(100),
    collection: z.record(id, count),
    deck: z.array(id).max(DECK_SIZE),
    savedDecks: z
      .array(
        z.object({
          name: z.string().trim().min(1).max(32),
          cards: z.array(id).length(DECK_SIZE),
        }),
      )
      .max(12)
      .default([]),
    lastPack: z.array(id).max(PACK_SIZE),
    lastBulkOpening: z
      .object({
        setId,
        packs: z.number().int().min(1).max(10000),
        cards: z.record(
          id,
          z.object({ total: count, foil: count, illuminated: count }),
        ),
      })
      .nullable()
      .default(null),
    foils: z.record(id, count),
    illuminated: z.record(id, count).default({}),
    lastPackIlluminated: z.array(z.boolean()).max(PACK_SIZE).default([]),
    lastPackFoils: z.array(z.boolean()).max(PACK_SIZE),
    legacyBattle: z.unknown().optional(),
    journal: z.array(z.string().max(200)).max(20),
    battle: battleSchema.nullable(),
  })
  .superRefine((s, ctx) => {
    if (s.lastBulkOpening) {
      const haul = s.lastBulkOpening,
        entries = Object.entries(haul.cards);
      if (
        entries.length > cards.filter((c) => c.setId === haul.setId).length ||
        entries.some(
          ([id, row]) =>
            cardById[id].setId !== haul.setId ||
            row.total < 1 ||
            row.foil + row.illuminated > row.total,
        ) ||
        entries.reduce((n, [, row]) => n + row.total, 0) !==
          haul.packs * PACK_SIZE ||
        entries.reduce((n, [, row]) => n + row.foil, 0) !== haul.packs ||
        entries.reduce((n, [, row]) => n + row.illuminated, 0) > haul.packs
      )
        ctx.addIssue({
          code: "custom",
          message: "Invalid bulk opening receipt",
        });
    }
    if (new Set(s.claimedMilestones).size !== s.claimedMilestones.length)
      ctx.addIssue({ code: "custom", message: "Duplicate milestone claim" });
    if (
      s.room.customers.some(
        (c) =>
          !setById[c.setId] ||
          (c.purpose !== "cards" &&
            !recipes.some((r) => r.id === c.itemId && r.type === c.purpose)),
      ) ||
      new Set(s.room.customers.map((c) => c.id)).size !==
        s.room.customers.length ||
      s.room.customers.some((c) => c.id >= s.room.nextId)
    )
      ctx.addIssue({ code: "custom", message: "Invalid customer references" });
    if (sets.some((set) => !s.products[set.id]))
      ctx.addIssue({ code: "custom", message: "Missing product" });
    if (s.lastPackFoils.length !== s.lastPack.length)
      ctx.addIssue({ code: "custom", message: "Pack treatment mismatch" });
    if (
      s.lastPackIlluminated.length &&
      s.lastPackIlluminated.length !== s.lastPack.length
    )
      ctx.addIssue({ code: "custom", message: "Illuminated pack mismatch" });
    for (const [id, n] of Object.entries(s.illuminated))
      if (n + (s.foils[id] ?? 0) > (s.collection[id] ?? 0))
        ctx.addIssue({ code: "custom", message: "Finishes exceed ownership" });
    for (const [id, n] of Object.entries(s.foils))
      if (n > (s.collection[id] ?? 0))
        ctx.addIssue({ code: "custom", message: "Foils exceed ownership" });
    if (
      new Set(s.savedDecks.map((d) => d.name.toLowerCase())).size !==
      s.savedDecks.length
    )
      ctx.addIssue({ code: "custom", message: "Duplicate deck names" });
    for (const d of s.savedDecks)
      for (const c of new Set(d.cards))
        if (d.cards.filter((id) => id === c).length > copyLimit(cardById[c]))
          ctx.addIssue({
            code: "custom",
            message: "Saved deck exceeds copy limit",
          });
    for (const c of new Set(s.deck)) {
      const n = s.deck.filter((x) => x === c).length;
      if (n > copyLimit(cardById[c]) || n > (s.collection[c] ?? 0))
        ctx.addIssue({
          code: "custom",
          message: "Deck ownership or copy limit",
        });
    }
  });
export type Game = z.infer<typeof gameSchema>;
export type { Battle, Side } from "./battle";
export type Command =
  | HospitalityCommand
  | { type: "claim-milestone"; id: string }
  | { type: "toggle" }
  | { type: "tick" }
  | { type: "room-step" }
  | { type: "walk"; destination: RoomNode }
  | { type: "order"; setId: string; quantity: number }
  | { type: "price"; setId: string; price: number }
  | { type: "open-pack"; setId: string }
  | { type: "open-all-packs"; setId: string }
  | { type: "craft-illuminated"; cardId: string }
  | { type: "deck"; cardId: string; add: boolean }
  | { type: "sell"; cardId: string; quantity?: number }
  | { type: "preset"; preset: string }
  | { type: "save-deck"; name: string }
  | { type: "load-deck"; name: string }
  | { type: "delete-deck"; name: string }
  | { type: "duel"; opponent?: string }
  | { type: "autoplay"; enabled: boolean }
  | { type: "auto-step" }
  | { type: "choose-mission"; branch: Branch; choice: "steady" | "bold" }
  | { type: "claim-mission"; branch: Branch }
  | BattleCommand
  | { type: "leave-duel" };
export const wholesale = (setId: string) =>
  setById[setId].release === 8 ? 34 : 32;
export function random(s: Game) {
  s.rng = (Math.imul(s.rng, 1664525) + 1013904223) >>> 0;
  return s.rng / 4294967296;
}
function shuffle(s: Game, list: string[]) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random(s) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function note(s: Game, msg: string) {
  s.journal = [msg, ...s.journal].slice(0, 20);
}
export function createGame(seed = 2447): Game {
  const deck = presetDeck();
  const collection: Record<string, number> = {};
  for (const p of presets.slice(0, 6))
    for (const id of new Set(presetDeck(p.id)))
      collection[id] = Math.max(
        collection[id] ?? 0,
        presetDeck(p.id).filter((x) => x === id).length,
      );
  return {
    version: 3,
    progression: initialProgression(),
    hospitality: initialHospitality(),
    room: initialRoom(),
    rng: seed >>> 0,
    gold: 860,
    day: 1,
    tick: 0,
    open: false,
    reputation: 0,
    revenue: 0,
    visitors: 0,
    wins: 0,
    products: Object.fromEntries(
      sets.map((set) => [
        set.id,
        { stock: set.release === 8 ? 12 : 5, price: 48, sold: 0 },
      ]),
    ),
    orders: [],
    collection,
    foils: {},
    illuminated: {},
    lastPackIlluminated: [],
    lastPackFoils: [],
    deck,
    lastPack: [],
    lastBulkOpening: null,
    journal: [
      "Your first stock has arrived. A new chapter begins at Grey Weir.",
    ],
    battle: null,
    savedDecks: [],
    claimedMilestones: [],
  };
}
const boosterSheets = new Map(
  sets.flatMap((set) =>
    ["common", "uncommon", "rare", "mythic", "basic", "special"].map(
      (sheet) =>
        [
          `${set.id}:${sheet}`,
          cards.filter(
            (c) =>
              c.setId === set.id &&
              (sheet === "basic"
                ? c.type === "Basic Resource"
                : sheet === "special"
                  ? c.type === "Special Resource"
                  : c.type !== "Basic Resource" && c.rarity === sheet),
          ),
        ] as const,
    ),
  ),
);
function openPackInto(s: Game, openingSetId: string) {
  const p = s.products[openingSetId];
  p.stock--;
  s.lastPack = [];
  s.lastPackFoils = [];
  s.lastPackIlluminated = [];
  for (const slot of PACK_SLOTS)
    for (let n = 0; n < slot.count; n++) {
      const roll = random(s);
      let sum = 0;
      let sheet = "common";
      for (const [rarity, weight] of Object.entries(slot.weights)) {
        sum += weight;
        if (roll < sum) {
          sheet = rarity;
          break;
        }
      }
      const pool = boosterSheets.get(`${openingSetId}:${sheet}`)!;
      if (!pool.length) throw Error("This booster sheet is empty.");
      const c = pool[Math.floor(random(s) * pool.length)],
        foil = slot.id === "foil";
      s.collection[c.id] = (s.collection[c.id] ?? 0) + 1;
      s.lastPack.push(c.id);
      s.lastPackFoils.push(foil);
      s.lastPackIlluminated.push(false);
      if (foil) s.foils[c.id] = (s.foils[c.id] ?? 0) + 1;
    }
  // Separate roll after normal collation. Never substitutes or adds a card.
  if (random(s) < ILLUMINATED_CHANCE) {
    const id = s.lastPack[11];
    s.lastPackIlluminated[11] = true;
    s.illuminated[id] = (s.illuminated[id] ?? 0) + 1;
  }
}
export const ILLUMINATION_COPIES = 5;
export function illuminationStatus(s: Game, cardId: string) {
  const owned = s.collection[cardId] ?? 0;
  const ordinary =
    owned - (s.foils[cardId] ?? 0) - (s.illuminated[cardId] ?? 0);
  const committed = s.deck.filter((id) => id === cardId).length;
  const spareOrdinary = Math.max(0, Math.min(ordinary, owned - committed));
  return {
    ordinary,
    spareOrdinary,
    canCraft: spareOrdinary >= ILLUMINATION_COPIES,
  };
}
export function applyCommand(state: Game, cmd: Command): Game {
  const s = structuredClone(state);
  s.hospitality ??= initialHospitality();
  if (
    [
      "auto-shop",
      "learn-skill",
      "upgrade-tavern",
      "buy-ingredient",
      "craft-recipe",
      "buy-recipe-supplies",
    ].includes(cmd.type)
  )
    hospitalityCommand(s, cmd as HospitalityCommand);
  s.savedDecks ??= [];
  s.claimedMilestones ??= [];
  if (cmd.type === "toggle") {
    s.hospitality.auto = false;
    s.open = !s.open;
    if (s.open) s.room.spawnIn = 0;
    note(
      s,
      s.open
        ? "The sign is turned. Welcome, travelers."
        : "The tavern is closed to shoppers.",
    );
  }
  if (cmd.type === "tick" && s.open) {
    s.tick++;
    const arrived = s.orders.filter((o) => o.due <= s.tick);
    for (const o of arrived) {
      s.products[o.setId].stock += o.quantity;
      note(s, `${o.quantity} ${setById[o.setId].name} boosters delivered.`);
    }
    s.orders = s.orders.filter((o) => o.due > s.tick);
  }
  if (cmd.type === "tick") advanceHospitality(s);

  if (cmd.type === "walk") {
    if (s.battle?.autoplay && s.battle.result === "playing") return s;
    if (!Object.hasOwn(roomNodes, cmd.destination))
      throw Error("Choose a place on the tavern floor.");
    if (!roomUnlocked(s, cmd.destination))
      throw Error("Build and equip that wing first.");
    walkTo(s.room.player, cmd.destination);
  }
  if (cmd.type === "room-step") {
    const room = s.room;
    room.step++;
    advanceWalker(room.player, 11);
    if (s.open) {
      room.spawnIn = Math.max(0, room.spawnIn - 1);
      if (room.spawnIn === 0 && room.customers.length < guestCapacity(s)) {
        const set = sets[Math.floor(random(s) * sets.length)],
          id = room.nextId++;
        const c = {
          id,
          kind: (id - 1) % customerTypes.length,
          setId: set.id,
          phase: "arriving" as const,
          wait: 0,
          purchased: false,
          saleAmount: 0,
          purpose: (hasUpgrade(s, "bar") && id % 4 === 0
            ? "drink"
            : hasUpgrade(s, "kitchen") && id % 3 !== 0
              ? "meal"
              : "cards") as "cards" | "meal" | "drink",
          itemId: null as string | null,
          node: "entrance" as const,
          x: roomNodes.entrance.x,
          y: roomNodes.entrance.y,
          route: [],
        };
        if (c.purpose !== "cards") {
          const menu = recipes.filter(
            (r) => r.type === c.purpose && hasUpgrade(s, r.requires),
          );
          const ready = menu.filter(
            (r) => (s.hospitality.pantry[r.id] ?? 0) > 0,
          );
          const choices = ready.length ? ready : menu;
          c.itemId = choices[(id - 1) % choices.length].id;
        }
        walkTo(
          c,
          c.purpose === "cards"
            ? "shelves"
            : c.purpose === "meal"
              ? "dining"
              : "bar",
        );
        room.customers.push(c);
        room.spawnIn = arrivalSteps(s);
        s.visitors++;
        note(s, `${customerName(c)} has arrived at the tavern.`);
      }
    }
    for (const c of room.customers) {
      if (!s.open && c.phase !== "leaving") {
        c.phase = "leaving";
        c.wait = 0;
        walkTo(c, "entrance");
      }
      advanceWalker(c, 7);
      if (c.route.length) continue;
      if (c.wait > 0) {
        c.wait--;
        continue;
      }
      if (c.phase === "arriving") {
        c.phase = "browsing";
        c.wait = 25;
      } else if (c.phase === "browsing") {
        c.phase = "checkout";
        c.wait = 15;
        walkTo(
          c,
          c.purpose === "cards"
            ? "counter"
            : c.purpose === "meal"
              ? "dining"
              : "bar",
        );
      } else if (c.phase === "dining") {
        c.phase = "leaving";
        walkTo(c, "entrance");
      } else if (c.phase === "checkout" && c.purpose !== "cards") {
        if (c.itemId && (s.hospitality.pantry[c.itemId] ?? 0) > 0) {
          s.hospitality.pantry[c.itemId]--;
          const price = sellingPrice(s, c.itemId);
          s.progression.totals.servings++;
          if (c.purpose === "meal") s.progression.totals.meals++;
          s.progression.totals.revenue += price;
          earnXP(s, 18);
          s.gold += price;
          s.revenue += price;
          s.reputation++;
          s.hospitality.xp++;
          if (c.purpose === "meal") s.hospitality.mealsSold++;
          else s.hospitality.drinksSold++;
          c.purchased = true;
          c.saleAmount = price;
          c.phase = "dining";
          c.wait = 45;
          note(
            s,
            `${customerName(c)} ordered ${recipes.find((r) => r.id === c.itemId)!.name}. +${price} crowns.`,
          );
        } else {
          c.phase = "leaving";
          walkTo(c, "entrance");
          note(s, `${customerName(c)} found the ${c.purpose} menu sold out.`);
        }
      } else if (c.phase === "checkout") {
        const p = s.products[c.setId],
          set = setById[c.setId],
          willingness = Math.max(0, Math.min(1, (72 - p.price) / 35));
        if (p.stock > 0 && random(s) < willingness) {
          p.stock--;
          p.sold++;
          s.progression.totals.sales++;
          s.progression.totals.revenue += p.price;
          earnXP(s, 12);
          s.gold += p.price;
          s.revenue += p.price;
          s.reputation++;
          s.hospitality.xp++;
          c.purchased = true;
          c.saleAmount = p.price;
          note(s, `${customerName(c)} bought ${set.name}. +${p.price} crowns.`);
        } else
          note(
            s,
            p.stock === 0
              ? `${customerName(c)} wanted ${set.name}; that shelf is empty.`
              : `${customerName(c)} found the price a little steep and left to think.`,
          );
        c.phase = "leaving";
        walkTo(c, "entrance");
      }
    }
    room.customers = room.customers.filter(
      (c) => c.phase !== "leaving" || c.route.length > 0,
    );
  }
  if (cmd.type === "order") {
    if (
      !setById[cmd.setId] ||
      !Number.isInteger(cmd.quantity) ||
      cmd.quantity < 1 ||
      cmd.quantity > 20
    )
      throw Error("Order 1–20 boosters.");
    if (s.orders.length >= 100) throw Error("The delivery ledger is full.");
    if (stockUsage(s) + cmd.quantity > stockCapacity(s))
      throw Error(
        "Sealed stock and incoming deliveries fill your shelves. Learn storage skills or expand the hall.",
      );
    const cost = wholesale(cmd.setId) * cmd.quantity;
    if (s.gold < cost) throw Error("Not enough crowns for this delivery.");
    s.gold -= cost;
    s.orders.push({
      setId: cmd.setId,
      quantity: cmd.quantity,
      due: s.tick + 3,
    });
    note(
      s,
      `Ordered ${cmd.quantity} ${setById[cmd.setId].name} boosters. Delivery after 3 open-shop bells.`,
    );
  }
  if (cmd.type === "price") {
    if (
      !s.products[cmd.setId] ||
      !Number.isInteger(cmd.price) ||
      cmd.price < 1 ||
      cmd.price > 60
    )
      throw Error("Prices must be 1–60 crowns.");
    s.products[cmd.setId].price = cmd.price;
  }
  if (cmd.type === "open-pack") {
    const p = s.products[cmd.setId];
    if (!p || p.stock < 1)
      throw Error("This set is out of stock. Order more boosters.");
    openPackInto(s, cmd.setId);
    note(
      s,
      `Opened ${setById[cmd.setId].name}. Fourteen cards, including one foil, added to your collection.`,
    );
  }
  if (cmd.type === "open-all-packs") {
    const packs = s.products[cmd.setId]?.stock;
    if (!packs || !setById[cmd.setId])
      throw Error("This set is out of stock. Order more boosters.");
    if (packs > 10000)
      throw Error("A single opening supports up to 10,000 packs.");
    const receipt: NonNullable<Game["lastBulkOpening"]> = {
      setId: cmd.setId,
      packs,
      cards: {},
    };
    for (let n = 0; n < packs; n++) {
      openPackInto(s, cmd.setId);
      s.lastPack.forEach((id, i) => {
        const row = (receipt.cards[id] ??= {
          total: 0,
          foil: 0,
          illuminated: 0,
        });
        row.total++;
        row.foil += Number(s.lastPackFoils[i]);
        row.illuminated += Number(s.lastPackIlluminated[i]);
      });
    }
    s.lastBulkOpening = receipt;
    note(
      s,
      `Opened all ${packs} packs of ${setById[cmd.setId].name}. ${packs * PACK_SIZE} cards added to your grimoire.`,
    );
  }
  if (cmd.type === "craft-illuminated") {
    if (!cardById[cmd.cardId] || !illuminationStatus(s, cmd.cardId).canCraft)
      throw Error(
        `Illumination needs ${ILLUMINATION_COPIES} ordinary spare copies of the same card. Your active deck and finishes are protected.`,
      );
    s.collection[cmd.cardId] -= ILLUMINATION_COPIES - 1;
    s.illuminated[cmd.cardId] = (s.illuminated[cmd.cardId] ?? 0) + 1;
    note(
      s,
      `Bound five ordinary copies of ${cardById[cmd.cardId].name} into one Illuminated edition.`,
    );
  }
  if (cmd.type === "preset") {
    if (!presets.some((p) => p.id === cmd.preset))
      throw Error("Unknown deck recipe.");
    const deck = presetDeck(cmd.preset);
    for (const id of new Set(deck))
      if (deck.filter((x) => x === id).length > (s.collection[id] ?? 0))
        throw Error("Collect the missing copies before using this recipe.");
    s.deck = deck;
    note(
      s,
      `Prepared ${presets.find((p) => p.id === cmd.preset)!.name}: 100 cards, 40 resources.`,
    );
  }
  if (cmd.type === "deck") {
    const c = cardById[cmd.cardId];
    if (!c) throw Error("Unknown card.");
    const n = s.deck.filter((x) => x === c.id).length;
    if (cmd.add) {
      if (s.deck.length >= DECK_SIZE)
        throw Error("Your deck is full. Remove a card first.");
      if (n >= copyLimit(c) || n >= (s.collection[c.id] ?? 0))
        throw Error(
          "No available copy, or the four-copy limit (unlimited basic resources) is reached.",
        );
      s.deck.push(c.id);
    } else {
      const i = s.deck.indexOf(c.id);
      if (i >= 0) s.deck.splice(i, 1);
    }
  }
  if (cmd.type === "sell") {
    const c = cardById[cmd.cardId],
      quantity = cmd.quantity ?? 1;
    if (
      !c ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      (s.collection[c.id] ?? 0) - s.deck.filter((x) => x === c.id).length <
        quantity
    )
      throw Error("Only spare copies outside your deck can be sold.");
    s.collection[c.id] -= quantity;
    // Sell ordinary copies first, then foil, preserving the scarce edition last.
    s.illuminated[c.id] = Math.min(
      s.illuminated[c.id] ?? 0,
      s.collection[c.id],
    );
    s.foils[c.id] = Math.min(
      s.foils[c.id] ?? 0,
      s.collection[c.id] - s.illuminated[c.id],
    );
    s.gold += buyback(c) * quantity;
  }
  if (["save-deck", "load-deck", "delete-deck"].includes(cmd.type)) {
    const action = cmd as Extract<Command, { name: string }>;
    const name = action.name.trim();
    if (!name || name.length > 32)
      throw Error("Give your deck a name of 1–32 characters.");
    const index = s.savedDecks.findIndex(
      (d) => d.name.toLowerCase() === name.toLowerCase(),
    );
    if (action.type === "save-deck") {
      if (s.deck.length !== DECK_SIZE)
        throw Error("Complete your 100-card deck before saving it.");
      if (index < 0 && s.savedDecks.length >= 12)
        throw Error("Your deck shelf has room for twelve books.");
      const deck = { name, cards: [...s.deck] };
      if (index < 0) s.savedDecks.push(deck);
      else s.savedDecks[index] = deck;
      note(s, `Saved deck: ${name}.`);
    } else {
      if (index < 0) throw Error("That saved deck is no longer on your shelf.");
      if (action.type === "delete-deck") s.savedDecks.splice(index, 1);
      else {
        const deck = s.savedDecks[index].cards;
        for (const id of new Set(deck))
          if (deck.filter((c) => c === id).length > (s.collection[id] ?? 0))
            throw Error(
              `You need more copies of ${cardById[id].name} to load this deck.`,
            );
        s.deck = [...deck];
        note(s, `Prepared deck: ${name}.`);
      }
    }
  }
  if (cmd.type === "claim-milestone") {
    const milestone = milestones.find((m) => m.id === cmd.id);
    if (
      !milestone ||
      s.claimedMilestones.includes(milestone.id) ||
      !milestone.ready(s)
    )
      throw Error("This chapter is not ready to be claimed.");
    s.claimedMilestones.push(milestone.id);
    s.gold += milestone.reward;
    note(s, `Completed ${milestone.title}. +${milestone.reward} crowns.`);
  }
  if (cmd.type === "choose-mission") chooseMission(s, cmd.branch, cmd.choice);
  if (cmd.type === "claim-mission") claimMission(s, cmd.branch);
  if (cmd.type === "duel") {
    if (s.battle) throw Error("Finish or concede your current duel first.");
    if (s.deck.length !== DECK_SIZE)
      throw Error("Build a 100-card deck before sitting down.");
    const guest =
      duelists.find((p) => p.id === cmd.opponent) ??
      duelists.find((p) => p.deck === cmd.opponent) ??
      duelists[s.wins % duelists.length];
    const opponent = presets.find((p) => p.id === guest.deck)!;
    s.battle = createBattle(
      shuffle(s, s.deck),
      shuffle(s, presetDeck(opponent.id)),
      `${guest.name} · ${opponent.name}`,
    );
  }
  if (cmd.type === "autoplay") {
    if (!s.battle || s.battle.result !== "playing")
      throw Error("Begin a duel before enabling autoplay.");
    s.battle.autoplay = cmd.enabled;
    if (cmd.enabled) walkTo(s.room.player, "table");
  }
  if (
    [
      "auto-step",
      "play",
      "tap",
      "pass",
      "end-turn",
      "combat",
      "declare",
      "block",
      "damage",
      "hero",
      "mulligan",
      "battle-tick",
      "battle-clock",
    ].includes(cmd.type)
  ) {
    if (!s.battle) throw Error("No active duel.");
    if (cmd.type === "auto-step") {
      if (
        !s.battle.autoplay ||
        s.battle.result !== "playing" ||
        s.room.player.node !== "table" ||
        s.room.player.route.length
      )
        return s;
      battleCommand(s.battle, autoplayCommand(s.battle));
    } else {
      if (s.battle.autoplay)
        throw Error("Take control to play this duel yourself.");
      battleCommand(s.battle, cmd as BattleCommand);
    }
    if (s.battle.result !== "playing" && !s.battle.rewarded) {
      const won = s.battle.result === "won",
        loop = s.battle.autoplay;
      s.progression.totals[won ? "wins" : "losses"]++;
      s.progression.lastDuel = { opponent: s.battle.opponent, won };
      earnXP(s, won ? 60 : 25);
      s.battle.rewarded = true;
      if (won) {
        s.gold += 35;
        s.wins++;
        s.reputation += 5;
        s.battle.rewarded = true;
        note(s, "Won a friendly duel. +35 crowns, +5 renown.");
      }
      if (loop) {
        const previous = duelists.find((d) =>
          s.battle!.opponent.startsWith(d.name + " · "),
        )!;
        const start = previous ? duelists.indexOf(previous) : -1;
        const next = Array.from(
          { length: duelists.length },
          (_, i) => duelists[(start + 1 + i) % duelists.length],
        ).find((d) => d.id !== previous?.id && d.deck !== previous?.deck)!;
        const recipe = presets.find((p) => p.id === next.deck)!;
        s.battle = createBattle(
          shuffle(s, s.deck),
          shuffle(s, presetDeck(next.deck)),
          `${next.name} · ${recipe.name}`,
        );
        s.battle.autoplay = true;
      }
    }
  }
  if (cmd.type === "leave-duel") {
    if (s.battle?.result === "playing")
      note(s, "You conceded a friendly duel. No crowns were lost.");
    s.battle = null;
  }
  return s;
}
export const SAVE_KEY = "hearth-hollow-v1";
export function decodeSave(raw: string): Game {
  if (raw.length > 1_000_000) throw Error("Save is too large.");
  const data: unknown = JSON.parse(raw);
  if (
    data &&
    typeof data === "object" &&
    "version" in data &&
    (data.version === 1 || data.version === 2)
  ) {
    const old = data as Record<string, any>;
    // Validate inherited references and inventory before granting migration supplies.
    z.object({
      collection: z.record(id, count),
      deck: z.array(id).max(100),
    }).parse(old);
    const fresh = createGame(old.rng),
      collection = { ...old.collection };
    for (const [id, n] of Object.entries(fresh.collection))
      collection[id] = Math.max(collection[id] ?? 0, n);
    const retained: string[] = old.deck;
    let deck = retained.length === 100 ? retained : [...retained];
    if (deck.length !== 100) {
      for (const id of fresh.deck) {
        if (deck.length === 100) break;
        if (deck.filter((x) => x === id).length < copyLimit(cardById[id]))
          deck.push(id);
      }
    }
    for (const id of new Set(deck))
      collection[id] = Math.max(
        collection[id] ?? 0,
        deck.filter((x) => x === id).length,
      );
    return gameSchema.parse({
      ...old,
      version: 3,
      hospitality: initialHospitality(),
      room: old.room ?? initialRoom(),
      collection,
      deck,
      foils: {},
      illuminated: {},
      lastPackIlluminated: [],
      lastPackFoils: (old.lastPack ?? []).map(() => false),
      products: Object.fromEntries(
        Object.entries(old.products as Record<string, { price: number }>).map(
          ([id, p]) => [id, { ...p, price: p.price === 12 ? 48 : p.price }],
        ),
      ),
      battle: null,
      legacyBattle: old.battle ?? undefined,
      journal: [
        "New rules: starter supplies added. Any earlier duel is archived; sit down for a fresh game.",
        ...(old.journal ?? []),
      ].slice(0, 20),
    });
  }
  return gameSchema.parse(data);
}
export function owned(s: Game) {
  return Object.values(s.collection).reduce((a, b) => a + b, 0);
}
