import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
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
  buildAtlas,
  type AssetManifest,
  type RgbaImage,
} from "../packages/art-pipeline/src/index";
const root = "assets/art/animation",
  out = "public/art/animation";
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
const groups: Record<string, { ids: string[]; rows: number[]; cols: number }> =
  {
    keepers: {
      ids: ["player.erilian", "customer.smith", "customer.merchant"],
      rows: [0, 390, 652, 1024],
      cols: 6,
    },
    travelers: {
      ids: ["customer.herbalist", "customer.knight", "customer.scholar"],
      rows: [0, 326, 661, 1024],
      cols: 6,
    },
    roads: {
      ids: ["customer.sailor", "customer.courier", "customer.warden"],
      rows: [0, 334, 664, 1024],
      cols: 6,
    },
    crafts: {
      ids: ["customer.antiquarian", "customer.bard", "customer.beekeeper"],
      rows: [0, 328, 665, 1024],
      cols: 6,
    },
    records: {
      ids: ["customer.ferryman", "customer.mason", "customer.archivist"],
      rows: [0, 326, 647, 1024],
      cols: 6,
    },
    environment: {
      ids: [
        "ambience.fire",
        "ambience.lantern",
        "ambience.cauldron",
        "ambience.barrel",
      ],
      rows: [0, 238, 510, 766, 1024],
      cols: 4,
    },
    interface: {
      ids: [
        "ornament.book",
        "ornament.pack",
        "ornament.card",
        "ornament.corner",
      ],
      rows: [0, 256, 520, 762, 1024],
      cols: 4,
    },
  };
const blank = (width: number, height: number): RgbaImage => ({
  width,
  height,
  data: new Uint8Array(width * height * 4),
});
const frameData = async (m: AssetManifest) =>
  Promise.all(
    m.frames.map(async (f) => ({
      id: f.id,
      image: decodePng(await readFile(f.sourcePath)),
    })),
  );
const cmd = process.argv[2];
if (cmd === "prepare")
  for (const [group, config] of Object.entries(groups)) {
    const source = `assets/art/source/animation/${group === "keepers" ? "keepers-keyed" : group + "-original"}.png`,
      bytes = await readFile(source),
      sheet = decodePng(bytes),
      prompt = await readFile(
        `assets/art/source/animation/${group}-prompt.txt`,
        "utf8",
      );
    if (group === "keepers")
      for (let i = 0; i < sheet.data.length; i += 4) {
        const [r, g, b] = sheet.data.subarray(i, i + 3);
        if (r > 130 && b > 130 && g < Math.min(r, b) * 0.55)
          sheet.data[i + 3] = 0;
      }
    const cw = sheet.width / config.cols;
    for (const [row, id] of config.ids.entries()) {
      const character = config.cols === 6,
        width = 128,
        height = character ? 160 : 128,
        y0 = config.rows[row],
        ch = config.rows[row + 1] - y0;
      const bounds = Array.from({ length: config.cols }, (_, col) => {
        let left = cw,
          right = 0,
          top = ch,
          bottom = 0;
        for (let y = 0; y < ch; y++)
          for (let x = 0; x < cw; x++)
            if (
              sheet.data[((y + y0) * sheet.width + col * cw + x) * 4 + 3] >= 220
            ) {
              left = Math.min(left, x);
              right = Math.max(right, x);
              top = Math.min(top, y);
              bottom = Math.max(bottom, y);
            }
        if (left >= right || top >= bottom)
          throw Error(`Missing silhouette: ${id}/${col}`);
        return { left, right, top, bottom };
      });
      const scale = Math.min(
        (width - 16) / Math.max(...bounds.map((b) => b.right - b.left + 1)),
        (height - 16) / Math.max(...bounds.map((b) => b.bottom - b.top + 1)),
      );
      const frames: AssetManifest["frames"] = [],
        images: RgbaImage[] = [];
      for (let col = 0; col < config.cols; col++) {
        const b = bounds[col],
          w = Math.round((b.right - b.left + 1) * scale),
          h = Math.round((b.bottom - b.top + 1) * scale),
          ox = Math.floor((width - w) / 2),
          oy = height - 8 - h,
          image = blank(width, height);
        for (let y = 0; y < h; y++)
          for (let x = 0; x < w; x++) {
            const sx =
                col * cw +
                b.left +
                Math.min(b.right - b.left, Math.floor(x / scale)),
              sy =
                y0 + b.top + Math.min(b.bottom - b.top, Math.floor(y / scale)),
              at = (sy * sheet.width + sx) * 4,
              to = ((oy + y) * width + ox + x) * 4;
            if (sheet.data[at + 3] >= 220) {
              image.data.set(sheet.data.subarray(at, at + 3), to);
              image.data[to + 3] = 255;
            }
          }
        const normalized = normalizePalette(image, palette).image,
          path = `${root}/frames/${id}-${col}.png`;
        await save(path, encodePng(normalized));
        images.push(normalized);
        const state = character ? (col < 2 ? "idle" : "walk") : "active",
          index = character && col >= 2 ? col - 2 : col;
        frames.push({
          id: `${id}/${state}/se/${index}`,
          state,
          index,
          direction: "se",
          durationMs: character ? (col < 2 ? 650 : 140) : 180,
          pivot: [64, height - 8],
          sourcePath: path,
        });
      }
      const manifest: AssetManifest = {
        schemaVersion: 1,
        id,
        type: character ? "unit" : "effect",
        status: "CANDIDATE",
        version: 1,
        nativeResolution: { width, height },
        paletteId: palette.id,
        contentIds: [id],
        prompt,
        frames,
        animation: {
          states: character
            ? {
                idle: { frames: 2, fps: 1000 / 650, loop: true },
                walk: { frames: 4, fps: 1000 / 140, loop: true },
              }
            : { active: { frames: 4, fps: 1000 / 180, loop: true } },
        },
        provenance: {
          provider: "codex-imagegen",
          model: "not-exposed-by-tool",
          promptHash: sha256(prompt),
          sourceRefs: [
            source,
            `assets/art/source/animation/${group}-prompt.txt`,
            ...(group === "keepers"
              ? [
                  "assets/art/source/animation/keepers-original.png",
                  "assets/art/source/animation/keepers-keyed-prompt.txt",
                ]
              : []),
          ],
          licenseNotes: [
            "Original generated Hearth & Card animation, not a canonical historical portrait. No native editor export claimed.",
          ],
        },
        createdAt: new Date().toISOString(),
        referenceHashes: [sha256(bytes)],
        processing: [
          {
            tool: "hearth-animation-extraction",
            version: "1",
            profile: "shared-scale-foot-registration-alpha220-nearest",
            settingsHash: sha256(
              JSON.stringify({
                bounds,
                scale,
                y0,
                ch,
                cw,
                alpha: 220,
                magenta: group === "keepers",
              }),
            ),
            inputHash: sha256(bytes),
            outputHash: sha256(
              images.map((i) => sha256(encodePng(i))).join(""),
            ),
          },
        ],
        validation: null,
        review: null,
        constraints: {
          transparentPadding: 4,
          maxColors: 64,
          binaryAlpha: true,
          logicalPixelSize: 1,
          maxPivotDrift: 0,
          maxBoundingBoxDrift: character ? 48 : 112,
          requireMotion: true,
          terrain: "none",
        },
      };
      await save(`${root}/candidates/${id}.json`, manifest);
      const contact = blank(width * config.cols * 2, height * 2);
      for (let col = 0; col < images.length; col++)
        for (let y = 0; y < height * 2; y++)
          for (let x = 0; x < width * 2; x++) {
            const from = (Math.floor(y / 2) * width + Math.floor(x / 2)) * 4,
              to = (y * contact.width + col * width * 2 + x) * 4;
            contact.data.set(images[col].data.subarray(from, from + 4), to);
          }
      await save(`${root}/reviews/${id}.png`, encodePng(contact));
      const report = validateAsset(
        manifest,
        frames.map((f, i) => ({ id: f.id, image: images[i] })),
        palette,
      );
      await save(`${root}/reports/${id}.json`, report);
      console.log(id, report.passed, report.inputHash, report.errors);
    }
  }
if (cmd === "approve") {
  const [id, hash, notes] = process.argv.slice(3);
  if (!id || !hash || !notes)
    throw Error("Explicit ID, reviewed hash and visual findings required.");
  const m = parseAssetManifest(
      JSON.parse(await readFile(`${root}/candidates/${id}.json`, "utf8")),
    ),
    report = validateAsset(m, await frameData(m), palette);
  const approved = approveAsset(
    m,
    report,
    {
      reviewer: "Codex visual review",
      reviewedAt: new Date().toISOString(),
      inputHash: hash,
      notes,
      evidencePaths: [`${root}/reviews/${id}.png`],
    },
    `${root}/reports/${id}.json`,
  );
  await save(`${root}/approved/${id}.json`, approved);
  console.log("Approved", id);
}
if (cmd === "atlas") {
  const names = (await readdir(`${root}/approved`))
    .filter((n) => n.endsWith(".json"))
    .sort();
  const inputs = await Promise.all(
    names.map(async (n) => {
      const manifest = parseAssetManifest(
        JSON.parse(await readFile(`${root}/approved/${n}`, "utf8")),
      );
      return { manifest, frames: await frameData(manifest) };
    }),
  );
  const options = {
    id: "hearth-animation",
    pageSize: 2048 as const,
    imageUrl: "/art/animation/sprites.png",
    jsonUrl: "/art/animation/sprites.json",
    palette,
  };
  const atlas = buildAtlas(inputs, options),
    reverse = buildAtlas([...inputs].reverse(), options);
  if (sha256(atlas.png) !== sha256(reverse.png))
    throw Error("Atlas is not deterministic");
  await save(`${out}/sprites.png`, atlas.png);
  await save(`${out}/sprites.json`, atlas.json);
  await save(`${out}/catalog.json`, atlas.catalog);
  for (const { manifest: m, frames } of inputs) {
    const w = m.nativeResolution.width,
      h = m.nativeResolution.height,
      strip = blank(w * frames.length, h);
    for (let n = 0; n < frames.length; n++)
      for (let y = 0; y < h; y++)
        strip.data.set(
          frames[n].image.data.subarray(y * w * 4, (y + 1) * w * 4),
          (y * strip.width + n * w) * 4,
        );
    await save(`${out}/${m.id}.png`, encodePng(strip));
    await save(`${out}/${m.id}-idle.png`, encodePng(frames[0].image));
  }
  console.log(
    `${inputs.length} approved animations; ${inputs.reduce((n, a) => n + a.frames.length, 0)} authored frames; 2048 atlas.`,
  );
}
