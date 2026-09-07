import { it, expect } from "vitest";
import { readFile, readdir } from "node:fs/promises";
import {
  parseAssetManifest,
  decodePng,
  validateAsset,
  paletteSchema,
  buildAtlas,
  sha256,
} from "../packages/art-pipeline/src/index";
it("all retained approvals are exact, valid, and pack identically in reverse order", async () => {
  const palette = paletteSchema.parse(
    JSON.parse(await readFile("assets/palettes/theandril-master.json", "utf8")),
  );
  const names = (await readdir("assets/art/approved")).filter((n) =>
    n.endsWith(".json"),
  );
  const input = await Promise.all(
    names.map(async (n) => {
      const manifest = parseAssetManifest(
        JSON.parse(await readFile("assets/art/approved/" + n, "utf8")),
      );
      const frames = await Promise.all(
        manifest.frames.map(async (f) => ({
          id: f.id,
          image: decodePng(await readFile(f.sourcePath)),
        })),
      );
      const report = validateAsset(manifest, frames, palette);
      expect(report.passed).toBe(true);
      expect(report.inputHash).toBe(manifest.review?.inputHash);
      if (manifest.id.startsWith("resource."))
        expect(
          sha256(
            await readFile(`public/art/resources/${manifest.id.slice(9)}.png`),
          ),
        ).toBe(sha256(await readFile(manifest.frames[0].sourcePath)));
      if (["ui.parchment", "ui.wood"].includes(manifest.id))
        expect(
          sha256(
            await readFile(`public/art/materials/${manifest.id.slice(3)}.png`),
          ),
        ).toBe(sha256(await readFile(manifest.frames[0].sourcePath)));
      return { manifest, frames };
    }),
  );
  const sprites = input.filter(
      (a) =>
        a.manifest.id !== "scene.tavern" &&
        !a.manifest.id.startsWith("resource.") &&
        !["ui.parchment", "ui.wood"].includes(a.manifest.id),
    ),
    options = {
      id: "hearth-sprites",
      pageSize: 1024 as const,
      imageUrl: "/art/sprites.png",
      jsonUrl: "/art/sprites.json",
      palette,
    };
  const a = buildAtlas(sprites, options),
    b = buildAtlas(sprites.reverse(), options);
  expect(sha256(a.png)).toBe(sha256(b.png));
  expect(sha256(a.png)).toBe(sha256(await readFile("public/art/sprites.png")));
});
it("expanded tavern plates retain exact reviewed factory pixels", async () => {
  const palette = paletteSchema.parse(
    JSON.parse(await readFile("assets/palettes/theandril-master.json", "utf8")),
  );
  for (const id of ["hall", "bar"]) {
    const m = parseAssetManifest(
      JSON.parse(
        await readFile(`assets/art/tavern-expansions/${id}.json`, "utf8"),
      ),
    );
    const pixels = await readFile(m.frames[0].sourcePath),
      image = decodePng(pixels);
    const report = validateAsset(m, [{ id: m.frames[0].id, image }], palette);
    expect(report.passed).toBe(true);
    expect(m.review?.inputHash).toBe(report.inputHash);
    expect(sha256(await readFile(`public/art/tavern-${id}.png`))).toBe(
      sha256(pixels),
    );
    expect([image.width, image.height]).toEqual([1536, 1024]);
  }
});
