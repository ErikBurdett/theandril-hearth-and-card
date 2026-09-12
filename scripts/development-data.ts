import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { format } from "prettier";
import type { Change } from "../src/development/changelog";
import { roadmapMarkdown } from "../src/development/roadmap";

const root = resolve(import.meta.dirname, "..");
const git = (...args: string[]) =>
  execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });

export function buildChangelog(): Change[] {
  return git("log", "--first-parent", "--format=%H%x1f%aI%x1f%s%x1f%b%x1e")
    .split("\x1e")
    .filter((record) => record.trim())
    .map((record) => {
      const [sha, date, subject, body] = record.trim().split("\x1f");
      // Compare to the first parent even for merges; the initial commit uses --root.
      const files = git(
        "diff-tree",
        "--root",
        "--no-commit-id",
        "--name-only",
        "--no-renames",
        "-r",
        "--first-parent",
        "-m",
        sha,
      )
        .trim()
        .split("\n")
        .filter(Boolean);
      return {
        sha,
        date,
        subject,
        body: (body ?? "").trim(),
        files: files.length,
        areas: [
          ...new Set(
            files.map((path) => path.split("/").slice(0, 2).join("/")),
          ),
        ]
          .sort()
          .slice(0, 6),
      };
    });
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(import.meta.filename)
) {
  const markdown = roadmapMarkdown();
  const output = resolve(root, "docs/ROADMAP.md");
  if (process.argv.includes("--check")) {
    if (readFileSync(output, "utf8") !== markdown)
      throw Error(
        "Roadmap docs differ from the site. Run npm run roadmap:build.",
      );
    console.log("Roadmap site and Markdown agree.");
  } else {
    writeFileSync(output, markdown);
    if (!process.argv.includes("--roadmap-only")) {
      if (git("rev-parse", "--is-shallow-repository").trim() === "true")
        throw Error(
          "The development change ledger requires full Git history. Fetch with --unshallow first.",
        );
      const changes = buildChangelog();
      writeFileSync(
        resolve(root, "src/development/changes.json"),
        await format(JSON.stringify(changes), { parser: "json" }),
      );
      console.log(`Built ${changes.length} development change entries.`);
    }
    console.log("Built docs/ROADMAP.md from the public roadmap.");
  }
}
