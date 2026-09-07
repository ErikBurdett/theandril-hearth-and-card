import { fileURLToPath } from "node:url";
// Restore the optional full-resolution provenance bundle; normal play needs none of it.
import { readFile, mkdir } from "node:fs/promises";
import { createReadStream, createWriteStream } from "node:fs";
import { createHash } from "node:crypto";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { spawnSync } from "node:child_process";
process.chdir(fileURLToPath(new URL("..", import.meta.url)));
const manifest = JSON.parse(
  await readFile("assets/art/archive-manifest.json", "utf8"),
);
await mkdir(".art-cache/archives", { recursive: true });
async function digest(path) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}
for (const archive of manifest.archives) {
  const path = `.art-cache/archives/${archive.name}`;
  let valid = false;
  try {
    valid = (await digest(path)) === archive.sha256;
  } catch {
    /* first download */
  }
  if (!valid) {
    console.log(
      `Downloading ${archive.name} (${Math.round(archive.bytes / 1024 / 1024)} MiB)`,
    );
    const response = await fetch(archive.url);
    if (!response.ok || !response.body)
      throw Error(`Download failed: ${response.status} ${archive.url}`);
    await pipeline(Readable.fromWeb(response.body), createWriteStream(path));
    if ((await digest(path)) !== archive.sha256)
      throw Error(
        `Checksum mismatch: ${archive.name}; archive was not extracted.`,
      );
  }
  // Only project-authored archives matching the committed SHA-256 reach extraction.
  const result = spawnSync("tar", ["-xzf", path, "--keep-old-files"], {
    stdio: "inherit",
  });
  if (result.error || result.status !== 0)
    throw Error(
      `Extraction failed for ${archive.name}. Existing files are preserved; restore into a clean clone for a complete audit.`,
    );
  console.log(`Restored ${archive.name}`);
}
