import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  decodePng,
  encodePng,
  normalizePalette,
  validateAsset,
  approveAsset,
  buildAtlas,
  parseAssetManifest,
  sha256,
  paletteSchema,
  type AssetManifest,
} from "../packages/art-pipeline/src/index";
import {
  asepriteVersion,
  findPixelSnapper,
} from "../packages/art-pipeline/src/toolchain";
const root = resolve(import.meta.dirname, "..");
const read = async (p: string) => readFile(resolve(root, p));
const json = async (p: string) => JSON.parse((await read(p)).toString());
const save = async (p: string, v: unknown) => {
  await mkdir(dirname(resolve(root, p)), { recursive: true });
  await writeFile(
    resolve(root, p),
    v instanceof Uint8Array ? v : JSON.stringify(v, null, 2) + "\n",
  );
};
const palette = paletteSchema.parse(
  await json("assets/palettes/theandril-master.json"),
);
const command = process.argv[2];
const frameData = async (m: AssetManifest) =>
  Promise.all(
    m.frames.map(async (f) => ({
      id: f.id,
      image: decodePng(await read(f.sourcePath)),
    })),
  );
if (command === "doctor") {
  try {
    console.log(
      "Aseprite:",
      (await asepriteVersion({ repoRoot: root })).version,
    );
  } catch {
    console.log(
      "Aseprite: MISSING; set ASEPRITE_BIN to an existing installation.",
    );
  }
  console.log(
    "Pixel Snapper:",
    (await findPixelSnapper({ repoRoot: root })) ??
      "MISSING; native reprocessing is unavailable.",
  );
  console.log(
    "Retained reviewed exports, palette validation and atlas compilation: AVAILABLE. No provider credentials required.",
  );
}
if (command === "prepare") {
  const original = await read("assets/art/source/tavern-original.png");
  const image = normalizePalette(decodePng(original), palette).image;
  const pixels = encodePng(image);
  await save("assets/art/candidates/tavern.png", pixels);
  const prompt = (await read("assets/art/source/tavern-prompt.txt")).toString();
  const m: AssetManifest = {
    schemaVersion: 1,
    id: "scene.tavern",
    type: "ui",
    status: "CANDIDATE",
    version: 1,
    nativeResolution: { width: image.width, height: image.height },
    paletteId: palette.id,
    contentIds: ["scene.tavern"],
    prompt,
    frames: [
      {
        id: "scene.tavern/idle/front/0",
        direction: "front",
        state: "idle",
        index: 0,
        durationMs: 1000,
        pivot: [image.width / 2, image.height / 2],
        sourcePath: "assets/art/candidates/tavern.png",
      },
    ],
    animation: { states: { idle: { frames: 1, fps: 1, loop: false } } },
    provenance: {
      provider: "codex-imagegen",
      model: "not-exposed-by-tool",
      promptHash: sha256(prompt),
      sourceRefs: [
        "assets/art/source/tavern-original.png",
        "assets/art/source/tavern-prompt.txt",
      ],
      licenseNotes: [
        "Original generation commissioned for this project. Service terms apply. No third-party game artwork used.",
      ],
    },
    createdAt: "2026-09-06T03:00:00.000Z",
    referenceHashes: [sha256(original)],
    processing: [
      {
        tool: "theandril-palette-normalize",
        version: "1",
        profile: "original-resolution-no-resize",
        settingsHash: sha256(JSON.stringify(palette)),
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
  await save("assets/art/candidates/scene.tavern.json", m);
  console.log(
    "Candidate prepared. This is a scene illustration, not a native-tool sprite export.",
  );
}
if (command === "validate" || command === "review") {
  const m = parseAssetManifest(
      await json("assets/art/candidates/scene.tavern.json"),
    ),
    frames = await frameData(m),
    report = validateAsset(m, frames, palette);
  await save("assets/art/reports/scene.tavern.json", report);
  console.log({
    passed: report.passed,
    inputHash: report.inputHash,
    errors: report.errors,
  });
  if (command === "review") {
    const hash = process.argv[3],
      notes = process.argv[4];
    if (!hash || !notes)
      throw Error(
        "Review requires the inspected input hash and visual findings.",
      );
    await save("assets/art/reviews/tavern.png", encodePng(frames[0].image));
    const approved = approveAsset(
      m,
      report,
      {
        reviewer: "Codex visual review",
        reviewedAt: new Date().toISOString(),
        inputHash: hash,
        notes,
        evidencePaths: ["assets/art/reviews/tavern.png"],
      },
      "assets/art/reports/scene.tavern.json",
    );
    // Keep the exact candidate path as durable provenance; reviewed bytes are checked again at publication.
    await save("assets/art/approved/scene.tavern.json", approved);
  }
  if (!report.passed) process.exitCode = 1;
}
if (command === "atlas") {
  const names = (await readdir(resolve(root, "assets/art/approved")))
    .filter((x) => x.endsWith(".json"))
    .sort();
  const input = await Promise.all(
    names.map(async (name) => {
      const manifest = parseAssetManifest(
        await json("assets/art/approved/" + name),
      );
      return { manifest, frames: await frameData(manifest) };
    }),
  );
  const art = input.filter(
    (x) =>
      x.manifest.id !== "scene.tavern" &&
      !x.manifest.id.startsWith("resource.") &&
      !["ui.parchment", "ui.wood"].includes(x.manifest.id),
  );
  const options = {
    id: "hearth-sprites",
    pageSize: 1024 as const,
    imageUrl: "/art/sprites.png",
    jsonUrl: "/art/sprites.json",
    palette,
  };
  const atlas = buildAtlas(art, options),
    reverse = buildAtlas([...art].reverse(), options);
  if (sha256(atlas.png) !== sha256(reverse.png))
    throw Error("Non-deterministic atlas");
  await save("public/art/sprites.png", atlas.png);
  await save("public/art/sprites.json", atlas.json);
  await save("public/art/catalog.json", atlas.catalog);
  for (const asset of art)
    await save(
      `public/art/thumbs/${asset.manifest.id}.png`,
      encodePng(asset.frames[0].image),
    );
  for (const resource of input.filter((x) =>
    x.manifest.id.startsWith("resource."),
  )) {
    const report = validateAsset(resource.manifest, resource.frames, palette);
    if (
      !report.passed ||
      report.inputHash !== resource.manifest.review?.inputHash
    )
      throw Error("Resource pixels changed since review.");
    await save(
      `public/art/resources/${resource.manifest.id.slice(9)}.png`,
      encodePng(resource.frames[0].image),
    );
  }
  const tavern = input.find((x) => x.manifest.id === "scene.tavern");
  if (!tavern) throw Error("Review the tavern before publication.");
  const report = validateAsset(tavern.manifest, tavern.frames, palette);
  if (!report.passed || report.inputHash !== tavern.manifest.review?.inputHash)
    throw Error("Tavern pixels changed since review.");
  await save("public/art/tavern.png", encodePng(tavern.frames[0].image));
  console.log(
    `${art.length} approved sprite assets, ${atlas.catalog.assets.reduce((n, a) => n + a.frames.length, 0)} frames; 4 MiB atlas. Reviewed tavern illustration published separately.`,
  );
}
