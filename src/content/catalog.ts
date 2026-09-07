import { expansionCards } from "./expansion";
import { tableWords } from "./wording";
export const traditions = [
  "Flame",
  "Storm",
  "Tide",
  "Stone",
  "Verdancy",
  "Grave",
  "Star",
  "Dream",
  "Shadow",
  "Radiance",
  "Spirit",
  "Rune",
  "Oath",
  "Void",
] as const;
export type Tradition = (typeof traditions)[number];
export interface CardSet {
  id: string;
  code: string;
  name: string;
  era: string;
  chapter: string;
  release: number;
  block: string;
  traditions: Tradition[];
  color: string;
  symbol: string;
  description: string;
  names: string[];
}
export const sets: CardSet[] = [
  {
    id: "first-oaths",
    code: "OAT",
    name: "The First Oaths",
    era: "RR 1–800",
    chapter: "II. The Age of First Oaths.md",
    release: 1,
    block: "The Witness Cycle",
    traditions: ["Oath", "Spirit", "Radiance"],
    color: "#cca75e",
    symbol: "◇",
    description:
      "Nineteen hearths. One stone. The first promise a stranger could trust.",
    names: [
      "Cold Ford Keeper",
      "Sallow Grainbearer",
      "Hearth Reciter",
      "Tally-stick Scribe",
      "Ford Watcher",
      "Ancestor Caller",
      "Stone-sworn Escort",
      "Nineteenth Hearth",
      "Grain and Remembrance",
      "Jointly Sealed",
      "Names of the Dead",
      "First Waystation",
      "The Unbroken Recitation",
      "Oath at Cold Ford",
      "The Nineteen Seals",
      "First Witness",
    ],
  },
  {
    id: "witness-roads",
    code: "WIT",
    name: "Witness Roads",
    era: "RR 2210–2231",
    chapter: "III. The Raising of the Roads.md",
    release: 2,
    block: "The Witness Cycle",
    traditions: ["Star", "Rune", "Oath"],
    color: "#91aaba",
    symbol: "✧",
    description:
      "Across four hundred stones, the world learns to keep its word.",
    names: [
      "Grey Weir Apprentice",
      "Junction Factor",
      "Toll-road Courier",
      "Lead-seal Cutter",
      "Waystation Keeper",
      "Subscription Mason",
      "Anvilheights Trader",
      "Outer Isles Envoy",
      "Attested Bargain",
      "Recitation Toll",
      "Lead and Wax",
      "Four Hundred Stones",
      "Maude, First Recorder",
      "The Honest Seal",
      "Ledger of Grey Weir",
      "Ilthen, Third Recorder",
    ],
  },
  {
    id: "iron-covenant",
    code: "IRN",
    name: "Forges of the Covenant",
    era: "RR 800–2290",
    chapter: "IV. The Age of Crowns.md",
    release: 3,
    block: "The Crown Cycle",
    traditions: ["Rune", "Stone", "Flame"],
    color: "#b78763",
    symbol: "⬡",
    description:
      "Deep under the Anvilheights, work is worship and stone remembers.",
    names: [
      "Deep-folk Mason",
      "Kiln Acolyte",
      "Client-valley Smith",
      "Anvil Warden",
      "Hold Engineer",
      "Ore Delver",
      "Rune Engraver",
      "Pass Sentinel",
      "Sealed Lock",
      "Shore the Crack",
      "Kiln Prayer",
      "Ever-burning Forge",
      "Master of Sealed Works",
      "Gate of the Anvilheights",
      "The Last Open Pass",
      "Covenant Forgekeeper",
    ],
  },
  {
    id: "saltwind",
    code: "SLT",
    name: "The Paper Sea",
    era: "RR 800–2290",
    chapter: "IV. The Age of Crowns.md",
    release: 4,
    block: "The Crown Cycle",
    traditions: ["Tide", "Storm", "Star"],
    color: "#699d9e",
    symbol: "≈",
    description:
      "Charter fleets follow a horizon pledged to the next generation.",
    names: [
      "Outer Isles Pilot",
      "Anchorage Runner",
      "League Deckhand",
      "Storm Navigator",
      "Tidebound Lookout",
      "Keel Surveyor",
      "Charter Courier",
      "Saltwind Captain",
      "Pledged Cargo",
      "Borrowed Wind",
      "The Insured Keel",
      "High Charter Seal",
      "Anchorage Fleetmaster",
      "Star over the Isles",
      "Three Generations Pledged",
      "Aldery, Debt-Crowned",
    ],
  },
  {
    id: "deepfen",
    code: "FEN",
    name: "Courts of the Deepfen",
    era: "Before RR 2289",
    chapter: "IV. The Age of Crowns.md",
    release: 5,
    block: "The Crown Cycle",
    traditions: ["Verdancy", "Spirit", "Dream"],
    color: "#9daa70",
    symbol: "❧",
    description: "Seasons turn. Crowns fall. The elder courts have time.",
    names: [
      "Reedfen Tenant",
      "Fen-court Envoy",
      "Hedge Tender",
      "Marsh-child",
      "Season Keeper",
      "Dreaming Heron",
      "Rootbound Attendant",
      "Deepfen Host",
      "The Sea Breathes",
      "Seasonal Ceremony",
      "A Wall of Hedging",
      "Court of Still Water",
      "Keeper of Old Seasons",
      "Withdrawal of the Courts",
      "Refuge beneath the Reeds",
      "Widow of the Deepfen",
    ],
  },
  {
    id: "reckoning",
    code: "REC",
    name: "Written Fire",
    era: "RR 2291–2311",
    chapter: "VI. The Reckoning.md",
    release: 6,
    block: "The Broken Cycle",
    traditions: ["Shadow", "Grave", "Oath"],
    color: "#a18ab2",
    symbol: "☾",
    description:
      "Promises become weapons. The pledged dead are called to account.",
    names: [
      "Erased Soldier",
      "Ninth Terrace Clerk",
      "Synod Caravaner",
      "Chalkland Keeper",
      "Reed Ford Witness",
      "Wardhall Hunter",
      "Soul-collateral Bearer",
      "Housed Ancestor",
      "Counterfeit Seal",
      "Call the Pledge",
      "Null-anchor",
      "The Severing",
      "Ossric, Third of the Name",
      "Ledger of Written Fire",
      "The Second Interment",
      "Provost of the Ninth Terrace",
    ],
  },
  {
    id: "ashfall",
    code: "ASH",
    name: "The Long Ash",
    era: "RR 2313–2443",
    chapter: "VIII. The Long Ash.md",
    release: 7,
    block: "The Broken Cycle",
    traditions: ["Flame", "Void", "Grave"],
    color: "#c18069",
    symbol: "△",
    description:
      "Quiet stones. Glass shores. A candle kept alight through the ruin.",
    names: [
      "Ash-lung Healer",
      "Salvage Brother",
      "Quiet-stone Pilgrim",
      "Unpaid Warden",
      "Glass-shore Gatherer",
      "Ruin Wayfinder",
      "Seed-grain Caravan",
      "Last Toll-road Walker",
      "Ash on the Water",
      "Buried Duplicate",
      "A Candle at the Door",
      "Broken Hands, Unbroken Record",
      "Witness of the Long Ash",
      "Cold Ford, RR 2389",
      "Continuing",
      "Ledgerbone, the Unerasable",
    ],
  },
  {
    id: "rekindled",
    code: "HRTH",
    name: "Rekindled Hearths",
    era: "RR 2447 · The present hour",
    chapter: "IX. The Rekindled Hearths.md",
    release: 8,
    block: "The Hearth Cycle",
    traditions: ["Verdancy", "Stone", "Radiance"],
    color: "#c4a267",
    symbol: "♧",
    description: "Keep the hearth. Keep the oath. Begin again, together.",
    names: [
      "Compact Journeyman",
      "Reedbound Boatwright",
      "Cinder Shieldmate",
      "Glass Tide Pilot",
      "Public Ledger Clerk",
      "Hearth Caravaner",
      "Reedfen Bargainer",
      "March Mine-master",
      "Keep the Hearth",
      "Open-square Audit",
      "Reopened Route",
      "Reusable Kiln-form",
      "Marshal of the Cinder March",
      "Council of Two Shores",
      "Every Horizon a Promise",
      "Keeper of the Rekindled Charter",
    ],
  },
];
export const manaColors = ["dawn", "tide", "grave", "ember", "grove"] as const;
export type ManaColor = (typeof manaColors)[number];
export const manaNames: Record<ManaColor, string> = {
  dawn: "Dawn",
  tide: "Tide",
  grave: "Grave",
  ember: "Ember",
  grove: "Grove",
};
export const manaSymbols: Record<ManaColor, string> = {
  dawn: "☀︎",
  tide: "≈",
  grave: "☾",
  ember: "△",
  grove: "♧",
};
export type Rarity = "common" | "uncommon" | "rare" | "mythic";
export type CardType =
  | "Creature"
  | "Basic Resource"
  | "Special Resource"
  | "Instant"
  | "Sorcery"
  | "Artifact"
  | "Enchantment"
  | "Hero";
export type Effect =
  | "none"
  | "damage"
  | "heal"
  | "draw"
  | "destroy"
  | "bounce"
  | "counter"
  | "pump"
  | "recall"
  | "shield"
  | "bind"
  | "renew"
  | "drain"
  | "rally";
export type Keyword =
  | "haste"
  | "vigilance"
  | "flying"
  | "reach"
  | "trample"
  | "lifelink"
  | "deathtouch"
  | "rootfast"
  | "daunt";
export interface HeroAbility {
  loyalty: number;
  effect: Effect;
  amount: number;
  text: string;
}
export interface Card {
  id: string;
  setId: string;
  number: number;
  name: string;
  rarity: Rarity;
  type: CardType;
  tradition: Tradition;
  cost: number;
  color: ManaColor;
  colored: number;
  attack: number;
  health: number;
  art: string;
  flavor: string;
  effect: Effect;
  amount: number;
  keywords: Keyword[];
  produces: ManaColor[];
  entersTapped: boolean;
  loyalty: number;
  abilities: HeroAbility[];
  trigger:
    | "none"
    | "gather"
    | "spellcraft"
    | "lifegain"
    | "mourning"
    | "welcome"
    | "recordwork";
  permanentEffect:
    | "none"
    | "anthem"
    | "sanctuary"
    | "mana-rock"
    | "watchfire"
    | "archive"
    | "welcome"
    | "recordwork";
  rules: string;
}
export const setIdentities: Record<
  string,
  { colors: [ManaColor, ManaColor]; archetype: string; plan: string }
> = {
  "first-oaths": {
    colors: ["dawn", "grove"],
    archetype: "Oathbound fellowship",
    plan: "Protect a wide board with Steadfast, lifegain and shared banners.",
  },
  "witness-roads": {
    colors: ["tide", "dawn"],
    archetype: "Witness control",
    plan: "Hold mana for responses, draw into answers, then protect a Hero.",
  },
  "iron-covenant": {
    colors: ["ember", "dawn"],
    archetype: "Forge and formation",
    plan: "Use artifacts and durable creatures to establish a protected attack.",
  },
  saltwind: {
    colors: ["tide", "ember"],
    archetype: "Spells on the tide",
    plan: "Grow spellcraft creatures while bouncing blockers and holding instant tricks.",
  },
  deepfen: {
    colors: ["grove", "grave"],
    archetype: "The returning grove",
    plan: "Trade creatures, regain life and reclaim threats from the graveyard.",
  },
  reckoning: {
    colors: ["grave", "tide"],
    archetype: "Debts of the dead",
    plan: "Counter threats, recur useful creatures and drain through deaths.",
  },
  ashfall: {
    colors: ["ember", "grave"],
    archetype: "Ash and aftermath",
    plan: "Force difficult blocks with Quickstep, burn and mourning triggers.",
  },
  rekindled: {
    colors: ["grove", "dawn"],
    archetype: "Rebuild the hearth",
    plan: "Make resource drops, grow the board and turn ordinary creatures into a fellowship.",
  },
};
const places = [
  "Cold Ford",
  "Grey Weir",
  "Anvilheights",
  "Outer Isles",
  "Deepfen",
  "Reed Ford",
  "Glass Shore",
  "Sallow Reach",
];
const creatureRoles = [
  "Roadside Forager",
  "Lantern Bearer",
  "Boundary Sentinel",
  "Waystone Seeker",
  "Household Defender",
  "Charter Scout",
  "Hearthland Forerunner",
  "Last-light Rider",
  "Keeper of Quiet Names",
  "Oathbound Envoy",
  "Twilight Familiar",
  "Traveling Celebrant",
  "Ruins Surveyor",
  "Market Escort",
  "River-wing Drake",
  "Stoneback Guardian",
];
const effectText = (effect: Effect, n: number) =>
  ({
    bind: "Exhaust target companion; it skips its next ready step.",
    renew: "Ready target companion and remove its binding.",
    drain: `Drain ${n} life from the opposing hearth after shields.`,
    rally: `Your companions get +${n}/+${n} until end of turn.`,
    none: "",
    damage: `Deal ${n} damage to a hearth, creature or Hero.`,
    heal: `Gain ${n} life.`,
    draw: `Draw ${n} card${n === 1 ? "" : "s"}.`,
    destroy: "Destroy target creature.",
    bounce: "Return target creature to its owner’s hand.",
    counter: "Counter target spell or ability.",
    pump: `Target creature gets +${n}/+${n} until end of turn.`,
    recall:
      "Return your most recently fallen creature from your graveyard to your hand.",
    shield: `Prevent the next ${n} damage to your hearth.`,
  })[effect];
function makeCard(
  set: CardSet,
  index: number,
  type: CardType,
  name: string,
): Card {
  const identity = setIdentities[set.id],
    color = identity.colors[index % 2],
    cost = type.includes("Resource") ? 0 : 1 + (index % 5);
  return {
    id: `${set.id}.${index + 1}`,
    setId: set.id,
    number: index + 1,
    name,
    rarity: index % 8 < 4 ? "common" : index % 8 < 6 ? "uncommon" : "rare",
    type,
    tradition: set.traditions[index % 3],
    cost,
    color,
    colored: cost >= 4 ? 2 : 1,
    attack: Math.max(1, cost - 1),
    health: cost + 1,
    art: `card.${set.id}.${index + 1}`,
    flavor: set.description,
    effect: "none",
    amount: 0,
    keywords: [],
    produces: [],
    entersTapped: false,
    loyalty: 0,
    abilities: [],
    trigger: "none",
    permanentEffect: "none",
    rules: "",
  };
}
export const cards: Card[] = sets.flatMap((set, si) => {
  const list: Card[] = [],
    place = places[si],
    identity = setIdentities[set.id];
  // Preserve the first sixteen stable IDs from the initial prototype.
  for (let i = 0; i < 24; i++) {
    const name = i < 16 ? set.names[i] : `${place} ${creatureRoles[i - 16]}`,
      type: CardType =
        i === 15
          ? "Hero"
          : i >= 8 && i <= 10
            ? i === 9
              ? "Instant"
              : "Sorcery"
            : i === 11 || i === 14
              ? "Artifact"
              : "Creature";
    const c = makeCard(set, i, type, name);
    if (i < 8) c.rarity = "common";
    if (i >= 8 && i <= 11) c.rarity = "uncommon";
    if (i >= 12 && i < 15) c.rarity = "rare";
    if (type === "Creature") {
      c.keywords = [
        (
          [
            "vigilance",
            "flying",
            "reach",
            "haste",
            "lifelink",
            "deathtouch",
            "trample",
          ] as Keyword[]
        )[(i + si) % 7],
      ];
      c.trigger =
        i % 3 === 0
          ? (
              [
                "lifegain",
                "spellcraft",
                "none",
                "spellcraft",
                "lifegain",
                "mourning",
                "mourning",
                "gather",
              ] as const
            )[si]
          : "none";
      if (i % 5 === 1) {
        c.effect = "heal";
        c.amount = 2;
      }
      if (i % 7 === 2) {
        c.effect = "draw";
        c.amount = 1;
        c.attack = Math.max(1, c.attack - 1);
      }
    } else if (type === "Sorcery" || type === "Instant") {
      c.effect = (
        [
          "shield",
          "draw",
          "damage",
          "bounce",
          "heal",
          "recall",
          "damage",
          "pump",
        ] as Effect[]
      )[si];
      c.amount = type === "Instant" ? 2 : 3;
    } else if (type === "Artifact") {
      c.permanentEffect = i === 11 ? "mana-rock" : "sanctuary";
      c.cost = i === 11 ? 2 : 3;
    }
    list.push(c);
  }
  // Five basics, all colors in every release; uncommon and rare dual-resource support.
  for (let i = 0; i < 8; i++) {
    const c = makeCard(
      set,
      list.length,
      i < 5 ? "Basic Resource" : "Special Resource",
      i < 5
        ? `${place} ${["Dawnfield", "Tidal Pool", "Burial Ground", "Ember Ridge", "Ancient Grove"][i]}`
        : `${place} ${["Sworn Crossing", "Moonlit Waystation", "Rekindled Sanctuary"][i - 5]}`,
    );
    c.rarity = i < 5 ? "common" : i < 7 ? "uncommon" : "rare";
    c.color = i < 5 ? manaColors[i] : identity.colors[0];
    c.produces = i < 5 ? [manaColors[i]] : [...identity.colors];
    c.entersTapped = i >= 5;
    c.colored = 0;
    if (i === 7) {
      c.effect = "heal";
      c.amount = 1;
    }
    list.push(c);
  }
  const patterns: {
    name: string;
    effect: Effect;
    amount: number;
    cost: number;
  }[] = [
    { name: "Written in Fire", effect: "damage", amount: 3, cost: 2 },
    { name: "Merciful Reprieve", effect: "heal", amount: 5, cost: 2 },
    { name: "Consult the Ledger", effect: "draw", amount: 2, cost: 3 },
    { name: "Sever the Bond", effect: "destroy", amount: 1, cost: 4 },
    { name: "Return to the Ford", effect: "bounce", amount: 1, cost: 2 },
    { name: "Refuse the Seal", effect: "counter", amount: 1, cost: 2 },
    { name: "Stand Together", effect: "pump", amount: 3, cost: 2 },
    { name: "Remember the Fallen", effect: "recall", amount: 1, cost: 2 },
    { name: "Hold the Lantern", effect: "shield", amount: 5, cost: 1 },
    { name: "Last-light Volley", effect: "damage", amount: 4, cost: 4 },
    { name: "An Honest Account", effect: "draw", amount: 3, cost: 5 },
    { name: "Strength of the Hearth", effect: "pump", amount: 5, cost: 4 },
  ];
  for (const type of ["Instant", "Sorcery"] as const)
    for (let i = 0; i < 12; i++) {
      const p = patterns[(i + si) % patterns.length],
        c = makeCard(
          set,
          list.length,
          type,
          `${place}: ${p.name}${type === "Sorcery" ? " Ritual" : ""}`,
        );
      c.effect =
        type === "Sorcery" && p.effect === "counter" ? "draw" : p.effect;
      c.amount = type === "Sorcery" && p.effect === "counter" ? 2 : p.amount;
      c.cost =
        p.cost +
        (type === "Instant" && ["draw", "destroy"].includes(p.effect) ? 1 : 0);
      c.colored = c.cost >= 4 ? 2 : 1;
      c.rarity = i < 6 ? "common" : i < 10 ? "uncommon" : "rare";
      list.push(c);
    }
  for (let i = 0; i < 8; i++) {
    const type = i < 4 ? "Artifact" : "Enchantment",
      c = makeCard(
        set,
        list.length,
        type,
        `${place} ${["Witness Lantern", "Caravan Compass", "Oath Bell", "Keeper’s Reliquary", "Banner of Remembering", "Shelter of the Hearth", "Pact of Returning", "Oath of the Living"][i]}`,
      );
    c.permanentEffect =
      i < 2 ? "mana-rock" : i % 2 === 0 ? "anthem" : "sanctuary";
    c.cost =
      c.permanentEffect === "anthem"
        ? 4
        : c.permanentEffect === "mana-rock"
          ? 2
          : 3;
    c.rarity = i < 2 ? "common" : i < 6 ? "uncommon" : "rare";
    list.push(c);
  }
  for (let i = 0; i < 8; i++) {
    const c = makeCard(
      set,
      list.length,
      i < 5 ? "Creature" : "Hero",
      `${place} ${i < 5 ? creatureRoles[i + 8] : ["First Keeper", "Unbroken Witness", "Last Chronicler"][i - 5]}`,
    );
    c.rarity = i < 3 ? "uncommon" : i < 6 ? "rare" : "mythic";
    c.cost = i < 5 ? 3 + (i % 3) : 4 + (i % 3);
    c.attack = c.cost - 1;
    c.health = c.cost + 1;
    if (i < 5) {
      c.keywords = [i % 2 ? "flying" : "trample"];
      c.trigger =
        si === 7
          ? "gather"
          : si === 1 || si === 3
            ? "spellcraft"
            : si === 4
              ? "lifegain"
              : "mourning";
    }
    list.push(c);
  }
  for (const c of list) {
    if (c.type === "Hero") {
      c.rarity = "mythic";
      c.cost = 4 + (c.number % 3);
      c.colored = 2;
      c.loyalty = 4;
      c.abilities = [
        { loyalty: 1, effect: "heal", amount: 2, text: "+1: Gain 2 life." },
        {
          loyalty: -2,
          effect: si % 2 ? "draw" : "damage",
          amount: si % 2 ? 2 : 3,
          text:
            si % 2 ? "−2: Draw 2 cards." : "−2: Deal 3 damage to any target.",
        },
        {
          loyalty: -6,
          effect: "damage",
          amount: 8,
          text: "−6: Deal 8 damage to any target.",
        },
      ];
    }
    c.rules = c.type.includes("Resource")
      ? `${c.entersTapped ? "Enters tapped. " : ""}Tap: add one ${c.produces.map((x) => manaNames[x]).join(" or ")} mana.${c.amount ? " Gain 1 life when this enters." : ""}`
      : c.type === "Hero"
        ? c.abilities.map((a) => a.text).join(" ")
        : [
            c.keywords.join(", "),
            c.trigger === "gather"
              ? "Gather: whenever a resource enters under your control, this gets a +1/+1 counter."
              : c.trigger === "spellcraft"
                ? "Spellcraft: whenever you cast an instant or sorcery, this gets a +1/+1 counter."
                : c.trigger === "lifegain"
                  ? "Fellowship: whenever you gain life, this gets a +1/+1 counter."
                  : c.trigger === "mourning"
                    ? "Mourning: whenever another friendly creature dies, the opposing hearth loses 1 life."
                    : "",
            c.permanentEffect === "mana-rock"
              ? `Tap: add one ${manaNames[c.color]} mana.`
              : c.permanentEffect === "anthem"
                ? "Your creatures get +1/+1."
                : c.permanentEffect === "sanctuary"
                  ? "At the beginning of your turn, gain 1 life."
                  : "",
            c.effect !== "none"
              ? `${c.type === "Creature" ? "When this enters: " : ""}${effectText(c.effect, c.amount)}`
              : "",
          ]
            .filter(Boolean)
            .join(" ");
  }
  list.push(...expansionCards(set, si, makeCard));
  for (const c of list) c.rules = tableWords(c.rules);
  return list;
});
export const cardById = Object.fromEntries(
  cards.map((c) => [c.id, c]),
) as Record<string, Card>;
export const setById = Object.fromEntries(sets.map((s) => [s.id, s])) as Record<
  string,
  CardSet
>;
export const DECK_SIZE = 100,
  COPY_LIMIT = 4;
export const isResource = (c: Card) =>
  c.type === "Basic Resource" || c.type === "Special Resource";
export const copyLimit = (c: Card) =>
  c.type === "Basic Resource" ? DECK_SIZE : COPY_LIMIT;
export const PACK_SLOTS = [
  { id: "common", count: 7, weights: { common: 1 } },
  { id: "uncommon", count: 3, weights: { uncommon: 1 } },
  { id: "resource", count: 1, weights: { basic: 0.8, special: 0.2 } },
  { id: "rare", count: 1, weights: { rare: 0.875, mythic: 0.125 } },
  {
    id: "wildcard",
    count: 1,
    weights: { common: 0.7, uncommon: 0.22, rare: 0.07, mythic: 0.01 },
  },
  {
    id: "foil",
    count: 1,
    weights: { common: 0.7, uncommon: 0.22, rare: 0.07, mythic: 0.01 },
  },
] as const;
export const PACK_SIZE = 14;
export const buyback = (c: Card) =>
  c.type === "Basic Resource"
    ? 0
    : { common: 1, uncommon: 2, rare: 6, mythic: 18 }[c.rarity];

/** Visual edition only: independent rare-slot upgrade, with no gameplay advantage. */
export const ILLUMINATED_CHANCE = 0.05;
