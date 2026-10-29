import { z } from "zod";
import { cardById } from "../content/catalog";
import {
  battleSchema,
  battleCommand,
  createBattle,
  presetDeck,
  stats,
  type BattleCommand,
  type Permanent,
} from "./battle";

export const lessonIds = [
  "mana",
  "responses",
  "blocking",
  "protection",
] as const;
export type LessonId = (typeof lessonIds)[number];
export const lessons = [
  {
    id: "mana",
    title: "Pay for a companion",
    goal: "Play one resource, pay two mana, then resolve your companion.",
    steps: 3,
  },
  {
    id: "responses",
    title: "Answer a spell",
    goal: "Counter a lethal spell before it reaches your hearth.",
    steps: 2,
  },
  {
    id: "blocking",
    title: "Protect your hearth",
    goal: "Assign a blocker and survive the incoming attack.",
    steps: 2,
  },
  {
    id: "protection",
    title: "Save a companion",
    goal: "Protect the threatened companion, then watch the temporary bonus expire safely.",
    steps: 4,
  },
] as const;
const lessonId = z.enum(lessonIds);
export const practiceSchema = z.object({
  active: z
    .object({
      lesson: lessonId,
      step: z
        .number()
        .int()
        .min(0)
        .max(Math.max(...lessons.map((lesson) => lesson.steps))),
      battle: battleSchema,
    })
    .refine(
      (active) =>
        active.step <=
          lessons.find((lesson) => lesson.id === active.lesson)!.steps &&
        !active.battle.timed &&
        !active.battle.autoplay,
      "Invalid practice checkpoint",
    )
    .nullable(),
  completed: z
    .array(lessonId)
    .max(lessonIds.length)
    .refine((ids) => new Set(ids).size === ids.length),
});
export type Practice = z.infer<typeof practiceSchema>;
export const initialPractice = (): Practice => ({
  active: null,
  completed: [],
});
export type PracticeCommand =
  | { type: "practice-start"; lesson: LessonId }
  | { type: "practice-act"; action: string }
  | { type: "practice-exit" };
// Borrowed teaching positions use released cards; no catalog definitions change.
export const practiceCards = {
  dawn: "first-oaths.25",
  tide: "first-oaths.26",
  companion: "shared-measure.13",
  damage: "first-oaths.33",
  counter: "witness-roads.37",
  protection: "first-oaths.39",
  otherCompanion: "shared-measure.7",
} as const;
function permanent(cardId: string, uid: number, tapped = false): Permanent {
  return {
    uid,
    cardId,
    tapped,
    entered: 0,
    damage: 0,
    counters: 0,
    boost: 0,
    loyalty: cardById[cardId].loyalty,
    used: 0,
  };
}
export function startPractice(
  lesson: LessonId,
): NonNullable<Practice["active"]> {
  const b = createBattle(presetDeck(), presetDeck(), "Practice partner");
  b.turn = 3;
  b.timed = false;
  b.enemy.hand = [];
  b.player.hand = [];
  b.nextId = 100;
  if (lesson === "mana") {
    b.player.board = [permanent(practiceCards.dawn, 10)];
    b.player.hand = [
      practiceCards.dawn,
      practiceCards.companion,
      practiceCards.dawn,
    ];
  } else if (lesson === "responses") {
    b.player.hp = cardById[practiceCards.damage].amount;
    b.player.board = [
      permanent(practiceCards.tide, 10),
      permanent(practiceCards.tide, 11),
    ];
    b.enemy.board = [
      permanent(practiceCards.dawn, 20, true),
      permanent(practiceCards.dawn, 21, true),
    ];
    b.player.hand = [practiceCards.counter];
    b.stack = [
      {
        uid: 30,
        owner: "enemy",
        cardId: practiceCards.damage,
        effect: "damage",
        amount: cardById[practiceCards.damage].amount,
        target: { side: "player", kind: "hearth" },
        ability: false,
      },
    ];
  } else if (lesson === "protection") {
    b.player.board = [
      permanent(practiceCards.companion, 10),
      permanent(practiceCards.otherCompanion, 11),
      permanent(practiceCards.dawn, 12),
      permanent(practiceCards.dawn, 13),
    ];
    b.enemy.board = [
      permanent(practiceCards.dawn, 20, true),
      permanent(practiceCards.dawn, 21, true),
    ];
    b.player.hand = [practiceCards.protection];
    // The next turn has only resources, so cleanup cannot lead into a new threat.
    b.enemy.draw = Array(93).fill(practiceCards.dawn);
    b.stack = [
      {
        uid: 30,
        owner: "enemy",
        cardId: practiceCards.damage,
        effect: "damage",
        amount: cardById[practiceCards.damage].amount,
        target: { side: "player", kind: "creature", uid: 10 },
        ability: false,
      },
    ];
  } else {
    b.player.hp = cardById[practiceCards.companion].attack;
    b.player.board = [permanent(practiceCards.companion, 10)];
    b.enemy.board = [permanent(practiceCards.companion, 20, true)];
    b.active = "enemy";
    b.phase = "block";
    b.combat = [{ uid: 20, hero: null, blocker: null, blocked: false }];
  }
  return { lesson, step: 0, battle: b };
}

export function practiceStatus(active: NonNullable<Practice["active"]>) {
  const { lesson, step, battle: b } = active;
  if (b.result === "lost" || b.result === "drawn") return "retry";
  if (lesson === "protection") {
    const companion = b.player.board.find((p) => p.uid === 10);
    if (!companion) return "retry";
    return step === 4 &&
      !b.stack.length &&
      companion.boost === 0 &&
      companion.damage === 0 &&
      b.turn > 3
      ? "complete"
      : "playing";
  }
  const done =
    lesson === "mana"
      ? step === 3 &&
        b.player.board.some((p) => p.cardId === practiceCards.companion) &&
        !b.stack.length
      : lesson === "responses"
        ? step === 2 &&
          b.player.hp === cardById[practiceCards.damage].amount &&
          !b.stack.length &&
          b.enemy.grave.includes(practiceCards.damage)
        : step === 2 &&
          b.player.hp === cardById[practiceCards.companion].attack &&
          b.phase === "second-main";
  return done ? "complete" : "playing";
}
type Choice = {
  id: string;
  label: string;
  command: BattleCommand;
  next: number;
};
export function practiceChoices(
  active: NonNullable<Practice["active"]>,
): Choice[] {
  if (practiceStatus(active) !== "playing") return [];
  const { lesson, step, battle: b } = active;
  if (lesson === "protection") {
    if (step === 0)
      return [
        ...[10, 11].map((uid): Choice => ({
          id: uid === 10 ? "protect" : "other",
          label: `Strengthen ${cardById[uid === 10 ? practiceCards.companion : practiceCards.otherCompanion].name}`,
          command: {
            type: "play",
            index: 0,
            target: { side: "player", kind: "creature", uid },
          },
          next: 1,
        })),
        {
          id: "pass",
          label: "Let the damage spell resolve",
          command: { type: "pass" },
          next: 3,
        },
      ];
    if (step === 1)
      return [
        {
          id: "resolve",
          label: "Resolve your protection spell",
          command: { type: "pass" },
          next: 2,
        },
      ];
    if (step === 2)
      return [
        {
          id: "resolve",
          label: "Resolve the incoming damage",
          command: { type: "pass" },
          next: 3,
        },
      ];
    if (step === 3)
      return [
        {
          id: "finish",
          label: "End turn and clear damage",
          command: { type: "end-turn" },
          next: 4,
        },
      ];
  }
  if (lesson === "mana") {
    const cast: Choice = {
      id: "cast",
      label: "Cast Pool-court Listener",
      command: {
        type: "play",
        index: b.player.hand.indexOf(practiceCards.companion),
      },
      next: 2,
    };
    if (step === 0)
      return [
        {
          id: "resource",
          label: "Play Cold Ford Dawnfield",
          command: {
            type: "play",
            index: b.player.hand.indexOf(practiceCards.dawn),
          },
          next: 1,
        },
        cast,
      ];
    if (step === 1)
      return [
        cast,
        {
          id: "resource",
          label: "Try a second resource",
          command: {
            type: "play",
            index: b.player.hand.indexOf(practiceCards.dawn),
          },
          next: 1,
        },
      ];
    if (step === 2)
      return [
        {
          id: "resolve",
          label: "Resolve your companion",
          command: { type: "pass" },
          next: 3,
        },
      ];
  }
  if (lesson === "responses") {
    if (step === 0)
      return [
        {
          id: "counter",
          label: "Counter the incoming spell",
          command: {
            type: "play",
            index: 0,
            target: { side: "enemy", kind: "stack", uid: 30 },
          },
          next: 1,
        },
        {
          id: "pass",
          label: "Let the incoming spell resolve",
          command: { type: "pass" },
          next: 1,
        },
      ];
    if (step === 1)
      return [
        {
          id: "resolve",
          label: "Resolve your counterspell",
          command: { type: "pass" },
          next: 2,
        },
      ];
  }
  if (lesson === "blocking") {
    if (step === 0)
      return [
        {
          id: "block",
          label: "Block with Pool-court Listener",
          command: { type: "block", attacker: 20, blocker: 10 },
          next: 1,
        },
        {
          id: "unblocked",
          label: "Take the attack unblocked",
          command: { type: "damage" },
          next: 1,
        },
      ];
    if (step === 1)
      return [
        {
          id: "resolve",
          label: "Deal combat damage",
          command: { type: "damage" },
          next: 2,
        },
      ];
  }
  return [];
}

export function practiceInstruction(active: NonNullable<Practice["active"]>) {
  const status = practiceStatus(active);
  if (active.lesson === "protection") {
    const b = active.battle,
      companion = b.player.board.find((p) => p.uid === 10);
    if (status === "retry")
      return "Pool-court Listener fell to the damage spell. A bonus helps only its chosen target. Replay and strengthen the threatened Listener before the incoming spell resolves.";
    if (status === "complete")
      return "Pool-court Listener survived. At turn end, its marked damage and temporary +3/+3 cleared together, leaving the original 2/3 companion unharmed. Protection changes toughness; it does not counter the incoming spell.";
    if (active.step === 0)
      return "The incoming spell targets your 2/3 Pool-court Listener for 3 damage. Stand Together grants its chosen companion +3/+3 until turn end. You have two ready Dawn sources. Choose which companion to strengthen.";
    if (active.step === 1) {
      const target = b.player.board.find(
        (p) => p.uid === b.stack.at(-1)?.target?.uid,
      );
      return `Your instant targets ${target ? cardById[target.cardId].name : "a missing companion"}. Its bonus has not applied yet. Resolve your protection spell first.`;
    }
    if (active.step === 2) {
      const strength = stats(b.player, companion!);
      return `Pool-court Listener is now ${strength.power}/${strength.toughness}. The incoming 3 damage is still on the stack. ${strength.toughness > 3 ? "The extra toughness will let it survive this spell." : "Strengthening the other companion left the Listener in danger."}`;
    }
    return "Pool-court Listener has 3 marked damage against 6 toughness. It is still on the table. End the turn to clear both marked damage and the temporary bonus together.";
  }
  if (status === "retry")
    return active.lesson === "responses"
      ? "The spell reached your hearth before you answered it. Replay and put your instant above it on the stack."
      : "The unblocked attacker dealt its power to your hearth. Replay and assign your ready companion before damage.";
  if (status === "complete")
    return {
      mana: "Your two resources paid the cost and exhausted. The companion entered only after its spell resolved. You may play one resource each turn.",
      responses:
        "Your instant resolved first and countered the incoming spell. Your hearth kept its health. Responses resolve last in, first out.",
      blocking:
        "The companions dealt damage to each other simultaneously. Your blocker kept this attack away from your hearth; both companions survived with damage.",
    }[active.lesson];
  return (
    {
      mana: [
        "You have one ready Dawn resource. Pool-court Listener costs two mana, including Dawn. Play a second source from your hand before casting it.",
        "You now have two ready sources. Cast your companion; payment will exhaust both. You have already used this turn’s resource play.",
        "Your companion is on the stack, not yet on the table. Pass the response window to let it resolve.",
      ],
      responses: [
        "An opposing spell is already on the stack. Its three damage would empty your hearth. Use your two ready Tide sources to cast the instant in your hand, targeting that spell.",
        "Your counterspell is above the incoming spell. Resolve the top of the stack to see which effect happens first.",
      ],
      blocking: [
        "A 2-power companion is attacking your 2-health hearth. Assign your ready 2/3 companion as its blocker before damage.",
        "The blocker is assigned. Resolve combat: each companion will deal 2 damage to the other instead of to your hearth.",
      ],
    }[active.lesson][active.step] ??
    "Replay this lesson to begin a fresh teaching position."
  );
}

export function practiceCommand(practice: Practice, cmd: PracticeCommand) {
  if (cmd.type === "practice-exit") {
    practice.active = null;
    return;
  }
  if (cmd.type === "practice-start") {
    if (!lessonIds.includes(cmd.lesson))
      throw Error("Choose a known practice lesson.");
    practice.active = startPractice(cmd.lesson);
    return;
  }
  const active = practice.active;
  if (!active) throw Error("Start a practice lesson first.");
  const choice = practiceChoices(active).find((c) => c.id === cmd.action);
  if (!choice) throw Error("Choose an available lesson action.");
  battleCommand(active.battle, choice.command);
  active.step = choice.next;
  if (
    practiceStatus(active) === "complete" &&
    !practice.completed.includes(active.lesson)
  )
    practice.completed.push(active.lesson);
}
