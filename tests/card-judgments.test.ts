import { it, expect } from "vitest";
import { readFile, readdir } from "node:fs/promises";
import { cards, sets } from "../src/content/catalog";
import {
  judgmentPath,
  questionsHash,
  stateHashFor,
} from "../scripts/card-judgment-state";

const blocking = (flags: string[]) =>
  flags.filter((f) => f.startsWith("block:"));

it("every authored card has a current TypeSafe text judgment", async () => {
  const authored = sets.filter((s) => s.authored);
  expect(authored.map((s) => s.id)).toEqual(["the-quiet"]);
  for (const set of authored) {
    const data = JSON.parse(await readFile(judgmentPath(set.id), "utf8"));
    expect(data.questionsHash).toBe(questionsHash);
    for (const c of cards.filter((c) => c.setId === set.id)) {
      const record = data.cards[c.id];
      // Edited card text must be judged again: run scripts/card-judgments.ts.
      expect(record?.stateHash, `${c.id} is missing or stale`).toBe(
        stateHashFor(c),
      );
    }
  }
});

it("no judged card in the catalogue carries a blocking flag", async () => {
  const files = (await readdir("assets/art/judgments")).filter(
    (f) => f.endsWith(".json") && !f.endsWith("-review-guard.json"),
  );
  expect(files).toHaveLength(sets.length);
  let judged = 0;
  for (const file of files) {
    const data = JSON.parse(
      await readFile(`assets/art/judgments/${file}`, "utf8"),
    );
    for (const [id, record] of Object.entries(
      data.cards as Record<string, { flags: string[] }>,
    )) {
      judged++;
      expect(blocking(record.flags), id).toEqual([]);
    }
  }
  expect(judged).toBe(cards.length);
});
