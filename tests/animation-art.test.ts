import { it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { customerTypes } from "../src/content/tavern";
import {
  runtimeCatalogSchema,
  paletteSchema,
  parseAssetManifest,
  validateAsset,
  decodePng,
  sha256,
} from "../packages/art-pipeline/src/index";
it("all fifteen actors and eight props have reviewed moving frames, exact sources and a matching runtime atlas", async () => {
  const catalog = runtimeCatalogSchema.parse(
      JSON.parse(await readFile("public/art/animation/catalog.json", "utf8")),
    ),
    palette = paletteSchema.parse(
      JSON.parse(
        await readFile("assets/palettes/theandril-master.json", "utf8"),
      ),
    );
  expect(catalog.assets).toHaveLength(23);
  expect(catalog.assets.reduce((n, a) => n + a.frames.length, 0)).toBe(122);
  expect(sha256(await readFile("public/art/animation/sprites.png"))).toBe(
    catalog.atlases[0].sha256,
  );
  for (const id of ["player.erilian", ...customerTypes.map((c) => c.art)]) {
    const a = catalog.assets.find((a) => a.id === id)!;
    expect(a.clips.find((c) => c.state === "idle")!.frames).toHaveLength(2);
    expect(a.clips.find((c) => c.state === "walk")!.frames).toHaveLength(4);
  }
  for (const a of catalog.assets) {
    const m = parseAssetManifest(
      JSON.parse(
        await readFile(`assets/art/animation/approved/${a.id}.json`, "utf8"),
      ),
    );
    const frames = await Promise.all(
      m.frames.map(async (f) => ({
        id: f.id,
        image: decodePng(await readFile(f.sourcePath)),
      })),
    );
    const report = validateAsset(m, frames, palette);
    expect(report.passed, a.id).toBe(true);
    expect(report.inputHash).toBe(m.review!.inputHash);
    expect(sha256(await readFile(m.provenance.sourceRefs[0]))).toBe(
      m.referenceHashes[0],
    );
    const strip = decodePng(await readFile(`public/art/animation/${a.id}.png`));
    expect(strip.width).toBe(m.nativeResolution.width * m.frames.length);
  }
});
