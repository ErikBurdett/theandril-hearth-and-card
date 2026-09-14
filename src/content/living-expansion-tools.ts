import type { Card, Effect, ManaColor, Rarity, Tradition } from "./catalog";

export type LivingEntry = Pick<
  Card,
  "name" | "type" | "color" | "cost" | "rarity" | "flavor"
> &
  Partial<Card> & {
    powers?: [number, Effect, number][];
  };
type Draft = Omit<LivingEntry, "rarity">;
export const C = (
  name: string,
  color: ManaColor,
  cost: number,
  attack: number,
  health: number,
  flavor: string,
  traits: Partial<Card> = {},
): Draft => ({
  name,
  type: "Creature",
  color,
  cost,
  attack,
  health,
  flavor,
  ...traits,
});
export const S = (
  name: string,
  type: "Instant" | "Sorcery",
  color: ManaColor,
  cost: number,
  effect: Effect,
  amount: number,
  flavor: string,
  traits: Partial<Card> = {},
): Draft => ({ name, type, color, cost, effect, amount, flavor, ...traits });
export const P = (
  name: string,
  type: "Artifact" | "Enchantment",
  color: ManaColor,
  cost: number,
  permanentEffect: Card["permanentEffect"],
  flavor: string,
): Draft => ({ name, type, color, cost, permanentEffect, flavor });
/** Each culture adds seven commons, six uncommons and three rares, in that order. */
export const culture = (
  tradition: Tradition,
  entries: Draft[],
): LivingEntry[] => {
  if (entries.length !== 16)
    throw Error("A culture expansion must contain sixteen cards.");
  return entries.map((entry, i) => ({
    ...entry,
    tradition,
    rarity: i < 7 ? "common" : i < 13 ? "uncommon" : "rare",
  }));
};
export const R = (
  name: string,
  color: ManaColor,
  produces: ManaColor[],
  rarity: Rarity,
  flavor: string,
): LivingEntry => ({
  name,
  type: produces.length === 1 ? "Basic Resource" : "Special Resource",
  color,
  cost: 0,
  colored: 0,
  produces,
  entersTapped: produces.length > 1,
  rarity,
  flavor,
});
export const H = (
  name: string,
  color: ManaColor,
  cost: number,
  loyalty: number,
  powers: [number, Effect, number][],
  flavor: string,
): LivingEntry => ({
  name,
  type: "Hero",
  color,
  cost,
  loyalty,
  powers,
  rarity: "mythic",
  flavor,
});
export const rare = (entry: Draft): LivingEntry => ({
  ...entry,
  rarity: "rare",
});
