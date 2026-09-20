import { it, expect } from "vitest";
import { createHash } from "node:crypto";
import { cards, cardById, sets, isResource } from "../content/catalog";
import { livingFactions, livingSets } from "../content/living-cultures";
import { fullLivingRecipes } from "../content/living-cards";
import { createGame, decodeSave, applyCommand } from "./game";
import { presets, presetDeck } from "./battle";
import baseline from "./fixtures/pre-full-living-sets.json";
import existingSave from "./fixtures/pre-full-living-sets-save.json";

const hash = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");

it("preserves all 736 released definitions and twenty-two exact saved recipes", () => {
  expect(baseline.ids).toHaveLength(736);
  expect(hash(baseline.ids.map((id) => cardById[id]))).toBe(baseline.cardHash);
  for (const [id, digest] of Object.entries(baseline.decks))
    expect(hash(presetDeck(id)), id).toBe(digest);
});

it("preserves a saved folio pack receipt and all eight historical seeded boosters", () => {
  // Later releases add only an empty shelf row; everything saved stays exact.
  const decoded = decodeSave(JSON.stringify(existingSave));
  expect(decoded.products["the-quiet"]).toEqual({
    stock: 0,
    price: 48,
    sold: 0,
  });
  delete decoded.products["the-quiet"];
  expect(decoded).toEqual(existingSave);
  for (const [setId, receipt] of Object.entries(baseline.packs)) {
    const game = createGame(8123);
    game.products[setId].stock = 1;
    const opened = applyCommand(game, { type: "open-pack", setId });
    expect(
      {
        cards: opened.lastPack,
        foils: opened.lastPackFoils,
        illuminated: opened.lastPackIlluminated,
        rng: opened.rng,
      },
      setId,
    ).toEqual(receipt);
  }
});

it("matches the older 80-card rarity sheets and resource counts without renumbering", () => {
  for (const set of sets) {
    const pool = cards.filter((c) => c.setId === set.id);
    expect(
      pool.map((c) => c.number),
      set.id,
    ).toEqual(Array.from({ length: 80 }, (_, i) => i + 1));
    expect(
      Object.fromEntries(
        ["common", "uncommon", "rare", "mythic"].map((r) => [
          r,
          pool.filter((c) => c.rarity === r).length,
        ]),
      ),
      set.id,
    ).toEqual({ common: 33, uncommon: 26, rare: 16, mythic: 5 });
    expect(pool.filter((c) => c.type === "Basic Resource")).toHaveLength(6);
    const specials = pool.filter((c) => c.type === "Special Resource");
    expect(specials).toHaveLength(4);
    expect(
      specials.every((c) => c.entersTapped && c.produces.length === 2),
    ).toBe(true);
  }
  for (const set of livingSets) {
    const related = livingFactions.filter((f) =>
      f.cards[0].startsWith(set.id + "."),
    );
    expect(related).toHaveLength(3);
    const assigned = related.flatMap((f) => f.cards);
    expect(new Set(assigned).size).toBe(68);
    expect(assigned.every((id) => !isResource(cardById[id]))).toBe(true);
    for (const faction of related)
      expect(
        faction.cards.every(
          (id) =>
            cardById[id].tradition === cardById[faction.cards[0]].tradition,
        ),
        faction.name,
      ).toBe(true);
  }
  const cairnfolk = livingFactions.find(
    (f) => f.id === "faction.cairnwing_concord",
  )!;
  expect(
    cairnfolk.cards.every((id) => !cardById[id].keywords.includes("flying")),
  ).toBe(true);
});

it("makes the four full-set recipes collectable with real ordinary copies and all twelve cultures", () => {
  expect(fullLivingRecipes).toHaveLength(4);
  expect(new Set(presets.map((recipe) => recipe.name)).size).toBe(
    presets.length,
  );
  for (const recipe of fullLivingRecipes) {
    const deck = presetDeck(recipe.id);
    expect(deck.filter((id) => cardById[id].type === "Creature")).toHaveLength(
      36,
    );
    expect(
      deck.filter(
        (id) =>
          !isResource(cardById[id]) &&
          cardById[id].number >= 25 &&
          cardById[id].setId === recipe.sets[0],
      ),
    ).toHaveLength(56);
    for (const faction of livingFactions.filter((f) =>
      f.cards[0].startsWith(recipe.sets[0] + "."),
    ))
      expect(
        faction.cards.some((id) => deck.includes(id)),
        faction.name,
      ).toBe(true);
  }
});
