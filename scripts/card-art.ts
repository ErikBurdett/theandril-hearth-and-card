import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { cards, sets, cardById } from "../src/content/catalog";
import {
  decodePng,
  encodePng,
  normalizePalette,
  validateAsset,
  approveAsset,
  parseAssetManifest,
  paletteSchema,
  sha256,
  type AssetManifest,
} from "../packages/art-pipeline/src/index";
const [command, id, hash, notes] = process.argv.slice(2);
const palette = paletteSchema.parse(
  JSON.parse(await readFile("assets/palettes/theandril-master.json", "utf8")),
);
const json = async (p: string) => JSON.parse(await readFile(p, "utf8"));
const save = async (p: string, v: unknown) =>
  writeFile(p, JSON.stringify(v, null, 2) + "\n");
const briefs: { id: string; prompt: string; setId: string; title: string }[] =
  await json("assets/art/card-briefs/catalog.json");
for (const p of [
  "assets/art/candidates/cards",
  "assets/art/approved/cards",
  "assets/art/reports/cards",
  "assets/art/reviews/cards",
  "public/art/cards",
])
  await mkdir(p, { recursive: true });
async function frames(m: AssetManifest) {
  return Promise.all(
    m.frames.map(async (f) => ({
      id: f.id,
      image: decodePng(await readFile(f.sourcePath)),
    })),
  );
}
if (command === "prepare") {
  const selected =
    id === "all" ? briefs : briefs.filter((b) => b.id === id || b.setId === id);
  for (const b of selected) {
    try {
      await readFile(`assets/art/approved/cards/${b.id}.json`);
      continue;
    } catch {}

    const source = `assets/art/source/cards/${b.id}.png`;
    let original: Buffer;
    try {
      original = await readFile(source);
    } catch {
      continue;
    }
    try {
      const candidate = await json(`assets/art/candidates/cards/${b.id}.json`);
      if (
        candidate.referenceHashes?.[0] === sha256(original) &&
        candidate.prompt === b.prompt
      )
        continue;
    } catch {}
    const input = decodePng(original),
      width = 256,
      height = 384;
    // Center-crop to portrait, then nearest sample. Record the exact transform and source.
    const ratio = width / height,
      cropWidth = Math.min(input.width, input.height * ratio),
      cropHeight = cropWidth / ratio;
    const left = (input.width - cropWidth) / 2,
      top = (input.height - cropHeight) / 2;
    const resized = { width, height, data: new Uint8Array(width * height * 4) };
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const from =
          (Math.min(
            input.height - 1,
            Math.floor(top + (y * cropHeight) / height),
          ) *
            input.width +
            Math.min(
              input.width - 1,
              Math.floor(left + (x * cropWidth) / width),
            )) *
          4;
        resized.data.set(
          input.data.subarray(from, from + 4),
          (y * width + x) * 4,
        );
      }
    const image = normalizePalette(resized, palette).image,
      pixels = encodePng(image),
      path = `assets/art/candidates/cards/${b.id}.png`;
    await writeFile(path, pixels);
    const m: AssetManifest = {
      schemaVersion: 1,
      id: `card.${b.id}`,
      type: "ui",
      status: "CANDIDATE",
      version: 1,
      nativeResolution: { width, height },
      paletteId: palette.id,
      contentIds: [b.id],
      prompt: b.prompt,
      frames: [
        {
          id: `card.${b.id}/idle/front/0`,
          direction: "front",
          state: "idle",
          index: 0,
          durationMs: 1000,
          pivot: [width / 2, height / 2],
          sourcePath: path,
        },
      ],
      animation: { states: { idle: { frames: 1, fps: 1, loop: false } } },
      provenance: {
        provider: "codex-imagegen",
        model: "not-exposed-by-tool",
        promptHash: sha256(b.prompt),
        sourceRefs: [source, `assets/art/card-briefs/${b.setId}.json`],
        licenseNotes: [
          "Original illustration commissioned for this card. Lore-inspired collector adaptation, not an authenticated historical reconstruction. Service terms apply.",
        ],
      },
      createdAt: new Date().toISOString(),
      referenceHashes: [sha256(original)],
      processing: [
        {
          tool: "theandril-card-prepare",
          version: "1",
          profile: "portrait-nearest-palette",
          settingsHash: sha256(
            JSON.stringify({
              palette,
              width,
              height,
              left,
              top,
              cropWidth,
              cropHeight,
            }),
          ),
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
    const report = validateAsset(m, [{ id: m.frames[0].id, image }], palette);
    await save(`assets/art/candidates/cards/${b.id}.json`, m);
    await save(`assets/art/reports/cards/${b.id}.json`, report);
    console.log(
      JSON.stringify({
        id: b.id,
        passed: report.passed,
        hash: report.inputHash,
      }),
    );
    if (!report.passed) throw Error(`Card ${b.id} failed validation.`);
  }
}
if (command === "approve") {
  if (!cardById[id] || !hash || !notes)
    throw Error("Card ID, exact inspected hash and visual findings required.");
  const m = parseAssetManifest(
      await json(`assets/art/candidates/cards/${id}.json`),
    ),
    fs = await frames(m),
    report = validateAsset(m, fs, palette);
  const evidence = `assets/art/reviews/cards/${id}.png`;
  await writeFile(evidence, encodePng(fs[0].image));
  const approved = approveAsset(
    m,
    report,
    {
      reviewer: "Codex visual review",
      reviewedAt: new Date().toISOString(),
      inputHash: hash,
      notes,
      evidencePaths: [evidence],
    },
    `assets/art/reports/cards/${id}.json`,
  );
  await save(`assets/art/approved/cards/${id}.json`, approved);
  await writeFile(`public/art/cards/${id}.png`, encodePng(fs[0].image));
  const approvedIds = (await readdir("assets/art/approved/cards"))
    .filter((n) => n.endsWith(".json"))
    .map((n) => n.slice(0, -5))
    .sort();
  await save(
    "assets/art/card-art-index.json",
    Object.fromEntries(approvedIds.map((id) => [id, `/art/cards/${id}.png`])),
  );
  console.log(`Approved and published ${id}.`);
}
if (command === "sheet") {
  const ids = cards
    .filter((c) => (id === "heroes" ? c.number === 16 : c.setId === id))
    .map((c) => c.id);
  const page = Number(hash ?? 0),
    selection = ids.slice(page * 12, page * 12 + 12),
    width = 1024,
    height = 1152;
  const sheet = { width, height, data: new Uint8Array(width * height * 4) };
  for (let i = 3; i < sheet.data.length; i += 4) sheet.data[i] = 255;
  for (let n = 0; n < selection.length; n++) {
    let image;
    try {
      image = decodePng(
        await readFile(`assets/art/candidates/cards/${selection[n]}.png`),
      );
    } catch {
      continue;
    }
    for (let y = 0; y < 384; y++)
      sheet.data.set(
        image.data.subarray(y * 256 * 4, (y + 1) * 256 * 4),
        ((Math.floor(n / 4) * 384 + y) * width + (n % 4) * 256) * 4,
      );
  }
  const path = `assets/art/reviews/cards/${id}-sheet-${page}.png`;
  await writeFile(path, encodePng(sheet));
  console.log(JSON.stringify({ path, ids: selection }));
}
if (command === "coverage") {
  const runtimeIndex = await json("assets/art/card-art-index.json");
  const rows: {
    id: string;
    setId: string;
    status: string;
    sourceHash: string;
  }[] = [];
  const seen = new Map<string, string>();
  const seenPixels = new Map<string, string>();
  for (const c of cards) {
    let status = "missing",
      inputHash = "";
    try {
      const m = parseAssetManifest(
          await json(`assets/art/approved/cards/${c.id}.json`),
        ),
        fs = await frames(m),
        report = validateAsset(m, fs, palette);
      inputHash = sha256(await readFile(m.provenance.sourceRefs[0]));
      status =
        report.passed &&
        report.inputHash === m.review?.inputHash &&
        m.referenceHashes.includes(inputHash) &&
        m.prompt === briefs.find((b) => b.id === c.id)?.prompt &&
        m.id === c.art &&
        fs[0].image.width === 256 &&
        fs[0].image.height === 384 &&
        runtimeIndex[c.id] === `/art/cards/${c.id}.png` &&
        sha256(await readFile(`public/art/cards/${c.id}.png`)) ===
          sha256(encodePng(fs[0].image))
          ? "approved"
          : "stale";
      const pixelsHash = sha256(fs[0].image.data);
      if (seenPixels.has(pixelsHash)) status = "shared";
      else seenPixels.set(pixelsHash, c.id);
      if (seen.has(inputHash)) status = "shared";
      else seen.set(inputHash, c.id);
    } catch {}
    rows.push({ id: c.id, setId: c.setId, status, sourceHash: inputHash });
  }
  const report = {
    total: cards.length,
    approved: rows.filter((r) => r.status === "approved").length,
    sets: sets.map((s) => ({
      id: s.id,
      approved: rows.filter((r) => r.setId === s.id && r.status === "approved")
        .length,
      total: cards.filter((c) => c.setId === s.id).length,
    })),
    cards: rows,
  };
  await save("docs/reports/card-art-coverage.json", report);
  console.log(
    JSON.stringify({
      total: report.total,
      approved: report.approved,
      sets: report.sets,
    }),
  );
  if (report.approved !== cards.length) process.exitCode = 1;
}
