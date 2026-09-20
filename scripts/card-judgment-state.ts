/** Shared state, questions and policy for TypeSafe card judgments. Imported
 * by scripts/card-judgments.ts and by the unit test that keeps cached
 * judgments current; nothing here calls the API. */
import { cards, setById, type Card } from "../src/content/catalog";
import { setLore } from "../src/content/lore";
import { sha256 } from "../packages/art-pipeline/src/index";

export type Question =
  | {
      type: "noul";
      instructions: string;
      criteria?: { true: string; false: string };
    }
  | { type: "choice"; instructions: string; criteria: Record<string, string> }
  | { type: "score"; instructions: string; criteria: string[] };
export type Answer =
  | { type: "noul"; noul: number }
  | {
      type: "choice";
      choice: string;
      probabilities: Record<string, number>;
      confidence: number;
    }
  | {
      type: "score";
      score: number;
      probabilities: Record<string, number>;
      confidence: number;
    };

/** One request per card: every question reads the same small state. */
export const cardQuestions: Record<string, Question> = {
  failing_cause: {
    type: "noul",
    instructions:
      "Does `card.title` or `card.scene` state or suggest what caused the Witness stones to go quiet?",
    criteria: {
      true: "It names or hints at a cause of the silence, such as a ruler's working, an overdrawn lattice, a waking star, a curse or someone's deliberate act.",
      false:
        "It shows the silence or its consequences without saying why the stones went quiet.",
    },
  },
  ashfall_cause: {
    type: "noul",
    instructions:
      "Does `card.title` or `card.scene` state or suggest what caused the great fire called the Ashfall?",
    criteria: {
      true: "It names or hints at who or what started the Ashfall.",
      false:
        "It does not mention the Ashfall, or mentions it without giving any cause.",
    },
  },
  network_restored: {
    type: "noul",
    instructions:
      "Does `card.scene` say that a quiet stone answered again or that distant attestation worked after the silence?",
    criteria: {
      true: "A stone speaks, answers or attests again, or a distant seal is honored through the stones.",
      false:
        "The stones stay silent; people rely on local memory, riders or fires instead.",
    },
  },
  named_person: {
    type: "noul",
    instructions:
      "Is the main subject of `card.scene` a specific named person from history, such as Ilthen, Maude, Aldery or Ossric?",
    criteria: {
      true: "The scene centers on a named historical person.",
      false:
        "The subject is unnamed, an invented figure, a group, an object or a place.",
    },
  },
  graphic_harm: {
    type: "noul",
    instructions:
      "Does `card.scene` describe gore, a killing, or a wound shown in graphic detail?",
  },
  paintable: {
    type: "score",
    instructions:
      "How clearly does `card.scene` describe something a painter could show on a small playing card?",
    criteria: [
      "Abstract: ideas, feelings or history with no visible subject or setting.",
      "Partly visual: a subject is named, but what it is doing or where it is stays vague.",
      "Concrete: a visible subject doing a clear action in a specific place.",
    ],
  },
  mechanic_fit: {
    type: "noul",
    instructions:
      "Could a player connect the scene in `card.scene` to what the card does in play, described in `card.rules`?",
    criteria: {
      true: "Something visible in the scene matches the game action, such as fire for damage, food or care for gaining life, a gate or barrier for stopping a companion, a rider for attacking quickly, or a guard for blocking.",
      false: "Nothing in the scene relates to the game action.",
    },
  },
  disputed_resolved: {
    type: "noul",
    instructions:
      "Does `card.title` or `card.scene` present one of Theandril's open questions as settled fact: how the Witness stones actually carried a promise, who or what made the world, or why the Mire Courts withdrew?",
    criteria: {
      true: "It explains the mechanism or the motive as a matter of fact.",
      false:
        "It shows the practice, the people or the consequences without settling the question.",
    },
  },
  framing: {
    type: "choice",
    instructions:
      "What should be the main subject of the painting described in `card.scene`?",
    criteria: {
      person:
        "One person, or a small group of people, doing something is the focus.",
      animal: "An animal or a herd of animals is the focus.",
      object:
        "A handmade object small enough to hold or carry is the focus, shown close up.",
      structure:
        "A building or large built structure, such as a granary, bell tower, oven or beacon, is the focus.",
      place:
        "A landscape or wide view of a place with no single main figure is the focus.",
      event:
        "A dramatic moment involving many people or a force such as fire or flood is the focus.",
    },
  },
};

export function cardState(c: Card) {
  const set = setById[c.setId],
    lore = setLore[c.setId];
  return {
    card: {
      title: c.name,
      type: c.type,
      rules: c.rules,
      scene: c.flavor,
    },
    setting: {
      era: set.era,
      place: lore.place,
      question: lore.question,
    },
  };
}

/** Cheap lexical shortlist in code; the judgment only compares a few names. */
export function similarNames(c: Card, limit = 3) {
  const words = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .replace(/[^a-z\s-]/g, "")
        .split(/[\s-]+/)
        .filter((w) => w.length > 2 && !["the", "and", "of"].includes(w)),
    );
  const mine = words(c.name);
  return cards
    .filter((o) => o.id !== c.id)
    .map((o) => {
      const theirs = words(o.name);
      const shared = [...mine].filter((w) => theirs.has(w)).length;
      return {
        name: o.name,
        id: o.id,
        score: shared / (mine.size + theirs.size - shared || 1),
      };
    })
    .filter((o) => o.score > 0)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, limit);
}

/** Some boundaries are era-bound. Before the Failing the stones answering is
 * canon, and the historical volumes deliberately depict named figures such as
 * Ilthen and Aldery; only the later sets and the authored sets are held to
 * those rules. Everything else applies to the whole catalog. */
const afterTheFailing = new Set([
  "ashfall",
  "rekindled",
  "shared-measure",
  "terms-of-shelter",
  "unclaimed-ways",
  "unfinished-answer",
  "the-quiet",
]);
export const questionScope: Record<
  string,
  "all" | "afterTheFailing" | "authored"
> = {
  failing_cause: "all",
  ashfall_cause: "all",
  disputed_resolved: "all",
  graphic_harm: "all",
  // Paintability, mechanic fit and framing vet text before art is commissioned.
  // The older sets carry one shared set tagline as each card's flavor and their
  // scenes live in the briefs, so those three only apply to authored sets.
  paintable: "authored",
  mechanic_fit: "authored",
  framing: "authored",
  network_restored: "afterTheFailing",
  named_person: "authored",
};
/** Version marker for the whole question set, recorded in each judgment file. */
export const questionsHash = sha256(JSON.stringify(cardQuestions));
/** The eight historical volumes and the folios are named procedurally, with
 * deliberate instant/sorcery twins ("… Ritual") and repeated role names per
 * place. Judging those for confusability reports the design, not a defect, so
 * the name comparison runs for authored sets only. */
export const judgesNames = (c: Card) => Boolean(setById[c.setId].authored);
export function questionsFor(c: Card): Record<string, Question> {
  const set = setById[c.setId];
  return Object.fromEntries(
    Object.entries(cardQuestions).filter(([id]) => {
      const scope = questionScope[id] ?? "all";
      if (scope === "afterTheFailing") return afterTheFailing.has(c.setId);
      if (scope === "authored") return Boolean(set.authored);
      return true;
    }),
  );
}
export const judgmentPath = (id: string) => `assets/art/judgments/${id}.json`;
export const stateHashFor = (c: Card) =>
  sha256(
    JSON.stringify({
      state: cardState(c),
      shortlist: judgesNames(c) ? similarNames(c) : [],
      questionsHash: sha256(JSON.stringify(questionsFor(c))),
    }),
  );

export interface CardJudgment {
  stateHash: string;
  answers: Record<string, Answer>;
  similarNames: { id: string; name: string; confusable: number }[];
  flags: string[];
}

/** Explicit policy. Blocking flags stop briefs; review flags need a person. */
export function flagsFor(
  c: Card,
  j: Omit<CardJudgment, "flags" | "stateHash">,
) {
  const a = j.answers,
    // Era-scoped questions are absent for sets they do not apply to.
    noul = (k: string) => (a[k] as { noul: number } | undefined)?.noul ?? 0,
    flags: string[] = [];
  if (noul("failing_cause") > 0.5) flags.push("block:failing-cause");
  if (noul("ashfall_cause") > 0.5) flags.push("block:ashfall-cause");
  if (noul("network_restored") > 0.5) flags.push("block:network-restored");
  if (noul("graphic_harm") > 0.5) flags.push("block:graphic-harm");
  if (noul("disputed_resolved") > 0.5) flags.push("block:disputed-resolved");
  if (c.type === "Hero" && noul("named_person") > 0.5)
    flags.push("block:named-hero");
  const paint = a.paintable as
    { score: number; confidence: number } | undefined;
  if (paint && paint.score < 1.5) flags.push("review:not-concrete");
  if ("mechanic_fit" in a && noul("mechanic_fit") < 0.3)
    flags.push("review:mechanic-unclear");
  if (judgesNames(c))
    for (const n of j.similarNames)
      if (n.confusable > 0.5) flags.push(`review:name-like:${n.id}`);
  return flags;
}
