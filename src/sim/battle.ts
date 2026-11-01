import { z } from "zod";
import {
  battleMomentsSchema,
  publicTable,
  rememberExchange,
  rememberMoment,
} from "./battle-moments";
import { duelists, type RivalProfile } from "../content/tavern";
import { livingRecipes, livingRecipeDeck } from "../content/living-cards";
import { quietRecipes, quietRecipeDeck } from "../content/the-quiet";
import {
  cards,
  cardById,
  isResource,
  manaColors,
  manaNames,
  type ManaColor,
  type Card,
  type Effect,
  type Keyword,
} from "../content/catalog";
const cid = z
  .string()
  .refine((x) => Object.hasOwn(cardById, x), "Unknown card");
const nat = z.number().int().nonnegative();
const manaSchema = z.object({
  dawn: nat,
  tide: nat,
  grave: nat,
  ember: nat,
  grove: nat,
});
export const permanentSchema = z.object({
  uid: nat,
  cardId: cid,
  tapped: z.boolean(),
  entered: nat,
  damage: nat,
  counters: nat,
  boost: z.number().int(),
  loyalty: z.number().int(),
  used: nat,
  bound: nat.max(1).optional(),
});
const sideSchema = z.object({
  hp: z.number().int(),
  shield: nat,
  mana: manaSchema,
  hand: z.array(cid).max(200),
  draw: z.array(cid).max(100),
  grave: z.array(cid).max(200),
  board: z.array(permanentSchema).max(200),
  landDrops: nat,
});
const targetSchema = z.object({
  side: z.enum(["player", "enemy"]),
  kind: z.enum(["hearth", "creature", "hero", "stack"]),
  uid: nat.optional(),
});
export const battleSchema = z.object({
  turn: nat,
  active: z.enum(["player", "enemy"]),
  phase: z.enum([
    "main",
    "attack",
    "block",
    "damage",
    "second-main",
    "cleanup",
  ]),
  player: sideSchema,
  enemy: sideSchema,
  nextId: nat,
  result: z.enum(["playing", "won", "lost", "drawn"]),
  rewarded: z.boolean(),
  stack: z
    .array(
      z.object({
        uid: nat,
        owner: z.enum(["player", "enemy"]),
        cardId: cid,
        effect: z.string(),
        amount: nat,
        target: targetSchema.nullable(),
        ability: z.boolean(),
        /** A queued automatic trigger (gather, lifegain, spellcraft, welcome, recordwork, mourning). */
        trigger: z.string().optional(),
        /** Permanents whose trigger this is; the trigger fades for any that left the table. */
        sources: z.array(nat).max(200).optional(),
      }),
    )
    .max(100),
  combat: z
    .array(
      z.object({
        uid: nat,
        hero: nat.nullable(),
        /** First blocker, kept for older saves and displays; `blockers` is authoritative. */
        blocker: nat.nullable(),
        blockers: z.array(nat).max(20).default([]),
        blocked: z.boolean(),
      }),
    )
    .max(200),
  log: z.array(z.string()).max(20),
  moments: battleMomentsSchema,
  mulligans: nat,
  opponent: z.string(),
  opponentId: z
    .string()
    .refine((id) => duelists.some((guest) => guest.id === id))
    .nullable()
    .default(null),
  secondsLeft: nat.max(60).default(60),
  timed: z.boolean().default(true),
  autoplay: z.boolean().default(false),
  /** A borrowed-recipe practice duel: no rewards, record or recipe unlock. */
  practice: z.boolean().default(false),
  fullControl: z.boolean().default(false),
  priority: z.enum(["player", "enemy"]).default("player"),
  passes: nat.max(1).default(0),
  reserveColor: z
    .enum(["dawn", "tide", "grave", "ember", "grove"])
    .nullable()
    .default(null),
  tapHistory: z
    .array(z.object({ uid: nat, mana: manaSchema }))
    .max(200)
    .default([]),
  eventSequence: nat.default(0),
  events: z
    .array(
      z.object({
        id: nat,
        kind: z.string(),
        text: z.string(),
        cardId: cid.optional(),
        owner: z.enum(["player", "enemy"]).optional(),
      }),
    )
    .max(40)
    .default([]),
});
export type Battle = z.infer<typeof battleSchema>;
export type Side = Battle["player"];
export type Permanent = z.infer<typeof permanentSchema>;
export type Target = z.infer<typeof targetSchema>;
export type Owner = "player" | "enemy";
export { rivalProfiles, type RivalProfile } from "../content/tavern";
export const rivalProfileNames: Record<RivalProfile, string> = {
  steady: "Steady",
  aggressive: "Aggressive",
  defensive: "Defensive",
  reactive: "Reactive",
  recursive: "Recursive",
  evasive: "Evasive",
  hero: "Hero-minded",
};
export const rivalProfileNotes: Record<RivalProfile, string> = {
  steady: "Plays a plain, even game.",
  aggressive: "Races: attacks into even trades and blocks only to win them.",
  defensive:
    "Keeps blockers home, protects companions and blocks to prevent damage.",
  reactive: "Removes the biggest threat first and holds mana for responses.",
  recursive: "Trades companions freely and reclaims the fallen.",
  evasive: "Presses with Skyborne attackers and keeps them out of bad trades.",
  hero: "Casts Heroes early, uses their abilities and attacks yours.",
};
/** How a keeper can play against each personality; shown in the guestbook. */
export const rivalProfileCounterplay: Record<RivalProfile, string> = {
  steady:
    "Attacks only when safe and blocks with the weakest legal companion; a plain, even game.",
  aggressive:
    "Expect early attacks and even trades. Keep a blocker on the table from the first turns, steady the hearth with healing or shields, and let the rush spend itself before your larger companions take over.",
  defensive:
    "They hold companions home, block to absorb damage and protect a threatened companion with a trick before spending a counter. Attack wide or with Skyborne companions, use removal before combat, and expect your damage spells to meet a response.",
  reactive:
    "They remove your biggest companion first and keep counter mana untapped while you hold cards. Lead with a lesser spell to draw the counter, empty your hand to free their mana, and spread several threats rather than one.",
  recursive:
    "They trade companions freely and reclaim the fallen. Avoid even trades, keep pressure on the hearth, and answer a recalled companion with bounce or binding rather than another trade.",
  evasive:
    "They press with Skyborne companions and keep them out of bad trades. Bring Skyborne or Highguard defenders, point direct damage at the fliers, and race on the ground where their blockers are thin.",
  hero: "They cast Heroes early, use an ability every turn and aim attacks at your Hero. Remove or attack their Hero before it builds devotion, keep your own Hero behind blockers, and save a counter for the Hero itself.",
};
/** The personality a deck's own composition suggests; autoplay pilots the keeper's recipe in its intended style. */
export function deckProfile(deck: string[]): RivalProfile {
  const spells = deck.map((id) => cardById[id]).filter((c) => !isResource(c)),
    count = (test: (c: Card) => boolean) => spells.filter(test).length,
    creatures = count((c) => c.type === "Creature") || 1,
    counters = count((c) => c.effect === "counter");
  if (
    count((c) => c.keywords.includes("haste")) / creatures >= 0.2 ||
    (count((c) => c.effect === "damage" || c.effect === "pump") >= 8 &&
      !counters)
  )
    return "aggressive";
  if (counters >= 4) return "reactive";
  if (count((c) => c.effect === "recall" || c.trigger === "mourning") >= 12)
    return "recursive";
  if (count((c) => c.keywords.includes("flying")) / creatures >= 0.2)
    return "evasive";
  if (
    count(
      (c) =>
        ["heal", "shield"].includes(c.effect) ||
        ["anthem", "sanctuary"].includes(c.permanentEffect),
    ) >= 10
  )
    return "defensive";
  return "steady";
}
/** Every card a side owns in the duel: library, hand, graveyard, table and its own spells waiting on the stack, so a profile read from them never changes while a spell resolves. */
export function sideCards(
  b: Pick<Battle, "player" | "enemy" | "stack">,
  owner: Owner,
): string[] {
  const s = b[owner];
  return [
    ...s.draw,
    ...s.hand,
    ...s.grave,
    ...s.board.map((p) => p.cardId),
    ...b.stack.filter((x) => x.owner === owner).map((x) => x.cardId),
  ];
}
/** A seven- or eight-card opening hand worth the one free redraw: fewer than two or more than five resources. */
export function wantsRedraw(hand: string[]) {
  const n = hand.filter((id) => isResource(cardById[id])).length;
  return n < 2 || n > 5;
}
/** The hand positions of the `n` costliest cards, costliest first, ties by position. */
export function costliest(hand: string[], n: number) {
  return hand
    .map((id, index) => ({ cost: cardById[id]?.cost ?? 0, index }))
    .sort((a, z) => z.cost - a.cost || a.index - z.index)
    .slice(0, Math.max(0, n))
    .map((c) => c.index);
}
/** Public personality only: the guest's own, or the style the rival's deck suggests when no guest is seated (practice partners, the balance matrix). */
export function rivalProfile(
  b: Pick<Battle, "opponentId" | "opponent" | "player" | "enemy" | "stack">,
): RivalProfile {
  const guest = b.opponentId
    ? duelists.find((g) => g.id === b.opponentId)
    : duelists.find((g) => b.opponent.startsWith(g.name + " · "));
  return guest?.profile ?? deckProfile(sideCards(b, "enemy"));
}
export type BattleCommand =
  | { type: "play"; index: number; target?: Target; expectedCardId?: string }
  | { type: "tap"; uid: number; color: ManaColor }
  | { type: "pass" }
  | { type: "end-turn" }
  | { type: "combat" }
  | {
      type: "declare";
      attackers: number[];
      hero?: number;
      /** Per-attacker destinations; omitted attackers use `hero` or the hearth. */
      destinations?: { uid: number; hero: number | null }[];
    }
  /** Adds the blocker to the attacker, removes it when already assigned, or clears all with null. */
  | { type: "block"; attacker: number; blocker: number | null }
  /** The attacking player's damage order among an attacker's blockers. */
  | { type: "damage-order"; attacker: number; blockers: number[] }
  | { type: "damage" }
  | { type: "hero"; uid: number; ability: number; target?: Target }
  | { type: "mulligan" }
  | {
      type: "battle-controls";
      fullControl?: boolean;
      reserveColor?: ManaColor | null;
    }
  | { type: "undo-tap" }
  | { type: "discard"; indices: number[] }
  | { type: "battle-tick" }
  | { type: "battle-clock"; timed: boolean };
export const zeroMana = () => ({
  dawn: 0,
  tide: 0,
  grave: 0,
  ember: 0,
  grove: 0,
});
export const presets = [
  {
    id: "fellowship",
    name: "Rekindled Fellowship",
    colors: ["grove", "dawn"] as ManaColor[],
    sets: ["rekindled", "first-oaths"],
    plan: "Gather, healing and Steadfast defenders.",
  },
  {
    id: "tempo",
    name: "Paper & Flame",
    colors: ["tide", "ember"] as ManaColor[],
    sets: ["saltwind", "witness-roads"],
    plan: "Spellcraft, Skyborne threats and instant responses.",
  },
  {
    id: "recursion",
    name: "The Returning Grove",
    colors: ["grove", "grave"] as ManaColor[],
    sets: ["deepfen", "reckoning"],
    plan: "Trade creatures, reclaim the fallen and grow through healing.",
  },
  {
    id: "cinder",
    name: "Cinder March Vanguard",
    colors: ["ember", "dawn"] as ManaColor[],
    sets: ["iron-covenant", "ashfall"],
    plan: "Quickstep, direct damage and an early creature offensive.",
  },
  {
    id: "witness",
    name: "Witnesses at Dusk",
    colors: ["tide", "grave"] as ManaColor[],
    sets: ["witness-roads", "reckoning"],
    plan: "Counter key spells, draw answers and recover fallen threats.",
  },
  {
    id: "embers",
    name: "Debts of the Long Ash",
    colors: ["ember", "grave"] as ManaColor[],
    sets: ["ashfall", "reckoning"],
    plan: "Removal and mourning turn creature trades into pressure.",
  },
  {
    id: "lantern",
    name: "Lanternwatch Company",
    colors: ["dawn", "tide"] as ManaColor[],
    sets: ["first-oaths", "witness-roads"],
    plan: "Protect a patient line, replenish your hand and interrupt key threats.",
  },
  {
    id: "wildfire",
    name: "Root & Cinder",
    colors: ["grove", "ember"] as ManaColor[],
    sets: ["rekindled", "iron-covenant"],
    plan: "Low-cost pressure, growth and forceful combat tricks.",
  },
  {
    id: "relics",
    name: "Keepers of Lost Things",
    colors: ["dawn", "grave"] as ManaColor[],
    sets: ["iron-covenant", "reckoning"],
    plan: "Defensive relics, recovery and a durable late-game presence.",
  },
  {
    id: "river",
    name: "Reedwater Revel",
    colors: ["tide", "grove"] as ManaColor[],
    sets: ["saltwind", "deepfen"],
    plan: "Skyborne threats, recall and disruption along the river.",
  },
];
presets.push(
  {
    id: "shelter",
    name: "The Open Door",
    colors: ["dawn", "grove"],
    sets: ["first-oaths", "rekindled"],
    plan: "Welcome arrivals, ready defenders and rally a broad board.",
  },
  {
    id: "binding",
    name: "Letters of Restraint",
    colors: ["tide", "grave"],
    sets: ["witness-roads", "reckoning"],
    plan: "Bind threats, record relics and drain through the late game.",
  },
);
export const challengeRecipes = [
  {
    id: "candlewatch",
    name: "Candles Against the Rain",
    colors: ["dawn", "tide"] as ManaColor[],
    sets: ["rekindled", "saltwind"],
    plan: "Protect Skyborne attackers and replenish your hand; wide attacks can overwhelm the watch.",
  },
  {
    id: "kiln",
    name: "The Kiln Wakes",
    colors: ["ember", "grove"] as ManaColor[],
    sets: ["ashfall", "first-oaths"],
    plan: "Quickstep pressure and combat growth; removal before combat breaks the rush.",
  },
  {
    id: "funeral",
    name: "The Last Lantern",
    colors: ["dawn", "grave"] as ManaColor[],
    sets: ["deepfen", "first-oaths"],
    plan: "Recover defenders and sustain a patient hearth; evasive pressure punishes the slow opening.",
  },
  {
    id: "mirror",
    name: "Mirrors on the Sallow",
    colors: ["tide", "ember"] as ManaColor[],
    sets: ["saltwind", "witness-roads", "ashfall"],
    plan: "Spellcraft threats backed by damage and counterspells; bait the answers before committing a Hero.",
  },
  {
    id: "thicket",
    name: "The Thornbound Path",
    colors: ["grove", "grave"] as ManaColor[],
    sets: ["iron-covenant", "deepfen", "reckoning"],
    plan: "Reclaim traded creatures and outlast early pressure; race with evasion before recovery takes hold.",
  },
  {
    id: "winter",
    name: "Winter's Guestbook",
    colors: ["tide", "grave"] as ManaColor[],
    sets: ["saltwind", "ashfall", "reckoning"],
    plan: "Draw answers, bind threats and drain a stalled hearth; multiple cheap threats stretch the answers.",
  },
];
presets.push(...challengeRecipes);
presets.push(...livingRecipes, ...quietRecipes);
export function recipeUnlocked(
  game: { unlockedRecipes?: string[] },
  id: string,
) {
  return (
    !challengeRecipes.some((p) => p.id === id) ||
    !!game.unlockedRecipes?.includes(id)
  );
}
export function presetDeck(preset = "fellowship"): string[] {
  const authored = livingRecipeDeck(preset) ?? quietRecipeDeck(preset);
  if (authored) return authored;
  const p = presets.find((p) => p.id === preset) ?? presets[0],
    pool = cards.filter(
      (c) => p.sets.includes(c.setId) && p.colors.includes(c.color),
    ),
    chosen: Card[] = [];
  const preferred =
    p.id === "mirror"
      ? ["mourning", "spellcraft"]
      : p.id === "fellowship"
        ? ["gather", "lifegain"]
        : ["tempo", "mirror"].includes(p.id)
          ? ["spellcraft"]
          : ["cinder", "wildfire", "kiln"].includes(p.id)
            ? ["spellcraft", "gather"]
            : ["recursion", "thicket"].includes(p.id)
              ? ["mourning"]
              : ["mourning", "lifegain"];
  // Balance pass 2 (2026-10-30): keyword tiers tried before the trigger
  // preference. The fast Ember recipes want Overrun and Skyborne bodies, then
  // Quickstep; The Thornbound Path races with Skyborne and Reach bodies and
  // trades with Venom.
  // Balance pass 3 (2026-10-31): Lanternwatch Company protects a line that
  // can close, Skyborne and Hearthbond bodies first, then Highguard and Venom.
  const favored: Keyword[][] = ["cinder", "wildfire", "kiln"].includes(p.id)
    ? [["trample", "flying"], ["haste"]]
    : p.id === "thicket"
      ? [["flying", "reach"], ["deathtouch"]]
      : p.id === "lantern"
        ? [
            ["flying", "lifelink"],
            ["reach", "deathtouch"],
          ]
        : [];
  const tier = (c: Card) => {
    const i = favored.findIndex((tier) =>
      tier.some((k) => c.keywords.includes(k)),
    );
    return i < 0 ? favored.length : i;
  };
  // Balance pass 1 (2026-10-29): the fast Ember recipes leave the one-drop
  // bodies behind and press with cost-two to cost-four Overrun and Skyborne
  // companions, since every foundation body is cost−1/cost+1.
  const curve = ["cinder", "wildfire", "kiln"].includes(p.id)
    ? [2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5, 5]
    : [1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5];
  for (const cost of curve) {
    const c = pool
      .filter((c) => c.type === "Creature" && !chosen.includes(c))
      .sort(
        (a, b) =>
          Math.abs(a.cost - cost) - Math.abs(b.cost - cost) ||
          tier(a) - tier(b) ||
          Number(preferred.includes(b.trigger)) -
            Number(preferred.includes(a.trigger)) ||
          a.id.localeCompare(b.id),
      )[0];
    chosen.push(c);
  }
  // Ten spell and permanent slots per recipe, filled cheapest-first from the
  // pool. "none" takes mana rocks and other plain permanents.
  const spellPackages: Record<string, string[]> = {
    shelter: [
      "renew",
      "rally",
      "rally",
      "heal",
      "heal",
      "shield",
      "none",
      "none",
      "none",
      "none",
    ],
    binding: [
      "bind",
      "drain",
      "counter",
      "draw",
      "recall",
      "destroy",
      "none",
      "none",
      "none",
      "none",
    ],
    lantern: [
      "counter",
      "shield",
      "shield",
      "draw",
      "draw",
      "bounce",
      "pump",
      "heal",
      "none",
      "none",
    ],
    relics: [
      "none",
      "none",
      "none",
      "none",
      "recall",
      "recall",
      "heal",
      "destroy",
      "destroy",
      "draw",
    ],
    // Balance pass 2 (2026-10-30): The Kiln Wakes trades a pump and two mana
    // rocks for a fifth burn spell, a removal spell and a draw.
    kiln: [
      "damage",
      "damage",
      "damage",
      "damage",
      "damage",
      "pump",
      "pump",
      "destroy",
      "draw",
      "none",
    ],
    cinder: [
      "damage",
      "damage",
      "damage",
      "damage",
      "pump",
      "pump",
      "pump",
      "none",
      "none",
      "none",
    ],
    witness: [
      "counter",
      "counter",
      "draw",
      "draw",
      "destroy",
      "recall",
      "bounce",
      "heal",
      "none",
      "none",
    ],
    embers: [
      "damage",
      "damage",
      "destroy",
      "recall",
      "draw",
      "pump",
      "none",
      "none",
      "none",
      "none",
    ],
    tempo: [
      "counter",
      "counter",
      "damage",
      "damage",
      "bounce",
      "bounce",
      "draw",
      "draw",
      "pump",
      "none",
    ],
    // Balance pass 2: The Thornbound Path reclaims twice and shields instead of healing.
    thicket: [
      "recall",
      "recall",
      "destroy",
      "pump",
      "draw",
      "shield",
      "none",
      "none",
      "none",
      "none",
    ],
    recursion: [
      "recall",
      "destroy",
      "heal",
      "heal",
      "draw",
      "pump",
      "none",
      "none",
      "none",
      "none",
    ],
  };
  spellPackages.winter = spellPackages.binding;
  spellPackages.candlewatch = spellPackages.lantern;
  spellPackages.funeral = spellPackages.relics;
  spellPackages.wildfire = spellPackages.cinder;
  spellPackages.mirror = spellPackages.tempo;
  spellPackages.river = spellPackages.recursion;
  const effects = spellPackages[p.id] ?? [
    "pump",
    "pump",
    "heal",
    "heal",
    "shield",
    "draw",
    "destroy",
    "none",
    "none",
    "none",
  ];
  for (const effect of effects) {
    const c = pool
      .filter(
        (c) =>
          ["Instant", "Sorcery", "Artifact", "Enchantment"].includes(c.type) &&
          c.effect === effect &&
          !chosen.includes(c),
      )
      .sort((a, b) => a.cost - b.cost || a.id.localeCompare(b.id))[0];
    if (!c) throw Error(`Deck ${p.id} has no remaining ${effect} spell.`);
    chosen.push(c);
  }
  if (["shelter", "binding"].includes(p.id)) {
    const additions = pool.filter((c) => c.number === 75);
    for (let i = 0; i < additions.length; i++) chosen[i] = additions[i];
  }
  const champions = pool.filter((c) => c.type === "Hero").slice(0, 2),
    resource = p.colors.map((color) =>
      cards.find(
        (c) =>
          c.type === "Basic Resource" &&
          c.produces[0] === color &&
          c.setId === p.sets[0],
      )!,
    );
  return [
    ...resource.flatMap((c) => Array(20).fill(c.id)),
    ...[...chosen, ...champions].flatMap((c) => [c.id, c.id]),
  ];
}
const other = (owner: Owner): Owner =>
  owner === "player" ? "enemy" : "player";
/** Public event fields let the interface react without reading the text. */
type EventFields = { kind?: string; cardId?: string; owner?: Owner };
const log = (b: Battle, text: string, fields: EventFields = {}) => {
  b.log = [text, ...b.log].slice(0, 20);
  b.eventSequence = (b.eventSequence ?? 0) + 1;
  b.events = [
    ...(b.events ?? []),
    {
      id: b.eventSequence,
      kind:
        fields.kind ??
        (text.includes("cast ")
          ? "cast"
          : text.includes("resolved")
            ? "resolve"
            : text.includes("damage")
              ? "combat"
              : "notice"),
      text,
      ...(fields.cardId ? { cardId: fields.cardId } : {}),
      ...(fields.owner ? { owner: fields.owner } : {}),
    },
  ].slice(-40);
};
export const creatures = (s: Side) =>
  s.board.filter((p) => cardById[p.cardId].type === "Creature");
export const resources = (s: Side) =>
  s.board.filter((p) => isResource(cardById[p.cardId]));
export const heroes = (s: Side) =>
  s.board.filter((p) => cardById[p.cardId].type === "Hero");
export function stats(s: Side, p: Permanent) {
  const anthem = s.board.filter(
      (x) => cardById[x.cardId].permanentEffect === "anthem",
    ).length,
    c = cardById[p.cardId];
  return {
    power: c.attack + p.counters + p.boost + anthem,
    toughness: c.health + p.counters + p.boost + anthem,
  };
}
export const canAttack = (b: Battle, p: Permanent) =>
  !p.tapped &&
  (p.entered < b.turn || cardById[p.cardId].keywords.includes("haste"));
const remaining = (s: Side, p: Permanent) => stats(s, p).toughness - p.damage;
const hasKeyword = (p: Permanent, k: Keyword) =>
  cardById[p.cardId].keywords.includes(k);
/** Whether `a` on side `as` would destroy `d` on side `ds` in one exchange. */
function slays(as: Side, a: Permanent, ds: Side, d: Permanent) {
  const power = Math.max(0, stats(as, a).power);
  return (
    power >= remaining(ds, d) || (power > 0 && hasKeyword(a, "deathtouch"))
  );
}
/** Damage to a hearth: a shield absorbs what it can first, the rest is lost health. Every path that hurts a hearth goes through here. */
function hurt(b: Battle, owner: Owner, n: number) {
  const s = b[owner],
    blocked = Math.min(s.shield, Math.max(0, n));
  s.shield -= blocked;
  s.hp -= Math.max(0, n) - blocked;
  return Math.max(0, n) - blocked;
}
function heal(b: Battle, owner: Owner, n: number) {
  if (n <= 0) return;
  b[owner].hp += n;
  queueTrigger(b, owner, "lifegain", withTrigger(b[owner], "lifegain"));
}
export const triggerNames: Record<string, string> = {
  gather: "Gather",
  lifegain: "Fellowship",
  spellcraft: "Spellcraft",
  welcome: "Welcome",
  recordwork: "Recordwork",
  mourning: "Mourning",
};
const withTrigger = (s: Side, trigger: string, except?: number) =>
  s.board.filter(
    (p) =>
      p.uid !== except &&
      (cardById[p.cardId].trigger === trigger ||
        cardById[p.cardId].permanentEffect === trigger),
  );
/** Name a queued trigger by its kind and lead source. */
export function triggerLabel(item: Battle["stack"][number]) {
  const n = item.sources?.length ?? 0;
  return `${triggerNames[item.trigger ?? ""] ?? "Trigger"} · ${cardById[item.cardId].name}${n > 1 ? ` ×${n}` : ""}`;
}
/**
 * Automatic triggers wait on the stack like spells: both players may respond
 * before one resolves, and it fades for every source that has left the table.
 * Triggers from one event share one item so a response window costs one pass.
 */
function queueTrigger(
  b: Battle,
  owner: Owner,
  trigger: string,
  sources: Permanent[],
  amount = 1,
) {
  if (!sources.length || b.result !== "playing") return;
  const item = {
    uid: b.nextId++,
    owner,
    cardId: sources[0].cardId,
    effect: "none",
    amount,
    target: null,
    ability: true,
    trigger,
    sources: sources.map((p) => p.uid),
  };
  b.passes = 0;
  b.stack.push(item);
  log(
    b,
    `${owner === "player" ? "Your" : "Opposing"} ${triggerLabel(item)} waits on the stack. A response may be played.`,
    { kind: "trigger", cardId: item.cardId, owner },
  );
}
function resolveTrigger(b: Battle, item: Battle["stack"][number]) {
  const owner = item.owner,
    side = b[owner],
    live = (item.sources ?? []).filter((uid) =>
      side.board.some((p) => p.uid === uid),
    ),
    label = triggerLabel(item);
  if (!live.length) {
    log(b, `${label} faded: its source had left the table.`, {
      kind: "trigger-resolve",
      cardId: item.cardId,
      owner,
    });
    return;
  }
  if (["gather", "lifegain", "spellcraft"].includes(item.trigger!))
    for (const uid of live) side.board.find((p) => p.uid === uid)!.counters++;
  // Welcome heals once per watcher, so Fellowship grows once per watcher.
  if (item.trigger === "welcome") for (const _ of live) heal(b, owner, 1);
  if (item.trigger === "recordwork") {
    // A watcher is spent when its draw happens, not when its trigger is queued.
    for (const uid of live)
      side.board.find((p) => p.uid === uid)!.used = b.turn;
    draw(b, owner, live.length);
  }
  if (item.trigger === "mourning")
    hurt(b, other(owner), item.amount * live.length);
  log(b, `${label} resolved.`, {
    kind: "trigger-resolve",
    cardId: item.cardId,
    owner,
  });
  stateActions(b);
}
/** Fallen friendly companions: every Mourning watcher drains the other hearth once each. */
function mourn(b: Battle, owner: Owner, fallen: number) {
  if (fallen > 0)
    queueTrigger(
      b,
      owner,
      "mourning",
      withTrigger(b[owner], "mourning"),
      fallen,
    );
}
function stateActions(b: Battle) {
  const fallenCreatures = { player: 0, enemy: 0 };
  for (let iteration = 0; iteration < 200; iteration++) {
    let dead = 0;
    for (const owner of ["player", "enemy"] as const) {
      const s = b[owner],
        fallen = s.board.filter((p) =>
          cardById[p.cardId].type === "Creature"
            ? p.damage >= stats(s, p).toughness || stats(s, p).toughness <= 0
            : cardById[p.cardId].type === "Hero" && p.loyalty <= 0,
        );
      if (!fallen.length) continue;
      const ids = new Set(fallen.map((p) => p.uid));
      s.board = s.board.filter((p) => !ids.has(p.uid));
      s.grave.push(...fallen.map((p) => p.cardId));
      dead += fallen.length;
      fallenCreatures[owner] += fallen.filter(
        (p) => cardById[p.cardId].type === "Creature",
      ).length;
    }
    if (!dead) break;
  }
  if (b.player.hp <= 0 && b.enemy.hp <= 0) b.result = "drawn";
  else if (b.player.hp <= 0) b.result = "lost";
  else if (b.enemy.hp <= 0) b.result = "won";
  // The active player's triggers wait first, so the other side's resolve first.
  for (const owner of [b.active, other(b.active)])
    mourn(b, owner, fallenCreatures[owner]);
}
function draw(b: Battle, owner: Owner, n = 1) {
  for (let i = 0; i < n; i++) {
    const id = b[owner].draw.shift();
    if (!id) {
      b[owner].hp = 0;
      rememberMoment(b, "An empty library", [
        `${owner === "player" ? "You" : "Your opponent"} needed to draw from an empty library. ${owner === "player" ? "Your" : "The opposing"} hearth fell to 0 health.`,
      ]);
      log(
        b,
        `${owner === "player" ? "Your" : "The opposing"} library is empty.`,
      );
      break;
    }
    b[owner].hand.push(id);
  }
  stateActions(b);
}
function makeSide(deck: string[]): Side {
  return {
    hp: 20,
    shield: 0,
    mana: zeroMana(),
    hand: [],
    draw: deck,
    grave: [],
    board: [],
    landDrops: 0,
  };
}
export function createBattle(
  playerDeck: string[],
  enemyDeck: string[],
  opponent = "Tamsin Reed",
  options: { first?: Owner; opponentId?: string | null } = {},
): Battle {
  const b: Battle = {
    turn: 1,
    active: "player",
    phase: "main",
    player: makeSide(playerDeck),
    enemy: makeSide(enemyDeck),
    nextId: 1,
    result: "playing",
    rewarded: false,
    stack: [],
    combat: [],
    log: ["A hundred stories each. One hearth to defend."],
    moments: [],
    mulligans: 0,
    opponent,
    opponentId: null,
    secondsLeft: 60,
    timed: true,
    autoplay: false,
    practice: false,
    fullControl: false,
    priority: "player",
    passes: 0,
    reserveColor: null,
    tapHistory: [],
    eventSequence: 0,
    events: [],
  };
  b.opponentId = options.opponentId ?? null;
  draw(b, "player", 7);
  draw(b, "enemy", 7);
  if (options.first === "enemy") {
    b.active = "enemy";
    log(b, `${opponent} opens the duel.`);
    aiStep(b);
    b.priority = "player";
  }
  return b;
}
function permanent(b: Battle, id: string): Permanent {
  return {
    uid: b.nextId++,
    cardId: id,
    tapped: cardById[id].entersTapped,
    entered: b.turn,
    damage: 0,
    counters: 0,
    boost: 0,
    loyalty: cardById[id].loyalty,
    used: 0,
  };
}
function sourceColors(p: Permanent): ManaColor[] {
  const c = cardById[p.cardId];
  return isResource(c)
    ? c.produces
    : c.permanentEffect === "mana-rock"
      ? [c.color]
      : [];
}
/** A dual source offers alternatives, not two spendable mana. */
export function availableResources(s: Side) {
  const ready = s.board.filter((p) => !p.tapped && sourceColors(p).length);
  return {
    total: ready.length + manaColors.reduce((n, color) => n + s.mana[color], 0),
    colors: Object.fromEntries(
      manaColors.map((color) => [
        color,
        s.mana[color] +
          ready.filter((p) => sourceColors(p).includes(color)).length,
      ]),
    ) as Record<ManaColor, number>,
    flexible: ready.filter((p) => sourceColors(p).length > 1).length,
  };
}
/** Pays colored pips first, then generic mana, with deterministic automatic resource tapping. */
function pay(s: Side, c: Card, reserveColor: ManaColor | null = null) {
  const pool = { ...s.mana },
    available = s.board.filter((p) => !p.tapped && sourceColors(p).length),
    tapped = new Set<number>();
  function take(color: ManaColor) {
    if (pool[color] > 0) {
      pool[color]--;
      return true;
    }
    const p = available
      .filter((p) => !tapped.has(p.uid) && sourceColors(p).includes(color))
      .sort(
        (a, b) =>
          sourceColors(a).length - sourceColors(b).length || a.uid - b.uid,
      )[0];
    if (!p) return false;
    tapped.add(p.uid);
    return true;
  }
  for (let i = 0; i < c.colored; i++)
    if (!take(c.color))
      throw Error(
        `You need ${c.colored} ${manaNames[c.color]} mana for ${c.name}.`,
      );
  for (let i = 0; i < c.cost - c.colored; i++) {
    const color = [...manaColors]
      .sort((a, b) => Number(a === reserveColor) - Number(b === reserveColor))
      .find((k) => pool[k] > 0);
    if (color) pool[color]--;
    else {
      const p = available
        .filter((p) => !tapped.has(p.uid))
        .sort(
          (a, b) =>
            Number(!!reserveColor && sourceColors(a).includes(reserveColor)) -
              Number(
                !!reserveColor && sourceColors(b).includes(reserveColor),
              ) ||
            sourceColors(a).length - sourceColors(b).length ||
            a.uid - b.uid,
        )[0];
      if (!p) throw Error("Not enough untapped mana sources.");
      tapped.add(p.uid);
    }
  }
  s.mana = pool;
  s.board.forEach((p) => {
    if (tapped.has(p.uid)) p.tapped = true;
  });
}
export function paymentPreview(b: Battle, c: Card) {
  if (isResource(c))
    return {
      tapped: [] as number[],
      remaining: availableResources(b.player),
      error: "",
    };
  const copy = structuredClone(b.player);
  try {
    pay(copy, c, b.reserveColor);
    return {
      tapped: copy.board
        .filter(
          (p) =>
            p.tapped && !b.player.board.find((q) => q.uid === p.uid)?.tapped,
        )
        .map((p) => p.uid),
      remaining: availableResources(copy),
      error: "",
    };
  } catch (e) {
    return {
      tapped: [] as number[],
      remaining: availableResources(b.player),
      error: (e as Error).message,
    };
  }
}
export function legalTargets(b: Battle, effect: Effect): Target[] {
  const targets: Target[] = (["player", "enemy"] as const).flatMap((side) => [
    { side, kind: "hearth" as const },
    ...b[side].board
      .filter((p) => ["Creature", "Hero"].includes(cardById[p.cardId].type))
      .map((p) => ({
        side,
        kind:
          cardById[p.cardId].type === "Hero"
            ? ("hero" as const)
            : ("creature" as const),
        uid: p.uid,
      })),
  ]);
  targets.push(
    ...b.stack.map((p) => ({
      side: p.owner,
      kind: "stack" as const,
      uid: p.uid,
    })),
  );
  return targets.filter((t) => validateTarget(b, effect, t));
}
export function playReason(b: Battle, c: Card) {
  if (b.result !== "playing") return "The duel has ended.";
  if (b.phase === "cleanup")
    return "Choose cards to put away before ending the turn.";
  if (b.priority !== "player") return "Your opponent has the response.";
  const main =
    b.active === "player" &&
    ["main", "second-main"].includes(b.phase) &&
    !b.stack.length;
  if (isResource(c) && b.player.landDrops)
    return "One resource per turn — already played.";
  if (c.type !== "Instant" && !main)
    return "Only instants can respond here; wait for your main phase and an empty stack.";
  const payment = paymentPreview(b, c);
  if (payment.error) return payment.error;
  if (
    ["Instant", "Sorcery"].includes(c.type) &&
    !validateTarget(b, c.effect, null) &&
    !legalTargets(b, c.effect).length
  )
    return "No legal target on the table.";
  return "";
}
export function affordable(s: Side, c: Card) {
  if (isResource(c)) return s.landDrops < 1;
  try {
    pay(structuredClone(s), c);
    return true;
  } catch {
    return false;
  }
}
export function validateTarget(
  b: Battle,
  effect: Effect,
  target: Target | null,
) {
  if (
    ![
      "damage",
      "destroy",
      "bounce",
      "pump",
      "counter",
      "bind",
      "renew",
    ].includes(effect)
  )
    return true;
  if (!target) return false;
  if (effect === "counter")
    return (
      target.kind === "stack" &&
      b.stack.some((x) => x.uid === target.uid && !x.trigger)
    );
  if (target.kind === "hearth") return effect === "damage";
  const p = b[target.side].board.find((p) => p.uid === target.uid);
  if (!p) return false;
  if (effect === "bounce" && cardById[p.cardId].keywords.includes("rootfast"))
    return false;
  return (
    (target.kind === "creature" && cardById[p.cardId].type === "Creature") ||
    (effect === "damage" &&
      target.kind === "hero" &&
      cardById[p.cardId].type === "Hero")
  );
}
function applyEffect(
  b: Battle,
  owner: Owner,
  effect: Effect,
  n: number,
  target: Target | null,
) {
  if (!validateTarget(b, effect, target)) {
    log(b, "The target is no longer legal. The spell has no effect.");
    return;
  }
  const me = b[owner];
  if (effect === "heal") heal(b, owner, n);
  if (effect === "draw") draw(b, owner, n);
  if (effect === "shield") me.shield += n;
  if (effect === "rally") for (const p of creatures(me)) p.boost += n;
  if (effect === "drain") heal(b, owner, hurt(b, other(owner), n));
  if (effect === "recall") {
    const i =
      me.grave.length -
      1 -
      [...me.grave]
        .reverse()
        .findIndex((id) => cardById[id].type === "Creature");
    if (i >= 0 && i < me.grave.length) me.hand.push(me.grave.splice(i, 1)[0]);
  }
  if (effect === "counter") {
    const i = b.stack.findIndex((x) => x.uid === target!.uid);
    if (i >= 0) {
      const removed = b.stack.splice(i, 1)[0];
      if (!removed.ability) b[removed.owner].grave.push(removed.cardId);
      log(b, `${cardById[removed.cardId].name} was countered.`);
    }
  }
  if (target && effect !== "counter") {
    const side = b[target.side],
      p = side.board.find((p) => p.uid === target.uid);
    if (effect === "damage") {
      if (target.kind === "hearth") hurt(b, target.side, n);
      else if (p) {
        if (target.kind === "hero") p.loyalty -= n;
        else p.damage += n;
      }
    }
    if (effect === "pump" && p) p.boost += n;
    if (effect === "bind" && p) {
      p.tapped = true;
      p.bound = 1;
    }
    if (effect === "renew" && p) {
      p.tapped = false;
      p.bound = 0;
    }
    if ((effect === "destroy" || effect === "bounce") && p) {
      side.board = side.board.filter((x) => x.uid !== p.uid);
      if (effect === "bounce") side.hand.push(p.cardId);
      else {
        side.grave.push(p.cardId);
        if (cardById[p.cardId].type === "Creature") mourn(b, target.side, 1);
      }
    }
  }
  stateActions(b);
}
function cast(b: Battle, owner: Owner, index: number, target: Target | null) {
  const me = b[owner],
    c = cardById[me.hand[index]];
  if (!c) throw Error("Choose a card from your hand.");
  const main =
    b.active === owner &&
    ["main", "second-main"].includes(b.phase) &&
    b.stack.length === 0;
  if (isResource(c)) {
    if (!main)
      throw Error("Play resources in your main phase with an empty stack.");
    if (me.landDrops >= 1)
      throw Error("You have already played a resource this turn.");
    me.hand.splice(index, 1);
    me.board.push(permanent(b, c.id));
    me.landDrops++;
    queueTrigger(b, owner, "gather", withTrigger(me, "gather"));
    if (c.effect === "heal") heal(b, owner, c.amount);
    log(b, `${owner === "player" ? "You" : b.opponent} played ${c.name}.`, {
      kind: "payment",
      cardId: c.id,
      owner,
    });
    return;
  }
  if (c.type !== "Instant" && !main)
    throw Error("Only instants can be cast at this time.");
  if (
    (c.type === "Instant" || c.type === "Sorcery") &&
    !validateTarget(b, c.effect, target)
  )
    throw Error("Choose a legal target before casting.");
  pay(me, c, owner === "player" ? b.reserveColor : null);
  me.hand.splice(index, 1);
  b.passes = 0;
  b.priority = owner;
  b.stack.push({
    uid: b.nextId++,
    owner,
    cardId: c.id,
    effect: c.effect,
    amount: c.amount,
    target,
    ability: false,
  });
  log(
    b,
    `${owner === "player" ? "You" : b.opponent} cast ${c.name}. A response may be played.`,
    // A spell landing on a waiting stack is a response.
    { kind: b.stack.length > 1 ? "response" : "cast", cardId: c.id, owner },
  );
  // Spellcraft waits above the spell that woke it, so it resolves first.
  if (c.type === "Instant" || c.type === "Sorcery")
    queueTrigger(b, owner, "spellcraft", withTrigger(me, "spellcraft"));
}
function resolveTop(b: Battle) {
  const item = b.stack.at(-1);
  if (!item) return;
  const before = publicTable(b);
  const c = cardById[item.cardId];
  const facts: string[] = [];
  if (
    (item.ability || c.type === "Instant" || c.type === "Sorcery") &&
    !validateTarget(b, item.effect as Effect, item.target)
  )
    facts.push("The target was no longer legal; the effect did not resolve.");
  const countered =
    item.effect === "counter" &&
    b.stack.find(
      (entry) => entry.uid === item.target?.uid && entry.uid !== item.uid,
    );
  resolveTopEffect(b);
  if (countered && !b.stack.some((entry) => entry.uid === countered.uid))
    facts.push(
      `${cardById[countered.cardId].name}${countered.ability ? "’s ability" : ""} was countered before it could resolve.`,
    );
  rememberExchange(
    b,
    before,
    `${item.owner === "player" ? "Your" : "Opposing"} ${item.trigger ? triggerLabel(item) : c.name + (item.ability ? " · Hero ability" : "")}`,
    facts,
  );
}
function resolveTopEffect(b: Battle) {
  const item = b.stack.pop();
  if (!item) return;
  const c = cardById[item.cardId],
    owner = item.owner;
  if (item.trigger) {
    resolveTrigger(b, item);
    return;
  }
  if (item.ability) {
    applyEffect(b, owner, item.effect as Effect, item.amount, item.target);
    return;
  }
  if (["Creature", "Hero", "Artifact", "Enchantment"].includes(c.type)) {
    if (c.type === "Hero") {
      const old = b[owner].board.find((p) => p.cardId === c.id);
      if (old) {
        b[owner].board = b[owner].board.filter((p) => p.uid !== old.uid);
        b[owner].grave.push(old.cardId);
      }
    }
    const entering = permanent(b, c.id);
    b[owner].board.push(entering);
    if (c.type === "Creature")
      queueTrigger(
        b,
        owner,
        "welcome",
        withTrigger(b[owner], "welcome", entering.uid),
      );
    if (c.type === "Artifact") {
      queueTrigger(
        b,
        owner,
        "recordwork",
        withTrigger(b[owner], "recordwork", entering.uid).filter(
          (watcher) => watcher.used !== b.turn,
        ),
      );
    }
    if (c.effect !== "none")
      applyEffect(
        b,
        owner,
        c.effect,
        c.amount,
        c.effect === "damage" ? { side: other(owner), kind: "hearth" } : null,
      );
  } else {
    applyEffect(b, owner, c.effect, c.amount, item.target);
    b[owner].grave.push(c.id);
  }
  log(b, `${c.name} resolved.`, { cardId: c.id, owner: item.owner });
  stateActions(b);
}
function emptyMana(b: Battle) {
  b.player.mana = zeroMana();
  b.enemy.mana = zeroMana();
}
function endTurn(b: Battle) {
  if (b.active === "player" && b.player.hand.length > 7) {
    b.phase = "cleanup";
    log(
      b,
      `Choose ${b.player.hand.length - 7} cards to put away before the next turn.`,
    );
    return;
  }
  for (const s of [b.player, b.enemy]) {
    s.board.forEach((p) => {
      p.damage = 0;
      p.boost = 0;
    });
    // The rival puts away its costliest cards, as the keeper's autoplay does.
    if (s === b[b.active])
      for (const i of costliest(s.hand, s.hand.length - 7).sort(
        (a, z) => z - a,
      ))
        s.grave.push(s.hand.splice(i, 1)[0]);
  }
  stateActions(b);
  if (b.result !== "playing") return;
  emptyMana(b);
  b.active = other(b.active);
  b.turn++;
  b.phase = "main";
  b.combat = [];
  b.priority = "player";
  b.passes = 0;
  const me = b[b.active];
  me.landDrops = 0;
  me.board.forEach((p) => {
    if (p.bound) {
      p.bound = 0;
    } else p.tapped = false;
  });
  for (const p of me.board)
    if (cardById[p.cardId].permanentEffect === "sanctuary")
      heal(b, b.active, 1);
  for (const p of [...me.board]) {
    const effect = cardById[p.cardId].permanentEffect;
    if (effect === "archive" && me.hand.length <= 3) draw(b, b.active, 1);
    if (effect === "watchfire")
      applyEffect(b, b.active, "damage", 1, {
        side: other(b.active),
        kind: "hearth",
      });
  }
  if (b.result !== "playing") return;
  draw(b, b.active);
  log(
    b,
    `${b.active === "player" ? "Your" : b.opponent + "’s"} turn: untap, upkeep, draw.`,
  );
}
export function canBlock(b: Battle, attacker: Permanent, blocker: Permanent) {
  return (
    !blocker.tapped &&
    (!cardById[attacker.cardId].keywords.includes("daunt") ||
      stats(b[other(b.active)], blocker).power > 1) &&
    (!cardById[attacker.cardId].keywords.includes("flying") ||
      cardById[blocker.cardId].keywords.some(
        (k) => k === "flying" || k === "reach",
      ))
  );
}
type Declaration = Battle["combat"][number];
/** Older saves carry a single `blocker`; keep both views consistent. */
function normalizeCombat(b: Battle) {
  for (const a of b.combat) {
    a.blockers ??= [];
    if (!a.blockers.length && a.blocker !== null) a.blockers = [a.blocker];
    a.blocker = a.blockers[0] ?? null;
  }
}
function declare(
  b: Battle,
  owner: Owner,
  ids: number[],
  hero: number | null,
  destinations: { uid: number; hero: number | null }[] = [],
) {
  if (b.active !== owner || b.phase !== "attack" || b.stack.length)
    throw Error("Declare attackers in combat with an empty stack.");
  if (new Set(ids).size !== ids.length) throw Error("Duplicate attacker.");
  const destination = (uid: number) => {
    const chosen = destinations.find((d) => d.uid === uid);
    return chosen ? chosen.hero : hero;
  };
  for (const target of new Set([hero, ...ids.map(destination)]))
    if (
      target !== null &&
      !heroes(b[other(owner)]).some((p) => p.uid === target)
    )
      throw Error("That Hero cannot be attacked.");
  const attackers = ids.map((id) =>
    creatures(b[owner]).find((p) => p.uid === id),
  );
  if (attackers.some((p) => !p || !canAttack(b, p)))
    throw Error(
      "Only untapped creatures without summoning sickness can attack.",
    );
  b.combat = attackers.map((p) => {
    if (!cardById[p!.cardId].keywords.includes("vigilance")) p!.tapped = true;
    return {
      uid: p!.uid,
      hero: destination(p!.uid),
      blocker: null,
      blockers: [],
      blocked: false,
    };
  });
  b.phase = ids.length ? "block" : "second-main";
  emptyMana(b);
  if (owner === "player" && ids.length) {
    enemyBlocks(b);
    b.phase = "damage";
  }
}
/** Blocks use only the public table. Steady keeps the original weakest-legal-blocker rule. */
function enemyBlocks(b: Battle) {
  for (const planned of planBlocks(b, "enemy", rivalProfile(b))) {
    const attack = b.combat.find((x) => x.uid === planned.uid)!;
    attack.blockers = planned.blockers;
    attack.blocker = planned.blockers[0] ?? null;
    attack.blocked = planned.blockers.length > 0;
  }
}
/** Plan blocks for the defending side from the public table; both seats share this planner. */
export function planBlocks(
  b: Battle,
  owner: Owner,
  profile: RivalProfile,
): { uid: number; blockers: number[] }[] {
  const used = new Set<number>(),
    me = b[owner],
    them = b[other(owner)],
    attackerOf = (uid: number) => them.board.find((p) => p.uid === uid)!,
    plan = b.combat
      .filter((x) => attackerOf(x.uid))
      .map((x) => ({ uid: x.uid, hero: x.hero, blockers: [] as number[] })),
    assign = (attack: (typeof plan)[number], d: Permanent) => {
      attack.blockers = [...attack.blockers, d.uid];
      used.add(d.uid);
    };
  if (profile === "steady") {
    for (const attack of plan) {
      const a = attackerOf(attack.uid),
        blocker = creatures(me)
          .filter((p) => !used.has(p.uid) && canBlock(b, a, p))
          .sort((x, y) => stats(me, x).power - stats(me, y).power)[0];
      if (blocker) assign(attack, blocker);
    }
    return plan.map(({ uid, blockers }) => ({ uid, blockers }));
  }
  const hp = me.hp + me.shield,
    power = (p: Permanent) => Math.max(0, stats(them, p).power),
    cost = (p: Permanent) => cardById[p.cardId].cost,
    open = () =>
      plan
        .filter((x) => !x.blockers.length && x.hero === null)
        .reduce((n, x) => n + power(attackerOf(x.uid)), 0),
    order = [...plan].sort(
      (x, y) =>
        power(attackerOf(y.uid)) - power(attackerOf(x.uid)) || x.uid - y.uid,
    );
  for (const attack of order) {
    const a = attackerOf(attack.uid),
      hero =
        attack.hero !== null
          ? heroes(me).find((h) => h.uid === attack.hero)
          : undefined,
      incoming = open(),
      ranked = creatures(me)
        .filter((d) => !used.has(d.uid) && canBlock(b, a, d))
        .map((d) => {
          const kill = slays(me, d, them, a),
            survive = !slays(them, a, me, d);
          let score =
            kill && survive
              ? 100
              : survive
                ? 60
                : kill
                  ? 40 + (cost(a) - cost(d)) * 5
                  : -50;
          if (profile === "defensive") {
            if (survive && !kill) score += 20;
            if (!kill && !survive && incoming >= hp / 2) score += 120;
          }
          if (profile === "aggressive") {
            if (kill && !survive && cost(d) > cost(a)) score -= 60;
            if (survive && !kill) score -= 10;
          }
          if (profile === "recursive" && kill && !survive) score += 30;
          if (
            profile === "evasive" &&
            hasKeyword(d, "flying") &&
            !(kill && survive)
          )
            score -= 40;
          if (profile === "hero" && hero) {
            score += 30;
            if (hero.loyalty <= power(a)) score += 60;
          }
          return { d, score };
        })
        .sort(
          (x, y) =>
            y.score - x.score || cost(x.d) - cost(y.d) || x.d.uid - y.d.uid,
        );
    if (ranked[0] && ranked[0].score >= 0) assign(attack, ranked[0].d);
  }
  // Gang blocks: two companions fell an attacker that neither could alone,
  // when the attacker cannot kill both (cautious rivals) or neither (racers).
  const cautious = !["aggressive", "evasive"].includes(profile);
  for (const attack of order) {
    const a = attackerOf(attack.uid),
      current = attack.blockers.map((uid) =>
        creatures(me).find((p) => p.uid === uid)!,
      );
    if (current.length > 1 || current.some((d) => slays(me, d, them, a)))
      continue;
    const spare = creatures(me)
      .filter((d) => !used.has(d.uid) && canBlock(b, a, d))
      .sort((x, y) => cost(x) - cost(y) || x.uid - y.uid);
    const pairs = current.length
      ? spare.map((d) => [current[0], d] as const)
      : spare.flatMap((d, i) => spare.slice(i + 1).map((e) => [d, e] as const));
    const pair = pairs.find(([d, e]) => {
      const kills =
          Math.max(0, stats(me, d).power) + Math.max(0, stats(me, e).power) >=
          remaining(them, a),
        attackerPower = power(a),
        safe = cautious
          ? attackerPower < remaining(me, d) + remaining(me, e)
          : attackerPower < Math.min(remaining(me, d), remaining(me, e));
      return (
        kills &&
        safe &&
        !hasKeyword(a, "deathtouch") &&
        cost(a) >= Math.min(cost(d), cost(e))
      );
    });
    if (pair) for (const d of pair) if (!used.has(d.uid)) assign(attack, d);
  }
  // Never let the hearth fall to an attack a legal block could still absorb.
  for (const attack of order) {
    if (open() < hp) break;
    if (attack.blockers.length || attack.hero !== null) continue;
    const a = attackerOf(attack.uid),
      d = creatures(me)
        .filter((x) => !used.has(x.uid) && canBlock(b, a, x))
        .sort((x, y) => cost(x) - cost(y) || x.uid - y.uid)[0];
    if (d) assign(attack, d);
  }
  return plan.map(({ uid, blockers }) => ({ uid, blockers }));
}
/** The attacking side's damage order. Rivals order by the public table: cheapest kills first. */
export function orderedBlockers(b: Battle, declaration: Declaration): number[] {
  const them = b[other(b.active)],
    blockers = (declaration.blockers ?? [])
      .map((uid) => creatures(them).find((p) => p.uid === uid))
      .filter((p): p is Permanent => !!p);
  if (b.active === "player" || blockers.length < 2)
    return blockers.map((p) => p.uid);
  return [...blockers]
    .sort(
      (x, y) =>
        remaining(them, x) - remaining(them, y) ||
        stats(them, y).power - stats(them, x).power ||
        x.uid - y.uid,
    )
    .map((p) => p.uid);
}
function combatDamage(b: Battle) {
  if (b.stack.length) throw Error("Resolve the stack before combat damage.");
  if (!["block", "damage"].includes(b.phase))
    throw Error("There is no combat to resolve.");
  const before = publicTable(b);
  const owner = b.active,
    defender = other(owner),
    me = b[owner],
    them = b[defender];
  const snapshot = new Map([
      ...me.board.map((p) => [p.uid, stats(me, p)] as const),
      ...them.board.map((p) => [p.uid, stats(them, p)] as const),
    ]),
    gains = { player: 0, enemy: 0 };
  normalizeCombat(b);
  for (const declaration of b.combat) {
    const a = creatures(me).find((p) => p.uid === declaration.uid);
    if (!a) continue;
    const power = Math.max(0, snapshot.get(a.uid)!.power),
      c = cardById[a.cardId],
      trample = c.keywords.includes("trample"),
      deathtouch = c.keywords.includes("deathtouch"),
      blockers = orderedBlockers(b, declaration).map((uid) =>
        creatures(them).find((p) => p.uid === uid)!,
      );
    let spill = 0;
    if (blockers.length) {
      // Damage is assigned in order: each blocker takes what would fell it
      // before the next receives any; the last takes the rest unless Overrun spills it.
      let left = power;
      const wounded = new Map<number, number>();
      for (const [i, blocker] of blockers.entries()) {
        const back = Math.max(0, snapshot.get(blocker.uid)!.power),
          needed = deathtouch
            ? 1
            : Math.max(
                0,
                snapshot.get(blocker.uid)!.toughness -
                  blocker.damage -
                  (wounded.get(blocker.uid) ?? 0),
              ),
          last = i === blockers.length - 1,
          dealt = last && !trample ? left : Math.min(left, needed);
        wounded.set(blocker.uid, dealt);
        left -= dealt;
        a.damage += back;
        if (
          cardById[blocker.cardId].keywords.includes("deathtouch") &&
          back > 0
        )
          a.damage = 100000;
        if (cardById[blocker.cardId].keywords.includes("lifelink"))
          gains[defender] += back;
      }
      for (const blocker of blockers) {
        blocker.damage += wounded.get(blocker.uid) ?? 0;
        if (deathtouch && (wounded.get(blocker.uid) ?? 0) > 0)
          blocker.damage = 100000;
      }
      if (trample) spill = left;
      if (c.keywords.includes("lifelink")) gains[owner] += power;
    } else if (!declaration.blocked || trample) {
      spill = power;
      if (c.keywords.includes("lifelink")) gains[owner] += power;
    }
    if (spill) {
      if (declaration.hero !== null) {
        const h = heroes(them).find((p) => p.uid === declaration.hero);
        if (h) h.loyalty -= spill;
      } else hurt(b, other(owner), spill);
    }
  }
  for (const side of [b.active, other(b.active)]) heal(b, side, gains[side]);
  b.phase = "second-main";
  b.combat = [];
  emptyMana(b);
  stateActions(b);
  rememberExchange(
    b,
    before,
    `${owner === "player" ? "Your" : "Opposing"} attack · simultaneous combat`,
  );
  log(b, "Combat damage is dealt simultaneously.");
}
/** Targets from the acting side's view of the public table. */
function aiTarget(
  b: Battle,
  effect: Effect,
  amount: number,
  profile: RivalProfile = rivalProfile(b),
  owner: Owner = "enemy",
): Target | null {
  const me = b[owner],
    foe = other(owner),
    them = b[foe],
    enemies = creatures(them).sort(
      (a, z) => stats(them, z).power - stats(them, a).power,
    );
  if (effect === "counter") {
    const spell = [...b.stack]
      .reverse()
      .find((s) => s.owner === foe && !s.trigger);
    return spell ? { side: foe, kind: "stack", uid: spell.uid } : null;
  }
  if (effect === "damage") {
    const hearth: Target = { side: foe, kind: "hearth" };
    if (amount >= them.hp + them.shield) return hearth;
    const kill = enemies.find((p) => remaining(them, p) <= amount);
    if (kill) return { side: foe, kind: "creature", uid: kill.uid };
    const hero = heroes(them)[0];
    return profile === "hero" && hero
      ? { side: foe, kind: "hero", uid: hero.uid }
      : hearth;
  }
  if (effect === "renew") {
    const p = creatures(me).find((p) => p.tapped || p.bound);
    return p ? { side: owner, kind: "creature", uid: p.uid } : null;
  }
  if (effect === "destroy" || effect === "bounce" || effect === "bind") {
    const p = enemies.find(
      (p) =>
        validateTarget(b, effect, {
          side: foe,
          kind: "creature",
          uid: p.uid,
        }) &&
        (effect !== "bind" || !p.bound),
    );
    return p ? { side: foe, kind: "creature", uid: p.uid } : null;
  }
  if (effect === "pump") {
    const ready = creatures(me).filter((p) => canAttack(b, p)),
      p =
        (profile === "evasive" && ready.find((p) => hasKeyword(p, "flying"))) ||
        ready[0];
    return p ? { side: owner, kind: "creature", uid: p.uid } : null;
  }
  return null;
}
function aiCounter(b: Battle) {
  b.priority = "enemy";
  const response = responseChoice(b, "enemy");
  if (response) {
    cast(b, "enemy", response.index, response.target);
    // The AI yields after its action; the player may answer it.
    b.passes = 1;
  } else b.passes = 1;
  b.priority = "player";
}
/** Evaluate only the acting side's hand and the public board/stack. */
export function responseChoice(
  b: Battle,
  owner: Owner,
  profile: RivalProfile = owner === "enemy" ? rivalProfile(b) : "steady",
): { index: number; target: Target | null } | null {
  const top = b.stack.at(-1);
  if (!top || top.owner === owner) return null;
  const foe = other(owner),
    me = b[owner],
    spell = cardById[top.cardId],
    hand = me.hand
      .map((id, index) => ({ c: cardById[id], index }))
      .filter(({ c }) => c.type === "Instant" && affordable(me, c)),
    threatened =
      top.target?.side === owner
        ? me.board.find((p) => p.uid === top.target?.uid)
        : undefined,
    atMyHearth =
      top.target?.side === owner &&
      top.target.kind === "hearth" &&
      top.effect === "damage",
    pointed = top.target?.side === owner,
    lethalToMe = atMyHearth && top.amount >= me.hp + me.shield,
    worth = spell.type === "Hero" || spell.cost >= 3 || pointed;
  // A damage instant that reaches the opposing hearth ends the duel at once.
  const burn = hand.find(
    ({ c }) => c.effect === "damage" && c.amount >= b[foe].hp + b[foe].shield,
  );
  if (burn) return { index: burn.index, target: { side: foe, kind: "hearth" } };
  if (top.trigger) {
    // Triggers cannot be countered; shield a lethal Mourning drain, else let it resolve.
    const drain =
      top.trigger === "mourning"
        ? top.amount *
          (top.sources ?? []).filter((uid) =>
            b[foe].board.some((p) => p.uid === uid),
          ).length
        : 0;
    const shield = hand.find(({ c }) => c.effect === "shield");
    return drain >= me.hp + me.shield && shield
      ? { index: shield.index, target: null }
      : null;
  }
  const protect = () => {
    for (const { c, index } of hand) {
      if (
        threatened &&
        top.effect === "damage" &&
        c.effect === "pump" &&
        remaining(me, threatened) <= top.amount &&
        remaining(me, threatened) + c.amount > top.amount
      )
        return {
          index,
          target: {
            side: owner,
            kind: "creature",
            uid: threatened.uid,
          } as Target,
        };
      if (atMyHearth && c.effect === "shield") return { index, target: null };
    }
    return null;
  };
  // Defensive rivals save counters by protecting with cheaper tricks first.
  if (profile === "defensive") {
    const saved = protect();
    if (saved) return saved;
  }
  const counter = hand.find(({ c }) => c.effect === "counter"),
    counterWanted = {
      steady: true,
      reactive: spell.cost >= 2 || worth,
      aggressive: spell.cost >= 4 || pointed || lethalToMe,
      defensive: worth,
      recursive: worth,
      evasive: worth,
      hero: worth || top.target?.kind === "hero",
    }[profile];
  if (counter && counterWanted)
    return {
      index: counter.index,
      target: { side: top.owner, kind: "stack", uid: top.uid },
    };
  return protect();
}
/** In assisted play the rival answers a keeper's queued trigger at once, as it answers a spell. */
function settleTriggers(b: Battle) {
  if (
    !b.fullControl &&
    b.passes === 0 &&
    b.stack.at(-1)?.trigger &&
    b.stack.at(-1)?.owner === "player"
  )
    aiCounter(b);
}
function passPriority(b: Battle) {
  if (!b.stack.length) {
    aiStep(b);
    b.priority = "player";
    settleTriggers(b);
    return;
  }
  // A preceding AI pass plus this player pass completes the response round.
  if (b.passes === 1) {
    resolveTop(b);
    b.passes = 0;
    b.priority = "player";
    settleTriggers(b);
    return;
  }
  b.passes = 1;
  b.priority = "enemy";
  const response = responseChoice(b, "enemy");
  if (response) {
    cast(b, "enemy", response.index, response.target);
    b.passes = 1;
  } else {
    resolveTop(b);
    b.passes = 0;
  }
  b.priority = "player";
  settleTriggers(b);
}
export function plannedAttackers(
  b: Battle,
  owner: Owner,
  profile: RivalProfile = owner === "enemy" ? rivalProfile(b) : "steady",
): number[] {
  const me = b[owner],
    them = b[other(owner)],
    defenders = creatures(them).filter((p) => !p.tapped),
    ready = creatures(me).filter((p) => canAttack(b, p)),
    power = (p: Permanent) => Math.max(0, stats(me, p).power),
    total = ready.reduce((n, p) => n + power(p), 0),
    legal = (a: Permanent) =>
      defenders.filter((d) => canBlock({ ...b, active: owner }, a, d)),
    survives = (a: Permanent, d: Permanent) => !slays(them, d, me, a),
    safe = (a: Permanent) => legal(a).every((d) => survives(a, d)),
    trades = (a: Permanent) =>
      legal(a).every((d) => survives(a, d) || slays(me, a, them, d));
  // Lethal through the best possible blocks, judged on the public table only.
  const blockable = ready
      .filter((a) => legal(a).length)
      .sort((x, y) => power(y) - power(x) || x.uid - y.uid),
    through =
      ready.filter((a) => !legal(a).length).reduce((n, a) => n + power(a), 0) +
      blockable.slice(defenders.length).reduce((n, a) => n + power(a), 0);
  if (ready.length && through >= them.hp + them.shield)
    return ready.map((p) => p.uid);
  const alpha =
    total >
    them.hp +
      them.shield +
      defenders.reduce((n, p) => n + stats(them, p).toughness, 0);
  if (profile === "steady")
    return ready
      .filter((a) => {
        if (!defenders.length || alpha) return true;
        const blockers = legal(a);
        return (
          !blockers.length ||
          blockers.every(
            (d) =>
              stats(me, a).toughness > stats(them, d).power ||
              stats(me, a).power >= stats(them, d).toughness,
          ) ||
          hasKeyword(a, "deathtouch")
        );
      })
      .map((p) => p.uid);
  const vigilant = (a: Permanent) => hasKeyword(a, "vigilance"),
    threats = creatures(them).filter((p) => !p.bound).length;
  let chosen: Permanent[];
  switch (profile) {
    case "aggressive":
      chosen = ready.filter(
        (a) => alpha || trades(a) || them.hp + them.shield <= total * 2,
      );
      break;
    case "recursive":
      chosen = ready.filter((a) => alpha || trades(a));
      break;
    case "evasive":
      chosen = ready.filter(
        (a) => alpha || (hasKeyword(a, "flying") ? trades(a) : safe(a)),
      );
      break;
    case "defensive": {
      const home = new Set(
        ready
          .filter((a) => !vigilant(a))
          .sort((x, y) => power(x) - power(y) || x.uid - y.uid)
          .slice(0, threats)
          .map((a) => a.uid),
      );
      chosen = ready.filter((a) => alpha || (!home.has(a.uid) && safe(a)));
      break;
    }
    case "reactive": {
      const home =
        me.hp + me.shield <= 10 && threats
          ? ready
              .filter((a) => !vigilant(a))
              .sort(
                (x, y) =>
                  stats(me, y).toughness - stats(me, x).toughness ||
                  x.uid - y.uid,
              )[0]
          : undefined;
      chosen = ready.filter((a) => alpha || (a !== home && safe(a)));
      break;
    }
    default:
      chosen = ready.filter((a) => alpha || safe(a));
  }
  return chosen.map((p) => p.uid);
}
function activateHero(
  b: Battle,
  owner: Owner,
  uid: number,
  index: number,
  target: Target | null,
) {
  if (
    b.active !== owner ||
    !["main", "second-main"].includes(b.phase) ||
    b.stack.length
  )
    throw Error("Activate Heroes in your main phase with an empty stack.");
  const p = heroes(b[owner]).find((p) => p.uid === uid),
    ability = p ? cardById[p.cardId].abilities[index] : null;
  if (!p || !ability || p.used === b.turn || p.loyalty + ability.loyalty < 0)
    throw Error("That Hero ability is unavailable.");
  if (!validateTarget(b, ability.effect, target))
    throw Error("Choose a legal target for the Hero ability.");
  p.loyalty += ability.loyalty;
  p.used = b.turn;
  b.passes = 0;
  b.priority = owner;
  b.stack.push({
    uid: b.nextId++,
    owner,
    cardId: p.cardId,
    effect: ability.effect,
    amount: ability.amount,
    target,
    ability: true,
  });
  stateActions(b);
}
/** Reactive and defensive rivals keep mana for a response while the opponent still holds cards. */
/** An instant kept back for the response window; only while the other side still holds cards. */
function heldResponse(b: Battle, profile: RivalProfile, owner: Owner) {
  if (!b[other(owner)].hand.length) return null;
  const wanted =
    profile === "reactive"
      ? ["counter"]
      : profile === "defensive"
        ? ["pump", "shield", "counter"]
        : [];
  return (
    b[owner].hand
      .map((id, index) => ({ c: cardById[id], index }))
      .filter(
        ({ c }) =>
          c.type === "Instant" &&
          wanted.includes(c.effect) &&
          affordable(b[owner], c),
      )
      .sort((x, y) => x.c.cost - y.c.cost || x.index - y.index)[0] ?? null
  );
}
function affordsBoth(s: Side, first: Card, second: Card) {
  const copy = structuredClone(s);
  try {
    pay(copy, first);
  } catch {
    return false;
  }
  return affordable(copy, second);
}
/** Main-phase priority from the public table; negative scores hold the card. */
function castScore(b: Battle, c: Card, profile: RivalProfile, owner: Owner) {
  const me = b[owner],
    them = b[other(owner)],
    foes = creatures(them),
    threat = Math.max(0, ...foes.map((p) => stats(them, p).power)),
    removal =
      ["destroy", "bounce", "bind"].includes(c.effect) ||
      (c.effect === "damage" &&
        foes.some((p) => remaining(them, p) <= c.amount)),
    creature = c.type === "Creature";
  let score = c.type === "Hero" ? 4 : creature ? 3 : 0;
  if (
    c.effect === "recall" &&
    !me.grave.some((id) => cardById[id].type === "Creature")
  )
    return -5;
  // A rally with nobody ready to attack is a wasted card.
  if (c.effect === "rally" && !creatures(me).some((p) => canAttack(b, p)))
    return -5;
  switch (profile) {
    case "aggressive":
      if (creature && c.keywords.includes("haste")) score += 2;
      if (creature && c.attack > c.health) score += 1;
      if (["damage", "pump", "rally"].includes(c.effect)) score += 1;
      if (["heal", "shield"].includes(c.effect)) score -= 2;
      break;
    case "defensive":
      if (c.effect === "shield" || (c.effect === "heal" && me.hp <= 14))
        score += 2;
      if (["anthem", "sanctuary"].includes(c.permanentEffect)) score += 2;
      if (creature && c.health >= c.attack) score += 1;
      if (removal) score += threat >= 3 ? 2 : -5;
      break;
    case "reactive":
      if (removal) score += threat >= 2 ? 4 : -5;
      if (c.effect === "draw") score += 1;
      break;
    case "recursive":
      if (c.effect === "recall") score += 4;
      if (creature && c.trigger === "mourning") score += 1;
      if (c.effect === "destroy") score += 1;
      break;
    case "evasive":
      if (creature && c.keywords.includes("flying")) score += 2;
      break;
    case "hero":
      if (c.type === "Hero") score += 3;
      if (heroes(me).length && ["heal", "shield"].includes(c.effect))
        score += 1;
      break;
  }
  return score;
}
/** The scored main-phase cast a side would make from its own hand and the public table; resources and counters are never chosen here. */
export function plannedCast(
  b: Battle,
  owner: Owner,
  profile: RivalProfile = owner === "enemy" ? rivalProfile(b) : "steady",
): { index: number; target: Target | null } | null {
  const me = b[owner],
    held = heldResponse(b, profile, owner),
    choices = me.hand
      .map((id, index) => ({ c: cardById[id], index }))
      .filter(
        ({ c, index }) =>
          !isResource(c) &&
          c.effect !== "counter" &&
          index !== held?.index &&
          affordable(me, c) &&
          validateTarget(
            b,
            c.effect,
            aiTarget(b, c.effect, c.amount, profile, owner),
          ),
      )
      .map((entry) => ({
        ...entry,
        score: castScore(b, entry.c, profile, owner),
      }))
      .filter(({ score }) => score >= 0)
      .sort(
        (a, z) => z.score - a.score || z.c.cost - a.c.cost || a.index - z.index,
      ),
    choice = held
      ? choices.find(({ c }) => affordsBoth(me, c, held.c))
      : choices[0];
  return choice
    ? {
        index: choice.index,
        target: aiTarget(b, choice.c.effect, choice.c.amount, profile, owner),
      }
    : null;
}
function abilityValue(
  b: Battle,
  p: Permanent,
  a: Card["abilities"][number],
  target: Target | null,
  profile: RivalProfile,
  owner: Owner,
) {
  const me = b[owner],
    them = b[other(owner)];
  let value = 1;
  if (a.effect === "damage") {
    if (target?.kind === "hearth")
      value =
        a.amount >= them.hp + them.shield
          ? 100
          : a.amount / 2 + (profile === "aggressive" ? 2 : 0);
    else if (target?.kind === "creature") {
      const c = them.board.find((x) => x.uid === target.uid);
      value = 5 + (c ? stats(them, c).power : 0);
    } else if (target?.kind === "hero") value = 6;
  }
  if (a.effect === "draw") value = 3 + (profile === "reactive" ? 1 : 0);
  if (a.effect === "heal")
    value = (me.hp <= 12 ? 3 : 1) + (profile === "defensive" ? 1 : 0);
  if (["destroy", "bounce", "bind"].includes(a.effect)) value = 6;
  if (a.effect === "shield") value = 2;
  if (a.effect === "rally") value = 3;
  if (a.effect === "pump") value = 2;
  if (a.effect === "recall") value = 4 + (profile === "recursive" ? 2 : 0);
  if (p.loyalty + a.loyalty <= 0 && value < 50)
    value -= profile === "hero" ? 100 : 3;
  if (profile === "hero" && a.loyalty > 0) value += 1;
  return value;
}
/** Choose a legal Hero activation; steady keeps the original heal/ultimate habit when legal. */
export function plannedHero(
  b: Battle,
  owner: Owner,
  profile: RivalProfile = owner === "enemy" ? rivalProfile(b) : "steady",
): { uid: number; ability: number; target: Target | null } | null {
  const foe = other(owner);
  for (const p of heroes(b[owner])) {
    if (p.used === b.turn) continue;
    const abilities = cardById[p.cardId].abilities;
    if (profile === "steady") {
      const ultimate = p.loyalty >= 6 && abilities[2],
        ability = ultimate ? 2 : 0,
        target: Target | null = ultimate ? { side: foe, kind: "hearth" } : null;
      if (
        abilities[ability] &&
        p.loyalty + abilities[ability].loyalty >= 0 &&
        validateTarget(b, abilities[ability].effect, target)
      )
        return { uid: p.uid, ability, target };
    }
    const options = abilities
      .map((a, ability) => ({ a, ability }))
      .filter(({ a }) => p.loyalty + a.loyalty >= 0)
      .map(({ a, ability }) => {
        const target = aiTarget(b, a.effect, a.amount, profile, owner);
        return {
          ability,
          target,
          value: validateTarget(b, a.effect, target)
            ? abilityValue(b, p, a, target, profile, owner)
            : -1,
        };
      })
      .filter((o) => o.value >= 0)
      .sort((x, y) => y.value - x.value || x.ability - y.ability);
    if (options[0])
      return {
        uid: p.uid,
        ability: options[0].ability,
        target: options[0].target,
      };
  }
  return null;
}
/** Each attacker chooses its own destination from the public table. */
function attackDestinations(
  b: Battle,
  owner: Owner,
  attackers: number[],
  profile: RivalProfile,
) {
  const me = b[owner],
    them = b[other(owner)],
    hero = heroes(them)[0];
  if (!hero || profile === "steady" || profile === "hero") return [];
  const power = (uid: number) =>
    Math.max(
      0,
      stats(
        me,
        me.board.find((p) => p.uid === uid)!,
      ).power,
    );
  const total = attackers.reduce((n, uid) => n + power(uid), 0);
  if (total >= them.hp + them.shield) return [];
  // Cautious rivals spend one attacker on a Hero it can fell; racers keep pressure on the hearth.
  if (["aggressive", "evasive"].includes(profile)) return [];
  const sent = [...attackers]
    .filter((uid) => power(uid) >= hero.loyalty)
    .sort((x, y) => power(x) - power(y) || x - y)[0];
  return sent === undefined ? [] : [{ uid: sent, hero: hero.uid }];
}
/** The attack a side declares from the public table: attackers, the Hero its plain attackers aim at, and per-attacker destinations. */
export function plannedDeclaration(
  b: Battle,
  owner: Owner,
  profile: RivalProfile = owner === "enemy" ? rivalProfile(b) : "steady",
): {
  attackers: number[];
  hero: number | null;
  destinations: { uid: number; hero: number | null }[];
} {
  const me = b[owner],
    them = b[other(owner)],
    attackers = plannedAttackers(b, owner, profile),
    h = heroes(them)[0],
    lethal =
      attackers.reduce(
        (n, uid) =>
          n +
          Math.max(
            0,
            stats(
              me,
              me.board.find((p) => p.uid === uid)!,
            ).power,
          ),
        0,
      ) >=
      them.hp + them.shield;
  return {
    attackers,
    hero:
      !lethal && (profile === "steady" || profile === "hero")
        ? (h?.uid ?? null)
        : null,
    destinations: lethal
      ? []
      : attackDestinations(b, owner, attackers, profile),
  };
}
/** The rival's turn, one action per call so the keeper may answer each: a resource, scored casts and activations, the attack, then the same choices again in a second main phase. */
function aiStep(b: Battle) {
  if (b.active !== "enemy" || b.stack.length) return;
  if (b.phase !== "main" && b.phase !== "second-main") return;
  const profile = rivalProfile(b);
  // The same one free redraw the keeper has, under the same conditions: the
  // rival's first turn, before any play, on a hand with fewer than two or more
  // than five resources. The keeper reads only the notice; the hand stays hidden.
  if (
    b.phase === "main" &&
    b.turn <= 2 &&
    !b.enemy.landDrops &&
    !b.enemy.board.length &&
    !b.enemy.grave.length &&
    wantsRedraw(b.enemy.hand)
  )
    redraw(b, "enemy");
  if (b.enemy.landDrops === 0) {
    const i = b.enemy.hand.findIndex((id) => isResource(cardById[id]));
    if (i >= 0) cast(b, "enemy", i, null);
    // A Gather or lifegain trigger now waits; the keeper may answer it first.
    if (b.stack.length) return;
  }
  const choice = plannedCast(b, "enemy", profile);
  if (choice) {
    cast(b, "enemy", choice.index, choice.target);
    return;
  }
  const activation = plannedHero(b, "enemy", profile);
  if (activation) {
    activateHero(
      b,
      "enemy",
      activation.uid,
      activation.ability,
      activation.target,
    );
    return;
  }
  if (b.phase === "second-main") {
    endTurn(b);
    return;
  }
  b.phase = "attack";
  emptyMana(b);
  const { attackers, hero, destinations } = plannedDeclaration(
    b,
    "enemy",
    profile,
  );
  declare(b, "enemy", attackers, hero, destinations);
  // With nobody attacking, the rival goes straight on to its second main phase.
  if (!attackers.length) aiStep(b);
}
export function battleCommand(b: Battle, cmd: BattleCommand) {
  b.fullControl ??= false;
  b.priority ??= "player";
  b.passes ??= 0;
  b.reserveColor ??= null;
  b.tapHistory ??= [];
  b.events ??= [];
  b.eventSequence ??= 0;
  normalizeCombat(b);
  if (cmd.type === "battle-controls") {
    if (cmd.fullControl !== undefined) b.fullControl = cmd.fullControl;
    if (cmd.reserveColor !== undefined) b.reserveColor = cmd.reserveColor;
    return;
  }
  if (b.result !== "playing") throw Error("This duel is finished.");
  if (cmd.type === "undo-tap") {
    const last = b.tapHistory.at(-1);
    const p = last && b.player.board.find((p) => p.uid === last.uid);
    if (!last || !p || !p.tapped)
      throw Error("No reversible resource payment.");
    b.tapHistory.pop();
    p.tapped = false;
    b.player.mana = last.mana;
    return;
  }
  if (cmd.type === "discard") {
    const required = b.player.hand.length - 7;
    if (
      b.phase !== "cleanup" ||
      b.active !== "player" ||
      cmd.indices.length !== required ||
      new Set(cmd.indices).size !== required ||
      cmd.indices.some(
        (i) => !Number.isInteger(i) || i < 0 || i >= b.player.hand.length,
      )
    )
      throw Error("Choose exactly the excess cards to put away.");
    for (const i of [...cmd.indices].sort((a, b) => b - a))
      b.player.grave.push(b.player.hand.splice(i, 1)[0]);
    b.tapHistory = [];
    b.secondsLeft = 60;
    endTurn(b);
    aiStep(b);
    b.priority = "player";
    settleTriggers(b);
    return;
  }
  if (
    b.phase === "cleanup" &&
    !["battle-clock", "battle-tick"].includes(cmd.type)
  )
    throw Error("Choose your cleanup discards first.");

  if (b.result !== "playing") throw Error("This duel is finished.");
  if (cmd.type === "battle-clock") {
    b.timed = cmd.timed;
    return;
  }
  if (cmd.type === "battle-tick") {
    if (!b.timed) return;
    b.secondsLeft = Math.max(0, b.secondsLeft - 1);
    if (b.secondsLeft > 0) return;
    log(b, "The hourglass emptied. Priority passes; existing blocks are kept.");
    const next: BattleCommand =
      b.phase === "cleanup"
        ? {
            type: "discard",
            indices: Array.from(
              { length: b.player.hand.length - 7 },
              (_, i) => b.player.hand.length - 1 - i,
            ),
          }
        : b.stack.length
          ? { type: "pass" }
          : ["block", "damage"].includes(b.phase)
            ? { type: "damage" }
            : b.active === "enemy"
              ? { type: "pass" }
              : b.phase === "attack"
                ? { type: "declare", attackers: [] }
                : { type: "end-turn" };
    battleCommand(b, next);
    b.secondsLeft = 60;
    return;
  }
  const windowBefore = `${b.turn}:${b.active}:${b.phase}:${b.stack.map((s) => s.uid).join(",")}`;
  if (cmd.type === "play") {
    if (cmd.expectedCardId && b.player.hand[cmd.index] !== cmd.expectedCardId)
      throw Error("That hand position changed. Choose the card again.");
    const reason =
      cardById[b.player.hand[cmd.index]] &&
      playReason(b, cardById[b.player.hand[cmd.index]]);
    if (reason) throw Error(reason);
    cast(b, "player", cmd.index, cmd.target ?? null);
    if (!b.fullControl && b.stack.length && b.stack.at(-1)?.owner === "player")
      aiCounter(b);
  }
  if (cmd.type === "tap") {
    const p = b.player.board.find((p) => p.uid === cmd.uid);
    if (!p || p.tapped || !sourceColors(p).includes(cmd.color))
      throw Error("Choose an untapped source and a color it produces.");
    b.tapHistory.push({ uid: p.uid, mana: { ...b.player.mana } });
    p.tapped = true;
    b.player.mana[cmd.color]++;
  }
  if (cmd.type === "pass") {
    passPriority(b);
  }
  if (cmd.type === "combat") {
    if (b.active !== "player" || b.phase !== "main" || b.stack.length)
      throw Error("Finish your first main phase before combat.");
    b.phase = "attack";
    emptyMana(b);
  }
  if (cmd.type === "declare")
    declare(
      b,
      "player",
      cmd.attackers,
      cmd.hero ?? null,
      cmd.destinations ?? [],
    );
  if (cmd.type === "block") {
    if (b.active !== "enemy" || b.phase !== "block" || b.stack.length)
      throw Error(
        "Declare blockers after the attacking creatures are announced.",
      );
    const declaration = b.combat.find((a) => a.uid === cmd.attacker),
      a = b.enemy.board.find((p) => p.uid === cmd.attacker);
    if (!declaration || !a) throw Error("Unknown attacker.");
    if (cmd.blocker === null) declaration.blockers = [];
    else if (declaration.blockers.includes(cmd.blocker))
      declaration.blockers = declaration.blockers.filter(
        (uid) => uid !== cmd.blocker,
      );
    else {
      const blocker = creatures(b.player).find((p) => p.uid === cmd.blocker);
      if (
        !blocker ||
        !canBlock(b, a, blocker) ||
        b.combat.some(
          (x) => x.uid !== cmd.attacker && x.blockers.includes(cmd.blocker!),
        )
      )
        throw Error("That creature cannot block this attacker.");
      declaration.blockers = [...declaration.blockers, cmd.blocker];
    }
    declaration.blocker = declaration.blockers[0] ?? null;
    declaration.blocked = declaration.blockers.length > 0;
  }
  if (cmd.type === "damage-order") {
    if (b.active !== "player" || b.phase !== "damage" || b.stack.length)
      throw Error("Order blockers during your own combat before damage.");
    const declaration = b.combat.find((a) => a.uid === cmd.attacker);
    if (
      !declaration ||
      cmd.blockers.length !== declaration.blockers.length ||
      new Set(cmd.blockers).size !== cmd.blockers.length ||
      cmd.blockers.some((uid) => !declaration.blockers.includes(uid))
    )
      throw Error("Order exactly the blockers assigned to that attacker.");
    declaration.blockers = [...cmd.blockers];
    declaration.blocker = declaration.blockers[0] ?? null;
  }
  if (cmd.type === "damage") {
    combatDamage(b);
    settleTriggers(b);
  }
  if (cmd.type === "end-turn") {
    if (
      b.active !== "player" ||
      b.stack.length ||
      ["block", "damage"].includes(b.phase)
    )
      throw Error(
        "Resolve the current stack or combat before ending your turn.",
      );
    endTurn(b);
    if (b.result === "playing") aiStep(b);
    settleTriggers(b);
  }
  if (cmd.type === "hero") {
    activateHero(b, "player", cmd.uid, cmd.ability, cmd.target ?? null);
    if (!b.fullControl) aiCounter(b);
  }
  if (cmd.type === "mulligan") {
    if (!redrawAvailable(b))
      throw Error("The free redraw is only available before your first play.");
    redraw(b, "player");
    b.mulligans++;
  }
  if (!["tap", "battle-clock", "battle-tick"].includes(cmd.type))
    b.tapHistory = [];
  stateActions(b);
  b.priority = "player";
  const windowAfter = `${b.turn}:${b.active}:${b.phase}:${b.stack.map((s) => s.uid).join(",")}`;
  if (windowBefore !== windowAfter) b.secondsLeft = 60;
}

/** The one free redraw: the keeper's first turn, before any play, even when the guest opened. */
/** The one free opening redraw, either seat: the whole hand (seven cards, or eight in the second seat) goes under the library and the same number is drawn. */
function redraw(b: Battle, owner: Owner) {
  const s = b[owner],
    size = s.hand.length;
  s.draw.push(...s.hand);
  s.hand = [];
  draw(b, owner, size);
  log(
    b,
    owner === "player"
      ? "You took your one free opening redraw."
      : `${b.opponent} took their one free opening redraw.`,
  );
}
export function redrawAvailable(b: Battle) {
  return (
    b.result === "playing" &&
    b.active === "player" &&
    b.turn <= 2 &&
    !b.player.landDrops &&
    !b.player.board.length &&
    !b.player.grave.length &&
    !b.stack.length &&
    !b.mulligans
  );
}
export function missingDeckCopies(
  collection: Record<string, number>,
  recipe: string,
): number {
  const deck = presetDeck(recipe);
  return [...new Set(deck)].reduce(
    (sum, id) =>
      sum +
      Math.max(0, deck.filter((c) => c === id).length - (collection[id] ?? 0)),
    0,
  );
}

/** Visible-board forecast only; preserves the live battle and waits for an empty stack. */
export function combatForecast(b: Battle) {
  if (
    b.result !== "playing" ||
    b.stack.length ||
    !["block", "damage"].includes(b.phase)
  )
    return null;
  const copy = structuredClone(b);
  combatDamage(copy);
  // The preview assumes nobody responds: lifelink gains and Mourning drains
  // queued by the exchange resolve before the life totals are read.
  for (let i = 0; i < 50 && copy.stack.at(-1)?.trigger; i++)
    resolveTopEffect(copy);
  return {
    doomed: [...b.player.board, ...b.enemy.board]
      .filter(
        (p) =>
          ![...copy.player.board, ...copy.enemy.board].some(
            (q) => q.uid === p.uid,
          ),
      )
      .map((p) => p.uid),
    playerLife: b.player.hp - copy.player.hp,
    enemyLife: b.enemy.hp - copy.enemy.hp,
    playerLost: b.player.board.filter(
      (p) =>
        cardById[p.cardId].type === "Creature" &&
        !copy.player.board.some((q) => q.uid === p.uid),
    ).length,
    enemyLost: b.enemy.board.filter(
      (p) =>
        cardById[p.cardId].type === "Creature" &&
        !copy.enemy.board.some((q) => q.uid === p.uid),
    ).length,
  };
}
