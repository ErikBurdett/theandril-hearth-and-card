import { it, expect } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  cards,
  cardById,
  sets,
  isResource,
  copyLimit,
  PACK_SIZE,
} from "../content/catalog";
import { factions } from "../content/factions";
import { livingCards, livingRecipes } from "../content/living-cards";
import { livingFactions, livingSets } from "../content/living-cultures";
import {
  createGame,
  decodeSave,
  applyCommand,
  wholesale,
  gameSchema,
} from "./game";
import {
  createBattle,
  presetDeck,
  battleCommand,
  zeroMana,
  type Permanent,
  type Battle,
  type Target,
} from "./battle";
import baseline from "./fixtures/pre-living-cultures.json";
import oldSave from "./fixtures/pre-living-cultures-save.json";

const hash = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
it("preserves all 640 original rules, eighteen exact recipes and a recorded seeded booster", () => {
  expect(hash(cards.slice(0, baseline.cardCount))).toBe(baseline.cardHash);
  for (const [id, digest] of Object.entries(baseline.decks))
    expect(hash(presetDeck(id)), id).toBe(digest);
  const opened = applyCommand(decodeSave(JSON.stringify(oldSave)), {
    type: "open-pack",
    setId: "rekindled",
  });
  for (const [key, value] of Object.entries(baseline.pack))
    expect(opened[key as keyof typeof opened]).toEqual(value);
});

it("adopts exactly the registered 24 cultures, retains chapter bytes and expands every new culture's cards", () => {
  expect(factions).toHaveLength(24);
  expect(factions.some((f) => f.id === "faction.testament_union")).toBe(false);
  const bible = readFileSync("docs/lore/theandril/FACTION_BIBLE.md", "utf8");
  const registered = [
    ...new Set([...bible.matchAll(/`(faction\.[a-z_]+)`/g)].map((m) => m[1])),
  ];
  expect(factions.map((f) => f.id).sort()).toEqual(registered.sort());
  const snapshot = JSON.parse(readFileSync("docs/lore/SNAPSHOT.json", "utf8"));
  const original = JSON.parse(
    readFileSync("docs/lore/history/b17900d-SNAPSHOT.json", "utf8"),
  );
  for (const [path, digest] of Object.entries(snapshot.files)) {
    const bytes = readFileSync(
      path.replace("docs/lore/", "docs/lore/theandril/"),
    );
    expect(createHash("sha256").update(bytes).digest("hex"), path).toBe(digest);
    if (
      path.includes("The Book of Broken Roads/") ||
      path.endsWith("FOUNDATIONS.md")
    )
      expect(digest).toBe(original.files[path]);
  }
  expect(livingCards).toHaveLength(320);
  for (const faction of livingFactions) {
    expect([22, 23]).toContain(faction.cards.length);
    expect(faction.cards.map((id) => cardById[id]).every(Boolean)).toBe(true);
    expect(faction.cards.map((id) => cardById[id].type)).toContain("Hero");
  }
  for (const id of ["unclaimed-ways.2", "unclaimed-ways.6"])
    expect(cardById[id].keywords).not.toContain("flying");
});

it("migrates old saves with empty later-release shelves while preserving holdings, currency, RNG and an active spell stack", () => {
  const migrated = decodeSave(JSON.stringify(oldSave)),
    laterSets = sets.filter((s) => s.release > 8);
  expect(laterSets.map((s) => s.id)).toEqual([
    ...livingSets.map((s) => s.id),
    "the-quiet",
  ]);
  for (const set of laterSets)
    expect(migrated.products[set.id]).toEqual({ stock: 0, price: 48, sold: 0 });
  const withoutAdditions = structuredClone(migrated);
  for (const set of laterSets) delete withoutAdditions.products[set.id];
  expect(withoutAdditions).toEqual(oldSave);
  expect(decodeSave(JSON.stringify(migrated))).toEqual(migrated);
  const pending = applyCommand(migrated, { type: "duel" });
  const b = pending.battle!;
  b.player.hand = ["unfinished-answer.3"];
  b.player.mana.tide = 3;
  b.enemy.hand = [];
  // A saved live stack remains intact across the catalog migration.
  const priorSpell = cards
    .slice(0, baseline.cardCount)
    .find((card) => card.type === "Instant" && card.effect === "damage")!;
  b.stack = [
    {
      uid: 1001,
      owner: "enemy",
      cardId: priorSpell.id,
      effect: "damage",
      amount: priorSpell.amount,
      ability: false,
      target: { kind: "hearth", side: "player" },
    },
  ];
  b.priority = "player";
  b.nextId = 1002;
  for (const set of laterSets) delete pending.products[set.id];
  const next = decodeSave(JSON.stringify(pending));
  expect(next.battle).toEqual(b);
  battleCommand(next.battle!, {
    type: "play",
    index: 0,
    target: { side: "enemy", kind: "stack", uid: 1001 },
  });
  const resumed = decodeSave(JSON.stringify(next));
  expect(resumed.battle!.stack).toEqual(next.battle!.stack);
  battleCommand(resumed.battle!, { type: "pass" });
  expect(resumed.battle!.stack).toHaveLength(0);
  expect(resumed.battle!.enemy.grave).toContain(priorSpell.id);
  const corrupt = structuredClone(oldSave);
  delete (corrupt.products as Record<string, unknown>)["first-oaths"];
  expect(() => decodeSave(JSON.stringify(corrupt))).toThrow();
});

it("orders, delivers and opens each new folio with deterministic slots and atomic rejection", () => {
  for (const set of livingSets) {
    let game = decodeSave(JSON.stringify(oldSave));
    const before = structuredClone(game);
    expect(() =>
      applyCommand(game, { type: "open-pack", setId: set.id }),
    ).toThrow();
    expect(game).toEqual(before);
    game = applyCommand(game, { type: "order", setId: set.id, quantity: 2 });
    expect(game.gold).toBe(before.gold - 2 * wholesale(set.id));
    game = applyCommand(game, { type: "toggle" });
    for (let i = 0; i < 3; i++) game = applyCommand(game, { type: "tick" });
    expect(game.products[set.id].stock).toBe(2);
    const opened = applyCommand(game, {
      type: "open-all-packs",
      setId: set.id,
    });
    expect(opened).toEqual(
      applyCommand(decodeSave(JSON.stringify(game)), {
        type: "open-all-packs",
        setId: set.id,
      }),
    );
    expect(opened.lastBulkOpening?.packs).toBe(2);
    expect(opened.lastPack).toHaveLength(PACK_SIZE);
    expect(opened.lastPack.every((id) => cardById[id].setId === set.id)).toBe(
      true,
    );
    expect(
      opened.lastPack
        .slice(0, 7)
        .every(
          (id) => cardById[id].rarity === "common" && !isResource(cardById[id]),
        ),
    ).toBe(true);
    expect(
      opened.lastPack
        .slice(7, 10)
        .every((id) => cardById[id].rarity === "uncommon"),
    ).toBe(true);
    expect(isResource(cardById[opened.lastPack[10]])).toBe(true);
    expect(["rare", "mythic"]).toContain(cardById[opened.lastPack[11]].rarity);
    expect(opened.lastPackFoils.filter(Boolean)).toHaveLength(1);
    expect(gameSchema.safeParse(opened).success).toBe(true);
    expect(decodeSave(JSON.stringify(opened))).toEqual(opened);
  }
});

it("offers eight useful cross-set 100-card recipes with affordable colors, all twelve cultures and no required mythics", () => {
  expect(livingRecipes).toHaveLength(8);
  const represented = new Set<string>();
  for (const recipe of livingRecipes) {
    const deck = presetDeck(recipe.id),
      game = createGame();
    expect(deck).toHaveLength(100);
    expect(deck.filter((id) => isResource(cardById[id]))).toHaveLength(40);
    expect(deck.every((id) => recipe.colors.includes(cardById[id].color))).toBe(
      true,
    );
    expect(deck.every((id) => cardById[id].rarity !== "mythic")).toBe(true);
    expect(new Set(deck.map((id) => cardById[id].setId)).size).toBe(2);
    expect(
      deck.filter(
        (id) => cardById[id].type === "Creature" && cardById[id].cost <= 2,
      ).length,
    ).toBeGreaterThanOrEqual(12);
    const before = structuredClone(game);
    expect(() =>
      applyCommand(game, { type: "preset", preset: recipe.id }),
    ).toThrow();
    expect(game).toEqual(before);
    for (const id of new Set(deck)) {
      const count = deck.filter((c) => c === id).length;
      expect(count).toBeLessThanOrEqual(copyLimit(cardById[id]));
      game.collection[id] = count;
    }
    const prepared = applyCommand(game, { type: "preset", preset: recipe.id });
    expect(prepared.deck).toEqual(deck);
    expect(decodeSave(JSON.stringify(prepared)).deck).toEqual(deck);
    for (const faction of livingFactions)
      if (faction.cards.some((id) => deck.includes(id)))
        represented.add(faction.id);
  }
  expect(represented.size).toBe(12);
});

const permanent = (cardId: string, uid: number): Permanent => ({
  cardId,
  uid,
  tapped: false,
  entered: 1,
  damage: 0,
  counters: 0,
  boost: 0,
  loyalty: 4,
  used: 0,
});
function table(): Battle {
  const b = createBattle(presetDeck(), presetDeck(), "Folio test");
  b.turn = 5;
  b.timed = false;
  b.nextId = 500;
  b.player.board = [];
  b.enemy.board = [];
  b.enemy.hand = [];
  b.player.hand = [];
  b.player.mana = { dawn: 30, tide: 30, grove: 30, grave: 30, ember: 30 };
  b.enemy.mana = zeroMana();
  return b;
}
function cast(b: Battle, id: string, target?: Target) {
  b.player.hand.push(id);
  battleCommand(b, { type: "play", index: b.player.hand.length - 1, target });
  battleCommand(b, { type: "pass" });
}
it("executes the folios' maintenance, shelter, passage and spellcraft lines with ordinary counterplay", () => {
  const maintenance = table();
  maintenance.player.board = [permanent("shared-measure.2", 101)];
  const hand = maintenance.player.hand.length;
  cast(maintenance, "shared-measure.5");
  expect(maintenance.player.hand).toHaveLength(hand + 1);
  cast(maintenance, "shared-measure.5");
  expect(maintenance.player.hand).toHaveLength(hand + 1); // once per turn
  const shelter = table();
  shelter.player.board = [permanent("terms-of-shelter.5", 101)];
  const life = shelter.player.hp;
  cast(shelter, "terms-of-shelter.7");
  expect(shelter.player.hp).toBe(life + 2); // Welcome plus the attendant
  shelter.enemy.shield = 1;
  cast(shelter, "terms-of-shelter.15");
  expect(shelter.player.hp).toBe(life + 3); // drain only the unshielded point
  const passage = table();
  passage.player.board = [permanent("unclaimed-ways.14", 101)];
  cast(passage, "unclaimed-ways.23");
  expect(passage.player.board[0].counters).toBe(1);
  passage.enemy.board = [permanent("unclaimed-ways.7", 201)];
  expect(() =>
    cast(passage, "shared-measure.15", {
      side: "enemy",
      kind: "creature",
      uid: 201,
    }),
  ).toThrow();
  const answer = table();
  answer.player.board = [permanent("unfinished-answer.1", 101)];
  cast(answer, "unfinished-answer.9", { side: "enemy", kind: "hearth" });
  expect(answer.player.board[0].counters).toBe(1);
  expect(answer.enemy.hp).toBe(17);
});
