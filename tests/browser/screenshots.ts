import { test, type Locator, type Page } from "@playwright/test";
import { basename, resolve } from "node:path";

/**
 * A review run (`npm run test:screenshots`, UPDATE_DOC_SCREENSHOTS=1) refreshes
 * the reviewed images under docs/screenshots and runs every equivalent case
 * (each viewport width, each folio). An ordinary run takes no documentation
 * screenshots at all (failures still keep their own through the config) and
 * runs one representative case, so the suite stays light on a shared machine.
 */
export const reviewRun = process.env.UPDATE_DOC_SCREENSHOTS === "1";

export function screenshotPath(name: string): string {
  if (basename(name) !== name)
    throw new Error("Expected a screenshot filename");
  return reviewRun
    ? resolve("docs/screenshots", name)
    : test.info().outputPath(name);
}

/** Take a documentation screenshot in a review run; do nothing otherwise. */
export async function docScreenshot(
  target: Page | Locator,
  name: string,
  options: Omit<
    Parameters<Page["screenshot"]>[0] & Parameters<Locator["screenshot"]>[0],
    "path"
  > = {},
): Promise<void> {
  if (!reviewRun) return;
  await target.screenshot({ ...options, path: screenshotPath(name) });
}

/** Every equivalent case in a review run; the given representatives otherwise. */
export function reviewCases<T>(
  all: readonly T[],
  ordinary: readonly T[],
): readonly T[] {
  return reviewRun ? all : ordinary;
}
