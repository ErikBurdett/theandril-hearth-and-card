import { test, type Page } from "@playwright/test";

/** Playwright drives HTML5 drag and CDP sessions only in Chromium; players in other browsers drag natively. */
export function chromiumOnly(browserName: string, feature: string) {
  test.skip(
    browserName !== "chromium",
    `${feature} is driven through Chromium-only automation; the game's own behavior is unchanged.`,
  );
}

/** Headless Firefox builds have no WebGL; the tavern then shows its illustrated fallback. */
export async function requireWebGL(page: Page) {
  const available = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  });
  test.skip(!available, "WebGL is unavailable in this browser build.");
}
