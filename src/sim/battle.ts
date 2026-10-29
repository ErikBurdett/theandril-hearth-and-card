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
    (count((c) => c.effect === "damage") >= 6 && !counters)
  )
    return "aggressive";
  if (counters >= 4) return "reactive";
  if (count((c) => c.effect === "recall" || c.trigger === "mourning") >= 14)
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
/** Public personality only. Duels without a recognizable guest keep the steady pilot. */
export function rivalProfile(
  b: Pick<Battle, "opponentId" | "opponent">,
): RivalProfile {
  const guest = b.opponentId
    ? duelists.find((g) => g.id === b.opponentId)
    : duelists.find((g) => b.opponent.startsWith(g.name + " · "));
  return guest?.profile ?? "steady";
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
          : ["mourning", "lifegain"];
  const curve = ["cinder", "wildfire", "kiln"].includes(p.id)
    ? [1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 5]
    : [1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5];
  for (const cost of curve) {
    const c = pool
      .filter((c) => c.type === "Creature" && !chosen.includes(c))
      .sort(
        (a, b) =>
          Math.abs(a.cost - cost) - Math.abs(b.cost - cost) ||
          (["cinder", "wildfire", "kiln"].includes(p.id)
            ? Number(b.keywords.includes("haste")) -
              Number(a.keywords.includes("haste"))
            : 0) ||
          Number(preferred.includes(b.trigger)) -
            Number(preferred.includes(a.trigger)) ||
          a.id.localeCompare(b.id),
      )[0];
    chosen.push(c);
  }
  const effects =
    p.id === "shelter"
      ? [
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
        ]
      : ["binding", "winter"].includes(p.id)
        ? [
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
          ]
        : ["lantern", "candlewatch"].includes(p.id)
          ? [
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
            ]
          : ["relics", "funeral"].includes(p.id)
            ? [
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
              ]
            : ["cinder", "wildfire", "kiln"].includes(p.id)
              ? [
                  "damage",
                  "damage",
                  "damage",
                  "pump",
                  "pump",
                  "shield",
                  "heal",
                  "none",
                  "none",
                  "none",
                ]
              : ["witness", "lantern"].includes(p.id)
                ? [
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
                  ]
                : p.id === "embers"
                  ? [
                      "damage",
                      "damage",
                      "destroy",
                      "destroy",
                      "recall",
                      "recall",
                      "draw",
                      "pump",
                      "none",
                      "none",
                    ]
                  : ["tempo", "mirror"].includes(p.id)
                    ? [
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
                      ]
                    : ["recursion", "river", "thicket"].includes(p.id)
                      ? [
                          "recall",
                          "recall",
                          "destroy",
                          "destroy",
                          "heal",
                          "heal",
                          "draw",
                          "pump",
                          "none",
                          "none",
                        ]
                      : [
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
const log = (b: Battle, text: string) => {
  b.log = [text, ...b.log].slice(0, 20);
  b.eventSequence = (b.eventSequence ?? 0) + 1;
  b.events = [
    ...(b.events ?? []),
    {
      id: b.eventSequence,
      kind: text.includes("cast ")
        ? "cast"
        : text.includes("resolved")
          ? "resolve"
          : text.includes("damage")
            ? "combat"
            : "notice",
      text,
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
function heal(b: Battle, owner: Owner, n: number) {
  if (n <= 0) return;
  b[owner].hp += n;
  for (const p of creatures(b[owner]))
    if (cardById[p.cardId].trigger === "lifegain") p.counters++;
}
function stateActions(b: Battle) {
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
      const n = fallen.filter(
        (p) => cardById[p.cardId].type === "Creature",
      ).length;
      for (const p of s.board)
        if (cardById[p.cardId].trigger === "mourning") b[other(owner)].hp -= n;
    }
    if (!dead) break;
  }
  if (b.player.hp <= 0 && b.enemy.hp <= 0) b.result = "drawn";
  else if (b.player.hp <= 0) b.result = "lost";
  else if (b.enemy.hp <= 0) b.result = "won";
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
    return target.kind === "stack" && b.stack.some((x) => x.uid === target.uid);
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
  if (effect === "drain") {
    const them = b[other(owner)],
      blocked = Math.min(them.shield, n);
    them.shield -= blocked;
    them.hp -= n - blocked;
    heal(b, owner, n - blocked);
  }
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
      if (target.kind === "hearth") {
        const blocked = Math.min(side.shield, n);
        side.shield -= blocked;
        side.hp -= n - blocked;
      } else if (p) {
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
        for (const watcher of creatures(side))
          if (cardById[watcher.cardId].trigger === "mourning")
            b[other(target.side)].hp--;
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
    for (const p of creatures(me))
      if (cardById[p.cardId].trigger === "gather") p.counters++;
    if (c.effect === "heal") heal(b, owner, c.amount);
    log(b, `${owner === "player" ? "You" : b.opponent} played ${c.name}.`);
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
  if (c.type === "Instant" || c.type === "Sorcery")
    for (const p of creatures(me))
      if (cardById[p.cardId].trigger === "spellcraft") p.counters++;
  log(
    b,
    `${owner === "player" ? "You" : b.opponent} cast ${c.name}. A response may be played.`,
  );
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
    `${item.owner === "player" ? "Your" : "Opposing"} ${c.name}${item.ability ? " · Hero ability" : ""}`,
    facts,
  );
}
function resolveTopEffect(b: Battle) {
  const item = b.stack.pop();
  if (!item) return;
  const c = cardById[item.cardId],
    owner = item.owner;
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
    for (const watcher of b[owner].board) {
      if (watcher.uid === entering.uid) continue;
      const w = cardById[watcher.cardId];
      if (
        c.type === "Creature" &&
        (w.trigger === "welcome" || w.permanentEffect === "welcome")
      )
        heal(b, owner, 1);
      if (
        c.type === "Artifact" &&
        (w.trigger === "recordwork" || w.permanentEffect === "recordwork") &&
        watcher.used !== b.turn
      ) {
        watcher.used = b.turn;
        draw(b, owner, 1);
      }
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
  log(b, `${c.name} resolved.`);
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
    if (s === b[b.active])
      while (s.hand.length > 7) s.grave.push(s.hand.pop()!);
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
  const destination = (uid: number) =>
    destinations.find((d) => d.uid === uid)?.hero ?? hero;
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
  const profile = rivalProfile(b),
    used = new Set<number>(),
    me = b.enemy,
    them = b.player,
    attackerOf = (uid: number) => them.board.find((p) => p.uid === uid)!;
  const assign = (attack: Declaration, d: Permanent) => {
    attack.blockers = [...attack.blockers, d.uid];
    attack.blocker = attack.blockers[0];
    attack.blocked = true;
    used.add(d.uid);
  };
  if (profile === "steady") {
    for (const attack of b.combat) {
      const a = attackerOf(attack.uid),
        blocker = creatures(me)
          .filter((p) => !used.has(p.uid) && canBlock(b, a, p))
          .sort((x, y) => stats(me, x).power - stats(me, y).power)[0];
      if (blocker) assign(attack, blocker);
    }
    return;
  }
  const hp = me.hp + me.shield,
    power = (p: Permanent) => Math.max(0, stats(them, p).power),
    cost = (p: Permanent) => cardById[p.cardId].cost,
    open = () =>
      b.combat
        .filter((x) => !x.blocked && x.hero === null)
        .reduce((n, x) => n + power(attackerOf(x.uid)), 0),
    order = [...b.combat].sort(
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
    if (attack.blocked || attack.hero !== null) continue;
    const a = attackerOf(attack.uid),
      d = creatures(me)
        .filter((x) => !used.has(x.uid) && canBlock(b, a, x))
        .sort((x, y) => cost(x) - cost(y) || x.uid - y.uid)[0];
    if (d) assign(attack, d);
  }
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
      } else {
        const prevented = Math.min(them.shield, spill);
        them.shield -= prevented;
        them.hp -= spill - prevented;
      }
    }
  }
  heal(b, "player", gains.player);
  heal(b, "enemy", gains.enemy);
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
function aiTarget(
  b: Battle,
  effect: Effect,
  amount: number,
  profile: RivalProfile = rivalProfile(b),
): Target | null {
  const enemies = creatures(b.player).sort(
    (a, z) => stats(b.player, z).power - stats(b.player, a).power,
  );
  if (effect === "counter") {
    const spell = [...b.stack].reverse().find((s) => s.owner === "player");
    return spell ? { side: "player", kind: "stack", uid: spell.uid } : null;
  }
  if (effect === "damage") {
    const hearth: Target = { side: "player", kind: "hearth" };
    if (amount >= b.player.hp + b.player.shield) return hearth;
    const kill = enemies.find((p) => remaining(b.player, p) <= amount);
    if (kill) return { side: "player", kind: "creature", uid: kill.uid };
    const hero = heroes(b.player)[0];
    return profile === "hero" && hero
      ? { side: "player", kind: "hero", uid: hero.uid }
      : hearth;
  }
  if (effect === "renew") {
    const p = creatures(b.enemy).find((p) => p.tapped || p.bound);
    return p ? { side: "enemy", kind: "creature", uid: p.uid } : null;
  }
  if (effect === "destroy" || effect === "bounce" || effect === "bind") {
    const p = enemies.find((p) =>
      validateTarget(b, effect, {
        side: "player",
        kind: "creature",
        uid: p.uid,
      }),
    );
    return p ? { side: "player", kind: "creature", uid: p.uid } : null;
  }
  if (effect === "pump") {
    const ready = creatures(b.enemy).filter((p) => canAttack(b, p)),
      p =
        (profile === "evasive" && ready.find((p) => hasKeyword(p, "flying"))) ||
        ready[0];
    return p ? { side: "enemy", kind: "creature", uid: p.uid } : null;
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
function passPriority(b: Battle) {
  if (!b.stack.length) {
    aiStep(b);
    b.priority = "player";
    return;
  }
  // A preceding AI pass plus this player pass completes the response round.
  if (b.passes === 1) {
    resolveTop(b);
    b.passes = 0;
    b.priority = "player";
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
function heldResponse(b: Battle, profile: RivalProfile) {
  if (!b.player.hand.length) return null;
  const wanted =
    profile === "reactive"
      ? ["counter"]
      : profile === "defensive"
        ? ["pump", "shield", "counter"]
        : [];
  return (
    b.enemy.hand
      .map((id, index) => ({ c: cardById[id], index }))
      .filter(
        ({ c }) =>
          c.type === "Instant" &&
          wanted.includes(c.effect) &&
          affordable(b.enemy, c),
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
function castScore(b: Battle, c: Card, profile: RivalProfile) {
  const foes = creatures(b.player),
    threat = Math.max(0, ...foes.map((p) => stats(b.player, p).power)),
    removal =
      ["destroy", "bounce", "bind"].includes(c.effect) ||
      (c.effect === "damage" &&
        foes.some((p) => remaining(b.player, p) <= c.amount)),
    creature = c.type === "Creature";
  let score = c.type === "Hero" ? 4 : creature ? 3 : 0;
  if (
    c.effect === "recall" &&
    !b.enemy.grave.some((id) => cardById[id].type === "Creature")
  )
    return -5;
  switch (profile) {
    case "aggressive":
      if (creature && c.keywords.includes("haste")) score += 2;
      if (creature && c.attack > c.health) score += 1;
      if (["damage", "pump", "rally"].includes(c.effect)) score += 1;
      if (["heal", "shield"].includes(c.effect)) score -= 2;
      break;
    case "defensive":
      if (c.effect === "shield" || (c.effect === "heal" && b.enemy.hp <= 14))
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
      if (heroes(b.enemy).length && ["heal", "shield"].includes(c.effect))
        score += 1;
      break;
  }
  return score;
}
function abilityValue(
  b: Battle,
  p: Permanent,
  a: Card["abilities"][number],
  target: Target | null,
  profile: RivalProfile,
) {
  let value = 1;
  if (a.effect === "damage") {
    if (target?.kind === "hearth")
      value =
        a.amount >= b.player.hp + b.player.shield
          ? 100
          : a.amount / 2 + (profile === "aggressive" ? 2 : 0);
    else if (target?.kind === "creature") {
      const c = b.player.board.find((x) => x.uid === target.uid);
      value = 5 + (c ? stats(b.player, c).power : 0);
    } else if (target?.kind === "hero") value = 6;
  }
  if (a.effect === "draw") value = 3 + (profile === "reactive" ? 1 : 0);
  if (a.effect === "heal")
    value = (b.enemy.hp <= 12 ? 3 : 1) + (profile === "defensive" ? 1 : 0);
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
function heroActivation(b: Battle, profile: RivalProfile) {
  for (const p of heroes(b.enemy)) {
    if (p.used === b.turn) continue;
    const abilities = cardById[p.cardId].abilities;
    if (profile === "steady") {
      const ultimate = p.loyalty >= 6 && abilities[2],
        ability = ultimate ? 2 : 0,
        target: Target | null = ultimate
          ? { side: "player", kind: "hearth" }
          : null;
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
        const target = aiTarget(b, a.effect, a.amount, profile);
        return {
          ability,
          target,
          value: validateTarget(b, a.effect, target)
            ? abilityValue(b, p, a, target, profile)
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
  attackers: number[],
  profile: RivalProfile,
) {
  const hero = heroes(b.player)[0];
  if (!hero || profile === "steady" || profile === "hero") return [];
  const power = (uid: number) =>
    Math.max(
      0,
      stats(
        b.enemy,
        b.enemy.board.find((p) => p.uid === uid)!,
      ).power,
    );
  const total = attackers.reduce((n, uid) => n + power(uid), 0);
  if (total >= b.player.hp + b.player.shield) return [];
  // Cautious rivals spend one attacker on a Hero it can fell; racers keep pressure on the hearth.
  if (["aggressive", "evasive"].includes(profile)) return [];
  const sent = [...attackers]
    .filter((uid) => power(uid) >= hero.loyalty)
    .sort((x, y) => power(x) - power(y) || x - y)[0];
  return sent === undefined ? [] : [{ uid: sent, hero: hero.uid }];
}
function aiStep(b: Battle) {
  if (b.active !== "enemy" || b.stack.length) return;
  const profile = rivalProfile(b);
  if (b.phase === "main") {
    if (b.enemy.landDrops === 0) {
      const i = b.enemy.hand.findIndex((id) => isResource(cardById[id]));
      if (i >= 0) cast(b, "enemy", i, null);
    }
    const held = heldResponse(b, profile);
    const choices = b.enemy.hand
      .map((id, index) => ({ c: cardById[id], index }))
      .filter(
        ({ c, index }) =>
          !isResource(c) &&
          c.effect !== "counter" &&
          index !== held?.index &&
          affordable(b.enemy, c) &&
          validateTarget(
            b,
            c.effect,
            aiTarget(b, c.effect, c.amount, profile),
          ) &&
          (!held || affordsBoth(b.enemy, c, held.c)) &&
          castScore(b, c, profile) >= 0,
      )
      .sort(
        (a, z) =>
          castScore(b, z.c, profile) - castScore(b, a.c, profile) ||
          z.c.cost - a.c.cost ||
          a.index - z.index,
      );
    if (choices[0]) {
      const { c, index } = choices[0];
      cast(b, "enemy", index, aiTarget(b, c.effect, c.amount, profile));
      return;
    }
    const activation = heroActivation(b, profile);
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
    b.phase = "attack";
    emptyMana(b);
    const attackers = plannedAttackers(b, "enemy", profile);
    const h = heroes(b.player)[0];
    declare(
      b,
      "enemy",
      attackers,
      profile === "steady" || profile === "hero" ? (h?.uid ?? null) : null,
      attackDestinations(b, attackers, profile),
    );
    if (!attackers.length) endTurn(b);
    return;
  }
  if (b.phase === "second-main") endTurn(b);
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
  if (cmd.type === "damage") combatDamage(b);
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
  }
  if (cmd.type === "hero") {
    activateHero(b, "player", cmd.uid, cmd.ability, cmd.target ?? null);
    if (!b.fullControl) aiCounter(b);
  }
  if (cmd.type === "mulligan") {
    if (
      b.turn !== 1 ||
      b.player.landDrops ||
      b.player.board.length ||
      b.stack.length ||
      b.mulligans
    )
      throw Error("The free redraw is only available before your first play.");
    b.player.draw.push(...b.player.hand);
    b.player.hand = [];
    draw(b, "player", 7);
    b.mulligans++;
    log(b, "You took your one free opening redraw.");
  }
  if (!["tap", "battle-clock", "battle-tick"].includes(cmd.type))
    b.tapHistory = [];
  stateActions(b);
  b.priority = "player";
  const windowAfter = `${b.turn}:${b.active}:${b.phase}:${b.stack.map((s) => s.uid).join(",")}`;
  if (windowBefore !== windowAfter) b.secondsLeft = 60;
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
