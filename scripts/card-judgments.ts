/** TypeSafe judgments for authored card text, run before briefs spend image
 * generations. Jev reads text only: it checks lore boundaries, how paintable a
 * scene is, which framing a painting needs, name confusability and whether a
 * written art review reports a defect. Code owns every threshold and decision.
 *
 *   node --import tsx scripts/card-judgments.ts judge SET_ID
 *   node --import tsx scripts/card-judgments.ts check SET_ID
 *   node --import tsx scripts/card-judgments.ts reviews SET_ID FINDINGS.json
 *
 * The key comes from TYPESAFE_API_KEY or ~/.config/typesafe/api-key and is
 * never written to the repository. Results are cached with the exact hash of
 * the judged state, so play, tests and briefs need no key. */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { cards, cardById, setById } from "../src/content/catalog";
import {
  cardQuestions,
  cardState,
  flagsFor,
  judgmentPath as path,
  similarNames,
  stateHashFor,
  questionsHash,
  type Answer,
  type CardJudgment,
  type Question,
} from "./card-judgment-state";

const ENDPOINT = "https://api.typesafe.ai/v1/systemone";
const MODEL = "jev-latest";
const [command, setId, extra] = process.argv.slice(2);

async function apiKey() {
  const key =
    process.env.TYPESAFE_API_KEY ??
    (await readFile(`${homedir()}/.config/typesafe/api-key`, "utf8")
      .then((k) => k.trim())
      .catch(() => ""));
  if (!key)
    throw Error(
      "No TypeSafe key: set TYPESAFE_API_KEY or ~/.config/typesafe/api-key.",
    );
  return key;
}

async function ask(
  key: string,
  state: unknown,
  questions: Record<string, Question>,
): Promise<{ model: string; answers: Record<string, Answer> }> {
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ state, model: MODEL, questions }),
    });
    if (response.ok) return response.json();
    if (![429, 500, 502, 503, 529].includes(response.status) || attempt >= 5)
      throw Error(`TypeSafe ${response.status}: ${await response.text()}`);
    const wait = Number(response.headers.get("retry-after")) || 2 ** attempt;
    await new Promise((r) => setTimeout(r, wait * 1000));
  }
}

async function pool<T, R>(
  items: T[],
  limit: number,
  run: (item: T) => Promise<R>,
) {
  const results: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await run(items[i]);
      }
    }),
  );
  return results;
}

if (command === "judge") {
  if (!setById[setId]) throw Error(`Unknown set: ${setId}`);
  const key = await apiKey(),
    list = cards.filter((c) => c.setId === setId);
  const previous = await readFile(path(setId), "utf8")
    .then((t) => JSON.parse(t))
    .catch(() => ({ cards: {} }));
  let usage = 0,
    model = previous.model ?? MODEL;
  const judged = await pool(list, 6, async (c) => {
    const state = cardState(c),
      shortlist = similarNames(c),
      stateHash = stateHashFor(c);
    const cached = previous.cards?.[c.id];
    if (cached?.stateHash === stateHash) return [c.id, cached] as const;
    const main = await ask(key, state, cardQuestions);
    model = main.model;
    let confusable: number[] = [];
    if (shortlist.length) {
      const names = await ask(
        key,
        { new_name: c.name, existing_names: shortlist.map((s) => s.name) },
        Object.fromEntries(
          shortlist.map((_, i) => [
            `name_${i}`,
            {
              type: "noul",
              instructions: `Would a player easily confuse the card name \`new_name\` with \`existing_names[${i}]\` when reading a deck list?`,
              criteria: {
                true: "The two names share their key words or mean nearly the same thing.",
                false:
                  "The names share at most a common word but clearly describe different things.",
              },
            } satisfies Question,
          ]),
        ),
      );
      confusable = shortlist.map(
        (_, i) => (names.answers[`name_${i}`] as { noul: number }).noul,
      );
    }
    const record = {
      stateHash,
      answers: main.answers,
      similarNames: shortlist.map((s, i) => ({
        id: s.id,
        name: s.name,
        confusable: Math.round(confusable[i] * 1000) / 1000,
      })),
    };
    usage++;
    return [c.id, { ...record, flags: flagsFor(c, record) }] as const;
  });
  await mkdir("assets/art/judgments", { recursive: true });
  const out = {
    setId,
    model,
    questionsHash,
    judgedAt: new Date().toISOString(),
    note: "Typed text judgments only. They gate briefs and route framing; they do not approve or assess images.",
    cards: Object.fromEntries(judged),
  };
  await writeFile(path(setId), JSON.stringify(out, null, 2) + "\n");
  summarize(out.cards);
  console.log(
    JSON.stringify({ judgedNow: usage, cached: list.length - usage, model }),
  );
}

function summarize(records: Record<string, CardJudgment>) {
  for (const [id, r] of Object.entries(records))
    if (r.flags.length)
      console.log(`${id} ${cardById[id].name}: ${r.flags.join(", ")}`);
}

if (command === "check") {
  const data = JSON.parse(await readFile(path(setId), "utf8"));
  const problems: string[] = [];
  for (const c of cards.filter((c) => c.setId === setId)) {
    const r: CardJudgment | undefined = data.cards[c.id];
    const stateHash = stateHashFor(c);
    if (!r) problems.push(`${c.id}: missing`);
    else if (r.stateHash !== stateHash) problems.push(`${c.id}: stale`);
    else if (r.flags.some((f) => f.startsWith("block:")))
      problems.push(`${c.id}: ${r.flags.join(", ")}`);
  }
  console.log(
    problems.length
      ? problems.join("\n")
      : `${setId}: all judgments current, no blocking flags.`,
  );
  if (problems.length) process.exitCode = 1;
}

/** Guard for approvals: a written finding that reports a defect must not be
 * approved as if it were clean. FINDINGS.json maps card IDs to notes. */
if (command === "reviews") {
  const key = await apiKey(),
    findings: Record<string, string> = JSON.parse(
      await readFile(extra, "utf8"),
    );
  const rows = await pool(Object.entries(findings), 6, async ([id, notes]) => {
    const result = await ask(
      key,
      { review: { card: cardById[id].name, notes } },
      {
        defect: {
          type: "noul",
          instructions:
            "Does `review.notes` report a visible problem that should stop this painting from being approved?",
          criteria: {
            true: "The notes report a wrong or missing subject, malformed anatomy, extra limbs, lettering or symbols in the picture, a frame or border, or the main subject cut off.",
            false:
              "The notes describe what is shown and at most minor stylistic observations.",
          },
        },
      },
    );
    return { id, defect: (result.answers.defect as { noul: number }).noul };
  });
  const blocked = rows.filter((r) => r.defect > 0.5);
  for (const r of blocked)
    console.log(`${r.id}: findings report a defect (${r.defect.toFixed(3)})`);
  console.log(
    JSON.stringify({ checked: rows.length, blocked: blocked.length }),
  );
  // Merge by card ID so the record accumulates across review batches.
  const guardPath = `assets/art/judgments/${setId}-review-guard.json`;
  const earlier: { id: string; defect: number; notes?: string }[] =
    await readFile(guardPath, "utf8")
      .then((t) => JSON.parse(t).rows)
      .catch(() => []);
  const merged = new Map(earlier.map((r) => [r.id, r]));
  for (const r of rows) merged.set(r.id, { ...r, notes: findings[r.id] });
  await writeFile(
    guardPath,
    JSON.stringify(
      {
        model: MODEL,
        updatedAt: new Date().toISOString(),
        rows: [...merged.values()].sort((x, y) =>
          x.id.localeCompare(y.id, "en", { numeric: true }),
        ),
      },
      null,
      2,
    ) + "\n",
  );
  if (blocked.length) process.exitCode = 1;
}
