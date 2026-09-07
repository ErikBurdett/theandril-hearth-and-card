import { it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import manifest from "../../assets/art/optimized-manifest.json";
import cards from "../../assets/art/card-art-index.json";
import { assetUrl } from "./artwork";
it("all optimized runtime files match reviewed conversion hashes and every card has a lightweight image", async () => {
  const outputs = new Set(
    manifest.files.map((f) => f.output.replace(/^public/, "")),
  );
  for (const path of Object.values(cards))
    expect(outputs.has(assetUrl(path))).toBe(true);
  for (const f of manifest.files) {
    const bytes = await readFile(f.output);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(f.outputHash);
    expect(bytes.length).toBe(f.bytes);
  }
  expect(manifest.webpBytes).toBeLessThan(manifest.sourceBytes * 0.25);
});
