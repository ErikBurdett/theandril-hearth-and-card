import { defineConfig } from "@playwright/test";
const liveBase = process.env.PAGES_SMOKE_URL;
const pagesMode = Boolean(process.env.PAGES_SMOKE || liveBase);
export default defineConfig({
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
    launchOptions: {
      executablePath:
        process.env.PLAYWRIGHT_CHROMIUM_PATH ||
        (process.env.CI ? undefined : "/usr/bin/chromium"),
      args: ["--no-sandbox", "--enable-unsafe-swiftshader"],
    },
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
