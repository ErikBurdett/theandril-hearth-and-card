import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import {
  decodePng,
  encodePng,
  normalizePalette,
  paletteSchema,
  parseAssetManifest,
  validateAsset,
  approveAsset,
  sha256,
  type AssetManifest,
  type RgbaImage,
} from "../packages/art-pipeline/src/index";
const save = async (p: string, v: unknown) => {
  await mkdir(dirname(p), { recursive: true });
  await writeFile(
    p,
    v instanceof Uint8Array ? v : JSON.stringify(v, null, 2) + "\n",
  );
};
const palette = paletteSchema.parse(
  JSON.parse(await readFile("assets/palettes/theandril-master.json", "utf8")),
);
const ids = [
  "customer.smith",
  "customer.merchant",
  "customer.herbalist",
  "customer.knight",
  "customer.scholar",
  "customer.sailor",
];
const command = process.argv[2];
if (command === "prepare") {
  for (const family of ["erilian", "customers"]) {
    const source = `assets/art/source/${family}-original.png`,
      bytes = await readFile(source),
      sheet = decodePng(bytes),
      prompt = await readFile(`assets/art/source/${family}-prompt.txt`, "utf8");
    const familyIds = family === "erilian" ? ["player.erilian"] : ids;
    for (let i = 0; i < familyIds.length; i++) {
      const id = familyIds[i],
        cols = family === "erilian" ? 1 : 3,
        rows = family === "erilian" ? 1 : 2,
        cw = sheet.width / cols,
        ch = sheet.height / rows,
        x0 = (i % cols) * cw,
        y0 = Math.floor(i / cols) * ch;
      let left = cw,
        top = ch,
        right = 0,
        bottom = 0;
      for (let y = 0; y < ch; y++)
        for (let x = 0; x < cw; x++) {
          if (sheet.data[((y + y0) * sheet.width + x + x0) * 4 + 3] >= 220) {
            left = Math.min(left, x);
            right = Math.max(right, x);
            top = Math.min(top, y);
            bottom = Math.max(bottom, y);
          }
        }
      if (left >= right || top >= bottom)
        throw Error(`No opaque character in ${id}`);
      const width = 96,
        height = 128,
        scale = Math.min(84 / (right - left + 1), 116 / (bottom - top + 1)),
        w = Math.round((right - left + 1) * scale),
        h = Math.round((bottom - top + 1) * scale),
        ox = Math.floor((width - w) / 2),
        oy = height - 6 - h;
      const image: RgbaImage = {
        width,
        height,
        data: new Uint8Array(width * height * 4),
      };
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          const sx =
              x0 +
              left +
              Math.min(right - left, Math.floor((x / w) * (right - left + 1))),
            sy =
              y0 +
              top +
              Math.min(bottom - top, Math.floor((y / h) * (bottom - top + 1))),
            at = (sy * sheet.width + sx) * 4,
            to = ((oy + y) * width + ox + x) * 4;
          if (sheet.data[at + 3] >= 220) {
            image.data.set(sheet.data.subarray(at, at + 3), to);
            image.data[to + 3] = 255;
          }
        }
      const png = encodePng(normalizePalette(image, palette).image),
        path = `assets/art/candidates/${id}.png`;
      await save(path, png);
      const manifest: AssetManifest = {
        schemaVersion: 1,
        id,
        type: "unit",
        status: "CANDIDATE",
        version: 1,
        nativeResolution: { width, height },
        paletteId: palette.id,
        contentIds: [id],
        prompt,
        frames: [
          {
            id: `${id}/idle/se/0`,
            direction: "se",
            state: "idle",
            index: 0,
            durationMs: 1000,
            pivot: [48, 122],
            sourcePath: path,
          },
        ],
        animation: { states: { idle: { frames: 1, fps: 1, loop: false } } },
        provenance: {
          provider: "codex-imagegen",
          model: "not-exposed-by-tool",
          promptHash: sha256(prompt),
          sourceRefs: [source, `assets/art/source/${family}-prompt.txt`],
          licenseNotes: [
            "Original generated character asset for the user. Erilian is an adaptation of the user’s podcast character. No official podcast likeness was available; visual direction follows the user’s black robes and staff.",
          ],
        },
        createdAt: "2026-09-06T04:00:00.000Z",
        referenceHashes: [sha256(bytes)],
        processing: [
          {
            tool: "hearth-character-extraction",
            version: "1",
            profile: "registered-96x128-alpha220-nearest",
            settingsHash: sha256(
              JSON.stringify({
                left,
                top,
                right,
                bottom,
                x0,
                y0,
                scale,
                ox,
                oy,
              }),
            ),
            inputHash: sha256(bytes),
            outputHash: sha256(png),
          },
        ],
        validation: null,
        review: null,
        constraints: {
          transparentPadding: 3,
          maxColors: 64,
          binaryAlpha: true,
          logicalPixelSize: 1,
          maxPivotDrift: 0,
          maxBoundingBoxDrift: 0,
          requireMotion: false,
          terrain: "none",
        },
      };
      await save(`assets/art/candidates/${id}.json`, manifest);
      const native = decodePng(png),
        large: RgbaImage = {
          width: 384,
          height: 512,
          data: new Uint8Array(384 * 512 * 4),
        };
      for (let y = 0; y < 512; y++)
        for (let x = 0; x < 384; x++) {
          const from = (Math.floor(y / 4) * 96 + Math.floor(x / 4)) * 4;
          large.data.set(
            native.data.subarray(from, from + 4),
            (y * 384 + x) * 4,
          );
        }
      await save(`assets/art/reviews/${id}-4x.png`, encodePng(large));
      const report = validateAsset(
        manifest,
        [{ id: manifest.frames[0].id, image: native }],
        palette,
      );
      await save(`assets/art/reports/${id}.json`, report);
      console.log(id, report.passed, report.inputHash);
    }
  }
}
if (command === "approve") {
  const id = process.argv[3],
    hash = process.argv[4],
    notes = process.argv[5];
  if (!id || !hash || !notes)
    throw Error("Supply a reviewed id, exact hash and findings.");
  const m = parseAssetManifest(
      JSON.parse(await readFile(`assets/art/candidates/${id}.json`, "utf8")),
    ),
    frames = await Promise.all(
      m.frames.map(async (f) => ({
        id: f.id,
        image: decodePng(await readFile(f.sourcePath)),
      })),
    ),
    report = validateAsset(m, frames, palette);
  const approved = approveAsset(
    m,
    report,
    {
      reviewer: "Codex visual review",
      reviewedAt: new Date().toISOString(),
      inputHash: hash,
      notes,
      evidencePaths: [`assets/art/reviews/${id}-4x.png`],
    },
    `assets/art/reports/${id}.json`,
  );
  await save(`assets/art/approved/${id}.json`, approved);
  console.log("Approved", id);
}
