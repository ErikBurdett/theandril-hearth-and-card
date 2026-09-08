import { z } from "zod";
import {
  cards,
  cardById,
  isResource,
  manaColors,
  manaNames,
  type ManaColor,
  type Card,
  type Effect,
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
        blocker: nat.nullable(),
        blocked: z.boolean(),
      }),
    )
    .max(200),
  log: z.array(z.string()).max(20),
  mulligans: nat,
  opponent: z.string(),
  secondsLeft: nat.max(60).default(60),
  timed: z.boolean().default(true),
  autoplay: z.boolean().default(false),
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
export type BattleCommand =
  | { type: "play"; index: number; target?: Target; expectedCardId?: string }
  | { type: "tap"; uid: number; color: ManaColor }
  | { type: "pass" }
  | { type: "end-turn" }
  | { type: "combat" }
  | { type: "declare"; attackers: number[]; hero?: number }
  | { type: "block"; attacker: number; blocker: number | null }
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
    mulligans: 0,
    opponent,
    secondsLeft: 60,
    timed: true,
    autoplay: false,
    fullControl: false,
    priority: "player",
    passes: 0,
    reserveColor: null,
    tapHistory: [],
    eventSequence: 0,
    events: [],
  };
  draw(b, "player", 7);
  draw(b, "enemy", 7);
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
function declare(b: Battle, owner: Owner, ids: number[], hero: number | null) {
  if (b.active !== owner || b.phase !== "attack" || b.stack.length)
    throw Error("Declare attackers in combat with an empty stack.");
  if (new Set(ids).size !== ids.length) throw Error("Duplicate attacker.");
  if (hero !== null && !heroes(b[other(owner)]).some((p) => p.uid === hero))
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
    return { uid: p!.uid, hero, blocker: null, blocked: false };
  });
  b.phase = ids.length ? "block" : "second-main";
  emptyMana(b);
  if (owner === "player" && ids.length) {
    const used = new Set<number>();
    for (const attack of b.combat) {
      const a = b.player.board.find((p) => p.uid === attack.uid)!,
        blocker = creatures(b.enemy)
          .filter((p) => !used.has(p.uid) && canBlock(b, a, p))
          .sort((x, y) => stats(b.enemy, x).power - stats(b.enemy, y).power)[0];
      if (blocker) {
        attack.blocker = blocker.uid;
        attack.blocked = true;
        used.add(blocker.uid);
      }
    }
    b.phase = "damage";
  }
}
function combatDamage(b: Battle) {
  if (b.stack.length) throw Error("Resolve the stack before combat damage.");
  if (!["block", "damage"].includes(b.phase))
    throw Error("There is no combat to resolve.");
  const owner = b.active,
    defender = other(owner),
    me = b[owner],
    them = b[defender];
  const snapshot = new Map([
      ...me.board.map((p) => [p.uid, stats(me, p)] as const),
      ...them.board.map((p) => [p.uid, stats(them, p)] as const),
    ]),
    gains = { player: 0, enemy: 0 };
  for (const declaration of b.combat) {
    const a = creatures(me).find((p) => p.uid === declaration.uid);
    if (!a) continue;
    const power = Math.max(0, snapshot.get(a.uid)!.power),
      c = cardById[a.cardId],
      blocker = creatures(them).find((p) => p.uid === declaration.blocker);
    let spill = 0;
    if (blocker) {
      const back = Math.max(0, snapshot.get(blocker.uid)!.power),
        needed = c.keywords.includes("deathtouch")
          ? 1
          : Math.max(0, snapshot.get(blocker.uid)!.toughness - blocker.damage);
      blocker.damage += power;
      a.damage += back;
      if (c.keywords.includes("deathtouch") && power > 0)
        blocker.damage = 100000;
      if (cardById[blocker.cardId].keywords.includes("deathtouch") && back > 0)
        a.damage = 100000;
      if (c.keywords.includes("trample")) spill = Math.max(0, power - needed);
      if (c.keywords.includes("lifelink")) gains[owner] += power;
      if (cardById[blocker.cardId].keywords.includes("lifelink"))
        gains[defender] += back;
    } else if (!declaration.blocked || c.keywords.includes("trample")) {
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
  log(b, "Combat damage is dealt simultaneously.");
}
function aiTarget(b: Battle, c: Card): Target | null {
  const enemies = creatures(b.player).sort(
    (a, z) => stats(b.player, z).power - stats(b.player, a).power,
  );
  if (c.effect === "counter") {
    const spell = [...b.stack].reverse().find((s) => s.owner === "player");
    return spell ? { side: "player", kind: "stack", uid: spell.uid } : null;
  }
  if (c.effect === "damage") {
    const kill = enemies.find(
      (p) => stats(b.player, p).toughness - p.damage <= c.amount,
    );
    return kill
      ? { side: "player", kind: "creature", uid: kill.uid }
      : { side: "player", kind: "hearth" };
  }
  if (c.effect === "renew") {
    const p = creatures(b.enemy).find((p) => p.tapped || p.bound);
    return p ? { side: "enemy", kind: "creature", uid: p.uid } : null;
  }
  if (c.effect === "destroy" || c.effect === "bounce" || c.effect === "bind")
    return enemies.find((p) =>
      validateTarget(b, c.effect, {
        side: "player",
        kind: "creature",
        uid: p.uid,
      }),
    )
      ? {
          side: "player",
          kind: "creature",
          uid: enemies.find((p) =>
            validateTarget(b, c.effect, {
              side: "player",
              kind: "creature",
              uid: p.uid,
            }),
          )!.uid,
        }
      : null;
  if (c.effect === "pump") {
    const p = creatures(b.enemy).find((p) => canAttack(b, p));
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
): { index: number; target: Target | null } | null {
  const top = b.stack.at(-1);
  if (!top || top.owner === owner) return null;
  const foe = other(owner);
  const counter = b[owner].hand.findIndex(
    (id) =>
      cardById[id].type === "Instant" &&
      cardById[id].effect === "counter" &&
      affordable(b[owner], cardById[id]),
  );
  if (counter >= 0)
    return {
      index: counter,
      target: { side: top.owner, kind: "stack", uid: top.uid },
    };
  const threatened =
    top.target?.side === owner
      ? b[owner].board.find((p) => p.uid === top.target?.uid)
      : undefined;
  for (let index = 0; index < b[owner].hand.length; index++) {
    const c = cardById[b[owner].hand[index]];
    if (c.type !== "Instant" || !affordable(b[owner], c)) continue;
    if (c.effect === "damage" && c.amount >= b[foe].hp + b[foe].shield)
      return { index, target: { side: foe, kind: "hearth" } };
    if (
      threatened &&
      top.effect === "damage" &&
      c.effect === "pump" &&
      stats(b[owner], threatened).toughness - threatened.damage <= top.amount &&
      stats(b[owner], threatened).toughness + c.amount - threatened.damage >
        top.amount
    )
      return {
        index,
        target: { side: owner, kind: "creature", uid: threatened.uid },
      };
    if (
      top.target?.side === owner &&
      top.target.kind === "hearth" &&
      top.effect === "damage" &&
      c.effect === "shield"
    )
      return { index, target: null };
  }
  return null;
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
export function plannedAttackers(b: Battle, owner: Owner): number[] {
  const defenders = creatures(b[other(owner)]).filter((p) => !p.tapped);
  const ready = creatures(b[owner]).filter((p) => canAttack(b, p));
  const total = ready.reduce(
    (n, p) => n + Math.max(0, stats(b[owner], p).power),
    0,
  );
  return ready
    .filter((a) => {
      if (
        !defenders.length ||
        total >
          b[other(owner)].hp +
            defenders.reduce(
              (n, p) => n + stats(b[other(owner)], p).toughness,
              0,
            )
      )
        return true;
      const legal = defenders.filter((d) =>
        canBlock({ ...b, active: owner }, a, d),
      );
      return (
        !legal.length ||
        legal.every(
          (d) =>
            stats(b[owner], a).toughness > stats(b[other(owner)], d).power ||
            stats(b[owner], a).power >= stats(b[other(owner)], d).toughness,
        ) ||
        cardById[a.cardId].keywords.includes("deathtouch")
      );
    })
    .map((p) => p.uid);
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
function aiStep(b: Battle) {
  if (b.active !== "enemy" || b.stack.length) return;
  if (b.phase === "main") {
    if (b.enemy.landDrops === 0) {
      const i = b.enemy.hand.findIndex((id) => isResource(cardById[id]));
      if (i >= 0) cast(b, "enemy", i, null);
    }
    const choices = b.enemy.hand
      .map((id, index) => ({ c: cardById[id], index }))
      .filter(
        ({ c }) =>
          !isResource(c) &&
          c.effect !== "counter" &&
          affordable(b.enemy, c) &&
          validateTarget(b, c.effect, aiTarget(b, c)),
      )
      .sort(
        (a, z) =>
          (z.c.type === "Creature" ? 3 : 0) +
            (z.c.type === "Hero" ? 4 : 0) -
            (a.c.type === "Creature" ? 3 : 0) -
            (a.c.type === "Hero" ? 4 : 0) || z.c.cost - a.c.cost,
      );
    if (choices[0]) {
      cast(b, "enemy", choices[0].index, aiTarget(b, choices[0].c));
      return;
    }
    const hReady = heroes(b.enemy).find((p) => p.used !== b.turn);
    if (hReady) {
      const ultimate = hReady.loyalty >= 6;
      activateHero(
        b,
        "enemy",
        hReady.uid,
        ultimate ? 2 : 0,
        ultimate ? { side: "player", kind: "hearth" } : null,
      );
      return;
    }
    b.phase = "attack";
    emptyMana(b);
    const attackers = plannedAttackers(b, "enemy");
    const h = heroes(b.player)[0];
    declare(b, "enemy", attackers, h?.uid ?? null);
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
    declare(b, "player", cmd.attackers, cmd.hero ?? null);
  if (cmd.type === "block") {
    if (b.active !== "enemy" || b.phase !== "block" || b.stack.length)
      throw Error(
        "Declare blockers after the attacking creatures are announced.",
      );
    const declaration = b.combat.find((a) => a.uid === cmd.attacker),
      a = b.enemy.board.find((p) => p.uid === cmd.attacker);
    if (!declaration || !a) throw Error("Unknown attacker.");
    if (cmd.blocker !== null) {
      const blocker = creatures(b.player).find((p) => p.uid === cmd.blocker);
      if (
        !blocker ||
        !canBlock(b, a, blocker) ||
        b.combat.some(
          (x) => x.uid !== cmd.attacker && x.blocker === cmd.blocker,
        )
      )
        throw Error("That creature cannot block this attacker.");
    }
    declaration.blocker = cmd.blocker;
    declaration.blocked = cmd.blocker !== null;
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
