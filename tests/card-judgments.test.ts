import { it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { cards, sets } from "../src/content/catalog";
import {
  judgmentPath,
  questionsHash,
  stateHashFor,
} from "../scripts/card-judgment-state";

it("every authored card has a current TypeSafe text judgment without blocking flags", async () => {
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
      expect(
        record.flags.filter((f: string) => f.startsWith("block:")),
        c.id,
      ).toEqual([]);
    }
  }
});
