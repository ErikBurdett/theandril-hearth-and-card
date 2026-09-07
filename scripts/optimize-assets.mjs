import { readdir, mkdir, writeFile, readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
process.chdir(fileURLToPath(new URL("..", import.meta.url)));
async function walk(dir) {
  const list = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.name === "optimized") continue;
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) list.push(...(await walk(p)));
    else if (p.endsWith(".png")) list.push(p);
  }
  return list.sort();
}
const report = {
  encoding: "lossless WebP, method 6; ImageMagick",
  files: [],
  sourceBytes: 0,
  webpBytes: 0,
};
const sha = (b) => createHash("sha256").update(b).digest("hex");
function command(args) {
  const r = spawnSync("magick", args, { maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw Error(r.stderr.toString());
  return r.stdout;
}
for (const path of await walk("public/art")) {
  const target = path
    .replace("public/art/", "public/art/optimized/")
    .replace(/\.png$/, ".webp");
  await mkdir(dirname(target), { recursive: true });
  command([
    path,
    "-define",
    "webp:lossless=true",
    "-define",
    "webp:method=6",
    target,
  ]);
  const canonical = command([path, "-depth", "8", "rgba:-"]);
  const decoded = command([target, "-depth", "8", "rgba:-"]);
  if (canonical.length !== decoded.length)
    throw Error(`Dimensions changed: ${path}`);
  for (let i = 0; i < canonical.length; i += 4) {
    if (
      canonical[i + 3] !== decoded[i + 3] ||
      (canonical[i + 3] > 0 &&
        (canonical[i] !== decoded[i] ||
          canonical[i + 1] !== decoded[i + 1] ||
          canonical[i + 2] !== decoded[i + 2]))
    )
      throw Error(`Visible pixel changed: ${path} at ${i / 4}`);
    if (canonical[i + 3] === 0) canonical.fill(0, i, i + 3);
  }
  const source = await readFile(path),
    encoded = await readFile(target);
  report.files.push({
    source: path,
    output: target,
    sourceHash: sha(source),
    outputHash: sha(encoded),
    visiblePixelsHash: sha(canonical),
    sourceBytes: source.length,
    bytes: encoded.length,
  });
  report.sourceBytes += source.length;
  report.webpBytes += encoded.length;
}
await writeFile(
  "assets/art/optimized-manifest.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log({
  files: report.files.length,
  sourceBytes: report.sourceBytes,
  webpBytes: report.webpBytes,
  reduction:
    Math.round(100 * (1 - report.webpBytes / report.sourceBytes)) + "%",
  visiblePixels: "identical",
});
