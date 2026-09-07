import { describe, it, expect } from "vitest";
import {
  createGame,
  applyCommand,
  decodeSave,
  gameSchema,
  owned,
  wholesale,
  type Game,
  type Command,
} from "./game";
import {
  cards,
  sets,
  cardById,
  traditions,
  isResource,
  copyLimit,
  buyback,
} from "../content/catalog";
import { presets, presetDeck } from "./battle";
const run = (s: Game, cmds: Command[]) => cmds.reduce(applyCommand, s);
it("defines eight complete 80-card expansions with all types, colors, rarities and traditions", () => {
  expect(sets).toHaveLength(8);
  expect(cards).toHaveLength(640);
  expect(new Set(cards.map((c) => c.id)).size).toBe(640);
  for (const set of sets) {
    const pool = cards.filter((c) => c.setId === set.id);
    expect(pool).toHaveLength(80);
    for (const type of [
      "Creature",
      "Basic Resource",
      "Special Resource",
      "Instant",
      "Sorcery",
      "Artifact",
      "Enchantment",
      "Hero",
    ])
      expect(pool.some((c) => c.type === type)).toBe(true);
    for (const rarity of ["common", "uncommon", "rare", "mythic"])
      expect(pool.some((c) => c.rarity === rarity)).toBe(true);
    expect(pool.filter((c) => c.type === "Basic Resource")).toHaveLength(6);
    expect(pool.every((c) => c.rules.length > 0 && c.colored <= c.cost)).toBe(
      true,
    );
  }
  expect(new Set(cards.map((c) => c.tradition))).toEqual(new Set(traditions));
});
it("provides twelve legal collectable 100-card recipes with 40 resources and a useful curve", () => {
  for (const p of presets) {
    const initial = createGame();
    for (const id of presetDeck(p.id))
      initial.collection[id] = (initial.collection[id] ?? 0) + 1;
    const s = applyCommand(initial, { type: "preset", preset: p.id });
    expect(s.deck).toHaveLength(100);
    expect(s.deck.filter((id) => isResource(cardById[id]))).toHaveLength(40);
    expect(
      s.deck.filter((id) => cardById[id].cost === 4).length,
    ).toBeGreaterThan(0);
    expect(gameSchema.safeParse(s).success).toBe(true);
    for (const id of new Set(s.deck))
      expect(s.deck.filter((x) => x === id).length).toBeLessThanOrEqual(
        copyLimit(cardById[id]),
      );
  }
  expect(
    presetDeck("tempo").filter((id) => cardById[id].effect === "counter")
      .length,
  ).toBeGreaterThan(
    presetDeck().filter((id) => cardById[id].effect === "counter").length,
  );
});
it("charges wholesale once and delivers after three open bells", () => {
  let s = applyCommand(createGame(), {
    type: "order",
    setId: "first-oaths",
    quantity: 5,
  });
  expect(s.gold).toBe(860 - 5 * wholesale("first-oaths"));
  s = applyCommand(s, { type: "tick" });
  expect(s.tick).toBe(0);
  s = run(s, [{ type: "toggle" }, { type: "tick" }, { type: "tick" }]);
  expect(s.orders).toHaveLength(1);
  s = applyCommand(s, { type: "tick" });
  expect(s.products["first-oaths"].stock).toBe(10);
  expect(s.orders).toHaveLength(0);
});
it("rejects invalid prices and orders atomically", () => {
  const s = createGame(),
    before = structuredClone(s);
  for (const quantity of [-1, 0, 21, NaN, 1.2])
    expect(() =>
      applyCommand(s, { type: "order", setId: "first-oaths", quantity }),
    ).toThrow();
  for (const price of [-1, 0, 61, NaN, 1.2])
    expect(() =>
      applyCommand(s, { type: "price", setId: "rekindled", price }),
    ).toThrow();
  expect(s).toEqual(before);
});
it("customer arrival, purchase and departure conserve stock and crowns exactly", () => {
  let s = applyCommand(createGame(17), { type: "toggle" });
  for (const p of Object.values(s.products)) p.price = 1;
  for (let i = 0; i < 750; i++) s = applyCommand(s, { type: "room-step" });
  const sold = Object.values(s.products).reduce((a, p) => a + p.sold, 0);
  expect(sold).toBeGreaterThan(0);
  expect(s.gold).toBe(860 + sold);
  expect(s.revenue).toBe(sold);
  expect(
    Object.values(s.products).reduce((a, p) => a + p.stock, 0) + sold,
  ).toBe(47);
  expect(s.visitors).toBeGreaterThan(s.room.customers.length);
  s = applyCommand(s, { type: "toggle" });
  const revenue = s.revenue;
  for (let i = 0; i < 500; i++) s = applyCommand(s, { type: "room-step" });
  expect(s.room.customers).toHaveLength(0);
  expect(s.revenue).toBe(revenue);
});
it("closes at dusk without inventing customers or sales in day ticks", () => {
  let s = applyCommand(createGame(), { type: "toggle" });
  for (let i = 0; i < 24; i++) s = applyCommand(s, { type: "tick" });
  expect(s.day).toBe(1);
  for (let i = 0; i < 24; i++) s = applyCommand(s, { type: "tick" });
  expect(s.day).toBe(2);
  expect(s.open).toBe(false);
  expect(s.visitors).toBe(0);
});
it("pack slots produce exactly 14 owned cards, one resource slot and one foil", () => {
  for (const set of sets) {
    const before = createGame(),
      s = applyCommand(before, { type: "open-pack", setId: set.id });
    expect(owned(s) - owned(before)).toBe(14);
    expect(s.products[set.id].stock).toBe(before.products[set.id].stock - 1);
    expect(
      s.lastPack.slice(0, 7).every((id) => cardById[id].rarity === "common"),
    ).toBe(true);
    expect(
      s.lastPack.slice(7, 10).every((id) => cardById[id].rarity === "uncommon"),
    ).toBe(true);
    expect(isResource(cardById[s.lastPack[10]])).toBe(true);
    expect(["rare", "mythic"]).toContain(cardById[s.lastPack[11]].rarity);
    expect(s.lastPackFoils.filter(Boolean)).toHaveLength(1);
    expect(s.lastPackFoils[13]).toBe(true);
    expect(s.foils[s.lastPack[13]]).toBe(1);
    expect(gameSchema.safeParse(s).success).toBe(true);
  }
});
it("samples configured slot chances and pack-wide mythic odds over 10,000 packs", () => {
  let s = createGame(2026);
  s.products.rekindled.stock = 10000;
  let rareMyth = 0,
    anyMyth = 0,
    special = 0,
    illuminated = 0;
  const wildcard = { common: 0, uncommon: 0, rare: 0, mythic: 0 },
    foil = { ...wildcard };
  let value = 0;
  for (let i = 0; i < 10000; i++) {
    s = applyCommand(s, { type: "open-pack", setId: "rekindled" });
    const p = s.lastPack.map((id) => cardById[id]);
    rareMyth += Number(p[11].rarity === "mythic");
    anyMyth += Number(p.some((c) => c.rarity === "mythic"));
    special += Number(p[10].type === "Special Resource");
    illuminated += Number(s.lastPackIlluminated[11]);
    expect(s.lastPackIlluminated.filter(Boolean).length).toBeLessThanOrEqual(1);
    expect(s.lastPackIlluminated[13]).toBe(false);
    wildcard[p[12].rarity]++;
    foil[p[13].rarity]++;
    value += p.reduce((a, c) => a + buyback(c), 0);
  }
  expect(Math.abs(illuminated / 10000 - 0.05)).toBeLessThan(0.008);
  expect(rareMyth / 10000).toBeCloseTo(0.125, 1);
  expect(Math.abs(anyMyth / 10000 - 0.1424125)).toBeLessThan(0.012);
  expect(Math.abs(special / 10000 - 0.2)).toBeLessThan(0.015);
  for (const dist of [wildcard, foil])
    for (const [rarity, p] of Object.entries({
      common: 0.7,
      uncommon: 0.22,
      rare: 0.07,
      mythic: 0.01,
    }))
      expect(
        Math.abs(dist[rarity as keyof typeof dist] / 10000 - p),
      ).toBeLessThan(0.014);
  expect(value / 10000).toBeLessThan(wholesale("rekindled"));
  expect(s.products.rekindled.stock).toBe(0);
  expect(() =>
    applyCommand(s, { type: "open-pack", setId: "rekindled" }),
  ).toThrow();
}, 20000);
it("enforces copy and ownership limits while allowing plentiful basic resources", () => {
  const s = createGame(),
    c = cards.find((c) => c.type === "Creature")!;
  s.deck = Array(4).fill(c.id);
  s.collection[c.id] = 5;
  expect(() =>
    applyCommand(s, { type: "deck", cardId: c.id, add: true }),
  ).toThrow();
  const basic = cards.find((c) => c.type === "Basic Resource")!;
  s.collection[basic.id] = 30;
  s.deck = Array(20).fill(basic.id);
  expect(
    applyCommand(s, { type: "deck", cardId: basic.id, add: true }).deck,
  ).toHaveLength(21);
  s.deck = [];
  delete s.collection[c.id];
  expect(() =>
    applyCommand(s, { type: "deck", cardId: c.id, add: true }),
  ).toThrow();
});
it("protects deck copies and sells nonfoil spares before foil copies", () => {
  const s = createGame(),
    id = cards.find((c) => c.type === "Creature")!.id;
  s.deck = [id];
  s.collection[id] = 2;
  s.foils[id] = 1;
  const sold = applyCommand(s, { type: "sell", cardId: id });
  expect(sold.foils[id]).toBe(1);
  expect(() => applyCommand(sold, { type: "sell", cardId: id })).toThrow();
  sold.deck = [];
  expect(applyCommand(sold, { type: "sell", cardId: id }).foils[id]).toBe(0);
});
it("preserves exact seeded continuation including customer routes and a battle stack", () => {
  const cmds: Command[] = [
    { type: "toggle" },
    { type: "room-step" },
    { type: "walk", destination: "table" },
    { type: "open-pack", setId: "deepfen" },
    { type: "duel" },
    { type: "end-turn" },
  ];
  const s = run(createGame(9), cmds);
  expect(run(createGame(9), cmds)).toEqual(s);
  expect(
    run(decodeSave(JSON.stringify(s)), [
      { type: "room-step" },
      { type: "pass" },
    ]),
  ).toEqual(run(s, [{ type: "room-step" }, { type: "pass" }]));
});
it("migrates old ledgers without losing crowns, ownership or historical duel data", () => {
  const fresh = createGame();
  const old = {
    ...fresh,
    version: 1,
    room: undefined,
    foils: undefined,
    lastPackFoils: undefined,
    deck: Array(2).fill("first-oaths.1"),
    collection: { "first-oaths.1": 2 },
    battle: { round: 3 },
    gold: 123,
    lastPack: ["first-oaths.2"],
  };
  const next = decodeSave(JSON.stringify(old));
  expect(next.version).toBe(3);
  expect(next.gold).toBe(123);
  expect(next.collection["first-oaths.1"]).toBeGreaterThanOrEqual(2);
  expect(next.deck).toHaveLength(100);
  expect(next.legacyBattle).toEqual({ round: 3 });
  expect(next.battle).toBeNull();
  expect(next.lastPack).toEqual(old.lastPack);
});
it("rejects corrupt and unknown references, invalid foils and unsupported save versions", () => {
  const s = createGame();
  for (const raw of [
    "{",
    JSON.stringify({ ...s, version: 999 }),
    JSON.stringify({ ...s, collection: { nope: 1 } }),
    JSON.stringify({ ...s, foils: { "first-oaths.1": 999 } }),
    JSON.stringify({ ...s, products: {} }),
    JSON.stringify({ ...s, collection: {} }),
  ])
    expect(() => decodeSave(raw)).toThrow();
});

it("keeps named deck recipes through reload, rechecks ownership and leaves rejected actions untouched", () => {
  let s = createGame(988);
  const first = [...s.deck];
  s = applyCommand(s, { type: "save-deck", name: "The first hearth" });
  s = applyCommand(s, { type: "preset", preset: "tempo" });
  s = applyCommand(s, { type: "save-deck", name: "Paper ships" });
  s = decodeSave(JSON.stringify(s));
  s = applyCommand(s, { type: "load-deck", name: "the FIRST hearth" });
  expect(s.deck).toEqual(first);
  expect(s.savedDecks).toHaveLength(2);
  s = applyCommand(s, { type: "load-deck", name: "Paper ships" });
  const lost = first.find((id) => !s.deck.includes(id))!;
  s.collection[lost] = 0;
  const before = JSON.stringify(s);
  expect(() =>
    applyCommand(s, { type: "load-deck", name: "The first hearth" }),
  ).toThrow(/more copies/);
  expect(JSON.stringify(s)).toBe(before);
  // Recipes may outlive sold spares; importing such a recipe must remain possible.
  expect(() => decodeSave(JSON.stringify(s))).not.toThrow();
  s = applyCommand(s, { type: "delete-deck", name: "The first hearth" });
  expect(s.savedDecks.map((d) => d.name)).toEqual(["Paper ships"]);
});

it("awards journal milestones once and preserves claims across reload", () => {
  let s = createGame(82),
    before = JSON.stringify(s);
  expect(() =>
    applyCommand(s, { type: "claim-milestone", id: "first-pack" }),
  ).toThrow(/not ready/);
  expect(JSON.stringify(s)).toBe(before);
  s = applyCommand(s, { type: "open-pack", setId: "first-oaths" });
  const gold = s.gold;
  s = applyCommand(s, { type: "claim-milestone", id: "first-pack" });
  expect(s.gold).toBe(gold + 10);
  s = decodeSave(JSON.stringify(s));
  before = JSON.stringify(s);
  expect(() =>
    applyCommand(s, { type: "claim-milestone", id: "first-pack" }),
  ).toThrow(/not ready/);
  expect(JSON.stringify(s)).toBe(before);
});

it("locks unowned prepared recipes and starts new duels at twenty health", () => {
  const s = createGame();
  const before = JSON.stringify(s);
  expect(() => applyCommand(s, { type: "preset", preset: "relics" })).toThrow(
    /missing copies/,
  );
  expect(JSON.stringify(s)).toBe(before);
  const started = applyCommand(s, { type: "duel" });
  expect(started.battle!.player.hp).toBe(20);
  expect(started.battle!.enemy.hp).toBe(20);
});

it("preserves scarce editions through saves and sells ordinary copies before finishes", () => {
  const s = createGame(19);
  const id = cards.find((c) => c.rarity === "rare")!.id;
  s.deck = [];
  s.collection[id] = 3;
  s.foils[id] = 1;
  s.illuminated[id] = 1;
  let sold = applyCommand(decodeSave(JSON.stringify(s)), {
    type: "sell",
    cardId: id,
  });
  expect(sold.foils[id]).toBe(1);
  expect(sold.illuminated[id]).toBe(1);
  sold = applyCommand(sold, { type: "sell", cardId: id });
  expect(sold.foils[id]).toBe(0);
  expect(sold.illuminated[id]).toBe(1);
  sold = applyCommand(sold, { type: "sell", cardId: id });
  expect(sold.illuminated[id]).toBe(0);
  expect(() =>
    decodeSave(JSON.stringify({ ...s, illuminated: { [id]: 3 } })),
  ).toThrow();
  const legacy = {
    ...s,
    illuminated: undefined,
    lastPackIlluminated: undefined,
  };
  expect(decodeSave(JSON.stringify(legacy)).illuminated).toEqual({});
});

it("opening all packs matches individual seeded openings across every set and saves an exact receipt", () => {
  for (const set of sets) {
    const initial = createGame(123);
    initial.products[set.id].stock = 12;
    let individual = initial;
    for (let n = 0; n < 12; n++)
      individual = applyCommand(individual, {
        type: "open-pack",
        setId: set.id,
      });
    const bulk = applyCommand(initial, {
      type: "open-all-packs",
      setId: set.id,
    });
    expect(initial.products[set.id].stock).toBe(12);
    for (const key of [
      "collection",
      "foils",
      "illuminated",
      "rng",
      "products",
      "lastPack",
      "lastPackFoils",
      "lastPackIlluminated",
      "gold",
      "deck",
    ] as const)
      expect(bulk[key]).toEqual(individual[key]);
    const receipt = bulk.lastBulkOpening!;
    expect(receipt.packs).toBe(12);
    expect(Object.keys(receipt.cards).length).toBeLessThanOrEqual(80);
    expect(
      Object.values(receipt.cards).reduce((n, row) => n + row.total, 0),
    ).toBe(168);
    expect(
      Object.values(receipt.cards).reduce((n, row) => n + row.foil, 0),
    ).toBe(12);
    for (const [id, row] of Object.entries(receipt.cards)) {
      expect(row.total).toBe(
        bulk.collection[id] - (initial.collection[id] ?? 0),
      );
      expect(row.foil).toBe((bulk.foils[id] ?? 0) - (initial.foils[id] ?? 0));
      expect(row.illuminated).toBe(
        (bulk.illuminated[id] ?? 0) - (initial.illuminated[id] ?? 0),
      );
    }
    expect(decodeSave(JSON.stringify(bulk)).lastBulkOpening).toEqual(receipt);
    const snapshot = JSON.stringify(bulk);
    expect(() =>
      applyCommand(bulk, { type: "open-all-packs", setId: set.id }),
    ).toThrow(/out of stock/);
    expect(JSON.stringify(bulk)).toBe(snapshot);
  }
});
it("illuminating consumes five ordinary spares for one edition and preserves active decks and finishes", () => {
  const s = createGame(8),
    id = cards.find((c) => c.type === "Creature" && c.rarity === "common")!.id;
  s.deck = [id, id, id, id];
  s.collection[id] = 10;
  s.foils[id] = 1;
  s.illuminated[id] = 1;
  const next = applyCommand(s, { type: "craft-illuminated", cardId: id });
  expect(next.collection[id]).toBe(6);
  expect(next.illuminated[id]).toBe(2);
  expect(next.foils[id]).toBe(1);
  expect(next.deck).toEqual(s.deck);
  expect(next.gold).toBe(s.gold);
  expect(next.rng).toBe(s.rng);
  expect(decodeSave(JSON.stringify(next)).illuminated[id]).toBe(2);
  const before = JSON.stringify(next);
  expect(() =>
    applyCommand(next, { type: "craft-illuminated", cardId: id }),
  ).toThrow(/five|5/);
  expect(JSON.stringify(next)).toBe(before);
  const protectedDeck = {
    ...s,
    collection: { ...s.collection, [id]: 8 },
    foils: {},
    illuminated: {},
  };
  expect(() =>
    applyCommand(protectedDeck, { type: "craft-illuminated", cardId: id }),
  ).toThrow();
  expect(() =>
    applyCommand(s, { type: "craft-illuminated", cardId: "missing" }),
  ).toThrow();
});
it("quantity sales conserve finishes, deck ownership and currency and reject invalid amounts atomically", () => {
  const s = createGame(9),
    c = cards.find((c) => c.rarity === "rare")!;
  s.deck = [c.id];
  s.collection[c.id] = 9;
  s.foils[c.id] = 1;
  s.illuminated[c.id] = 1;
  const sold = applyCommand(s, { type: "sell", cardId: c.id, quantity: 7 });
  expect(sold.collection[c.id]).toBe(2);
  expect(sold.foils[c.id]).toBe(1);
  expect(sold.illuminated[c.id]).toBe(1);
  expect(sold.gold - s.gold).toBe(7 * buyback(c));
  for (const quantity of [0, -1, 1.5, 9, Infinity]) {
    const before = JSON.stringify(s);
    expect(() =>
      applyCommand(s, { type: "sell", cardId: c.id, quantity }),
    ).toThrow();
    expect(JSON.stringify(s)).toBe(before);
  }
});
it("old saves default to no haul and corrupt bulk receipts cannot be imported", () => {
  const s = createGame(10);
  expect(
    decodeSave(JSON.stringify({ ...s, lastBulkOpening: undefined }))
      .lastBulkOpening,
  ).toBeNull();
  const bulk = applyCommand(s, { type: "open-all-packs", setId: "rekindled" });
  bulk.lastBulkOpening!.packs++;
  expect(() => decodeSave(JSON.stringify(bulk))).toThrow(/receipt/);
  s.products.rekindled.stock = 10001;
  expect(() =>
    applyCommand(s, { type: "open-all-packs", setId: "rekindled" }),
  ).toThrow(/10,000/);
  expect(s.products.rekindled.stock).toBe(10001);
});
