import { defineConfig } from "@playwright/test";
const liveBase = process.env.PAGES_SMOKE_URL;
const pagesMode = Boolean(process.env.PAGES_SMOKE || liveBase);
export default defineConfig({
  // This workstation is shared with other sessions' browser suites: two
  // workers by default (PW_WORKERS overrides), no retries, so a local run
  // cannot crowd out other processes. CI keeps Playwright's default.
  workers: process.env.CI ? undefined : Number(process.env.PW_WORKERS ?? 2),
  retries: 0,
  testIgnore: pagesMode ? [] : ["**/pages.spec.ts"],
  testMatch: pagesMode
    ? ["**/pages.spec.ts", "**/development.spec.ts"]
    : "**/*.spec.ts",
  testDir: "tests/browser",
  use: {
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    baseURL:
      liveBase ??
      (pagesMode
        ? "http://127.0.0.1:5175/theandril-hearth-and-card/"
        : "http://127.0.0.1:5174"),
    // PW_BROWSER=firefox runs the same scenarios in Playwright's Firefox build
    // for non-Chromium release coverage; Chromium stays the default.
    ...(process.env.PW_BROWSER === "firefox"
      ? {
          browserName: "firefox" as const,
          // Headless Firefox creates no WebGL context even with the usual
          // prefs; scene scenarios skip through tests/browser/engine.ts.
        }
      : {
          launchOptions: {
            executablePath:
              process.env.PLAYWRIGHT_CHROMIUM_PATH ||
              (process.env.CI ? undefined : "/usr/bin/chromium"),
            args: ["--no-sandbox", "--enable-unsafe-swiftshader"],
          },
        }),
    viewport: { width: 1440, height: 1000 },
  },
  webServer: liveBase
    ? undefined
    : {
        command: process.env.PAGES_SMOKE
          ? "npm run preview -- --host 127.0.0.1 --port 5175 --base /theandril-hearth-and-card/"
          : "npm run dev",
        url: process.env.PAGES_SMOKE
          ? "http://127.0.0.1:5175/theandril-hearth-and-card/"
          : "http://127.0.0.1:5174",
        reuseExistingServer: !process.env.CI,
      },
});
