import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFile, unlink } from "node:fs/promises";
import { createHash } from "node:crypto";
import optimized from "./assets/art/optimized-manifest.json";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "reviewed-lossless-assets",
      enforce: "pre",
      transform(code, id) {
        if (id.endsWith(".css"))
          return code.replace(
            /\/art\/(?!optimized\/)([^"')\s]+)\.png/g,
            "/art/optimized/$1.webp",
          );
      },
      async buildStart() {
        for (const f of optimized.files) {
          const hash = createHash("sha256")
            .update(await readFile(f.output))
            .digest("hex");
          if (hash !== f.outputHash)
            throw Error(
              `Optimized asset changed: ${f.output}. Run art:optimize and inspect the result.`,
            );
        }
      },
      async closeBundle() {
        // Original approved PNGs are audit sources, never duplicate download payloads.
        for (const f of optimized.files)
          await unlink(f.source.replace(/^public\//, "dist/")).catch(
            (error: NodeJS.ErrnoException) => {
              if (error.code !== "ENOENT") throw error;
            },
          );
      },
    },
  ],
  base: process.env.VITE_BASE_PATH || "/",
  // Formatters can briefly truncate a file before rewriting it. Wait for the
  // write to settle so HMR never caches an empty module during development.
  server: {
    watch: { awaitWriteFinish: { stabilityThreshold: 150, pollInterval: 25 } },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) =>
          id.includes("node_modules/three/") ? "three" : undefined,
      },
    },
  },
});
