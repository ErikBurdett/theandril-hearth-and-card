import { spawn } from "node:child_process";
import { writeFile, mkdir } from "node:fs/promises";
import { chromium, type Page, type CDPSession } from "@playwright/test";
import { sets } from "../src/content/catalog";

// Browser-emulated delivery and session measurements against the production
// build. Chromium runs headless with SwiftShader software GL, so frame numbers
// are pessimistic; physical devices and other browsers remain separate work.
const PORT = 5176,
  BASE = process.env.PAGES_BASE ?? "/",
  URL = `http://127.0.0.1:${PORT}${BASE}`;
const networks = {
  unthrottled: null,
  "fast-3g": { latency: 150, downloadKbps: 1600, uploadKbps: 750 },
  "slow-3g": { latency: 400, downloadKbps: 400, uploadKbps: 400 },
} as const;

const server = spawn(
  "npx",
  [
    "vite",
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    String(PORT),
    "--base",
    BASE,
  ],
  { stdio: "ignore" },
);
async function ready() {
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(URL)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw Error("preview server did not start");
}
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || "/usr/bin/chromium",
  args: [
    "--no-sandbox",
    "--enable-unsafe-swiftshader",
    "--enable-precise-memory-info",
  ],
});
function transfers(cdp: CDPSession) {
  const totals = {
    requests: 0,
    bytes: 0,
    byType: {} as Record<string, number>,
  };
  const types = new Map<string, string>();
  cdp.on("Network.responseReceived", (e) => types.set(e.requestId, e.type));
  cdp.on("Network.loadingFinished", (e) => {
    totals.requests++;
    totals.bytes += e.encodedDataLength;
    const type = types.get(e.requestId) ?? "Other";
    totals.byType[type] = (totals.byType[type] ?? 0) + e.encodedDataLength;
  });
  return totals;
}
async function session(
  network: keyof typeof networks,
  viewport = { width: 1366, height: 768 },
) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  const profile = networks[network];
  if (profile)
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: profile.latency,
      downloadThroughput: (profile.downloadKbps * 1024) / 8,
      uploadThroughput: (profile.uploadKbps * 1024) / 8,
    });
  return { context, page, cdp, totals: transfers(cdp) };
}
const memory = (page: Page) =>
  page.evaluate(() => ({
    usedJSHeapMiB:
      Math.round(
        (((performance as unknown as { memory?: { usedJSHeapSize: number } })
          .memory?.usedJSHeapSize ?? 0) /
          1048576) *
          10,
      ) / 10,
    domNodes: document.querySelectorAll("*").length,
  }));

try {
  await ready();
  const report: Record<string, unknown> = {
    generated: new Date().toISOString(),
    notes:
      "Browser-emulated diagnostics on the production build: headless Chromium with SwiftShader software rendering and CDP network throttling. Not a physical-device or non-Chromium signoff.",
    environment: {
      chromium: browser.version(),
      base: BASE,
      networks,
    },
  };

  // 1. First play: a cold load until the tavern is interactive.
  const firstPlay: Record<string, unknown>[] = [];
  for (const network of Object.keys(networks) as (keyof typeof networks)[]) {
    for (const viewport of [
      { width: 1366, height: 768 },
      { width: 390, height: 844 },
    ]) {
      const s = await session(network, viewport);
      const started = Date.now();
      await s.page.goto(URL);
      await s.page
        .getByRole("button", { name: "Duel table", exact: true })
        .waitFor({ state: "visible" });
      const interactive = Date.now() - started;
      await s.page
        .getByRole("button", { name: "Duel table", exact: true })
        .click();
      await s.page.getByRole("dialog", { name: "Duel table" }).waitFor();
      const tableOpen = Date.now() - started;
      await s.page.waitForLoadState("networkidle");
      firstPlay.push({
        network,
        viewport: `${viewport.width}x${viewport.height}`,
        msUntilTavernInteractive: interactive,
        msUntilDuelTableOpen: tableOpen,
        requestsAtIdle: s.totals.requests,
        transferredMiBAtIdle:
          Math.round((s.totals.bytes / 1048576) * 100) / 100,
        byTypeKiB: Object.fromEntries(
          Object.entries(s.totals.byType).map(([k, v]) => [
            k,
            Math.round(v / 1024),
          ]),
        ),
        ...(await memory(s.page)),
      });
      await s.context.close();
    }
  }
  report.firstPlay = firstPlay;

  // 2. All-set browsing: every set history and its painted record, unthrottled and on fast 3G.
  const browsing: Record<string, unknown>[] = [];
  for (const network of ["unthrottled", "fast-3g"] as const) {
    const s = await session(network);
    await s.page.goto(URL);
    await s.page
      .getByRole("button", { name: "Card collection", exact: true })
      .click();
    await s.page
      .getByRole("button", { name: "Set histories", exact: true })
      .click();
    const spines = s.page.locator(".set-spines button");
    await spines.first().waitFor();
    const before = { ...s.totals, byType: { ...s.totals.byType } };
    const started = Date.now();
    const perSet: number[] = [];
    for (const set of sets) {
      const t = Date.now();
      await spines.filter({ hasText: set.name }).first().click();
      await s.page.locator(".set-record").getByText(set.name).first().waitFor();
      await s.page.waitForLoadState("networkidle");
      perSet.push(Date.now() - t);
    }
    browsing.push({
      network,
      volumes: sets.length,
      msTotal: Date.now() - started,
      msPerVolumeMax: Math.max(...perSet),
      msPerVolumeMedian: [...perSet].sort((a, b) => a - b)[
        Math.floor(perSet.length / 2)
      ],
      requests: s.totals.requests - before.requests,
      transferredMiB:
        Math.round(((s.totals.bytes - before.bytes) / 1048576) * 100) / 100,
      ...(await memory(s.page)),
    });
    await s.context.close();
  }
  report.allSetBrowsing = browsing;

  // 2b. Binder browsing: every page of the full catalogue with its paintings, unthrottled.
  {
    const s = await session("unthrottled");
    await s.page.goto(URL);
    await s.page
      .getByRole("button", { name: "Card collection", exact: true })
      .click();
    // Show the whole catalogue, owned or not: thirteen pages of eighty paintings.
    await s.page.getByLabel("Owned only").uncheck();
    const before = { requests: s.totals.requests, bytes: s.totals.bytes };
    const started = Date.now();
    const more = s.page.getByRole("button", { name: "More cards" });
    let pages = 1;
    const perPage: number[] = [];
    while (await more.isEnabled()) {
      const t = Date.now();
      await more.click();
      await s.page.waitForLoadState("networkidle");
      perPage.push(Date.now() - t);
      pages++;
      if (pages > 40) break;
    }
    report.binderBrowsing = {
      pages,
      msTotal: Date.now() - started,
      msPerPageMax: perPage.length ? Math.max(...perPage) : 0,
      requests: s.totals.requests - before.requests,
      transferredMiB:
        Math.round(((s.totals.bytes - before.bytes) / 1048576) * 100) / 100,
      ...(await memory(s.page)),
    };
    await s.context.close();
  }

  // 3. Sustained duel: autoplay at the table for a fixed window, sampling frames and memory.
  const SECONDS = Number(process.env.PERF_DUEL_SECONDS ?? 60);
  const s = await session("unthrottled");
  await s.page.goto(URL);
  await s.page.getByRole("button", { name: "Duel table", exact: true }).click();
  const start = await memory(s.page);
  await s.page.getByRole("button", { name: "Shuffle & autoplay" }).click();
  // Passed as source text: tsx's keepNames helper is not defined inside the page.
  const frames = (await s.page.evaluate(`new Promise((resolve) => {
    const seconds = ${SECONDS};
    const gaps = [];
    let last = performance.now();
    const end = last + seconds * 1000;
    requestAnimationFrame(function tick(now) {
      gaps.push(now - last);
      last = now;
      if (now < end) requestAnimationFrame(tick);
      else {
        const sorted = [...gaps].sort((a, b) => a - b);
        resolve({
          count: gaps.length,
          longFrames: gaps.filter((g) => g > 50).length,
          worstMs: Math.round(sorted[sorted.length - 1]),
          p95Ms: Math.round(sorted[Math.floor(sorted.length * 0.95)]),
          meanFps: Math.round(gaps.length / seconds),
        });
      }
    });
  })`)) as {
    count: number;
    longFrames: number;
    worstMs: number;
    p95Ms: number;
    meanFps: number;
  };
  const end = await memory(s.page);
  const duel = await s.page.evaluate(() => {
    const g = JSON.parse(localStorage.getItem("hearth-hollow-v1") ?? "{}");
    return {
      turn: g.battle?.turn ?? null,
      result: g.battle?.result ?? null,
      autoplay: g.battle?.autoplay ?? null,
    };
  });
  report.sustainedDuel = {
    seconds: SECONDS,
    frames,
    memoryStart: start,
    memoryEnd: end,
    duel,
  };
  await s.context.close();
  await mkdir("docs/reports", { recursive: true });
  console.log(JSON.stringify(report, null, 2));

  // Delivery budget: a proposed 1.0 bar, checked with --check so regressions fail loudly.
  const budget = {
    firstPlayMiB: 1.5,
    fast3gInteractiveMs: 4000,
    slow3gInteractiveMs: 12000,
    duelLongFrames: 10,
    duelHeapGrowthMiB: 20,
  };
  const breaches: string[] = [];
  for (const row of firstPlay) {
    if ((row.transferredMiBAtIdle as number) > budget.firstPlayMiB)
      breaches.push(
        `${row.network} ${row.viewport}: ${row.transferredMiBAtIdle} MiB transferred`,
      );
    const limit =
      row.network === "fast-3g"
        ? budget.fast3gInteractiveMs
        : row.network === "slow-3g"
          ? budget.slow3gInteractiveMs
          : null;
    if (limit && (row.msUntilTavernInteractive as number) > limit)
      breaches.push(
        `${row.network} ${row.viewport}: ${row.msUntilTavernInteractive} ms to interactive`,
      );
  }
  if (frames.longFrames > budget.duelLongFrames)
    breaches.push(`sustained duel: ${frames.longFrames} frames over 50 ms`);
  if (end.usedJSHeapMiB - start.usedJSHeapMiB > budget.duelHeapGrowthMiB)
    breaches.push(
      `sustained duel: heap grew ${(end.usedJSHeapMiB - start.usedJSHeapMiB).toFixed(1)} MiB`,
    );
  report.budget = { limits: budget, breaches };
  await writeFile(
    "docs/reports/performance.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  if (breaches.length) {
    console.error("Performance budget breached:\n" + breaches.join("\n"));
    if (process.argv.includes("--check")) process.exit(1);
  } else console.log("Performance budget met.");
} finally {
  await browser.close().catch(() => undefined);
  server.kill();
}
