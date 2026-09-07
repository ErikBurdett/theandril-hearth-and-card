import { it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { cards } from "../src/content/catalog";
import {
  parseAssetManifest,
  decodePng,
  validateAsset,
  paletteSchema,
  sha256,
} from "../packages/art-pipeline/src/index";
it("every card has a distinct source, reviewed full-art pixels and a correct runtime mapping", async () => {
  const json = async (p: string) => JSON.parse(await readFile(p, "utf8"));
  const palette = paletteSchema.parse(
    await json("assets/palettes/theandril-master.json"),
  );
  const index = await json("assets/art/card-art-index.json");
  const briefs: { id: string; prompt: string }[] = await json(
    "assets/art/card-briefs/catalog.json",
  );
  expect(Object.keys(index).sort()).toEqual(cards.map((c) => c.id).sort());
  const sourceHashes = new Set<string>(),
    pixelHashes = new Set<string>();
  for (const c of cards) {
    const m = parseAssetManifest(
      await json(`assets/art/approved/cards/${c.id}.json`),
    );
    expect(m.id, c.id).toBe(c.art);
    expect(m.contentIds, c.id).toContain(c.id);
    expect(sha256(m.prompt), c.id).toBe(m.provenance.promptHash);
    expect(m.prompt, c.id).toBe(briefs.find((b) => b.id === c.id)?.prompt);
    const sourceHash = sha256(await readFile(m.provenance.sourceRefs[0]));
    expect(m.referenceHashes, c.id).toContain(sourceHash);
    expect(sourceHashes.has(sourceHash), `Shared source: ${c.id}`).toBe(false);
    sourceHashes.add(sourceHash);
    const pixels = await readFile(m.frames[0].sourcePath),
      image = decodePng(pixels);
    const report = validateAsset(m, [{ id: m.frames[0].id, image }], palette);
    expect(report.passed, c.id).toBe(true);
    expect(report.inputHash, c.id).toBe(m.review?.inputHash);
    const pixelHash = sha256(image.data);
    expect(pixelHashes.has(pixelHash), `Repeated pixels: ${c.id}`).toBe(false);
    pixelHashes.add(pixelHash);
    expect([image.width, image.height], c.id).toEqual([256, 384]);
    expect(index[c.id], c.id).toBe(`/art/cards/${c.id}.png`);
    expect(sha256(await readFile(`public${index[c.id]}`)), c.id).toBe(
      sha256(pixels),
    );
  }
}, 120000);
