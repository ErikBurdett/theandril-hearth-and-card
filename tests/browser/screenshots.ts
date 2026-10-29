import { test } from "@playwright/test";
import { basename, resolve } from "node:path";

// Keep ordinary runs isolated by test, retry and worker. Documentation images
// are refreshed only when a contributor explicitly requests a visual review.
export function screenshotPath(name: string): string {
  if (basename(name) !== name)
    throw new Error("Expected a screenshot filename");
  return process.env.UPDATE_DOC_SCREENSHOTS === "1"
    ? resolve("docs/screenshots", name)
    : test.info().outputPath(name);
}
