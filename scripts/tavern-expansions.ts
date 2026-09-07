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
const ids = ["hall", "bar"];
const [command, id, argument, notes] = process.argv.slice(2);
if (!ids.includes(id)) throw Error("Choose hall or bar.");
const prefix = `assets/art/candidates/tavern.${id}`;
const palette = paletteSchema.parse(
  JSON.parse(await readFile("assets/palettes/theandril-master.json", "utf8")),
);
if (command === "prepare") {
  const priorVersion = await readFile(
    `assets/art/tavern-expansions/${id}.json`,
    "utf8",
  )
    .then((s) => parseAssetManifest(JSON.parse(s)).version)
    .catch(() => 0);
  const source = `assets/art/source/tavern-${id}-original.png`;
  await copyFile(argument, source);
  const original = await readFile(source),
    input = decodePng(original);
  const width = input.width,
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
  const promptPath = `assets/art/source/tavern-${id}-prompt.txt`,
    prompt = await readFile(promptPath, "utf8");
  const m: AssetManifest = {
    schemaVersion: 1,
    id: `tavern.${id}`,
    type: "ui",
    status: "CANDIDATE",
    version: priorVersion + 1,
    nativeResolution: { width, height },
    paletteId: palette.id,
    contentIds: [`tavern.${id}`],
    prompt,
    frames: [
      {
        id: `tavern.${id}/idle/front/0`,
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
        "Original project illustration generated with the built-in tool. Service terms apply. Tavern expansion illustration; an original game setting adaptation.",
      ],
    },
    createdAt: new Date().toISOString(),
    referenceHashes: [sha256(original)],
    processing: [
      {
        tool: "theandril-tavern-prepare",
        version: "1",
        profile: "original-resolution-palette",
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
  `assets/art/reports/tavern.${id}.json`,
  JSON.stringify(report, null, 2) + "\n",
);
console.log({
  id,
  passed: report.passed,
  inputHash: report.inputHash,
  errors: report.errors,
});
if (!report.passed) throw Error("Tavern expansion validation failed.");
if (command === "approve") {
  if (!argument || !notes)
    throw Error("Exact inspected hash and visual findings required.");
  const evidence = `assets/art/reviews/tavern.${id}.png`;
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
    `assets/art/reports/tavern.${id}.json`,
  );
  await mkdir("assets/art/tavern-expansions", { recursive: true });
  await writeFile(
    `assets/art/tavern-expansions/${id}.json`,
    JSON.stringify(approved, null, 2) + "\n",
  );
  await mkdir("public/art", { recursive: true });
  await writeFile(`public/art/tavern-${id}.png`, encodePng(frames[0].image));
}
