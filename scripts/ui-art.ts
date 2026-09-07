import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  decodePng,
  encodePng,
  normalizePalette,
  validateAsset,
  approveAsset,
  parseAssetManifest,
  sha256,
  paletteSchema,
  type AssetManifest,
} from "../packages/art-pipeline/src/index";
const root = resolve(import.meta.dirname, "..");
process.chdir(root);
const ids = ["parchment", "wood"];
const [command, id, argument, notes] = process.argv.slice(2);
if (!ids.includes(id)) throw Error("Choose parchment or wood.");
const prefix = `assets/art/candidates/ui.${id}`;
const palette = paletteSchema.parse(
  JSON.parse(await readFile("assets/palettes/theandril-master.json", "utf8")),
);
if (command === "prepare") {
  const source = `assets/art/source/ui/${id}-original.png`;
  await copyFile(argument, source);
  const original = await readFile(source),
    input = decodePng(original);
  const width = 512,
    height = Math.round((input.height * width) / input.width);
  const resized = { width, height, data: new Uint8Array(width * height * 4) };
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const from =
        (Math.floor((y * input.height) / height) * input.width +
          Math.floor((x * input.width) / width)) *
        4;
      resized.data.set(
        input.data.subarray(from, from + 4),
        (y * width + x) * 4,
      );
    }
  const frame = normalizePalette(resized, palette).image,
    pixels = encodePng(frame);
  await writeFile(`${prefix}.png`, pixels);
  const promptPath = `assets/art/source/ui/${id}-prompt.txt`,
    prompt = await readFile(promptPath, "utf8");
  const m: AssetManifest = {
    schemaVersion: 1,
    id: `ui.${id}`,
    type: "ui",
    status: "CANDIDATE",
    version: 1,
    nativeResolution: { width, height },
    paletteId: palette.id,
    contentIds: [`ui.${id}`],
    prompt,
    frames: [
      {
        id: `ui.${id}/idle/front/0`,
        direction: "front",
        state: "idle",
        index: 0,
        durationMs: 1000,
        pivot: [width / 2, height / 2],
        sourcePath: `${prefix}.png`,
      },
    ],
    animation: { states: { idle: { frames: 1, fps: 1, loop: false } } },
    provenance: {
      provider: "codex-imagegen",
      model: "not-exposed-by-tool",
      promptHash: sha256(prompt),
      sourceRefs: [source, promptPath],
      licenseNotes: [
        "Original project illustration generated with the built-in tool. Service terms apply. Interface material texture; not canonical world history.",
      ],
    },
    createdAt: new Date().toISOString(),
    referenceHashes: [sha256(original)],
    processing: [
      {
        tool: "theandril-ui-prepare",
        version: "1",
        profile: "nearest-512-wide-palette",
        settingsHash: sha256(JSON.stringify({ palette, width, height })),
        inputHash: sha256(original),
        outputHash: sha256(pixels),
      },
    ],
    validation: null,
    review: null,
    constraints: {
      transparentPadding: 0,
      maxColors: 64,
      binaryAlpha: true,
      logicalPixelSize: 1,
      maxPivotDrift: 0,
      maxBoundingBoxDrift: 0,
      requireMotion: false,
      terrain: "none",
    },
  };
  await writeFile(`${prefix}.json`, JSON.stringify(m, null, 2) + "\n");
}
const manifest = parseAssetManifest(
  JSON.parse(await readFile(`${prefix}.json`, "utf8")),
);
const frames = [
  {
    id: manifest.frames[0].id,
    image: decodePng(await readFile(manifest.frames[0].sourcePath)),
  },
];
const report = validateAsset(manifest, frames, palette);
await writeFile(
  `assets/art/reports/ui.${id}.json`,
  JSON.stringify(report, null, 2) + "\n",
);
console.log({
  id,
  passed: report.passed,
  inputHash: report.inputHash,
  errors: report.errors,
});
if (!report.passed) throw Error("Resource validation failed.");
if (command === "approve") {
  if (!argument || !notes)
    throw Error("Exact inspected hash and visual findings required.");
  const evidence = `assets/art/reviews/ui.${id}.png`;
  await copyFile(`${prefix}.png`, evidence);
  const approved = approveAsset(
    manifest,
    report,
    {
      reviewer: "Codex visual review",
      reviewedAt: new Date().toISOString(),
      inputHash: argument,
      notes,
      evidencePaths: [evidence],
    },
    `assets/art/reports/ui.${id}.json`,
  );
  await writeFile(
    `assets/art/approved/ui.${id}.json`,
    JSON.stringify(approved, null, 2) + "\n",
  );
  await mkdir("public/art/materials", { recursive: true });
  await writeFile(`public/art/materials/${id}.png`, encodePng(frames[0].image));
}
