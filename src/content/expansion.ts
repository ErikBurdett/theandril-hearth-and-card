import type { Card, CardSet, CardType } from "./catalog";
/** Eight authored additions per volume. IDs 1–72 remain untouched. */
export const expansionNames = [
  [
    "Shared Granary Meadow",
    "Nineteen-Hearth Rest",
    "Guest-right Protector",
    "Lift the Weary",
    "Meal Before Measure",
    "Host’s Copper Bowl",
    "A Place at Every Fire",
    "Keeper of the Open Door",
  ],
  [
    "Surveyor’s Stillwater",
    "The Unfinished Causeway",
    "Sealroom Archivist",
    "Stay the Caravan",
    "Read the Missing Margin",
    "Recorder’s Index Wheel",
    "Copies in Other Hands",
    "Witness of the Unanswered Seal",
  ],
  [
    "Valley Charcoal Grove",
    "The Closed Pass Landing",
    "Valleybond Sentinel",
    "Quench the War Hammer",
    "A Valley’s Due",
    "Inspection Furnace",
    "Work Owed to the Valley",
    "Master of the Load-bearing Arch",
  ],
  [
    "Sounder’s Quiet Shoal",
    "Keel-pledge Anchorage",
    "Weatherline Corsair",
    "Rigging in the Gale",
    "Call the Cargo Home",
    "Harbor Signal Brazier",
    "The Limited Pledge",
    "Pilot of the Last Unpledged Keel",
  ],
  [
    "Willow Nursery",
    "Season’s Turning Pool",
    "Root-right Warden",
    "Unbind the Reed Path",
    "The Patient Harvest",
    "Court’s Seed Casket",
    "Shelter Without Tribute",
    "Keeper of the Seasonal Hearing",
  ],
  [
    "Chalkland Seed Terrace",
    "The Unclaimed Stair",
    "Collateral Examiner",
    "Suspend the Writ",
    "The Cost of Continuance",
    "Ninth-Terrace Measure",
    "An Office Without an End",
    "Advocate of the Living Dependents",
  ],
  [
    "Cinderseed Hollow",
    "The Four-Winter Shelter",
    "Ash-road Outrider",
    "One More Watch",
    "Bring the Ember Home",
    "Watchpost Coal Basket",
    "Four Generations Unpaid",
    "Keeper of the Surviving Names",
  ],
  [
    "Underwood Renewal Plot",
    "Wintershare Guest Hall",
    "Passage-right Envoy",
    "Open the Grazing Gate",
    "A Common Store Repaid",
    "Replenishment Ledger",
    "Room for the Next Household",
    "Speaker for the Unheard Hearth",
  ],
];
export function expansionCards(
  set: CardSet,
  si: number,
  make: (set: CardSet, index: number, type: CardType, name: string) => Card,
): Card[] {
  const types: CardType[] = [
    "Basic Resource",
    "Special Resource",
    "Creature",
    "Instant",
    "Sorcery",
    "Artifact",
    "Enchantment",
    "Hero",
  ];
  const list = types.map((type, i) =>
    make(set, 72 + i, type, expansionNames[si][i]),
  );
  const [basic, dual, unit, instant, ritual, relic, vow, hero] = list;
  for (const c of list) {
    c.effect = "none";
    c.trigger = "none";
    c.permanentEffect = "none";
    c.keywords = [];
    c.colored = 1;
    c.cost = 3;
    c.rarity = "uncommon";
    c.attack = 0;
    c.health = 0;
  }
  basic.rarity = "common";
  basic.cost = 0;
  basic.colored = 0;
  basic.produces = [basic.color];
  basic.rules = `Exhaust: add one ${basic.color} mana.`;
  dual.rarity = "rare";
  dual.cost = 0;
  dual.colored = 0;
  dual.produces = [basic.color, dual.color];
  dual.entersTapped = true;
  dual.effect = "heal";
  dual.amount = 2;
  dual.rules = `Enters exhausted. Gain 2 life. Exhaust: add one ${dual.produces.join(" or ")} mana.`;
  unit.rarity = "uncommon";
  unit.cost = 3;
  unit.attack = si % 2 ? 3 : 2;
  unit.health = si % 2 ? 2 : 4;
  unit.keywords = si === 3 || si === 6 ? ["daunt"] : ["rootfast"];
  unit.trigger =
    si === 1 || si === 2
      ? "recordwork"
      : si === 0 || si === 4 || si === 7
        ? "welcome"
        : "mourning";
  unit.rules =
    (unit.keywords[0] === "daunt"
      ? "Daunt: companions with 1 or less power cannot block this. "
      : "Rootfast: cannot be returned to hand by spells. ") +
    (unit.trigger === "welcome"
      ? "Welcome: whenever another friendly companion enters, gain 1 life."
      : unit.trigger === "recordwork"
        ? "Recordwork: the first friendly artifact that enters each turn lets you draw a card."
        : "Mourning: whenever another friendly companion dies, the opposing hearth loses 1 life.");
  instant.rarity = "common";
  instant.effect = si % 2 ? "bind" : "renew";
  instant.cost = 2;
  instant.amount = 1;
  instant.rules =
    instant.effect === "bind"
      ? "Exhaust target companion. It skips its next ready step."
      : "Ready target companion and remove its binding. Arrival fatigue still applies.";
  ritual.rarity = "uncommon";
  ritual.effect = si === 5 || si === 6 ? "drain" : "rally";
  ritual.amount = ritual.effect === "drain" ? 3 : 2;
  ritual.cost = 4;
  ritual.rules =
    ritual.effect === "drain"
      ? "Deal 3 damage to the opposing hearth. Gain life equal to damage dealt after shields."
      : "Your companions get +2/+2 until the end of this turn.";
  relic.rarity = "rare";
  relic.permanentEffect =
    si === 2 || si === 3 || si === 6 ? "watchfire" : "archive";
  relic.cost = 4;
  relic.rules =
    relic.permanentEffect === "watchfire"
      ? "At the start of your turn, deal 1 damage to the opposing hearth."
      : "At the start of your turn, if you have 3 or fewer cards in hand, draw a card.";
  vow.rarity = "uncommon";
  vow.permanentEffect = si % 2 ? "recordwork" : "welcome";
  vow.cost = 3;
  vow.rules =
    vow.permanentEffect === "welcome"
      ? "Whenever a friendly companion enters, gain 1 life."
      : "The first friendly artifact that enters each turn lets you draw a card.";
  hero.rarity = "mythic";
  hero.cost = 5;
  hero.colored = 2;
  hero.loyalty = 4;
  hero.abilities = [
    {
      loyalty: 1,
      effect: si % 2 ? "draw" : "heal",
      amount: si % 2 ? 1 : 2,
      text: si % 2 ? "+1: Draw a card." : "+1: Gain 2 life.",
    },
    {
      loyalty: -2,
      effect: si % 2 ? "bind" : "renew",
      amount: 1,
      text:
        si % 2
          ? "−2: Bind target companion through its next ready step."
          : "−2: Ready target companion and remove its binding.",
    },
    {
      loyalty: -6,
      effect: si === 5 || si === 6 ? "drain" : "rally",
      amount: 4,
      text:
        si === 5 || si === 6
          ? "−6: Drain 4 life from the opposing hearth after shields."
          : "−6: Your companions get +4/+4 until end of turn.",
    },
  ];
  hero.rules = hero.abilities.map((a) => a.text).join(" ");
  return list;
}
